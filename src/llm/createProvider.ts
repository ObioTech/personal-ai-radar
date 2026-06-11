import { AppConfig } from "../types.js";
import { LLMProvider } from "./types.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAIProvider } from "./openai.js";
import { FallbackProvider } from "./fallback.js";

export function createProvider(config: AppConfig): LLMProvider {
  const providers: { name: string; provider: LLMProvider }[] = [];

  // 1. Primary Provider
  if (config.llmProvider === "gemini") {
    providers.push({
      name: `gemini:${config.geminiModel}`,
      provider: new GeminiProvider(config.geminiApiKey, config.geminiModel)
    });
  } else {
    throw new Error(
      `UnsupportedProviderError: Provider "${config.llmProvider}" is not supported as primary. Only "gemini" is available.`
    );
  }

  // 2. Fallback Providers
  if (config.fallbackModels) {
    const fallbackList = config.fallbackModels.split(",").map((s) => s.trim()).filter(Boolean);
    for (const fb of fallbackList) {
      const parts = fb.split(":");
      if (parts.length < 2) continue;
      
      const providerName = parts[0];
      const modelName = parts.slice(1).join(":"); // in case model name has colons

      if (providerName === "gemini") {
        if (!config.geminiApiKey) continue;
        providers.push({
          name: fb,
          provider: new GeminiProvider(config.geminiApiKey, modelName)
        });
      } else if (providerName === "openai") {
        if (!config.openaiApiKey) {
          console.warn(`[Warning] Missing OPENAI_API_KEY cho fallback model: ${fb}`);
          continue;
        }
        providers.push({
          name: fb,
          provider: new OpenAIProvider(config.openaiApiKey, modelName)
        });
      }
    }
  }

  // 3. Return FallbackProvider if there are fallbacks, else return raw provider
  if (providers.length === 1 && providers[0]) {
    return providers[0].provider;
  }

  return new FallbackProvider(providers);
}
