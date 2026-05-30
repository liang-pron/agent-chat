import { readFile, writeFile, mkdir, readdir, stat, rm } from "fs/promises";
import path from "path";

function getWorkspace(): string | null {
  return process.env.WORKSPACE_DIR || null;
}

/** Resolve and validate a path — must stay inside workspace */
function resolvePath(inputPath: string): string | null {
  const ws = getWorkspace();
  if (!ws) return null;

  const resolved = path.resolve(ws, inputPath);
  if (!resolved.startsWith(path.resolve(ws))) return null;
  return resolved;
}

export async function listFiles(dirPath = ""): Promise<{ name: string; type: "file" | "dir"; size?: number }[]> {
  const ws = getWorkspace();
  if (!ws) return [];

  const target = resolvePath(dirPath) || ws;
  await mkdir(target, { recursive: true });

  const entries = await readdir(target, { withFileTypes: true });
  const result = await Promise.all(
    entries.map(async (e) => {
      const full = path.join(target, e.name);
      if (e.isDirectory()) return { name: e.name, type: "dir" as const };
      const s = await stat(full).catch(() => ({ size: 0 }));
      return { name: e.name, type: "file" as const, size: s.size };
    })
  );
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function readTextFile(filePath: string): Promise<string | null> {
  const resolved = resolvePath(filePath);
  if (!resolved) return null;
  try {
    return await readFile(resolved, "utf-8");
  } catch {
    return null;
  }
}

export async function writeTextFile(filePath: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const resolved = resolvePath(filePath);
  if (!resolved) return { ok: false, error: "未配置工作目录" };

  try {
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, content, "utf-8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function createFolder(folderPath: string): Promise<{ ok: boolean; error?: string }> {
  const resolved = resolvePath(folderPath);
  if (!resolved) return { ok: false, error: "未配置工作目录" };

  try {
    await mkdir(resolved, { recursive: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteEntry(targetPath: string): Promise<{ ok: boolean; error?: string }> {
  const resolved = resolvePath(targetPath);
  if (!resolved) return { ok: false, error: "未配置工作目录" };

  try {
    await rm(resolved, { recursive: true, force: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export function getWorkspaceInfo(): { configured: boolean; path: string | null } {
  const ws = getWorkspace();
  return { configured: !!ws, path: ws };
}
