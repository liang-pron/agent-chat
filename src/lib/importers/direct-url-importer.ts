import { parseSkillMdContent } from "@/lib/github-import";
import { classifyAgent } from "@/lib/classifier";
import { registerAgent } from "@/lib/agent-registry";
import { DEFAULT_MODEL_CONFIG } from "@/lib/constants";

export async function importFromDirectUrl(url: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "AgentPlaza/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "无法访问该链接", status: 502 };
  }

  if (!response.ok) {
    return { error: `无法访问该链接 (HTTP ${response.status})`, status: 502 };
  }

  const content = await response.text();
  const parsed = parseSkillMdContent(content);

  if (!parsed) {
    return { error: "无法解析该链接中的 SKILL.md，请确认是有效的 Markdown 文件（含 YAML frontmatter）", status: 400 };
  }

  const category = parsed.category || await classifyAgent(parsed.name, parsed.description, parsed.systemPrompt);

  const agent = await registerAgent({
    name: parsed.name,
    description: parsed.description,
    category,
    githubUrl: url,
    systemPrompt: parsed.systemPrompt,
    modelConfig: JSON.stringify(DEFAULT_MODEL_CONFIG),
  });

  return { agent, category, status: 201 };
}
