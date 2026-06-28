import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";
import { XAIProvider } from "./providers/xai";
import { CircuitBreaker } from "./circuit-breaker";
import { GatewayLogger } from "./logger";
import { ProviderKey } from "./types";

/**
 * AIGateway orchestrates resilience features such as retries, timeouts, and round-robin
 * key rotation with automatic provider failover.
 * 
 * IMPORTANT: The current round-robin index and circuit breaker states are process-local.
 */
export class AIGateway extends ChatGoogleGenerativeAI {
  private static keyIndices = new Map<string, number>();

  constructor() {
    super({ model: "gemini-2.5-flash", apiKey: "GATEWAY_PLACEHOLDER" });
  }

  private static getProviderKeys(name: string): ProviderKey[] {
    switch (name) {
      case "gemini": return GeminiProvider.getKeys();
      case "openrouter": return OpenRouterProvider.getKeys();
      case "xai": return XAIProvider.getKeys();
      default: throw new Error(`Unknown provider: ${name}`);
    }
  }

  private static getModelInstance(name: string, key: string) {
    switch (name) {
      case "gemini": return GeminiProvider.getModelInstance(key);
      case "openrouter": return OpenRouterProvider.getModelInstance(key);
      case "xai": return XAIProvider.getModelInstance(key);
      default: throw new Error(`Unknown provider: ${name}`);
    }
  }

  override async invoke(
    ...args: Parameters<ChatGoogleGenerativeAI["invoke"]>
  ): ReturnType<ChatGoogleGenerativeAI["invoke"]> {
    const order = [
      process.env.AI_DEFAULT_PROVIDER,
      process.env.AI_FALLBACK_PROVIDER,
      process.env.AI_LAST_PROVIDER,
    ].filter(Boolean) as string[];
    
    // Fallback to gemini for backward compatibility
    const providerOrder = order.length > 0 ? Array.from(new Set(order)).map(p => p.toLowerCase()) : ["gemini"];

    const maxRetries = 3;
    const timeoutMs = 30000;
    
    let lastError: unknown;

    for (let pIdx = 0; pIdx < providerOrder.length; pIdx++) {
      const providerName = providerOrder[pIdx];
      const displayProvider = providerName === "gemini" ? "Gemini" : providerName === "openrouter" ? "OpenRouter" : "xAI";
      
      let keys: ProviderKey[];
      try {
        keys = AIGateway.getProviderKeys(providerName);
      } catch (e) {
        lastError = e;
        continue;
      }

      if (!AIGateway.keyIndices.has(providerName)) {
        AIGateway.keyIndices.set(providerName, 0);
      }

      let attempt = 0;
      let providerShouldFailover = false;

      while (attempt <= maxRetries && !providerShouldFailover) {
        const startIndex = AIGateway.keyIndices.get(providerName) || 0;
        let selectedKey = null;

        for (let i = 0; i < keys.length; i++) {
          const index = (startIndex + i) % keys.length;
          const keyObj = keys[index];
          if (CircuitBreaker.isHealthy(keyObj)) {
            selectedKey = keyObj;
            AIGateway.keyIndices.set(providerName, (index + 1) % keys.length);
            break;
          }
        }

        if (!selectedKey) {
          // All keys on cooldown for THIS provider -> failover to next provider
          lastError = new Error(`AI Gateway: All available API keys for ${displayProvider} are currently on cooldown (Circuit Breaker Open).`);
          providerShouldFailover = true;
          break; // break the retry loop, try next provider
        }

        const modelInstance = AIGateway.getModelInstance(providerName, selectedKey.key);
        const startTime = Date.now();

        try {
          const invokePromise = (modelInstance as unknown as { invoke: (...args: Parameters<ChatGoogleGenerativeAI["invoke"]>) => ReturnType<ChatGoogleGenerativeAI["invoke"]> }).invoke(...args);
          
          let timeoutId: NodeJS.Timeout;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`AI Gateway Timeout (30s) for ${displayProvider}`)), timeoutMs);
          });

          // Use Promise.race to enforce timeout, clear timeout immediately afterwards to prevent leaks
          const response = await Promise.race([invokePromise, timeoutPromise]).finally(() => {
            clearTimeout(timeoutId);
          });
          
          const latencyMs = Date.now() - startTime;
          CircuitBreaker.recordSuccess(selectedKey.index, selectedKey, latencyMs);
          
          GatewayLogger.log({
            provider: displayProvider,
            keyIndex: selectedKey.index,
            latencyMs,
            retryCount: attempt,
            status: "SUCCESS",
            providerSwitch: pIdx > 0,
            finalProvider: displayProvider
          });

          return response as Awaited<ReturnType<ChatGoogleGenerativeAI["invoke"]>>;
        } catch (error: unknown) {
          const latencyMs = Date.now() - startTime;
          const err = error as Record<string, unknown>;
          
          CircuitBreaker.recordFailure(selectedKey.index, selectedKey, displayProvider, error);

          const isTransient = CircuitBreaker.isTransientError(error);
          
          const msg = typeof err.message === "string" ? err.message.toLowerCase() : "";
          const status = err.status || err.statusCode;
          const isNonTransientProviderFailure = 
            status === 401 || 
            status === 403 || 
            msg.includes("api_key") || 
            msg.includes("api key") || 
            msg.includes("auth") || 
            msg.includes("quota") || 
            msg.includes("unauthorized") || 
            msg.includes("forbidden");

          GatewayLogger.log({
            provider: displayProvider,
            keyIndex: selectedKey.index,
            latencyMs,
            retryCount: attempt,
            failureReason: typeof err.message === "string" ? err.message : "Unknown error",
            status: attempt < maxRetries && isTransient ? "RETRY" : "FAILURE",
          });

          if (isTransient) {
            lastError = error;
            attempt++;
            if (attempt <= maxRetries) {
              await new Promise((res) => setTimeout(res, 500 * attempt));
            } else {
              providerShouldFailover = true;
            }
          } else if (isNonTransientProviderFailure) {
            // Provider Failure (e.g. Invalid API key, auth failure, quota).
            // Do not retry on the same provider. Failover immediately to the next configured provider.
            lastError = error;
            providerShouldFailover = true;
            break;
          } else {
            // Request failure (e.g., Invalid prompt, malformed request payload).
            // These MUST NOT trigger failover. Immediately throw.
            throw error; 
          }
        }
      }
    }

    throw lastError || new Error("AI Gateway: All configured providers exhausted.");
  }
}
