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
      throw new Error(`GeminiError: ${e.message}`);
    }
  }
}
