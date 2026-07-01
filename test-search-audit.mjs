/**
 * FORENSIC AUDIT — traces every stage of the /api/search pipeline
 * Stage 1: env var
 * Stage 2: URL construction
 * Stage 3: FMP fetch (raw text BEFORE json())
 * Stage 4: JSON parse
 * Stage 5: field mapping
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");

// Load .env.local manually (Node doesn't auto-load it)
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error("[STAGE 0] dotenv load ERROR:", result.error.message);
  } else {
    console.log("[STAGE 0] dotenv loaded from:", envPath);
  }
} else {
  console.error("[STAGE 0] .env.local NOT FOUND at:", envPath);
}

const QUERY = "msft";
const FMP_BASE = "https://financialmodelingprep.com/api/v3";
const LIMIT = 8;

// ── STAGE 1: Environment Variable ─────────────────────────────────────────
console.log("\n====== STAGE 1: ENVIRONMENT VARIABLE ======");
const rawKey = process.env.FMP_API_KEY;
if (!rawKey) {
  console.error("❌  FMP_API_KEY: NOT FOUND / UNDEFINED");
  process.exit(1);
}
console.log("✅  FMP_API_KEY loaded        : YES");
console.log("    Key length                :", rawKey.length);
console.log("    Starts with               :", rawKey.slice(0, 4) + "...");
console.log("    Has leading/trailing space:", rawKey !== rawKey.trim() ? "YES ⚠️" : "NO");
const apiKey = rawKey.trim();

// ── STAGE 2: URL Construction ──────────────────────────────────────────────
console.log("\n====== STAGE 2: URL CONSTRUCTION ======");
const url = new URL(`${FMP_BASE}/search`);
url.searchParams.set("query", QUERY);
url.searchParams.set("limit", String(LIMIT));
url.searchParams.set("apikey", apiKey);
const finalUrl = url.toString();
// Print URL with key partially masked
const maskedUrl = finalUrl.replace(apiKey, apiKey.slice(0, 4) + "****");
console.log("Constructed URL:", maskedUrl);

// Verify individual parts
console.log("  pathname  :", url.pathname);
console.log("  ?query    :", url.searchParams.get("query"));
console.log("  ?limit    :", url.searchParams.get("limit"));
console.log("  ?apikey   :", url.searchParams.get("apikey")?.slice(0,4) + "****");

// ── STAGE 3: HTTP Fetch — read RAW TEXT first ──────────────────────────────
console.log("\n====== STAGE 3: HTTP FETCH (raw text) ======");
let rawText = "";
let httpStatus = 0;
let contentType = "";

try {
  const response = await fetch(finalUrl, { signal: AbortSignal.timeout(8000) });
  httpStatus = response.status;
  contentType = response.headers.get("content-type") ?? "";
  rawText = await response.text();  // TEXT first — never json() directly

  console.log("HTTP Status        :", httpStatus);
  console.log("Content-Type       :", contentType);
  console.log("Response length    :", rawText.length, "chars");
  console.log("Raw response (first 600 chars):\n", rawText.slice(0, 600));

  if (httpStatus !== 200) {
    console.error(`\n❌  Non-200 status: ${httpStatus}`);
    console.error("This is the failure point. Check the raw response above for the error message.");
    process.exit(1);
  }
} catch (err) {
  console.error("\n❌  FETCH THREW AN EXCEPTION:");
  console.error("    Name   :", err instanceof Error ? err.name    : typeof err);
  console.error("    Message:", err instanceof Error ? err.message : String(err));
  process.exit(1);
}

// ── STAGE 4: JSON Parse ───────────────────────────────────────────────────
console.log("\n====== STAGE 4: JSON PARSE ======");
let parsed;
try {
  parsed = JSON.parse(rawText);
  console.log("JSON.parse succeeded");
  console.log("Type               :", Array.isArray(parsed) ? "Array" : typeof parsed);
  if (Array.isArray(parsed)) {
    console.log("Array length       :", parsed.length);
  } else {
    console.log("Parsed value       :", JSON.stringify(parsed).slice(0, 200));
  }
} catch (e) {
  console.error("❌  JSON.parse FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
}

if (!Array.isArray(parsed)) {
  console.error("\n❌  FMP did not return an array. Root cause found at STAGE 4.");
  process.exit(1);
}

if (parsed.length === 0) {
  console.warn("\n⚠️  FMP returned an EMPTY ARRAY for query:", QUERY);
  console.warn("    This could be a plan restriction or wrong endpoint.");
  process.exit(0);
}

// ── STAGE 5: Field Mapping ───────────────────────────────────────────────
console.log("\n====== STAGE 5: FIELD MAPPING ======");
const first = parsed[0];
console.log("All keys on first result:", Object.keys(first).join(", "));
console.log("First result (raw):", JSON.stringify(first, null, 2));

// Check what our mapping expects vs what FMP actually sends
console.log("\nField presence check:");
console.log("  item.symbol          :", typeof first.symbol, "=", first.symbol);
console.log("  item.name            :", typeof first.name, "=", first.name);
console.log("  item.exchangeShortName:", typeof first.exchangeShortName, "=", first.exchangeShortName);
console.log("  item.exchange        :", typeof first.exchange, "=", first.exchange);
console.log("  item.currency        :", typeof first.currency, "=", first.currency);
console.log("  item.stockExchange   :", typeof first.stockExchange, "=", first.stockExchange);

// Simulate the mapping
const mapped = parsed
  .filter((item) => typeof item?.symbol === "string" && typeof item?.name === "string")
  .map((item) => ({
    symbol:   String(item.symbol).trim(),
    name:     String(item.name).trim(),
    exchange: typeof item.exchangeShortName === "string" ? item.exchangeShortName.trim()
            : typeof item.exchange          === "string" ? item.exchange.trim()
            : "Unknown",
    currency: typeof item.currency === "string" ? item.currency.trim() : "USD",
  }))
  .slice(0, LIMIT);

console.log("\nMapped output:");
mapped.forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(r)));

console.log("\n====== DIAGNOSIS COMPLETE ======");
console.log(`Total mapped results: ${mapped.length} / ${parsed.length}`);
if (mapped.length > 0) {
  console.log("✅  Mapping works correctly — if endpoint returns 0, root cause is upstream.");
}
