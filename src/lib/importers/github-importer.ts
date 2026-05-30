import { importFromGitHub, findAllSkillMdFiles, fetchAndParseSkillMd, fetchRepoReadme } from "@/lib/github-import";
import { validateGitHubUrl } from "@/lib/validators";
import { classifyAgent } from "@/lib/classifier";
import { registerAgent, isRepoImported } from "@/lib/agent-registry";
import { DEFAULT_MODEL_CONFIG } from "@/lib/constants";

export async function importFromGithub(
  githubUrl: string,
  merge = false,
  selectedPaths?: string[]
) {
  const parsed = validateGitHubUrl(githubUrl);
  if ("error" in parsed) return { error: parsed.error, status: 400 };

  const { owner, repo } = parsed;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  // Check for multiple SKILL.md files
  let skillFiles = null;
  try { skillFiles = await findAllSkillMdFiles(owner, repo); } catch { /* fall through */ }

  if (skillFiles && skillFiles.length > 1) {
    return bulkImportFromGithub(owner, repo, repoUrl, skillFiles, merge, selectedPaths);
  }

  return singleImportFromGithub(repoUrl);
}

async function singleImportFromGithub(repoUrl: string) {
  const result = await importFromGitHub(repoUrl);

  if (!result.success) {
    const statusMap: Record<string, number> = {
      INVALID_URL: 400, REPO_NOT_FOUND: 400, RATE_LIMITED: 429,
      NO_SKILL_FILE: 400, INVALID_SKILL: 400, MISSING_FIELDS: 400, FETCH_ERROR: 502,
    };
    return { error: result.error, status: statusMap[result.code] || 500 };
  }

  const alreadyImported = await isRepoImported(result.data.githubUrl);
  if (alreadyImported) {
    return { error: "该仓库已经导入过了", status: 409 };
  }

  let category = result.data.category;
  if (!category || category === "其他") {
    category = await classifyAgent(result.data.name, result.data.description, result.data.systemPrompt);
  }

  let document = "";
  try {
    const pu = validateGitHubUrl(result.data.githubUrl);
    if (!("error" in pu)) {
      const readme = await fetchRepoReadme(pu.owner, pu.repo);
      if (readme) document = readme;
    }
  } catch { /* skip */ }

  const agent = await registerAgent({
    name: result.data.name, description: result.data.description, category,
    githubUrl: result.data.githubUrl, systemPrompt: result.data.systemPrompt,
    modelConfig: JSON.stringify(result.data.modelConfig),
    avatarUrl: result.data.avatarUrl, document,
  });

  return { agent, category, status: 201 };
}

async function bulkImportFromGithub(
  owner: string, repo: string, repoUrl: string,
  skillFiles: { path: string; url: string }[],
  merge = false, selectedPaths?: string[]
) {
  const files = selectedPaths
    ? skillFiles.filter((f) => selectedPaths.includes(f.path))
    : skillFiles;

  if (files.length === 0) return { error: "未选择任何文件", status: 400 };

  // Merge mode
  if (merge) {
    const parsedList = [];
    for (const file of files) {
      const p = await fetchAndParseSkillMd(owner, repo, file.path);
      if (p) parsedList.push(p);
    }
    if (parsedList.length === 0) return { error: "无法解析任何 SKILL.md", status: 400 };

    const mergedName = parsedList.map((p) => p.name).join(" · ");
    const mergedDesc = parsedList.map((p) => `${p.name}: ${p.description || "—"}`).join("；");
    const mergedPrompt = parsedList.map((p, i) => `## ${i + 1}: ${p.name}\n\n${p.systemPrompt}`).join("\n\n---\n\n");
    const category = await classifyAgent(mergedName, mergedDesc, mergedPrompt);

    const agent = await registerAgent({
      name: mergedName, description: mergedDesc, category,
      githubUrl: repoUrl, systemPrompt: mergedPrompt,
      modelConfig: JSON.stringify(DEFAULT_MODEL_CONFIG),
    });

    return { bulk: true, merge: true, total: files.length, okCount: 1, results: [{ path: "合并导入", name: mergedName, status: "ok" }], agents: [{ id: agent.id, name: agent.name }], status: 201 };
  }

  // Separate mode
  const results: { path: string; name: string; status: "ok" | "skip" | "fail"; reason?: string }[] = [];
  const imported: { id: string; name: string }[] = [];

  for (const file of files) {
    try {
      const p = await fetchAndParseSkillMd(owner, repo, file.path);
      if (!p) { results.push({ path: file.path, name: "-", status: "fail", reason: "无法解析" }); continue; }

      const fileUrl = `https://github.com/${owner}/${repo}/blob/main/${file.path}`;
      if (await isRepoImported(fileUrl)) { results.push({ path: file.path, name: p.name, status: "skip", reason: "已导入" }); continue; }

      const cat = p.category || await classifyAgent(p.name, p.description, p.systemPrompt);
      const agent = await registerAgent({
        name: p.name, description: p.description, category: cat,
        githubUrl: fileUrl, systemPrompt: p.systemPrompt,
        modelConfig: JSON.stringify(DEFAULT_MODEL_CONFIG),
      });
      results.push({ path: file.path, name: p.name, status: "ok" });
      imported.push({ id: agent.id, name: agent.name });
    } catch {
      results.push({ path: file.path, name: "-", status: "fail", reason: "导入出错" });
    }
  }

  return {
    bulk: true, total: files.length,
    okCount: results.filter((r) => r.status === "ok").length,
    skipCount: results.filter((r) => r.status === "skip").length,
    failCount: results.filter((r) => r.status === "fail").length,
    results, agents: imported, status: 201,
  };
}
