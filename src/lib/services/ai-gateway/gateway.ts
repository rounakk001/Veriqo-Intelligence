import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiProvider } from "./providers/gemini";
import { CircuitBreaker } from "./circuit-breaker";
import { GatewayLogger } from "./logger";

/**
 * AIGateway orchestrates resilience features such as retries, timeouts, and round-robin
 * key rotation.
 * 
 * IMPORTANT: The current round-robin index and circuit breaker states are process-local.
 * If this application is later deployed across multiple Node.js instances, containers,
 * or serverless functions, these states will not be shared. In a distributed environment, 
 * a shared store (such as Redis) should be used for distributed coordination.
 */
export class AIGateway extends ChatGoogleGenerativeAI {
  private static currentKeyIndex = 0;

  constructor() {
    super({ model: "gemini-2.5-flash", apiKey: "GATEWAY_PLACEHOLDER" });
  }

  override async invoke(
    ...args: Parameters<ChatGoogleGenerativeAI["invoke"]>
  ): ReturnType<ChatGoogleGenerativeAI["invoke"]> {
    const keys = GeminiProvider.getKeys();
    const maxRetries = 3;
    const timeoutMs = 30000;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      // Find the next healthy key
      const startIndex = AIGateway.currentKeyIndex;
      let selectedKey = null;

      for (let i = 0; i < keys.length; i++) {
        const index = (startIndex + i) % keys.length;
        const keyObj = keys[index];
        if (CircuitBreaker.isHealthy(keyObj)) {
          selectedKey = keyObj;
          AIGateway.currentKeyIndex = (index + 1) % keys.length;
          break;
        }
      }

      if (!selectedKey) {
        throw new Error("AI Gateway: All available API keys are currently on cooldown (Circuit Breaker Open).");
      }

      const modelInstance = GeminiProvider.getModelInstance(selectedKey.key);
      const startTime = Date.now();

      try {
        const invokePromise = modelInstance.invoke(...args);
        
        // Timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("AI Gateway Timeout (30s)")), timeoutMs);
        });

        // Use Promise.race to enforce timeout
        const response = await Promise.race([invokePromise, timeoutPromise]);
        
        const latencyMs = Date.now() - startTime;
        CircuitBreaker.recordSuccess(selectedKey.index, selectedKey, latencyMs);
        
        GatewayLogger.log({
          provider: "Gemini",
          keyIndex: selectedKey.index,
          latencyMs,
          retryCount: attempt,
          status: "SUCCESS",
        });

        return response as Awaited<ReturnType<ChatGoogleGenerativeAI["invoke"]>>;
      } catch (error: unknown) {
        const latencyMs = Date.now() - startTime;
        const err = error as Record<string, unknown>;
        CircuitBreaker.recordFailure(selectedKey.index, selectedKey, "Gemini", error);

        const isTransient = CircuitBreaker.isTransientError(error);

        GatewayLogger.log({
          provider: "Gemini",
          keyIndex: selectedKey.index,
          latencyMs,
          retryCount: attempt,
          failureReason: typeof err.message === "string" ? err.message : "Unknown error",
          status: attempt < maxRetries && isTransient ? "RETRY" : "FAILURE",
        });

        if (!isTransient) {
          throw error; // Don't retry on permanent errors (e.g. invalid prompt, auth failure)
        }

        lastError = error;
        attempt++;
        
        if (attempt <= maxRetries) {
          // Small delay before retry
          await new Promise((res) => setTimeout(res, 500 * attempt));
        }
      }
    }

    throw lastError || new Error("AI Gateway: Max retries exceeded");
  }
}
