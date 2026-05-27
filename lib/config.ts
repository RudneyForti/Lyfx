/**
 * Public config helpers — no admin auth required.
 * Used by app layouts and middleware to read global settings.
 */
import { db } from "@/lib/db";

export async function getConfigValue(key: string, fallback = ""): Promise<string> {
  try {
    const entry = await db.appConfig.findUnique({ where: { key } });
    return entry?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getConfigBool(key: string, fallback = false): Promise<boolean> {
  const val = await getConfigValue(key, String(fallback));
  return val === "true";
}
