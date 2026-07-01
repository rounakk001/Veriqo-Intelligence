import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();

// test /stable/search-name
const queries = ["apple", "hdfc bank", "vodafone idea", "microsoft", "nvidia", "reliance industries"];

for (const q of queries) {
  const url = `https://financialmodelingprep.com/stable/search-name?query=${encodeURIComponent(q)}&limit=3&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await res.json();
  console.log(`\nNAME  "${q}"  status=${res.status}  count=${Array.isArray(data) ? data.length : "n/a"}`);
  if (Array.isArray(data) && data.length > 0) {
    console.log("  Keys:", Object.keys(data[0]).join(", "));
    data.forEach(r => console.log(`  symbol=${r.symbol}  name=${r.name}  exchange=${r.exchange}  currency=${r.currency}`));
  } else {
    console.log("  →", JSON.stringify(data).slice(0, 200));
  }
}
