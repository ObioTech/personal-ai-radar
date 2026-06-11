import OpenAI from "openai";
import { LLMProvider } from "./types.js";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, modelName: string) {
    this.client = new OpenAI({ apiKey });
    this.model = modelName;
  }

  async generateText(
    prompt: string,
    options?: { jsonMode?: boolean }
  ): Promise<string> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const responseFormat = options?.jsonMode
          ? { type: "json_object" as const }
          : undefined;

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          response_format: responseFormat,
        });

        const text = response.choices[0]?.message?.content;
        if (!text) {
          throw new Error("Empty response from OpenAI");
        }
        return text;
      } catch (e: any) {
        attempt++;
        const errorMessage = e.message || String(e);
        const isTransient = errorMessage.includes("503") || 
                            errorMessage.includes("500") || 
                            errorMessage.includes("429");
        
        if (isTransient && attempt <= maxRetries) {
          const delayMs = attempt * 5000;
          console.warn(`[OpenAI API] Lỗi mạng hoặc quá tải (${errorMessage.match(/\d{3}/)?.[0] || 'Unknown'}). Đang thử lại sau ${delayMs/1000}s (Lần ${attempt}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
        throw new Error(`OpenAIError: ${errorMessage}`);
      }
    }
    throw new Error("OpenAIError: Vượt quá số lần thử lại (Max retries exceeded).");
  }
}
