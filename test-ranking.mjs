import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();
const FMP_BASE = "https://financialmodelingprep.com/stable";

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
  const qLower = q.toLowerCase();

  for (const item of [...(Array.isArray(sym)?sym:[]), ...(Array.isArray(nam)?nam:[])]) {
    if (item?.symbol && !seen.has(item.symbol)) {
      seen.add(item.symbol);
      
      const nameLower = (item.name || "").toLowerCase();
      const symbolLower = (item.symbol || "").toLowerCase();
      
      let textScore = 0;
      if (symbolLower === qLower || nameLower === qLower) textScore = 10000;
      else if (symbolLower.startsWith(qLower) || nameLower.startsWith(qLower)) textScore = 5000;
      else if (nameLower.includes(qLower) || symbolLower.includes(qLower)) textScore = 1000;

      const liquidityPoints = 100 - rank(item.exchange);
      
      merged.push({ ...item, _score: textScore + liquidityPoints });
    }
  }
  merged.sort((a,b) => b._score - a._score);
  return merged.slice(0,8).map(r=>({
    symbol:r.symbol, name:r.name, exchange:r.exchange, currency:r.currency,
    _score: r._score
  }));
}

const tests = [
  "Apple", "Microsoft", "Google", "Alphabet", "Amazon", "Tesla", "NVIDIA", "Meta", "Netflix",
  "HDFC", "ICICI", "TCS", "Infosys", "Reliance", "SBIN", "IDEA", "Samsung", "Sam", "Alphabet",
  "MSFT", "AAPL", "NVDA", "HDFCBANK.NS", "RELIANCE.NS"
];

for (const q of tests) {
  const results = await search(q);
  console.log(`\nQuery: "${q}"  → ${results.length} result(s)`);
  results.slice(0,3).forEach((r, i) =>
    console.log(`  [score=${String(r._score).padStart(5)}] ${r.symbol.padEnd(16)} ${r.name.slice(0,35).padEnd(35)} ${r.exchange.padEnd(8)} ${r.currency}`)
  );
}
