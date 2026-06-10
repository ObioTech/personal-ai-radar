import { describe, it, expect } from "vitest";
import { createProvider } from "../src/llm/createProvider.js";
import { AppConfig } from "../src/types.js";

describe("LLM provider creation", () => {
  it("creates gemini provider when configured", () => {
    const config: AppConfig = {
      llmProvider: "gemini",
      geminiApiKey: "fake-key",
      geminiModel: "gemini-2.5-flash",
      paths: {
        docsDaily: "",
        docsReports: "",
        dataDir: "",
        dbPath: "",
        configDir: "",
        promptsDir: ""
      }
    };
    const provider = createProvider(config);
    expect(provider).toBeDefined();
    expect(provider.generateText).toBeTypeOf("function");
  });

  it("throws on unsupported provider", () => {
    const config: AppConfig = {
      llmProvider: "unsupported",
      geminiApiKey: "fake-key",
      geminiModel: "gemini-2.5-flash",
      paths: {
        docsDaily: "",
        docsReports: "",
        dataDir: "",
        dbPath: "",
        configDir: "",
        promptsDir: ""
      }
    };
    expect(() => createProvider(config)).toThrow(/UnsupportedProviderError/);
  });
});
