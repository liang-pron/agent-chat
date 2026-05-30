import { NextRequest, NextResponse } from "next/server";
import { listFiles, readTextFile, writeTextFile, createFolder, deleteEntry, getWorkspaceInfo } from "@/lib/fs-ops";

/** GET /api/fs?path=subdir — list files; ?path=file&read=1 — read file */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path") || "";
  const read = searchParams.get("read");

  const info = getWorkspaceInfo();
  if (!info.configured) {
    return NextResponse.json({ error: "未配置工作目录，请在 .env 中设置 WORKSPACE_DIR" }, { status: 400 });
  }

  try {
    if (read) {
      const content = await readTextFile(filePath);
      if (content === null) return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      return NextResponse.json({ content, path: filePath });
    }

    const files = await listFiles(filePath);
    return NextResponse.json({ files, path: filePath || "/", workspace: info.path });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** POST /api/fs — create/write file or folder */
export async function POST(req: NextRequest) {
  const info = getWorkspaceInfo();
  if (!info.configured) {
    return NextResponse.json({ error: "未配置工作目录" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { path: filePath, content, folder } = body as { path?: string; content?: string; folder?: boolean };

    if (!filePath) return NextResponse.json({ error: "缺少路径" }, { status: 400 });

    if (folder) {
      const r = await createFolder(filePath);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
      return NextResponse.json({ ok: true, path: filePath });
    }

    if (content === undefined) return NextResponse.json({ error: "缺少内容" }, { status: 400 });

    const r = await writeTextFile(filePath, content);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ ok: true, path: filePath });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** DELETE /api/fs?path=xxx — delete file or folder */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) return NextResponse.json({ error: "缺少路径" }, { status: 400 });

  const r = await deleteEntry(filePath);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
