import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const apiKey = process.env.FMP_API_KEY?.trim();

const q = "sam";
const url1 = `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(q)}&limit=15&apikey=${apiKey}`;
const url2 = `https://financialmodelingprep.com/stable/search-name?query=${encodeURIComponent(q)}&limit=15&apikey=${apiKey}`;

const [res1, res2] = await Promise.all([
    fetch(url1).then(r => r.json()),
    fetch(url2).then(r => r.json())
]);

console.log("=== SYMBOL ===");
if (Array.isArray(res1)) res1.forEach(r => console.log(JSON.stringify(r)));
console.log("=== NAME ===");
if (Array.isArray(res2)) res2.forEach(r => console.log(JSON.stringify(r)));
