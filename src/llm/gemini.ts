import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { LLMProvider } from "./types.js";

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string, modelName: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: modelName });
  }

  async generateText(
    prompt: string,
    options?: { jsonMode?: boolean }
  ): Promise<string> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const generationConfig = options?.jsonMode
          ? { responseMimeType: "application/json" }
          : undefined;

        const result = await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        });

        const response = result.response;
        const text = response.text();
        if (!text) {
          throw new Error("Empty response from Gemini");
        }
        return text;
      } catch (e: any) {
        attempt++;
        const errorMessage = e.message || String(e);
        const isTransient = errorMessage.includes("503") || 
                            errorMessage.includes("500") || 
                            errorMessage.includes("429") || 
                            errorMessage.includes("high demand") || 
                            errorMessage.includes("quota");
        
        if (isTransient && attempt <= maxRetries) {
          const delayMs = attempt * 5000; // 5s, 10s, 15s
          console.warn(`[Gemini API] Lỗi mạng hoặc quá tải (${errorMessage.match(/\d{3}/)?.[0] || 'Unknown'}). Đang thử lại sau ${delayMs/1000}s (Lần ${attempt}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
        throw new Error(`GeminiError: ${errorMessage}`);
      }
    }
    throw new Error("GeminiError: Vượt quá số lần thử lại (Max retries exceeded).");
  }
}
