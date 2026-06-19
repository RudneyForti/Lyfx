"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { readFile, writeFile, stat } from "fs/promises";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import { db } from "@/lib/db";
import { ALL_MODULES } from "@/lib/modules";
import { validatePasswordStrict } from "@/lib/password-strength";

const COOKIE = "lyfx_admin";

export async function adminLogin(password: string) {
  const secret = process.env.ADMIN_SECRET ?? "";
  const a = Buffer.from(password.padEnd(secret.length));
  const b = Buffer.from(secret.padEnd(password.length));
  const valid = password.length === secret.length && secret.length > 0 && timingSafeEqual(a, b);
  if (!valid) return { error: "Senha incorreta." };
  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2h
    path: "/studio",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/studio");
}

export async function adminLogout() {
  const jar = await cookies();
  jar.set(COOKIE, "", { maxAge: 0, path: "/studio" });
  jar.set("lyfx_session", "", { maxAge: 0, path: "/" });
  redirect("/");
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "1";
}

// [FIX C-4] Internal guard — all sensitive actions must call this first
export async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) throw new Error("Unauthorized.");
}

export async function adminResetPassword(userId: string, newPassword: string) {
  await requireAdmin();
  const pwError = validatePasswordStrict(newPassword);
  if (pwError) return { error: pwError };
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { password: hashed } });
  return { ok: true };
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  // Delete all user data (cascade manually — no FK relation from User to these models)
  await db.transaction.deleteMany({ where: { userId } }); // TransactionTags cascade via onDelete
  await db.tag.deleteMany({ where: { userId } });
  await db.budget.deleteMany({ where: { userId } });
  await db.goal.deleteMany({ where: { userId } }); // GoalPayments cascade via onDelete
  await db.liability.deleteMany({ where: { userId } });
  await db.institution.deleteMany({ where: { userId } }); // Accounts cascade via onDelete
  await db.asset.deleteMany({ where: { userId } });        // AssetExpenses cascade via onDelete
  await db.settings.deleteMany({ where: { userId } });
  await db.pillProgress.deleteMany({ where: { userId } }); // CS-12: evitar dados órfãos de educação
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/studio");
  return { ok: true };
}

export async function getStudioDataForUser(userId: string) {
  await requireAdmin();
  const [txCount, tagCount, budgetCount, goalCount, recentTx] = await Promise.all([
    db.transaction.count({ where: { userId } }),
    db.tag.count({ where: { userId } }),
    db.budget.count({ where: { userId } }),
    db.goal.count({ where: { userId } }),
    db.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);
  return { txCount, tagCount, budgetCount, goalCount, recentTx };
}

export async function adminCreateUser(data: { name: string; email: string; password: string }) {
  await requireAdmin();
  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.email.trim()) return { error: "E-mail obrigatório." };
  const pwError = validatePasswordStrict(data.password);
  if (pwError) return { error: pwError };

  const existing = await db.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existing) return { error: "E-mail já cadastrado." };

  const hashed = await bcrypt.hash(data.password, 10);

  // Assign default plan automatically
  const defaultPlan = await db.plan.findFirst({ where: { isDefault: true } });

  const newUser = await db.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashed,
      ...(defaultPlan ? { planId: defaultPlan.id } : {}),
    },
  });

  // Notificação de boas-vindas padrão para todo novo usuário
  await db.notification.create({
    data: {
      userId: newUser.id,
      title: "Bem-vindo ao Lyfx!",
      body: `Olá, ${newUser.name}! Seu ambiente está pronto. Explore os módulos de orçamento, metas e saúde financeira para começar a organizar sua vida financeira.`,
      type: "success",
      link: "/dashboard",
      fingerprint: null,
    },
  });

  revalidatePath("/studio");
  return { ok: true };
}

export async function getStudioData() {
  await requireAdmin();
  const [users, plans, txCount, tagCount, budgetCount, goalCount, liabilityCount, goalPaymentCount, recentTx] = await Promise.all([
    db.user.findMany({
      select: {
        id: true, name: true, email: true, createdAt: true, avatar: true,
        planId: true,
        plan: { select: { id: true, name: true, color: true } },
      },
    }),
    db.plan.findMany({
      include: {
        modules: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.transaction.count(),
    db.tag.count(),
    db.budget.count(),
    db.goal.count(),
    db.liability.count(),
    db.goalPayment.count(),
    db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);

  const totalRecords =
    users.length + txCount + tagCount + budgetCount +
    goalCount + liabilityCount + goalPaymentCount;

  // DB file size (PostgreSQL: approximate via pg_database_size)
  let dbSizeBytes = 0;
  try {
    const result = await db.$queryRaw<[{ size: bigint }]>`
      SELECT pg_database_size(current_database()) AS size
    `;
    dbSizeBytes = Number(result[0].size);
  } catch { /* ignore */ }

  const planList = plans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    isDefault: p.isDefault,
    modules: p.modules.map(m => m.module),
    userCount: p._count.users,
  }));

  // Read dev + prod versions from package.json
  let appVersion = "—";
  let prodVersion = "—";
  try {
    const pkg = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf-8"));
    appVersion = pkg.version ?? "—";
  } catch { /* ignore */ }
  try {
    const pkg = JSON.parse(await readFile(path.join(process.cwd(), "..", "lyfx-production", "package.json"), "utf-8"));
    prodVersion = pkg.version ?? "—";
  } catch { /* ignore */ }

  // Read git branch + short commit hash for each worktree
  const devCwd  = process.cwd();
  const prodCwd = path.join(process.cwd(), "..", "lyfx-production");
  let devBranch = "—", devCommit = "—";
  let prodBranch = "—", prodCommit = "—";
  try {
    devBranch  = execSync("git rev-parse --abbrev-ref HEAD", { cwd: devCwd,  encoding: "utf-8" }).trim();
    devCommit  = execSync("git rev-parse --short HEAD",      { cwd: devCwd,  encoding: "utf-8" }).trim();
  } catch { /* ignore */ }
  try {
    prodBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: prodCwd, encoding: "utf-8" }).trim();
    prodCommit = execSync("git rev-parse --short HEAD",      { cwd: prodCwd, encoding: "utf-8" }).trim();
  } catch { /* ignore */ }

  return {
    users, plans: planList,
    txCount, tagCount, budgetCount, goalCount, recentTx,
    userCount: users.length, totalRecords, dbSizeBytes,
    appVersion, prodVersion,
    devBranch, devCommit, prodBranch, prodCommit,
  };
}

// ── Live schema from PostgreSQL information_schema ────────────────────────────

export interface SchemaColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_pk: boolean;
  is_fk: boolean;
  fk_ref?: string; // referenced table name
}

export interface SchemaForeignKey {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface LiveSchema {
  tables: SchemaTable[];
  foreignKeys: SchemaForeignKey[];
}

export async function getLiveSchema(): Promise<LiveSchema> {
  await requireAdmin();

  type ColRow = Omit<SchemaColumn, "is_pk" | "is_fk" | "fk_ref"> & { table_name: string };
  type PkRow  = { table_name: string; column_name: string };

  const [columns, fks, pks] = await Promise.all([
    db.$queryRaw<ColRow[]>`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name NOT IN ('_prisma_migrations')
      ORDER BY table_name, ordinal_position
    `,
    db.$queryRaw<SchemaForeignKey[]>`
      SELECT
        kcu.table_name, kcu.column_name,
        ccu.table_name  AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY kcu.table_name, kcu.column_name
    `,
    db.$queryRaw<PkRow[]>`
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    `,
  ]);

  // Build lookup sets
  const pkSet  = new Set(pks.map(pk => `${pk.table_name}.${pk.column_name}`));
  const fkMap  = new Map(fks.map(fk => [`${fk.table_name}.${fk.column_name}`, fk.foreign_table_name]));

  // Group columns by table — annotated with PK/FK
  const tableMap = new Map<string, SchemaColumn[]>();
  for (const row of columns) {
    if (!tableMap.has(row.table_name)) tableMap.set(row.table_name, []);
    const key = `${row.table_name}.${row.column_name}`;
    tableMap.get(row.table_name)!.push({
      column_name:    row.column_name,
      data_type:      row.data_type,
      is_nullable:    row.is_nullable,
      column_default: row.column_default,
      is_pk:  pkSet.has(key),
      is_fk:  fkMap.has(key),
      fk_ref: fkMap.get(key),
    });
  }

  const tables: SchemaTable[] = Array.from(tableMap.entries()).map(([name, cols]) => ({
    name,
    columns: cols,
  }));

  return { tables, foreignKeys: fks };
}

export async function getDocumentation(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "DOCUMENTATION.md");
    return await readFile(filePath, "utf-8");
  } catch {
    return "_Arquivo DOCUMENTATION.md não encontrado._";
  }
}

// ── App Config (global key-value settings) ────────────────────────────────────

export type AppConfigEntry = { key: string; value: string; updatedAt: Date };

/** Defaults are written to DB on first call if not already present */
const CONFIG_DEFAULTS: Record<string, string> = {
  allowUserCreation: "true",
  maintenanceMode:   "false",
  maintenanceBanner: "O sistema está temporariamente indisponível para manutenção.",
  adminNotes:        "",
  betaModules:       JSON.stringify(ALL_MODULES.filter(m => m.isBeta).map(m => m.key)),
};

export async function getAppConfig(): Promise<AppConfigEntry[]> {
  await requireAdmin();
  for (const [key, value] of Object.entries(CONFIG_DEFAULTS)) {
    await db.appConfig.upsert({
      where:  { key },
      update: {},
      create: { key, value },
    });
  }
  return db.appConfig.findMany({ orderBy: { key: "asc" } });
}

export async function setAppConfig(key: string, value: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await db.appConfig.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/studio");
  return { ok: true };
}

export async function saveAdminNotes(content: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await db.appConfig.upsert({
    where:  { key: "adminNotes" },
    update: { value: content },
    create: { key: "adminNotes", value: content },
  });
  return { ok: true };
}

// ── CS-18: Envio de notificações via Studio ───────────────────────────────────

// ── CS-18: Notificações manuais via Studio ───────────────────────────────────

export interface AdminSendNotificationInput {
  recipientType: "all" | "plan" | "user";
  planId?: string;
  userId?: string;
  title: string;
  body: string;
  type: "info" | "warning" | "danger" | "success";
  link?: string;
}

export interface NotifBroadcast {
  broadcastId: string | null;
  sampleId: string;
  title: string;
  body: string;
  type: "info" | "warning" | "danger" | "success";
  link: string | null;
  createdAt: Date;
  totalCount: number;
  readCount: number;
}

export async function adminSendNotification(
  input: AdminSendNotificationInput
): Promise<{ ok: true; count: number } | { error: string }> {
  await requireAdmin();

  if (!input.title.trim()) return { error: "Título obrigatório." };
  if (!input.body.trim())  return { error: "Mensagem obrigatória." };

  let userIds: string[] = [];

  if (input.recipientType === "all") {
    const users = await db.user.findMany({ select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (input.recipientType === "plan") {
    if (!input.planId) return { error: "Plano não selecionado." };
    const users = await db.user.findMany({ where: { planId: input.planId }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (input.recipientType === "user") {
    if (!input.userId) return { error: "Usuário não selecionado." };
    userIds = [input.userId];
  }

  if (userIds.length === 0) return { error: "Nenhum destinatário encontrado." };

  const broadcastId = crypto.randomUUID();

  await db.notification.createMany({
    data: userIds.map((uid) => ({
      userId: uid,
      title: input.title.trim(),
      body: input.body.trim(),
      type: input.type,
      link: input.link?.trim() || null,
      broadcastId,
    })),
  });

  revalidatePath("/", "layout");
  return { ok: true, count: userIds.length };
}

/** Lista notificações manuais agrupadas por broadcastId para o painel do Studio. */
export async function adminGetManualNotifications(): Promise<NotifBroadcast[]> {
  await requireAdmin();

  // Busca todas as notificações sem fingerprint (= manuais)
  const rows = await db.notification.findMany({
    where: { fingerprint: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, broadcastId: true, title: true, body: true, type: true, link: true, createdAt: true, readAt: true },
  });

  // Agrupa por broadcastId (null = legado sem broadcastId, cada um é seu próprio grupo)
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.broadcastId ?? `__solo__${row.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries()).map(([, items]) => {
    const first = items[0];
    return {
      broadcastId: first.broadcastId,
      sampleId: first.id,
      title: first.title,
      body: first.body,
      type: first.type as NotifBroadcast["type"],
      link: first.link,
      createdAt: first.createdAt,
      totalCount: items.length,
      readCount: items.filter((n) => n.readAt !== null).length,
    };
  });
}

export async function adminDeleteNotification(
  broadcastId: string | null,
  sampleId: string
): Promise<{ ok: true }> {
  await requireAdmin();

  if (broadcastId) {
    await db.notification.deleteMany({ where: { broadcastId } });
  } else {
    await db.notification.delete({ where: { id: sampleId } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminUpdateNotification(
  broadcastId: string | null,
  sampleId: string,
  data: { title: string; body: string; type: string; link: string | null }
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!data.title.trim()) return { error: "Título obrigatório." };
  if (!data.body.trim())  return { error: "Mensagem obrigatória." };

  const update = {
    title: data.title.trim(),
    body: data.body.trim(),
    type: data.type,
    link: data.link?.trim() || null,
  };

  if (broadcastId) {
    await db.notification.updateMany({ where: { broadcastId }, data: update });
  } else {
    await db.notification.update({ where: { id: sampleId }, data: update });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Métricas do servidor ──────────────────────────────────────────────────────

export interface ServerMetrics {
  // Memória do sistema
  memUsedBytes:  number;
  memTotalBytes: number;
  // Heap do processo Node.js
  heapUsedBytes:  number;
  heapTotalBytes: number;
  // CPU
  loadAvg1m:  number;
  loadAvg5m:  number;
  cpuCount:   number;
  // Processo
  uptimeSeconds: number;
  // Usuários online (lastSeenAt nos últimos 5 minutos)
  onlineNow:   number;
  // Usuários ativos hoje
  activeToday: number;
}

export async function getServerMetrics(): Promise<ServerMetrics> {
  await requireAdmin();

  const mem  = process.memoryUsage();
  const load = os.loadavg();
  const now  = new Date();
  const fiveMinAgo  = new Date(now.getTime() -      5 * 60 * 1000);
  const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [onlineNow, activeToday] = await Promise.all([
    db.user.count({ where: { lastSeenAt: { gte: fiveMinAgo } } }),
    db.user.count({ where: { lastSeenAt: { gte: startOfDay } } }),
  ]);

  return {
    memUsedBytes:   os.totalmem() - os.freemem(),
    memTotalBytes:  os.totalmem(),
    heapUsedBytes:  mem.heapUsed,
    heapTotalBytes: mem.heapTotal,
    loadAvg1m:  load[0],
    loadAvg5m:  load[1],
    cpuCount:   os.cpus().length,
    uptimeSeconds: process.uptime(),
    onlineNow,
    activeToday,
  };
}

// ── CS-18: Log de eventos para a aba Dados do Studio ─────────────────────────

export interface AuditEvent {
  id: string;
  eventType: "transaction" | "education" | "goal" | "notification" | "system";
  title: string;
  detail: string;
  actorType: "user" | "system";
  userId: string | null;
  userName: string | null;
  userPlanId: string | null;
  timestamp: Date;
}

export async function adminGetEventLog(filters?: {
  eventType?: string;
  planId?: string;
  userId?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  await requireAdmin();

  const limit = filters?.limit ?? 100;
  const et = filters?.eventType;

  // Resolve target userIds from plan/user filters
  let targetUserIds: string[] | null = null; // null = all users
  if (filters?.userId) {
    targetUserIds = [filters.userId];
  } else if (filters?.planId) {
    const users = await db.user.findMany({
      where: { planId: filters.planId },
      select: { id: true },
    });
    targetUserIds = users.map((u) => u.id);
  }

  // Build user name/plan lookup map
  const allUsers = await db.user.findMany({
    select: { id: true, name: true, planId: true },
  });
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const events: AuditEvent[] = [];

  function include(type: string) { return !et || et === type; }
  function userWhere() {
    return targetUserIds ? { userId: { in: targetUserIds } } : {};
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  if (include("transaction")) {
    const txs = await db.transaction.findMany({
      where: { ...userWhere() },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, description: true, amount: true, type: true,
        category: true, userId: true, createdAt: true,
      },
    });
    for (const tx of txs) {
      const u = userMap.get(tx.userId);
      events.push({
        id: `tx-${tx.id}`,
        eventType: "transaction",
        title: tx.description,
        detail: `${tx.type === "credit" ? "+" : "-"}R$ ${tx.amount.toFixed(2)} · ${tx.category}`,
        actorType: "user",
        userId: tx.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: tx.createdAt,
      });
    }
  }

  // ── Education (PillProgress) ──────────────────────────────────────────────
  if (include("education")) {
    const pills = await db.pillProgress.findMany({
      where: { ...userWhere() },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        id: true, pillId: true, userId: true,
        completedAt: true, timeSpentSeconds: true, quizCorrect: true,
      },
    });
    for (const p of pills) {
      const u = userMap.get(p.userId);
      const dur = p.timeSpentSeconds < 60
        ? `${p.timeSpentSeconds}s`
        : `${Math.floor(p.timeSpentSeconds / 60)}min`;
      events.push({
        id: `edu-${p.id}`,
        eventType: "education",
        title: `Módulo educacional concluído`,
        detail: `${p.pillId} · ${dur}${p.quizCorrect ? " · quiz ✓" : ""}`,
        actorType: "user",
        userId: p.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: p.completedAt,
      });
    }
  }

  // ── Goal payments ─────────────────────────────────────────────────────────
  if (include("goal")) {
    const goalWhere = targetUserIds ? { userId: { in: targetUserIds } } : {};
    const goals = await db.goal.findMany({
      where: goalWhere,
      select: { id: true, name: true, userId: true },
    });
    if (goals.length > 0) {
      const goalMap = new Map(goals.map((g) => [g.id, g]));
      const payments = await db.goalPayment.findMany({
        where: { paid: true, goalId: { in: goals.map((g) => g.id) } },
        orderBy: { paidAt: "desc" },
        take: limit,
        select: { id: true, goalId: true, amount: true, paidAt: true },
      });
      for (const p of payments) {
        const goal = goalMap.get(p.goalId);
        const u = goal ? userMap.get(goal.userId) : null;
        events.push({
          id: `goal-${p.id}`,
          eventType: "goal",
          title: `Pagamento de meta registrado`,
          detail: `${goal?.name ?? "—"} · R$ ${p.amount.toFixed(2)}`,
          actorType: "user",
          userId: goal?.userId ?? null,
          userName: u?.name ?? null,
          userPlanId: u?.planId ?? null,
          timestamp: p.paidAt ?? new Date(0),
        });
      }
    }
  }

  // ── Auto-generated alerts (fingerprint not null) ──────────────────────────
  if (include("notification")) {
    const notifs = await db.notification.findMany({
      where: { fingerprint: { not: null }, ...userWhere() },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, body: true, type: true, userId: true, createdAt: true },
    });
    for (const n of notifs) {
      const u = userMap.get(n.userId);
      events.push({
        id: `notif-${n.id}`,
        eventType: "notification",
        title: `Alerta automático: ${n.title}`,
        detail: n.body.length > 90 ? n.body.slice(0, 90) + "…" : n.body,
        actorType: "system",
        userId: n.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: n.createdAt,
      });
    }
  }

  // ── System events (Studio-level — only when no user/plan filter) ──────────
  if (include("system") && targetUserIds === null) {
    // User registrations
    const registrations = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, planId: true, createdAt: true },
    });
    for (const u of registrations) {
      events.push({
        id: `reg-${u.id}`,
        eventType: "system",
        title: `Novo usuário registrado`,
        detail: u.name,
        actorType: "system",
        userId: u.id,
        userName: u.name,
        userPlanId: u.planId ?? null,
        timestamp: u.createdAt,
      });
    }

    // Studio broadcasts (deduplicated by broadcastId)
    const broadcasts = await db.notification.findMany({
      where: { broadcastId: { not: null }, fingerprint: null },
      orderBy: { createdAt: "asc" }, // asc so first row = earliest (= creation time)
      take: 500,
      select: { broadcastId: true, title: true, body: true, createdAt: true },
    });
    const seenBroadcast = new Set<string>();
    for (const b of broadcasts) {
      if (!b.broadcastId || seenBroadcast.has(b.broadcastId)) continue;
      seenBroadcast.add(b.broadcastId);
      events.push({
        id: `broadcast-${b.broadcastId}`,
        eventType: "system",
        title: `Broadcast enviado: ${b.title}`,
        detail: b.body.length > 90 ? b.body.slice(0, 90) + "…" : b.body,
        actorType: "system",
        userId: null,
        userName: null,
        userPlanId: null,
        timestamp: b.createdAt,
      });
    }

    // AppConfig writes (excluding adminNotes — too noisy)
    const configs = await db.appConfig.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { key: true, value: true, updatedAt: true },
    });
    for (const c of configs) {
      if (c.key === "adminNotes") continue;
      events.push({
        id: `config-${c.key}`,
        eventType: "system",
        title: `Configuração alterada`,
        detail: `${c.key}: ${c.value.length > 60 ? c.value.slice(0, 60) + "…" : c.value}`,
        actorType: "system",
        userId: null,
        userName: null,
        userPlanId: null,
        timestamp: c.updatedAt,
      });
    }
  }

  // Sort by timestamp desc and enforce limit
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return events.slice(0, limit);
}

// ── CS-35: Security Audit Log (admin view) ────────────────────────────────────

export interface AdminSecurityEvent {
  id:          string;
  action:      string;
  label:       string;
  description: string;
  variant:     "success" | "danger" | "warning" | "info";
  userId:      string | null;
  userName:    string | null;
  userEmail:   string | null;
  ip:          string | null;
  createdAt:   Date;
}

export async function getAdminSecurityLog(filters?: {
  userId?:  string;
  action?:  string;
  limit?:   number;
}): Promise<AdminSecurityEvent[]> {
  await requireAdmin();

  const { AUDIT_META } = await import("@/lib/audit");
  type AuditAction = keyof typeof AUDIT_META;

  const limit = filters?.limit ?? 200;

  const logs = await db.auditLog.findMany({
    where: {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.action  ? { action: filters.action }  : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, userId: true, ip: true, metadata: true, createdAt: true },
  });

  // Build userId → user map for a single extra query
  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean) as string[])];
  const users   = userIds.length
    ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  return logs.map(log => {
    const action   = log.action as AuditAction;
    const meta     = AUDIT_META[action] ?? { label: action, description: () => action, variant: "info" as const };
    const metadata = (log.metadata ?? undefined) as Record<string, unknown> | undefined;
    const user     = log.userId ? userMap.get(log.userId) : null;
    return {
      id:          log.id,
      action:      log.action,
      label:       meta.label,
      description: meta.description(metadata),
      variant:     meta.variant,
      userId:      log.userId,
      userName:    user?.name    ?? null,
      userEmail:   user?.email   ?? null,
      ip:          log.ip,
      createdAt:   log.createdAt,
    };
  });
}

/* ── Kanban Board (CS-20) ── */

export interface KanbanColumn {
  id:    string;
  title: string;
  order: number;
}

export interface KanbanCard {
  id:           string;
  columnId:     string;
  csNumber:     string;
  title:        string;
  description:  string;
  labels:       string[];
  version:      string;
  commitHash:   string;
  completedAt:  string | null;
  order:        number;
}

export interface KanbanBoard {
  version:     number;
  lastUpdated: string;
  columns:     KanbanColumn[];
  cards:       KanbanCard[];
}

const BOARD_FILE = path.join(process.cwd(), "docs", "cs-board.json");

export async function getKanbanBoard(): Promise<KanbanBoard> {
  await requireAdmin();
  const raw = await readFile(BOARD_FILE, "utf-8");
  return JSON.parse(raw) as KanbanBoard;
}

export async function saveKanbanBoard(board: KanbanBoard): Promise<{ ok: boolean }> {
  await requireAdmin();
  const updated: KanbanBoard = { ...board, lastUpdated: new Date().toISOString() };
  await writeFile(BOARD_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return { ok: true };
}
