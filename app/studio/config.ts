"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ALL_MODULES } from "@/lib/modules";
import { requireAdmin } from "./auth";

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

// [PERF] Seed dos defaults roda 1× por processo — antes eram 5 upserts
// sequenciais em toda abertura do Studio
let defaultsSeeded = false;

export async function getAppConfig(): Promise<AppConfigEntry[]> {
  await requireAdmin();
  if (!defaultsSeeded) {
    const keys = Object.keys(CONFIG_DEFAULTS);
    const existing = await db.appConfig.count({ where: { key: { in: keys } } });
    if (existing < keys.length) {
      for (const [key, value] of Object.entries(CONFIG_DEFAULTS)) {
        await db.appConfig.upsert({
          where:  { key },
          update: {},
          create: { key, value },
        });
      }
    }
    defaultsSeeded = true;
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
