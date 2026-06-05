"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { readFile, stat } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { ALL_MODULES } from "@/lib/modules";

const COOKIE = "lyfx_admin";

export async function adminLogin(password: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || password !== secret) return { error: "Senha incorreta." };
  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2h
    path: "/studio",
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
async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) throw new Error("Unauthorized.");
}

export async function adminResetPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 6) return { error: "Mínimo 6 caracteres." };
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
  if (data.password.length < 6) return { error: "Senha deve ter ao menos 6 caracteres." };

  const existing = await db.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existing) return { error: "E-mail já cadastrado." };

  const hashed = await bcrypt.hash(data.password, 10);

  // Assign default plan automatically
  const defaultPlan = await db.plan.findFirst({ where: { isDefault: true } });

  await db.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashed,
      ...(defaultPlan ? { planId: defaultPlan.id } : {}),
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

  return {
    users, plans: planList,
    txCount, tagCount, budgetCount, goalCount, recentTx,
    userCount: users.length, totalRecords, dbSizeBytes,
    appVersion, prodVersion,
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
