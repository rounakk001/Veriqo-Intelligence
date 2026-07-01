import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// ─────────────────────────────────────────────────────────────────────
// PART 1 — Trace "idea" through the resolution pipeline
// ─────────────────────────────────────────────────────────────────────
async function auditResolution(query) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`RESOLUTION AUDIT FOR QUERY: "${query}"`);
  console.log("=".repeat(60));

  const resp = await yf.search(query, { quotesCount: 15, lang: "en-US" });
  const quotes = resp.quotes ?? [];

  console.log(`\nYahoo returned ${quotes.length} results:`);
  quotes.forEach((q, i) => {
    console.log(
      `  [${i}] symbol=${q.symbol}  type=${q.quoteType}  exchange=${q.exchDisp ?? q.exchange ?? "?"}  name="${q.shortname ?? q.longname ?? q.name ?? ""}"`
    );
  });

  // ── Simulate current resolveCompanySymbol logic ──────────────────
  const normalized = query.trim().toLowerCase();
  const cleanName = (name) =>
    name.toLowerCase().replace(/\b(inc|corp|plc|ltd|co|corporation|company)\b\.?/gi, "").trim();
  const normalizedClean = cleanName(query);

  const exactSymbol = quotes.find((r) => (r.symbol ?? "").toLowerCase() === normalized);
  const exactName   = quotes.find((r) => cleanName(r.shortname ?? r.longname ?? r.name ?? "") === normalizedClean);
  const startsWith  = quotes.find((r) => cleanName(r.shortname ?? r.longname ?? r.name ?? "").startsWith(normalizedClean));
  const fallback    = quotes[0];

  const chosen = exactSymbol ?? exactName ?? startsWith ?? fallback;

  console.log(`\nResolution result:`);
  console.log(`  exactSymbol match  : ${exactSymbol ? `"${exactSymbol.symbol}"` : "none"}`);
  console.log(`  exactName match    : ${exactName   ? `"${exactName.symbol}"` : "none"}`);
  console.log(`  startsWith match   : ${startsWith  ? `"${startsWith.symbol}"` : "none"}`);
  console.log(`  chosen (current)   : "${chosen?.symbol}" (${chosen?.shortname ?? chosen?.name ?? ""})`);
  
  console.log(`\nLiquidity proxy — quoteType ranking:`);
  const rank = { EQUITY: 0, ETF: 1, MUTUALFUND: 2, INDEX: 3, OPTION: 4, FUTURE: 5, CURRENCY: 6, CRYPTOCURRENCY: 7 };
  quotes.slice(0, 8).forEach(q => {
    const r = rank[q.quoteType] ?? 99;
    console.log(`  ${q.symbol} (${q.quoteType}) rank=${r} exchange=${q.exchDisp ?? q.exchange ?? "?"}`);
  });
}

// ─────────────────────────────────────────────────────────────────────
// PART 2 — Financial data quality audit for a resolved OTC company
// ─────────────────────────────────────────────────────────────────────
const DATA_QUALITY_THRESHOLD = 4; // minimum critical fields that must be non-null

async function auditDataQuality(symbol) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`DATA QUALITY AUDIT FOR: ${symbol}`);
  console.log("=".repeat(60));

  try {
    const s = await yf.quoteSummary(symbol, {
      modules: ["financialData", "defaultKeyStatistics", "price", "summaryDetail", "incomeStatementHistory"]
    });

    const fd  = s.financialData ?? {};
    const dks = s.defaultKeyStatistics ?? {};
    const p   = s.price ?? {};
    const inc = s.incomeStatementHistory?.incomeStatementHistory ?? [];

    const critical = {
      revenue:           inc[0]?.totalRevenue ?? null,
      revenueFromFD:     fd.totalRevenue ?? null,
      operatingCashFlow: fd.operatingCashflow ?? null,
      profitMargins:     fd.profitMargins ?? null,
      marketCap:         p.marketCap ?? null,
      returnOnEquity:    fd.returnOnEquity ?? null,
      grossMargins:      fd.grossMargins ?? null,
      debtToEquity:      fd.debtToEquity ?? null,
    };

    const optional = {
      peRatio:       s.summaryDetail?.trailingPE ?? dks.trailingPE ?? null,
      pegRatio:      dks.pegRatio ?? null,
      priceToBook:   dks.priceToBook ?? null,
      freeCashFlow:  fd.freeCashFlow ?? fd.freeCashflow ?? null,
    };

    console.log("\nCritical fields:");
    let presentCount = 0;
    for (const [k, v] of Object.entries(critical)) {
      const present = v != null && v !== 0;
      if (present) presentCount++;
      console.log(`  ${k.padEnd(22)}: ${present ? String(v).slice(0, 30) : "MISSING"}`);
    }

    console.log("\nOptional fields:");
    for (const [k, v] of Object.entries(optional)) {
      console.log(`  ${k.padEnd(22)}: ${v != null ? String(v).slice(0, 30) : "MISSING"}`);
    }

    console.log(`\nData quality score: ${presentCount}/${Object.keys(critical).length} critical fields present`);
    if (presentCount < DATA_QUALITY_THRESHOLD) {
      console.log(`⚠️  VERDICT: INSUFFICIENT DATA — should show "Limited financial data" state`);
    } else {
      console.log(`✅  VERDICT: Sufficient data for analysis`);
    }

    console.log(`\nExchange : ${p.exchangeName ?? "?"}`);
    console.log(`Market   : ${p.quoteType ?? "?"}`);
    console.log(`Price    : ${p.regularMarketPrice ?? "?"}`);
    console.log(`MarketCap: ${p.marketCap ?? "?"}`);

  } catch (e) {
    console.log("ERROR:", e.message);
  }
}

async function main() {
  // Resolution audit
  await auditResolution("idea");
  await auditResolution("vodafone idea");

  // Data quality for the problematic OTC resolution
  await auditDataQuality("IDEA");     // What the app resolved to

  // Contrast with a real company
  await auditDataQuality("AAPL");
  await auditDataQuality("TCS.NS");
}

main();
