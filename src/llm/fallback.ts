import { LLMProvider } from "./types.js";

export class FallbackProvider implements LLMProvider {
  private providers: { name: string; provider: LLMProvider }[];

  constructor(providers: { name: string; provider: LLMProvider }[]) {
    if (providers.length === 0) {
      throw new Error("FallbackProvider requires at least one provider.");
    }
    this.providers = providers;
  }

  async generateText(
    prompt: string,
    options?: { jsonMode?: boolean }
  ): Promise<string> {
    let lastError: Error | null = null;

    let index = 0;
    for (const { name, provider } of this.providers) {
      try {
        if (index > 0) {
          console.log(`[Fallback] Chuyển sang model dự phòng: ${name}...`);
        }
        return await provider.generateText(prompt, options);
      } catch (error: any) {
        console.warn(`[Fallback] Provider "${name}" thất bại: ${error.message}`);
        lastError = error;
      }
      index++;
    }

    throw new Error(`Tất cả các model dự phòng đều thất bại. Lỗi cuối cùng: ${lastError?.message}`);
  }
}
