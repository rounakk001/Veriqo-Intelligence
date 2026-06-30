// FORENSIC PROOF SCRIPT
// This script proves the root cause of AI seeing "710%" for SBI instead of "7.1%"

// revenueGrowth lifecycle:
// Yahoo raw: 0.071 (decimal returned by financialData.revenueGrowth)
// After normalizePercentage(0.071): 7.1   <-- stored in FinancialMetrics
// In geminiService.ts line 121, 261, 410:
//   (financials.revenueGrowth * 100).toFixed(1) + "%"
//   = (7.1 * 100).toFixed(1) + "%" = "710.0%"   ← BUG: already normalized, multiplied again

// PROOF CASES:
const revenueGrowthInFinancialMetrics = {
  NVDA:        85.2,   // Yahoo raw: 0.852 → normalized: 85.2
  MSFT:        18.3,   // Yahoo raw: 0.183 → normalized: 18.3
  AAPL:        16.6,   // Yahoo raw: 0.166 → normalized: 16.6
  "SBIN.NS":    7.1,   // Yahoo raw: 0.071 → normalized: 7.1
  "TCS.NS":     9.6,   // Yahoo raw: 0.096 → normalized: 9.6
};

console.log("=== FORENSIC PROOF: AI Prompt Revenue Growth ===\n");
for (const [symbol, stored] of Object.entries(revenueGrowthInFinancialMetrics)) {
  const whatAISees_BUGGY = (stored * 100).toFixed(1) + "%";    // current (wrong)
  const whatAISees_FIXED = stored.toFixed(1) + "%";             // correct
  const verdict = stored * 100 > 100 ? "WRONG - impossible value" : "Plausible";
  console.log(`${symbol}: stored=${stored}% | AI sees (BUGGY)="${whatAISees_BUGGY}" | AI should see="${whatAISees_FIXED}"`);
}

console.log("\n=== FORENSIC PROOF: operatingMargin Threshold Bug ===\n");
const testMargins = {
  NVDA: 65.6, MSFT: 46.3, AAPL: 32.3, "TCS.NS": 25.3, "SBIN.NS": 29.0
};
for (const [symbol, margin] of Object.entries(testMargins)) {
  const buggyCheck = margin >= 0.15;  // current code: always true for any positive margin
  const fixedCheck = margin >= 15;    // correct: 15% threshold for normalized value
  console.log(`${symbol}: margin=${margin}% | buggy (>=0.15): ${buggyCheck} | fixed (>=15): ${fixedCheck}`);
}

console.log("\n=== FORENSIC PROOF: Chart vs Tooltip Sign Mismatch ===\n");
const hdfcOCF = -2752336887808;
const chartValue_BUGGY = Math.abs(hdfcOCF);   // current: positive, chart shows upward bar
const displayValue = hdfcOCF;                  // tooltip uses formatCurrency(raw) = negative
console.log(`HDFCBANK OCF: raw=${hdfcOCF}`);
console.log(`  Chart bar height uses: Math.abs(${hdfcOCF}) = ${chartValue_BUGGY}  → POSITIVE bar`);
console.log(`  Tooltip display uses: formatCurrency(${hdfcOCF})  → shows NEGATIVE`);
console.log(`  Result: bar goes UP (positive) but tooltip says -$2.75T  ← CONTRADICTION`);
console.log(`  Root cause: Math.abs() strips sign for chart height but display keeps original sign`);
