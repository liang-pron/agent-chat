import { NextRequest, NextResponse } from "next/server";
import { importFromFile } from "@/lib/importers/file-importer";
import { importFromDirectUrl } from "@/lib/importers/direct-url-importer";
import { importFromGithub } from "@/lib/importers/github-importer";

/** POST /api/import */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  try {
    // File upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "请选择 SKILL.md 文件" }, { status: 400 });
      const r = await importFromFile(file);
      return NextResponse.json(r, { status: r.status || 500 });
    }

    // URL import
    const body = await req.json();
    const url = (body as { githubUrl?: string }).githubUrl;
    if (!url) return NextResponse.json({ error: "请提供链接" }, { status: 400 });

    // Direct URL or GitHub
    if (url.endsWith(".md") || url.includes("raw.")) {
      const r = await importFromDirectUrl(url);
      return NextResponse.json(r, { status: r.status || 500 });
    }

    const r = await importFromGithub(
      url,
      (body as { merge?: boolean }).merge,
      (body as { selectedPaths?: string[] }).selectedPaths
    );
    return NextResponse.json(r, { status: r.status || 500 });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "导入失败，请稍后重试" }, { status: 500 });
  }
}
