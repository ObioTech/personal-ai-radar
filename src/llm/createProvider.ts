import { AppConfig } from "../types.js";
import { LLMProvider } from "./types.js";
import { GeminiProvider } from "./gemini.js";

export function createProvider(config: AppConfig): LLMProvider {
  if (config.llmProvider === "gemini") {
    return new GeminiProvider(config.geminiApiKey, config.geminiModel);
  }
  throw new Error(
    `UnsupportedProviderError: Provider "${config.llmProvider}" is not supported in MVP. Only "gemini" is available.`
  );
}
