import { GatewayLogEntry } from "./types";

export class GatewayLogger {
  private static isProduction = process.env.NODE_ENV === "production";

  static log(entry: Omit<GatewayLogEntry, "timestamp">) {
    const logEntry: GatewayLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction) {
      if (entry.status === "FAILURE" || entry.status === "CIRCUIT_BREAKER") {
        console.error(JSON.stringify(logEntry));
      } else if (entry.status === "RETRY") {
        console.warn(JSON.stringify(logEntry));
      }
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}
