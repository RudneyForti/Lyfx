/**
 * system-info.ts — informações de ambiente do Studio (versões + git).
 *
 * DEPENDÊNCIA DE AMBIENTE (isolada aqui de propósito):
 *   - `git` precisa estar no PATH do processo Node
 *   - o worktree de produção precisa existir em `../lyfx-production`
 *
 * Todo acesso é envolto em try/catch com fallback "—". Se o deploy for para
 * um container sem git ou sem o worktree, o Studio degrada graciosamente —
 * nada quebra além destes campos informativos.
 *
 * Este módulo NÃO é "use server" — são helpers síncronos consumidos apenas
 * por server actions (app/studio/data.ts).
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
