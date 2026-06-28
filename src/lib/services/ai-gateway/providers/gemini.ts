import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ProviderKey } from "../types";

export class GeminiProvider {
  private static instanceMap = new Map<string, ChatGoogleGenerativeAI>();
  private static keys: ProviderKey[] = [];

  static getKeys(): ProviderKey[] {
    if (this.keys.length > 0) return this.keys;

    const rawKeys: string[] = [];

    // 1. Discover all environment variables starting with GEMINI_API_KEY_ dynamically
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("GEMINI_API_KEY_") && value && typeof value === "string" && value.trim() !== "") {
        rawKeys.push(value.trim());
      }
    }

    // 2. Keep GOOGLE_API_KEY as a legacy fallback for backward compatibility
    if (rawKeys.length === 0) {
      if (process.env.GOOGLE_API_KEY && typeof process.env.GOOGLE_API_KEY === "string" && process.env.GOOGLE_API_KEY.trim() !== "") {
        rawKeys.push(process.env.GOOGLE_API_KEY.trim());
      }
    }

    // Remove duplicates
    const uniqueKeys = Array.from(new Set(rawKeys));

    let index = 0;
    for (const key of uniqueKeys) {
      this.keys.push({
        index,
        key,
        stats: {
          successes: 0,
          failures: 0,
          lastFailure: null,
          averageLatencyMs: 0,
          cooldownUntil: null,
        },
      });
      index++;
    }

    if (this.keys.length === 0) {
      throw new Error("No Gemini API keys found in environment.");
    }

    return this.keys;
  }

  static getModelInstance(apiKey: string): ChatGoogleGenerativeAI {
    if (this.instanceMap.has(apiKey)) {
      return this.instanceMap.get(apiKey)!;
    }

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey,
      temperature: 0.2,
      maxOutputTokens: 4096,
    });

    this.instanceMap.set(apiKey, model);
    return model;
  }
}
