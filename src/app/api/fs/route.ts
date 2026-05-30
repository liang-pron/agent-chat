import { NextRequest, NextResponse } from "next/server";
import { listFiles, readTextFile, writeTextFile, createFolder, deleteEntry } from "@/lib/fs-ops";

function getWorkspace(req: NextRequest): string {
  return req.nextUrl.searchParams.get("workspace") || "";
}

/** GET /api/fs?workspace=DIR&path=sub — list files; &read=1 — read file */
export async function GET(req: NextRequest) {
  const ws = getWorkspace(req);
  if (!ws) return NextResponse.json({ error: "请设置工作目录" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path") || "";
  const read = searchParams.get("read");

  try {
    if (read) {
      const content = await readTextFile(ws, filePath);
      if (content === null) return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      return NextResponse.json({ content, path: filePath });
    }
    const files = await listFiles(ws, filePath);
    return NextResponse.json({ files, path: filePath || "/", workspace: ws });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** POST /api/fs — write file or create folder */
export async function POST(req: NextRequest) {
  const ws = getWorkspace(req);
  if (!ws) return NextResponse.json({ error: "请设置工作目录" }, { status: 400 });

  try {
    const body = await req.json();
    const { path: filePath, content, folder } = body as { path?: string; content?: string; folder?: boolean };
    if (!filePath) return NextResponse.json({ error: "缺少路径" }, { status: 400 });

    if (folder) {
      const r = await createFolder(ws, filePath);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
      return NextResponse.json({ ok: true, path: filePath });
    }
    if (content === undefined) return NextResponse.json({ error: "缺少内容" }, { status: 400 });

    const r = await writeTextFile(ws, filePath, content);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ ok: true, path: filePath });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** DELETE /api/fs?workspace=DIR&path=xxx */
export async function DELETE(req: NextRequest) {
  const ws = getWorkspace(req);
  if (!ws) return NextResponse.json({ error: "请设置工作目录" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "缺少路径" }, { status: 400 });

  const r = await deleteEntry(ws, filePath);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
