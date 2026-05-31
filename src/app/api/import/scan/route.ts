import { NextRequest, NextResponse } from "next/server";
import { findAllSkillMdFiles, fetchAndParseSkillMd } from "@/lib/github-import";
import { validateGitHubUrl } from "@/lib/validators";

/** GET /api/import/scan?url=https://github.com/owner/repo */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "请提供 GitHub 仓库链接" }, { status: 400 });
  }

  const parsed = validateGitHubUrl(url);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const files = await findAllSkillMdFiles(parsed.owner, parsed.repo);
    if (files.length === 0) {
      return NextResponse.json({ error: "该仓库未找到任何 SKILL.md 文件" }, { status: 404 });
    }

    // Parse each SKILL.md for preview
    const owner = parsed.owner;
    const repo = parsed.repo;
    const previews = await Promise.all(
      files.map(async (f) => {
        try {
          const result = await fetchAndParseSkillMd(owner, repo, f.path);
          return {
            path: f.path,
            name: result?.name || f.path,
            description: result?.description?.slice(0, 80) || "",
          };
        } catch {
          return { path: f.path, name: f.path, description: "" };
        }
      })
    );

    return NextResponse.json({ files: previews, total: files.length });
  } catch (err) {
    const e = err as { code?: string; status?: number; message?: string };
    if (e.code === "RATE_LIMITED" || e.status === 403) {
      return NextResponse.json({
        error: "GitHub API 请求次数超限。解决方法：在 .env 中添加 GITHUB_TOKEN（无需权限，仅提高限额）。从 https://github.com/settings/tokens 创建 token。",
      }, { status: 429 });
    }
    if (e.code === "NOT_FOUND" || e.status === 404) {
      return NextResponse.json({ error: "仓库不存在或为私有仓库" }, { status: 404 });
    }
    console.error("Scan error:", err);
    return NextResponse.json({
      error: `扫描失败: ${(err as Error).message || "请检查链接是否正确"}`,
    }, { status: 502 });
  }
}
