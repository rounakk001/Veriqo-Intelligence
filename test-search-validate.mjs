/**
 * End-to-end validation — simulates exactly what route.ts does after the fix.
 * Validates all test cases from the requirements.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();
const FMP_BASE = "https://financialmodelingprep.com/stable";

// Same exchangeRank as financialConstants.ts
const EXCHANGE_RANK = {
  "NasdaqGS":1,"NYSE":1,"Nasdaq":1,"NasdaqCM":2,"NYSE American":2,
  "NSE":3,"BSE":3,"Bombay":3,"Tokyo":3,"London":3,"Hong Kong":3,
  "Toronto":3,"Frankfurt":3,"Paris":3,"XETRA":4,"FSX":4,
  "OTC":90,"OTC Markets":90,"CRYPTO":95,
};
const rank = (ex) => EXCHANGE_RANK[ex] ?? 50;

async function search(q) {
  const [sym, nam] = await Promise.all([
    fetch(`${FMP_BASE}/search-symbol?query=${encodeURIComponent(q)}&limit=8&apikey=${apiKey}`).then(r=>r.json()).catch(()=>[]),
    fetch(`${FMP_BASE}/search-name?query=${encodeURIComponent(q)}&limit=8&apikey=${apiKey}`).then(r=>r.json()).catch(()=>[]),
  ]);
  const seen = new Set();
  const merged = [];
  for (const item of [...(Array.isArray(sym)?sym:[]), ...(Array.isArray(nam)?nam:[])]) {
    if (item.symbol && !seen.has(item.symbol)) {
      seen.add(item.symbol);
      merged.push(item);
    }
  }
  merged.sort((a,b) => rank(a.exchange) - rank(b.exchange));
  return merged.slice(0,8).map(r=>({ symbol:r.symbol, name:r.name, exchange:r.exchange, currency:r.currency }));
}

const tests = [
  "Apple", "Microsoft", "NVIDIA", "Alphabet", "Tesla", "Meta",
  "Reliance", "TCS", "HDFC Bank", "Vodafone Idea", "IDEA", "SBIN", "ICICI", "INFY"
];

for (const q of tests) {
  const results = await search(q);
  console.log(`\nQuery: "${q}"  → ${results.length} result(s)`);
  results.slice(0,3).forEach(r => console.log(`  ${r.symbol.padEnd(15)} ${r.name.padEnd(35)} ${r.exchange}  ${r.currency}`));
}
