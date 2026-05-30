import { validateGitHubUrl } from "@/lib/validators";
import YAML from "yaml";

const GITHUB_API_BASE = "https://api.github.com";

interface AgentJson {
  name: string;
  description: string;
  systemPrompt: string;
  category?: string;
  model?: {
    provider?: string;
    model?: string;
    apiEndpoint?: string;
  };
  avatarUrl?: string;
}

interface SkillMd {
  name: string;
  description: string;
  body: string;
  metadata?: Record<string, string>;
  category?: string;
  model?: {
    provider?: string;
    model?: string;
    apiEndpoint?: string;
  };
}

interface ImportResult {
  success: true;
  data: {
    name: string;
    description: string;
    systemPrompt: string;
    githubUrl: string;
    category?: string;
    modelConfig: {
      provider: string;
      model: string;
      apiEndpoint: string;
      apiKeyEnv: string;
    };
    avatarUrl?: string;
  };
}

interface ImportError {
  success: false;
  error: string;
  code:
    | "INVALID_URL"
    | "REPO_NOT_FOUND"
    | "RATE_LIMITED"
    | "NO_SKILL_FILE"
    | "INVALID_SKILL"
    | "MISSING_FIELDS"
    | "FETCH_ERROR";
}

/**
 * Import an agent from a GitHub repo.
 *
 * Priority order:
 *   1. SKILL.md — the standard agent skill format (YAML frontmatter + Markdown body)
 *   2. agent.json — simple JSON config (backward compatible)
 */
export async function importFromGitHub(
  githubUrl: string
): Promise<ImportResult | ImportError> {
  // 1. Validate URL
  const parsed = validateGitHubUrl(githubUrl);
  if ("error" in parsed) {
    return { success: false, error: parsed.error, code: "INVALID_URL" };
  }

  const { owner, repo } = parsed;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  // 2. Try SKILL.md first, then agent.json
  let skillData: { name: string; description: string; systemPrompt: string; category?: string; modelConfig: { provider: string; model: string; apiEndpoint: string; apiKeyEnv: string } };
  let errorCode: ImportError["code"] = "NO_SKILL_FILE";

  try {
    // Try SKILL.md first
    const skill = await fetchSkillMd(owner, repo);
    skillData = buildFromSkillMd(skill);
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number };

    // If SKILL.md not found, try agent.json
    if (e.code === "NOT_FOUND" || e.code === "NO_SKILL_FILE") {
      try {
        const json = await fetchAgentJson(owner, repo);
        skillData = buildFromAgentJson(json);
      } catch (err2: unknown) {
        const e2 = err2 as { code?: string; status?: number };
        if (e2.code === "NO_AGENT_JSON") {
          return {
            success: false,
            error: "该仓库未找到 SKILL.md 或 agent.json。请确保仓库根目录下有符合规范的配置文件。",
            code: "NO_SKILL_FILE",
          };
        }
        return handleFetchError(e2, owner, repo);
      }
    } else {
      return handleFetchError(e, owner, repo);
    }
  }

  // 3. Validate required fields
  if (!skillData.name || !skillData.systemPrompt) {
    const missing: string[] = [];
    if (!skillData.name) missing.push("name");
    if (!skillData.systemPrompt) missing.push("systemPrompt");
    return {
      success: false,
      error: `配置文件缺少必填字段：${missing.join("、")}`,
      code: "MISSING_FIELDS",
    };
  }

  return {
    success: true,
    data: {
      name: skillData.name.trim(),
      description: (skillData.description || "").trim(),
      systemPrompt: skillData.systemPrompt.trim(),
      githubUrl: repoUrl,
      category: skillData.category,
      modelConfig: skillData.modelConfig,
    },
  };
}

function handleFetchError(
  err: { code?: string; status?: number },
  owner: string,
  repo: string
): ImportError {
  if (err.code === "NOT_FOUND" || err.status === 404) {
    return {
      success: false,
      error: `找不到仓库 ${owner}/${repo}，请检查链接是否正确`,
      code: "REPO_NOT_FOUND",
    };
  }
  if (err.code === "RATE_LIMITED" || err.status === 403) {
    return {
      success: false,
      error: "GitHub API 请求太频繁，请稍后再试",
      code: "RATE_LIMITED",
    };
  }
  return {
    success: false,
    error: `获取仓库信息失败：请检查链接是否正确`,
    code: "FETCH_ERROR",
  };
}

// ─── Public parser for raw SKILL.md content ──────────────────

interface ParsedSkill {
  name: string;
  description: string;
  systemPrompt: string;
  category?: string;
}

/** Parse raw SKILL.md content (YAML frontmatter + Markdown body) */
export function parseSkillMdContent(content: string): ParsedSkill | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatterStr = match[1];
  const body = match[2].trim();
  let frontmatter: Record<string, unknown>;

  try { frontmatter = YAML.parse(frontmatterStr) as Record<string, unknown>; }
  catch { return null; }

  const name = (frontmatter.name as string) || "";
  if (!name) return null;

  return {
    name,
    description: (frontmatter.description as string) || "",
    systemPrompt: body,
    category: frontmatter.category as string | undefined,
  };
}

// ─── Bulk import: find all SKILL.md files in a repo ────────────

interface SkillMdFile {
  path: string;    // e.g., "agents/zhangxuefeng/SKILL.md"
  url: string;     // GitHub API URL for contents
}

/** Recursively find all SKILL.md files in a GitHub repo */
export async function findAllSkillMdFiles(
  owner: string,
  repo: string
): Promise<SkillMdFile[]> {
  const branch = await getDefaultBranch(owner, repo);
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AgentPlaza/1.0",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw { code: "NOT_FOUND", status: response.status };
  }

  const data = (await response.json()) as {
    tree?: { path: string; type: string; url: string }[];
  };

  return (data.tree || [])
    .filter((item) => item.type === "blob" && item.path.endsWith("SKILL.md"))
    .map((item) => ({ path: item.path, url: item.url }));
}

async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AgentPlaza/1.0",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw { code: "NOT_FOUND", status: response.status };
  const data = (await response.json()) as { default_branch: string };
  return data.default_branch || "main";
}

/** Fetch and parse a SKILL.md from a specific path in a repo */
export async function fetchAndParseSkillMd(
  owner: string,
  repo: string,
  path: string
): Promise<{ name: string; description: string; systemPrompt: string; category?: string } | null> {
  const content = await fetchFileContent(owner, repo, path);
  return parseSkillMdContent(content);
}

// ─── SKILL.md parser (GitHub) ─────────────────────────────────

async function fetchSkillMd(
  owner: string,
  repo: string
): Promise<SkillMd> {
  const content = await fetchFileContent(owner, repo, "SKILL.md");

  // Parse YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw { code: "INVALID_SKILL" };
  }

  const frontmatterStr = match[1];
  const body = match[2].trim();
  let frontmatter: Record<string, unknown>;

  try {
    frontmatter = YAML.parse(frontmatterStr) as Record<string, unknown>;
  } catch {
    throw { code: "INVALID_SKILL" };
  }

  const name = (frontmatter.name as string) || "";
  const description = (frontmatter.description as string) || "";

  if (!name) {
    throw { code: "INVALID_SKILL" };
  }

  return {
    name,
    description,
    body,
    metadata: frontmatter.metadata as Record<string, string> | undefined,
    category: frontmatter.category as string | undefined,
  };
}

function buildFromSkillMd(skill: SkillMd): {
  name: string;
  description: string;
  systemPrompt: string;
  category?: string;
  modelConfig: { provider: string; model: string; apiEndpoint: string; apiKeyEnv: string };
} {
  return {
    name: skill.name,
    description: skill.description,
    systemPrompt: skill.body,
    category: skill.category,
    modelConfig: {
      provider: "deepseek",
      model: "deepseek-chat",
      apiEndpoint: "https://api.deepseek.com/v1",
      apiKeyEnv: "DEEPSEEK_API_KEY",
    },
  };
}

// ─── agent.json parser (backward compatible) ─────────────────

async function fetchAgentJson(
  owner: string,
  repo: string
): Promise<AgentJson> {
  const content = await fetchFileContent(owner, repo, "agent.json");
  try {
    return JSON.parse(content) as AgentJson;
  } catch {
    throw { code: "INVALID_SKILL" };
  }
}

function buildFromAgentJson(json: AgentJson): {
  name: string;
  description: string;
  systemPrompt: string;
  category?: string;
  modelConfig: { provider: string; model: string; apiEndpoint: string; apiKeyEnv: string };
} {
  return {
    name: json.name,
    description: json.description || "",
    systemPrompt: json.systemPrompt,
    category: json.category,
    modelConfig: {
      provider: json.model?.provider || "deepseek",
      model: json.model?.model || "deepseek-chat",
      apiEndpoint: json.model?.apiEndpoint || "https://api.deepseek.com/v1",
      apiKeyEnv:
        json.model?.provider === "custom" ? "CUSTOM_API_KEY" : "DEEPSEEK_API_KEY",
    },
  };
}

// ─── GitHub API helper ───────────────────────────────────────

async function fetchFileContent(
  owner: string,
  repo: string,
  filename: string
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filename}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AgentPlaza/1.0",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) {
    throw { code: filename === "SKILL.md" ? "NO_SKILL_FILE" : "NO_AGENT_JSON" };
  }
  if (response.status === 403) {
    throw { code: "RATE_LIMITED", status: 403 };
  }
  if (!response.ok) {
    throw { code: "NOT_FOUND", status: response.status };
  }

  const data = (await response.json()) as {
    content?: string;
    encoding?: string;
  };

  if (!data.content) {
    throw { code: filename === "SKILL.md" ? "NO_SKILL_FILE" : "NO_AGENT_JSON" };
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}
