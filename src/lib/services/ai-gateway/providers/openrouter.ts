import { ChatOpenAI } from "@langchain/openai";
import { ProviderKey } from "../types";

export class OpenRouterProvider {
  private static instanceMap = new Map<string, ChatOpenAI>();
  private static keys: ProviderKey[] = [];

  static getKeys(): ProviderKey[] {
    if (this.keys.length > 0) return this.keys;

    const rawKeys: string[] = [];

    // Discover all environment variables starting with OPENROUTER_API_KEY_ dynamically
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("OPENROUTER_API_KEY_") && value && typeof value === "string" && value.trim() !== "") {
        rawKeys.push(value.trim());
      }
    }

    if (rawKeys.length === 0) {
      if (process.env.OPENROUTER_API_KEY && typeof process.env.OPENROUTER_API_KEY === "string" && process.env.OPENROUTER_API_KEY.trim() !== "") {
        rawKeys.push(process.env.OPENROUTER_API_KEY.trim());
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

    return this.keys;
  }

  static getModelInstance(apiKey: string): ChatOpenAI {
    if (this.instanceMap.has(apiKey)) {
      return this.instanceMap.get(apiKey)!;
    }

    const model = new ChatOpenAI({
      modelName: "google/gemini-2.5-flash", // Use the same target model via OpenRouter fallback/routing or simply respect user config
      apiKey,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      temperature: 0.2,
      maxTokens: 4096,
    });

    this.instanceMap.set(apiKey, model);
    return model;
  }
}
