import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

type ModelProvider = "deepseek" | "custom";

interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiEndpoint: string;
  apiKeyEnv: string;
}

/**
 * Route a chat request to the appropriate model.
 *
 * Key priority:
 *   1. userApiKey — user's own key from browser (takes precedence)
 *   2. Server env var (DEEPSEEK_API_KEY / CUSTOM_API_KEY) — fallback
 *   3. Empty string — will error with clear message
 */
export function routeModel(
  modelConfigJson: string,
  userApiKey?: string
): {
  model: LanguageModel;
  provider: ModelProvider;
} {
  let config: ModelConfig;
  try {
    config = JSON.parse(modelConfigJson) as ModelConfig;
  } catch {
    config = {
      provider: "deepseek",
      model: "deepseek-chat",
      apiEndpoint: "https://api.deepseek.com/v1",
      apiKeyEnv: "DEEPSEEK_API_KEY",
    };
  }

  const provider = config.provider || "deepseek";

  // Determine API key: user's key first, then server env
  const apiKey =
    userApiKey ||
    process.env[config.apiKeyEnv] ||
    process.env.DEEPSEEK_API_KEY ||
    "";

  switch (provider) {
    case "deepseek": {
      const deepseek = createOpenAICompatible({
        name: "deepseek",
        apiKey,
        baseURL: config.apiEndpoint || "https://api.deepseek.com/v1",
      });
      return { model: deepseek(config.model || "deepseek-chat"), provider: "deepseek" };
    }

    case "custom": {
      const customProvider = createOpenAICompatible({
        name: "custom",
        apiKey,
        baseURL: config.apiEndpoint,
      });
      return { model: customProvider(config.model || "gpt-3.5-turbo"), provider: "custom" };
    }

    default: {
      const deepseek = createOpenAICompatible({
        name: "deepseek",
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      return { model: deepseek("deepseek-chat"), provider: "deepseek" };
    }
  }
}
