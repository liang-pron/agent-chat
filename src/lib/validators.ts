/** Input validation utilities for AgentPlaza */

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[^/]+\/[^/]+/;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_AGENT_NAME_LENGTH = 50;
const MAX_IMPORTS_PER_HOUR = 10;

const importCounts = new Map<string, { count: number; resetAt: number }>();

/** Validate and normalize a GitHub repo URL. Returns { owner, repo } or error. */
export function validateGitHubUrl(
  url: string
): { owner: string; repo: string } | { error: string } {
  const trimmed = url.trim().replace(/\/$/, "").replace(/^https:\/\/www\./, "https://");

  if (!trimmed) {
    return { error: "请输入 GitHub 仓库链接" };
  }

  const match = trimmed.match(GITHUB_URL_REGEX);
  if (!match) {
    return { error: "请输入有效的 GitHub 仓库链接（https://github.com/owner/repo）" };
  }

  // Strip subdirectory paths like /tree/main/subfolder
  const urlObj = new URL(trimmed);
  const parts = urlObj.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return { error: "请输入有效的 GitHub 仓库链接" };
  }

  return { owner: parts[0], repo: parts[1] };
}

/** Validate a chat message */
export function validateMessage(content: string): { error?: string } {
  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "消息不能为空" };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { error: `消息长度不能超过 ${MAX_MESSAGE_LENGTH} 字符` };
  }
  return {};
}

/** Validate an agent name */
export function validateAgentName(name: string): { error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "角色名不能为空" };
  }
  if (trimmed.length > MAX_AGENT_NAME_LENGTH) {
    return { error: `角色名不能超过 ${MAX_AGENT_NAME_LENGTH} 字符` };
  }
  return {};
}

/** Rate-limit imports by IP. Returns true if allowed. */
export function checkImportRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = importCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    importCounts.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (entry.count >= MAX_IMPORTS_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}
