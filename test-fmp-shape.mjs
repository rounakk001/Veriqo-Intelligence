/**
 * Verify exact field names returned by /stable/search-symbol for multiple queries.
 * This confirms what our mapper needs to read.
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

const queries = ["apple", "TCS", "hdfc bank", "vodafone idea", "idea", "reliance"];

for (const q of queries) {
  const url = `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(q)}&limit=3&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await res.json();
  console.log(`\nQuery: "${q}"  →  status=${res.status}  count=${Array.isArray(data) ? data.length : "n/a"}`);
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    console.log("  Keys  :", Object.keys(first).join(", "));
    data.forEach(r => console.log(`  [result] symbol=${r.symbol}  name=${r.name}  exchange=${r.exchange}  currency=${r.currency}`));
  } else {
    console.log("  →", JSON.stringify(data).slice(0, 200));
  }
}
