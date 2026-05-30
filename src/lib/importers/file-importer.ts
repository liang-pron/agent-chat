import { parseSkillMdContent } from "@/lib/github-import";
import { classifyAgent } from "@/lib/classifier";
import { registerAgent } from "@/lib/agent-registry";
import { DEFAULT_MODEL_CONFIG } from "@/lib/constants";

export async function importFromFile(file: File) {
  if (!file.name.endsWith(".md")) {
    return { error: "仅支持 .md 文件", status: 400 };
  }

  const content = await file.text();
  const parsed = parseSkillMdContent(content);

  if (!parsed) {
    return { error: "无法解析 SKILL.md，请检查文件格式是否正确（需要 YAML frontmatter）", status: 400 };
  }

  const category = parsed.category || await classifyAgent(parsed.name, parsed.description, parsed.systemPrompt);

  const agent = await registerAgent({
    name: parsed.name,
    description: parsed.description,
    category,
    githubUrl: `file://${file.name}`,
    systemPrompt: parsed.systemPrompt,
    modelConfig: JSON.stringify(DEFAULT_MODEL_CONFIG),
  });

  return { agent, category, status: 201 };
}
