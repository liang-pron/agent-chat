import { NextRequest, NextResponse } from "next/server";
import { importFromGitHub, parseSkillMdContent } from "@/lib/github-import";
import { classifyAgent } from "@/lib/classifier";
import { registerAgent, isRepoImported } from "@/lib/agent-registry";

/** POST /api/import — import from GitHub URL, direct URL, or local file upload */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // File upload: parse SKILL.md directly
    if (contentType.includes("multipart/form-data")) {
      return handleFileUpload(req);
    }

    // JSON: GitHub URL or direct SKILL.md URL
    return handleUrlImport(req);
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "导入失败，请稍后重试" }, { status: 500 });
  }
}

async function handleFileUpload(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择 SKILL.md 文件" }, { status: 400 });
  }

  if (!file.name.endsWith(".md")) {
    return NextResponse.json({ error: "仅支持 .md 文件" }, { status: 400 });
  }

  const content = await file.text();
  const parsed = parseSkillMdContent(content);

  if (!parsed) {
    return NextResponse.json({ error: "无法解析 SKILL.md，请检查文件格式是否正确（需要 YAML frontmatter）" }, { status: 400 });
  }

  const { name, description, systemPrompt, category: parsedCategory } = parsed;
  const category = parsedCategory || await classifyAgent(name, description, systemPrompt);
  const modelConfig = { provider: "deepseek", model: "deepseek-chat", apiEndpoint: "https://api.deepseek.com/v1", apiKeyEnv: "DEEPSEEK_API_KEY" };

  const agent = await registerAgent({
    name, description, category,
    githubUrl: `file://${file.name}`,
    systemPrompt,
    modelConfig: JSON.stringify(modelConfig),
  });

  return NextResponse.json({ agent, category }, { status: 201 });
}

async function handleUrlImport(req: NextRequest) {
  const body = await req.json();
  const { githubUrl } = body as { githubUrl?: string };

  if (!githubUrl) {
    return NextResponse.json({ error: "请提供链接" }, { status: 400 });
  }

  // Direct SKILL.md URL (raw .md file hosted anywhere)
  if (githubUrl.endsWith(".md") || githubUrl.includes("raw.")) {
    return handleDirectUrl(githubUrl);
  }

  // GitHub repo URL
  return handleGithubImport(githubUrl);
}

async function handleDirectUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AgentPlaza/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const content = await response.text();
    const parsed = parseSkillMdContent(content);

    if (!parsed) {
      return NextResponse.json({ error: "无法解析该链接中的 SKILL.md，请确认是有效的 Markdown 文件（含 YAML frontmatter）" }, { status: 400 });
    }

    const { name, description, systemPrompt, category: parsedCategory } = parsed;
    const category = parsedCategory || await classifyAgent(name, description, systemPrompt);
    const modelConfig = { provider: "deepseek", model: "deepseek-chat", apiEndpoint: "https://api.deepseek.com/v1", apiKeyEnv: "DEEPSEEK_API_KEY" };

    const agent = await registerAgent({
      name, description, category,
      githubUrl: url,
      systemPrompt,
      modelConfig: JSON.stringify(modelConfig),
    });

    return NextResponse.json({ agent, category }, { status: 201 });
  } catch (err) {
    console.error("Direct URL import error:", err);
    return NextResponse.json({ error: "无法访问该链接，请检查链接是否可直接访问" }, { status: 502 });
  }
}

async function handleGithubImport(githubUrl: string) {
  const result = await importFromGitHub(githubUrl);

  if (!result.success) {
    const statusMap: Record<string, number> = {
      INVALID_URL: 400, REPO_NOT_FOUND: 400, RATE_LIMITED: 429,
      NO_SKILL_FILE: 400, INVALID_SKILL: 400, MISSING_FIELDS: 400, FETCH_ERROR: 502,
    };
    return NextResponse.json({ error: result.error }, { status: statusMap[result.code] || 500 });
  }

  const alreadyImported = await isRepoImported(result.data.githubUrl);
  if (alreadyImported) {
    return NextResponse.json({ error: "该仓库已经导入过了" }, { status: 409 });
  }

  let category = result.data.category;
  if (!category || category === "其他") {
    category = await classifyAgent(result.data.name, result.data.description, result.data.systemPrompt);
  }

  const agent = await registerAgent({
    name: result.data.name, description: result.data.description, category,
    githubUrl: result.data.githubUrl, systemPrompt: result.data.systemPrompt,
    modelConfig: JSON.stringify(result.data.modelConfig),
    avatarUrl: result.data.avatarUrl,
  });

  return NextResponse.json({ agent, category }, { status: 201 });
}
