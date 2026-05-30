import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/** Supported model providers in v1 */
type ModelProvider = "deepseek" | "custom";

interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiEndpoint: string;
  apiKeyEnv: string;
}

/** Route a chat request to the appropriate model based on agent config */
export function routeModel(modelConfigJson: string): {
  model: LanguageModel;
  provider: ModelProvider;
} {
  let config: ModelConfig;

  try {
    config = JSON.parse(modelConfigJson) as ModelConfig;
  } catch {
    // Fallback to DeepSeek if config is malformed
    config = {
      provider: "deepseek",
      model: "deepseek-chat",
      apiEndpoint: "https://api.deepseek.com/v1",
      apiKeyEnv: "DEEPSEEK_API_KEY",
    };
  }

  const provider = config.provider || "deepseek";

  switch (provider) {
    case "deepseek": {
      const apiKey = process.env.DEEPSEEK_API_KEY || "";
      const deepseek = createOpenAICompatible({
        name: "deepseek",
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      return { model: deepseek(config.model || "deepseek-chat"), provider: "deepseek" };
    }

    case "custom": {
      const apiKey = process.env[config.apiKeyEnv] || "";
      const customProvider = createOpenAICompatible({
        name: "custom",
        apiKey,
        baseURL: config.apiEndpoint,
      });
      return {
        model: customProvider(config.model || "gpt-3.5-turbo"),
        provider: "custom",
      };
    }

    default: {
      // Fallback
      const apiKey = process.env.DEEPSEEK_API_KEY || "";
      const deepseek = createOpenAICompatible({
        name: "deepseek",
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      return { model: deepseek("deepseek-chat"), provider: "deepseek" };
    }
  }
}
