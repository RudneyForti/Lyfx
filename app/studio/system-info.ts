/**
 * system-info.ts — Studio environment information (versions + git).
 *
 * ENVIRONMENT DEPENDENCY (isolated here on purpose):
 *   - `git` must be on the Node process's PATH
 *   - the production worktree must exist at `../lyfx-production`
 *
 * Every access is wrapped in try/catch with a "—" fallback. If the deploy
 * target is a container without git or without the worktree, the Studio
 * degrades gracefully — nothing breaks besides these informational fields.
 *
 * This module is NOT "use server" — these are sync helpers consumed only
 * by server actions (app/studio/data.ts).
 */

import { readFile } from "fs/promises";
import { execSync } from "child_process";
import path from "path";

export interface VersionInfo {
  appVersion:  string;
  prodVersion: string;
}

export interface GitInfo {
  devBranch:  string;
  devCommit:  string;
  prodBranch: string;
  prodCommit: string;
}

const PROD_DIR = () => path.join(process.cwd(), "..", "lyfx-production");

export async function getVersionInfo(): Promise<VersionInfo> {
  let appVersion = "—";
  let prodVersion = "—";
  try {
    const pkg = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf-8"));
    appVersion = pkg.version ?? "—";
  } catch { /* ignore */ }
  try {
    const pkg = JSON.parse(await readFile(path.join(PROD_DIR(), "package.json"), "utf-8"));
    prodVersion = pkg.version ?? "—";
  } catch { /* ignore */ }
  return { appVersion, prodVersion };
}

function gitAt(cwd: string, args: string): string {
  return execSync(`git ${args}`, { cwd, encoding: "utf-8", timeout: 3000 }).trim();
}

export function getGitInfo(): GitInfo {
  let devBranch = "—", devCommit = "—";
  let prodBranch = "—", prodCommit = "—";
  try {
    devBranch = gitAt(process.cwd(), "rev-parse --abbrev-ref HEAD");
    devCommit = gitAt(process.cwd(), "rev-parse --short HEAD");
  } catch { /* git ausente ou fora de um repositório */ }
  try {
    prodBranch = gitAt(PROD_DIR(), "rev-parse --abbrev-ref HEAD");
    prodCommit = gitAt(PROD_DIR(), "rev-parse --short HEAD");
  } catch { /* worktree de produção inexistente neste ambiente */ }
  return { devBranch, devCommit, prodBranch, prodCommit };
}
