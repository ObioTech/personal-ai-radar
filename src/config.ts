import dotenv from "dotenv";
import * as path from "path";
import { AppConfig } from "./types.js";

export function loadConfig(): AppConfig {
  dotenv.config();

  const geminiApiKey = process.env["GEMINI_API_KEY"] || "";
  const llmProvider = process.env["LLM_PROVIDER"] || "gemini";
  const geminiModel = process.env["GEMINI_MODEL"] || "gemini-2.5-flash";
  const openaiApiKey = process.env["OPENAI_API_KEY"];
  const fallbackModels = process.env["FALLBACK_MODELS"];
  const githubToken = process.env["GITHUB_TOKEN"];

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required. Please set it in your .env file.");
  }

  let telegram;
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (botToken && chatId) {
    telegram = {
      botToken,
      chatId,
    };
  }

  const baseDir = process.cwd();

  return {
    llmProvider,
    geminiApiKey,
    geminiModel,
    openaiApiKey,
    fallbackModels,
    githubToken,
    telegram,
    paths: {
      docsDaily: path.join(baseDir, "docs", "daily"),
      docsReports: path.join(baseDir, "docs", "reports"),
      dataDir: path.join(baseDir, "data"),
      dbPath: path.join(baseDir, "data", "obio-radar.sqlite"),
      configDir: path.join(baseDir, "config"),
      promptsDir: path.join(baseDir, "prompts"),
    },
  };
}
