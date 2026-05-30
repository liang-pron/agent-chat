import { readFile, writeFile, mkdir, readdir, stat, rm } from "fs/promises";
import path from "path";

function resolvePath(workspace: string, inputPath: string): string {
  return path.resolve(workspace, inputPath);
}

export async function listFiles(workspace: string, dirPath = ""): Promise<{ name: string; type: "file" | "dir"; size?: number }[]> {
  const target = path.resolve(workspace, dirPath);
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

export async function readTextFile(workspace: string, filePath: string): Promise<string | null> {
  try {
    const resolved = resolvePath(workspace, filePath);
    return await readFile(resolved, "utf-8");
  } catch {
    return null;
  }
}

export async function writeTextFile(workspace: string, filePath: string, content: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resolved = resolvePath(workspace, filePath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, content, "utf-8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function createFolder(workspace: string, folderPath: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resolved = resolvePath(workspace, folderPath);
    await mkdir(resolved, { recursive: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteEntry(workspace: string, targetPath: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resolved = resolvePath(workspace, targetPath);
    await rm(resolved, { recursive: true, force: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
