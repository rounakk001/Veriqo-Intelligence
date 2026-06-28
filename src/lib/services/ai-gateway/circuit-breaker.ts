import { ProviderKey } from "./types";
import { GatewayLogger } from "./logger";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * CircuitBreaker tracks the health (successes/failures, cooldowns, latency) of API keys.
 * 
 * IMPORTANT: The current circuit breaker state is process-local.
 * If this application is later deployed across multiple Node.js instances or containers, 
 * a shared store (such as Redis) should be used to ensure synchronized failure tracking 
 * and distributed coordination.
 */
export class CircuitBreaker {
  static recordSuccess(keyIndex: number, providerKey: ProviderKey, latencyMs: number) {
    const stats = providerKey.stats;
    stats.successes += 1;
    
    // Moving average of latency
    if (stats.averageLatencyMs === 0) {
      stats.averageLatencyMs = latencyMs;
    } else {
      stats.averageLatencyMs = (stats.averageLatencyMs * 0.9) + (latencyMs * 0.1);
    }
  }

  static recordFailure(keyIndex: number, providerKey: ProviderKey, providerName: string, error: unknown) {
    const stats = providerKey.stats;
    stats.failures += 1;
    stats.lastFailure = new Date();

    const isRateLimitOrServerError = this.isTransientError(error);
    
    if (isRateLimitOrServerError) {
      stats.cooldownUntil = new Date(Date.now() + COOLDOWN_MS);
      const err = error as Record<string, unknown>;
      const msg = typeof err?.message === "string" ? err.message : "Unknown";
      GatewayLogger.log({
        provider: providerName,
        keyIndex,
        status: "CIRCUIT_BREAKER",
        failureReason: `Circuit open for 5 mins due to error: ${msg}`,
      });
    }
  }

  static isHealthy(providerKey: ProviderKey): boolean {
    if (!providerKey.stats.cooldownUntil) return true;
    
    if (new Date() > providerKey.stats.cooldownUntil) {
      // Cooldown expired, restore health
      providerKey.stats.cooldownUntil = null;
      return true;
    }
    
    return false;
  }

  static isTransientError(error: unknown): boolean {
    if (!error) return true; // Timeout or unknown
    const err = error as Record<string, unknown>;
    const msg = typeof err.message === "string" ? err.message.toLowerCase() : "";
    const status = err.status || err.statusCode;

    if (status === 429 || status === 503 || status === 500 || status === 504 || status === 502) {
      return true;
    }

    if (
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("timeout") ||
      msg.includes("network") ||
      msg.includes("fetch failed") ||
      msg.includes("econnrefused") ||
      msg.includes("socket")
    ) {
      return true;
    }

    return false;
  }
}
