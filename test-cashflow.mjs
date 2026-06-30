import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const symbols = ["NVDA", "MSFT", "AAPL", "HDFCBANK.NS", "TCS.NS"];

function fmt(v) {
  if (v == null || v === undefined) return "null / missing";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(3)}T  (raw: ${v})`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(3)}B  (raw: ${v})`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(3)}M  (raw: ${v})`;
  return `${sign}$${abs.toFixed(2)}  (raw: ${v})`;
}

async function audit() {
  for (const symbol of symbols) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SYMBOL: ${symbol}`);
    console.log("=".repeat(60));

    let summary;
    try {
      summary = await yf.quoteSummary(symbol, {
        modules: [
          "financialData",
          "cashflowStatementHistory",
        ],
      });
    } catch (e) {
      console.log("ERROR fetching quoteSummary:", e.message);
      continue;
    }

    const fd = summary.financialData ?? {};
    const cfStatements = summary.cashflowStatementHistory?.cashflowStatements ?? [];
    const latestCF = cfStatements[0] ?? null;

    // ── 1. Raw values from financialData ──────────────────────────
    console.log("\n[financialData module]");
    console.log(`  operatingCashflow (camelCase lowercase):  ${fmt(fd.operatingCashflow)}`);
    console.log(`  operatingCashFlow (camelCase uppercase):  ${fmt(fd.operatingCashFlow)}`);
    console.log(`  freeCashFlow:                             ${fmt(fd.freeCashFlow)}`);
    // also try freeCashflow (lowercase)
    const fdRaw = fd;
    console.log(`  freeCashflow (lowercase):                 ${fmt(fdRaw.freeCashflow)}`);

    // ── 2. Raw values from cashflowStatementHistory ───────────────
    console.log("\n[cashflowStatementHistory – latestCF index 0]");
    if (!latestCF) {
      console.log("  No cash flow statement returned (deprecated module).");
    } else {
      console.log(`  Statement date:                           ${latestCF.endDate}`);
      const cf = latestCF;
      console.log(`  totalCashFromOperatingActivities:         ${fmt(cf.totalCashFromOperatingActivities)}`);
      console.log(`  freeCashFlow:                             ${fmt(cf.freeCashFlow)}`);
      // Dump all keys present on the statement
      console.log(`  All keys in latestCF:`, Object.keys(cf).join(", "));
    }

    // ── 3. Simulate exactly what the application code does ────────
    function coerce(v) { return (v == null || v === undefined || isNaN(Number(v))) ? null : Number(v); }

    const ocf_fromStatement = coerce(latestCF?.totalCashFromOperatingActivities);
    const ocf_fromFD_upper  = coerce(fd.operatingCashFlow);
    const ocf_fromFD_lower  = coerce(fd.operatingCashflow);

    const extractedOCF =
      ocf_fromStatement ??
      ocf_fromFD_upper ??
      ocf_fromFD_lower ??
      0;

    const capex        = coerce(latestCF?.capitalExpenditures) ?? 0;
    const calculatedFCF = extractedOCF - Math.abs(capex);
    const fcf_fromStatement = coerce(latestCF?.freeCashFlow);
    const fcf_fromFD_lower  = coerce(fdRaw.freeCashflow);
    const fcf_fromFD_upper  = coerce(fd.freeCashFlow);

    const extractedFCF =
      fcf_fromStatement ??
      fcf_fromFD_lower ??
      fcf_fromFD_upper ??
      calculatedFCF;

    console.log("\n[Application Logic Simulation]");
    console.log(`  OCF source used:   ${
      ocf_fromStatement != null ? "cashflowStatementHistory.totalCashFromOperatingActivities" :
      ocf_fromFD_upper  != null ? "financialData.operatingCashFlow"  :
      ocf_fromFD_lower  != null ? "financialData.operatingCashflow"  : "FALLBACK 0"
    }`);
    console.log(`  Extracted OCF:     ${fmt(extractedOCF)}`);

    console.log(`  FCF source used:   ${
      fcf_fromStatement != null ? "cashflowStatementHistory.freeCashFlow" :
      fcf_fromFD_lower  != null ? "financialData.freeCashflow (lowercase)" :
      fcf_fromFD_upper  != null ? "financialData.freeCashFlow (uppercase)" : `calculatedFCF (OCF - |CapEx|) = ${fmt(calculatedFCF)}`
    }`);
    console.log(`  Extracted FCF:     ${fmt(extractedFCF)}`);

    console.log("\n[Formatted Output – what the UI/PDF shows]");
    function uiFmt(v) {
      if (typeof v !== "number" || !isFinite(v)) return "—";
      const abs = Math.abs(v);
      const sign = v < 0 ? "-" : "";
      if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
      if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
      if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`;
      return `${sign}$${abs.toFixed(2)}`;
    }
    console.log(`  UI OCF display:    ${uiFmt(extractedOCF)}`);
    console.log(`  UI FCF display:    ${uiFmt(extractedFCF)}`);
  }
}

audit();
