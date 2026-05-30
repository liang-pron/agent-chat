import { validateGitHubUrl } from "@/lib/validators";

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
  code: "INVALID_URL" | "REPO_NOT_FOUND" | "RATE_LIMITED" | "NO_AGENT_JSON" | "INVALID_JSON" | "MISSING_FIELDS" | "FETCH_ERROR";
}

/**
 * Import an agent from a GitHub repo.
 * Looks for agent.json in the repo root and parses the agent config.
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

  // 2. Fetch agent.json from GitHub
  let agentJson: AgentJson;
  try {
    agentJson = await fetchAgentJson(owner, repo);
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number };
    if (e.code === "NOT_FOUND" || e.status === 404) {
      return {
        success: false,
        error: `找不到仓库 ${owner}/${repo}，请检查链接是否正确`,
        code: "REPO_NOT_FOUND",
      };
    }
    if (e.code === "RATE_LIMITED" || e.status === 403) {
      return {
        success: false,
        error: "GitHub API 请求太频繁，请稍后再试",
        code: "RATE_LIMITED",
      };
    }
    if (e.code === "NO_AGENT_JSON") {
      return {
        success: false,
        error: `该仓库未包含 agent.json 配置文件。请确保仓库根目录下有符合规范的 agent.json 文件。`,
        code: "NO_AGENT_JSON",
      };
    }
    return {
      success: false,
      error: `获取仓库信息失败：${(e as Error).message || "未知错误"}`,
      code: "FETCH_ERROR",
    };
  }

  // 3. Validate required fields
  if (!agentJson.name || !agentJson.systemPrompt) {
    const missing: string[] = [];
    if (!agentJson.name) missing.push("name");
    if (!agentJson.systemPrompt) missing.push("systemPrompt");
    return {
      success: false,
      error: `配置文件缺少必填字段：${missing.join("、")}`,
      code: "MISSING_FIELDS",
    };
  }

  // 4. Build model config
  const modelConfig = {
    provider: agentJson.model?.provider || "deepseek",
    model: agentJson.model?.model || "deepseek-chat",
    apiEndpoint:
      agentJson.model?.apiEndpoint || "https://api.deepseek.com/v1",
    apiKeyEnv:
      agentJson.model?.provider === "custom" ? "CUSTOM_API_KEY" : "DEEPSEEK_API_KEY",
  };

  return {
    success: true,
    data: {
      name: agentJson.name.trim(),
      description: (agentJson.description || "").trim(),
      systemPrompt: agentJson.systemPrompt.trim(),
      githubUrl: repoUrl,
      category: agentJson.category,
      modelConfig,
      avatarUrl: agentJson.avatarUrl,
    },
  };
}

/** Fetch and parse agent.json from a GitHub repo */
async function fetchAgentJson(
  owner: string,
  repo: string
): Promise<AgentJson> {
  // Try fetching agent.json from the repo root
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/agent.json`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AgentPlaza/1.0",
      // Use GITHUB_TOKEN if available for higher rate limits
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) {
    throw { code: "NO_AGENT_JSON" };
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
    throw { code: "NO_AGENT_JSON" };
  }

  const decoded = Buffer.from(data.content, "base64").toString("utf-8");

  try {
    return JSON.parse(decoded) as AgentJson;
  } catch {
    throw { code: "INVALID_JSON" };
  }
}
