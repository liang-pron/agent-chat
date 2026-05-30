import { NextRequest, NextResponse } from "next/server";
import { importFromGitHub, parseSkillMdContent, findAllSkillMdFiles, fetchAndParseSkillMd, fetchRepoReadme } from "@/lib/github-import";
import { validateGitHubUrl } from "@/lib/validators";
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
  const { githubUrl, merge, selectedPaths } = body as {
    githubUrl?: string;
    merge?: boolean;
    selectedPaths?: string[];
  };

  if (!githubUrl) {
    return NextResponse.json({ error: "请提供链接" }, { status: 400 });
  }

  // Direct SKILL.md URL (raw .md file hosted anywhere)
  if (githubUrl.endsWith(".md") || githubUrl.includes("raw.")) {
    return handleDirectUrl(githubUrl);
  }

  // GitHub repo URL
  return handleGithubImport(githubUrl, merge, selectedPaths);
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

async function handleGithubImport(
  githubUrl: string,
  merge?: boolean,
  selectedPaths?: string[]
) {
  const parsed = validateGitHubUrl(githubUrl);
  if ("error" in parsed) return handleSingleGithubImport(githubUrl);

  try {
    const skillFiles = await findAllSkillMdFiles(parsed.owner, parsed.repo);
    if (skillFiles.length > 1) {
      return handleBulkGithubImport(parsed.owner, parsed.repo, githubUrl, skillFiles, merge, selectedPaths);
    }
  } catch { /* fall through */ }

  return handleSingleGithubImport(githubUrl);
}

async function handleBulkGithubImport(
  owner: string, repo: string, baseUrl: string,
  skillFiles: { path: string; url: string }[],
  merge = false,
  selectedPaths?: string[]
) {
  // Filter to selected files if specified
  const files = selectedPaths
    ? skillFiles.filter((f) => selectedPaths.includes(f.path))
    : skillFiles;

  if (files.length === 0) {
    return NextResponse.json({ error: "未选择任何文件" }, { status: 400 });
  }

  // ─── Merge mode: combine all into one agent ───
  if (merge) {
    const parsedList: { name: string; description: string; systemPrompt: string; category?: string }[] = [];
    for (const file of files) {
      const p = await fetchAndParseSkillMd(owner, repo, file.path);
      if (p) parsedList.push(p);
    }

    if (parsedList.length === 0) {
      return NextResponse.json({ error: "无法解析任何 SKILL.md" }, { status: 400 });
    }

    const mergedName = parsedList.map((p) => p.name).join(" · ");
    const mergedDesc = parsedList.map((p) => `${p.name}: ${p.description || "—"}`).join("；");
    const mergedPrompt = parsedList
      .map((p, i) => `## 角色 ${i + 1}: ${p.name}\n\n${p.systemPrompt}`)
      .join("\n\n---\n\n");

    const category = await classifyAgent(mergedName, mergedDesc, mergedPrompt);
    const modelConfig = { provider: "deepseek", model: "deepseek-chat", apiEndpoint: "https://api.deepseek.com/v1", apiKeyEnv: "DEEPSEEK_API_KEY" };

    const agent = await registerAgent({
      name: mergedName,
      description: mergedDesc,
      category,
      githubUrl: baseUrl,
      systemPrompt: mergedPrompt,
      modelConfig: JSON.stringify(modelConfig),
    });

    return NextResponse.json({
      bulk: true,
      merge: true,
      total: files.length,
      okCount: 1,
      results: [{ path: "合并导入", name: mergedName, status: "ok" }],
      agents: [{ id: agent.id, name: agent.name }],
    }, { status: 201 });
  }

  // ─── Separate mode: one agent per SKILL.md ───
  const results: { path: string; name: string; status: "ok" | "skip" | "fail"; reason?: string }[] = [];
  const imported: { id: string; name: string }[] = [];

  for (const file of files) {
    try {
      const parsed = await fetchAndParseSkillMd(owner, repo, file.path);
      if (!parsed) {
        results.push({ path: file.path, name: "-", status: "fail", reason: "无法解析" });
        continue;
      }

      const repoUrl = `https://github.com/${owner}/${repo}/blob/main/${file.path}`;
      const alreadyImported = await isRepoImported(repoUrl);
      if (alreadyImported) {
        results.push({ path: file.path, name: parsed.name, status: "skip", reason: "已导入" });
        continue;
      }

      const category = parsed.category || await classifyAgent(parsed.name, parsed.description, parsed.systemPrompt);
      const modelConfig = { provider: "deepseek", model: "deepseek-chat", apiEndpoint: "https://api.deepseek.com/v1", apiKeyEnv: "DEEPSEEK_API_KEY" };

      const agent = await registerAgent({
        name: parsed.name, description: parsed.description, category,
        githubUrl: repoUrl, systemPrompt: parsed.systemPrompt,
        modelConfig: JSON.stringify(modelConfig),
      });

      results.push({ path: file.path, name: parsed.name, status: "ok" });
      imported.push({ id: agent.id, name: agent.name });
    } catch {
      results.push({ path: file.path, name: "-", status: "fail", reason: "导入出错" });
    }
  }

  return NextResponse.json({
    bulk: true,
    total: files.length,
    okCount: results.filter((r) => r.status === "ok").length,
    skipCount: results.filter((r) => r.status === "skip").length,
    failCount: results.filter((r) => r.status === "fail").length,
    results,
    agents: imported,
  }, { status: 201 });
}

async function handleSingleGithubImport(githubUrl: string) {
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

  // Try to fetch README.md as document
  let document = "";
  try {
    const parsedUrl = validateGitHubUrl(result.data.githubUrl);
    if (!("error" in parsedUrl)) {
      const readme = await fetchRepoReadme(parsedUrl.owner, parsedUrl.repo);
      if (readme) document = readme;
    }
  } catch { /* skip */ }

  const agent = await registerAgent({
    name: result.data.name, description: result.data.description, category,
    githubUrl: result.data.githubUrl, systemPrompt: result.data.systemPrompt,
    modelConfig: JSON.stringify(result.data.modelConfig),
    avatarUrl: result.data.avatarUrl,
    document,
  });

  return NextResponse.json({ agent, category }, { status: 201 });
}
