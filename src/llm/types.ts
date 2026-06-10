export interface LLMProvider {
  generateText(
    prompt: string,
    options?: {
      jsonMode?: boolean;
    }
  ): Promise<string>;
}
