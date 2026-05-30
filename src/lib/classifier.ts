import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { CATEGORIES, type Category } from "@/lib/constants";
export const VALID_CATEGORIES = CATEGORIES;
export type { Category };

/** Keyword-to-category mapping for fallback classification */
const KEYWORD_MAP: Record<string, Category> = {
  高考: "教育",
  志愿: "教育",
  考试: "教育",
  学习: "教育",
  老师: "教育",
  学生: "教育",
  学校: "教育",
  编程: "科技",
  代码: "科技",
  程序员: "科技",
  AI: "科技",
  人工智能: "科技",
  科技: "科技",
  技术: "科技",
  搞笑: "娱乐",
  段子: "娱乐",
  相声: "娱乐",
  脱口秀: "娱乐",
  演员: "娱乐",
  明星: "娱乐",
  电影: "娱乐",
  创业: "商业",
  投资: "商业",
  商业: "商业",
  赚钱: "商业",
  公司: "商业",
  老板: "商业",
  健身: "生活方式",
  美食: "生活方式",
  旅行: "生活方式",
  穿搭: "生活方式",
  心理: "生活方式",
  宠物: "生活方式",
  游戏: "游戏",
  电竞: "游戏",
  LOL: "游戏",
  王者荣耀: "游戏",
};

/**
 * Classify an agent into a domain category.
 * Uses LLM (DeepSeek) as primary, falls back to keyword matching.
 */
export async function classifyAgent(
  name: string,
  description: string,
  systemPrompt: string
): Promise<Category> {
  // Try LLM classification first
  try {
    const category = await classifyWithLLM(name, description, systemPrompt);
    if (VALID_CATEGORIES.includes(category as Category)) {
      return category as Category;
    }
  } catch {
    // LLM failed, fall through to keyword matching
  }

  // Keyword fallback
  return classifyWithKeywords(name, description, systemPrompt);
}

async function classifyWithLLM(
  name: string,
  description: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const deepseek = createOpenAICompatible({
    name: "deepseek",
    apiKey,
    baseURL: "https://api.deepseek.com/v1",
  });

  const text = `角色名：${name}
简介：${description}
系统提示词片段：${systemPrompt.slice(0, 200)}`;

  const { text: result } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt: `你是一个角色分类器。请根据以下角色信息，将其归类到最合适的领域。只返回分类名称，不要返回其他内容。

可选分类：${VALID_CATEGORIES.join("、")}

${text}

分类：`,
    maxOutputTokens: 10,
    temperature: 0,
    abortSignal: AbortSignal.timeout(8000),
  });

  return result.trim();
}

/** Keyword-based fallback classification */
export function classifyWithKeywords(
  name: string,
  description: string,
  _systemPrompt: string
): Category {
  const combined = `${name} ${description}`.toLowerCase();

  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (combined.includes(keyword.toLowerCase())) {
      return category;
    }
  }

  return "其他";
}
