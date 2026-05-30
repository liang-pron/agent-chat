/** Default model configuration used across the entire app */
export const DEFAULT_MODEL_CONFIG = {
  provider: "deepseek" as const,
  model: "deepseek-chat",
  apiEndpoint: "https://api.deepseek.com/v1",
  apiKeyEnv: "DEEPSEEK_API_KEY",
};

export const DEFAULT_MODEL_CONFIG_JSON = JSON.stringify(DEFAULT_MODEL_CONFIG);

/** All valid agent categories */
export const CATEGORIES = [
  "教育",
  "科技",
  "娱乐",
  "商业",
  "生活方式",
  "游戏",
  "其他",
] as const;

export type Category = (typeof CATEGORIES)[number];
