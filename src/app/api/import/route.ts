import { NextRequest, NextResponse } from "next/server";
import { importFromGitHub } from "@/lib/github-import";
import { classifyAgent } from "@/lib/classifier";
import { registerAgent, isRepoImported } from "@/lib/agent-registry";
import { checkImportRateLimit } from "@/lib/validators";

/** POST /api/import — import an agent from a GitHub repo */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkImportRateLimit(ip)) {
      return NextResponse.json(
        { error: "导入请求太频繁，请一小时后重试" },
        { status: 429 }
      );
    }

    // Parse request
    const body = await req.json();
    const { githubUrl } = body as { githubUrl?: string };

    if (!githubUrl) {
      return NextResponse.json({ error: "请提供 GitHub 仓库链接" }, { status: 400 });
    }

    // Import from GitHub
    const result = await importFromGitHub(githubUrl);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        REPO_NOT_FOUND: 400,
        RATE_LIMITED: 429,
        NO_AGENT_JSON: 400,
        INVALID_JSON: 400,
        MISSING_FIELDS: 400,
        FETCH_ERROR: 502,
      };
      return NextResponse.json(
        { error: result.error },
        { status: statusMap[result.code] || 500 }
      );
    }

    // Check for duplicate imports
    const alreadyImported = await isRepoImported(result.data.githubUrl);
    if (alreadyImported) {
      return NextResponse.json(
        { error: "该仓库已经导入过了" },
        { status: 409 }
      );
    }

    // Auto-classify if no category provided
    let category = result.data.category;
    if (!category || category === "其他") {
      category = await classifyAgent(
        result.data.name,
        result.data.description,
        result.data.systemPrompt
      );
    }

    // Register agent
    const agent = await registerAgent({
      name: result.data.name,
      description: result.data.description,
      category,
      githubUrl: result.data.githubUrl,
      systemPrompt: result.data.systemPrompt,
      modelConfig: JSON.stringify(result.data.modelConfig),
      avatarUrl: result.data.avatarUrl,
    });

    return NextResponse.json({ agent, category }, { status: 201 });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "导入失败，请稍后重试" }, { status: 500 });
  }
}
