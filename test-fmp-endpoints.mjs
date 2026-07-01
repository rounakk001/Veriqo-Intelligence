/**
 * Discover which FMP v3 and v4 search endpoints still work with this API key.
 * Tests candidate endpoints against query "msft" and prints status + raw response.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();
if (!apiKey) { console.error("No FMP_API_KEY"); process.exit(1); }

const QUERY = "msft";
const LIMIT = 5;

const CANDIDATES = [
  // Current (new) FMP v3 endpoints
  `https://financialmodelingprep.com/stable/search-symbol?query=${QUERY}&limit=${LIMIT}&apikey=${apiKey}`,
  `https://financialmodelingprep.com/stable/search?query=${QUERY}&limit=${LIMIT}&apikey=${apiKey}`,
  `https://financialmodelingprep.com/api/v3/search-ticker?query=${QUERY}&limit=${LIMIT}&apikey=${apiKey}`,
  `https://financialmodelingprep.com/api/v3/search-name?query=${QUERY}&limit=${LIMIT}&apikey=${apiKey}`,
  `https://financialmodelingprep.com/api/v4/company/profile/${QUERY}?apikey=${apiKey}`,
  `https://financialmodelingprep.com/api/v3/profile/${QUERY}?apikey=${apiKey}`,
  `https://financialmodelingprep.com/api/v3/quotes/NASDAQ?apikey=${apiKey}&limit=1`,  // test auth
];

for (const url of CANDIDATES) {
  const masked = url.replace(apiKey, apiKey.slice(0,4) + "****");
  console.log("\n──────────────────────────────────────────────────");
  console.log("URL:", masked);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const text = await res.text();
    console.log("Status :", res.status);
    console.log("Body   :", text.slice(0, 300));
  } catch(e) {
    console.log("ERROR  :", e.message);
  }
}
