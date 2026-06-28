export interface HealthStats {
  successes: number;
  failures: number;
  lastFailure: Date | null;
  averageLatencyMs: number;
  cooldownUntil: Date | null;
}

export interface ProviderKey {
  index: number;
  key: string;
  stats: HealthStats;
}

export interface GatewayLogEntry {
  timestamp: string;
  provider: string;
  keyIndex: number;
  latencyMs?: number;
  retryCount?: number;
  failureReason?: string;
  providerSwitch?: boolean;
  finalProvider?: string;
  status: "SUCCESS" | "FAILURE" | "CIRCUIT_BREAKER" | "RETRY" | "INFO";
}
