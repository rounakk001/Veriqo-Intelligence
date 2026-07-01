import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();
const FMP_BASE = "https://financialmodelingprep.com/stable";

// Exact copy of the FIXED exchangeRank logic (case-insensitive)
const RAW = {
  "NasdaqGS":1,"NYSE":1,"Nasdaq":1,"NASDAQ":1,"NasdaqCM":2,"NYSE American":2,"CBOE":2,"AMEX":2,
  "NSE":3,"BSE":3,"Bombay":3,"Tokyo":3,"JPX":3,"TSE":3,"London":3,"LSE":3,
  "Hong Kong":3,"HKSE":3,"Shanghai":3,"SHH":3,"Shenzhen":3,"SHZ":3,
  "Toronto":3,"TSX":3,"Frankfurt":3,"Paris":3,"Amsterdam":3,"Zurich":3,"SIX":3,
  "Sydney":3,"ASX":3,"Singapore":3,"SGX":3,"Seoul":3,"KSC":3,"KOSDAQ":3,"Taiwan":3,"TWSE":3,
  "XETRA":4,"FSX":4,"NEO":4,"MIL":4,"BRU":4,
  "Kuala Lumpur Stock Exchange":4,"Taipei":4,
  "NYSE ARCA":5,"BATS":5,
  "OTC Markets":90,"OTC Markets OTCID":90,"OTC Bulletin Board":90,"Pink Sheets":90,"OID":90,"OTC":90,
  "CCC":95,"CRYPTO":95,
};
const NORM = new Map();
for (const [k,v] of Object.entries(RAW)) NORM.set(k.toLowerCase(), v);
const rank = (ex) => !ex ? 99 : (NORM.get(ex.toLowerCase()) ?? 50);

async function search(q) {
  const [sym, nam] = await Promise.all([
    fetch(`${FMP_BASE}/search-symbol?query=${encodeURIComponent(q)}&limit=8&apikey=${apiKey}`).then(r=>r.json()).catch(()=>[]),
    fetch(`${FMP_BASE}/search-name?query=${encodeURIComponent(q)}&limit=8&apikey=${apiKey}`).then(r=>r.json()).catch(()=>[]),
  ]);
  const seen = new Set();
  const merged = [];
  for (const item of [...(Array.isArray(sym)?sym:[]), ...(Array.isArray(nam)?nam:[])]) {
    if (item?.symbol && !seen.has(item.symbol)) {
      seen.add(item.symbol);
      merged.push(item);
    }
  }
  merged.sort((a,b) => rank(a.exchange) - rank(b.exchange));
  return merged.slice(0,8).map(r=>({
    symbol:r.symbol, name:r.name, exchange:r.exchange, currency:r.currency,
    _rank: rank(r.exchange)
  }));
}

const tests = [
  "Apple", "Microsoft", "NVIDIA", "Alphabet", "Tesla", "Meta",
  "Reliance", "TCS", "HDFC Bank", "Vodafone Idea", "IDEA", "SBIN", "ICICI", "INFY"
];

let passed = 0;
let failed = 0;
for (const q of tests) {
  const results = await search(q);
  const top = results[0];
  const topRank = top?._rank ?? 99;
  const status = topRank <= 3 ? "✅" : (results.length === 0 ? "⚠️ EMPTY" : `⚠️ rank=${topRank}`);
  if (topRank <= 3) passed++; else failed++;
  console.log(`\n${status}  Query: "${q}"  → ${results.length} result(s)`);
  results.slice(0,3).forEach(r =>
    console.log(`  [rank=${r._rank}] ${r.symbol.padEnd(16)} ${r.name.slice(0,38).padEnd(38)} ${r.exchange.padEnd(8)} ${r.currency}`)
  );
}
console.log(`\n${"=".repeat(50)}`);
console.log(`PASSED: ${passed}/${tests.length}   FAILED: ${failed}/${tests.length}`);
