import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function normalizePercentage(value) {
  if (value == null) return null;
  return value * 100;
}

function scoreFinancialHealth(debtToEquity, cash, debt, operatingCashFlow) {
  let score = 50;
  if (debtToEquity != null) {
    if (debtToEquity < 0.5) score += 25;
    else if (debtToEquity < 1) score += 15;
    else if (debtToEquity < 2) score += 5;
    else score -= 15;
  }
  if (operatingCashFlow > 0) {
    score += 15;
  } else {
    // New banking/liquidity protection rule
    if (cash > debt * 0.5) score += 0;
    else score -= 20;
  }
  if (cash > debt) score += 10;
  else if (debt > cash * 2) score -= 10;
  return clamp(score, 0, 100);
}

function scoreProfitability(netMargin) {
  if (netMargin == null) return 50;
  if (netMargin > 20) return 90;
  if (netMargin > 10) return 75;
  if (netMargin > 5) return 60;
  if (netMargin > 0) return 45;
  return 20;
}

function scoreGrowth(revenueGrowth) {
  if (revenueGrowth == null) return 50;
  if (revenueGrowth > 25) return 95;
  if (revenueGrowth > 15) return 80;
  if (revenueGrowth > 5) return 65;
  if (revenueGrowth > 0) return 55;
  if (revenueGrowth > -5) return 40;
  return 25;
}

function scoreValuation(pe, peg, pb) {
  let score = 50;
  let dataPoints = 0;
  if (pe != null) {
    if (pe < 0) score += 0;
    else if (pe < 15) score += 30;
    else if (pe < 25) score += 15;
    else if (pe < 40) score -= 5;
    else if (pe < 80) score -= 20;
    else score -= 30;
    dataPoints++;
  }
  if (peg != null) {
    if (peg > 0 && peg < 1) score += 20;
    else if (peg < 2) score += 5;
    else score -= 15;
    dataPoints++;
  }
  if (pb != null) {
    if (pb > 0 && pb < 2) score += 15;
    else if (pb < 5) score += 5;
    else score -= 10;
    dataPoints++;
  }
  if (dataPoints === 0) return 50;
  return clamp(score, 0, 100);
}

function getVerdict(score) {
  if (score >= 80) return "Strong Invest";
  if (score >= 64) return "Invest";
  if (score >= 50) return "Neutral";
  return "Pass";
}

async function run() {
  const symbols = ["NVDA", "MSFT", "AAPL", "META", "GOOGL", "AMD", "HDFCBANK.NS", "ICICIBANK.NS", "TCS.NS", "INFY.NS"];
  
  for (const symbol of symbols) {
    try {
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "defaultKeyStatistics", "balanceSheetHistory", "cashflowStatementHistory", "summaryDetail"]
      });

      const fd = summary.financialData || {};
      const dks = summary.defaultKeyStatistics || {};
      const sd = summary.summaryDetail || {};
      const bs = (summary.balanceSheetHistory?.balanceSheetStatements || [])[0] || {};
      const cf = (summary.cashflowStatementHistory?.cashflowStatements || [])[0] || {};

      const revGrowthRaw = fd.revenueGrowth ?? null;
      const revenueGrowth = revGrowthRaw != null ? normalizePercentage(revGrowthRaw) : null;
      
      const netMargin = normalizePercentage(fd.profitMargins ?? sd.profitMargins);
      
      const rawYahooDte = fd.debtToEquity ?? dks.debtToEquity;
      const debtToEquity = rawYahooDte != null ? rawYahooDte / 100 : null;
      
      const cash = bs.cash ?? fd.totalCash ?? 0;
      const debt = bs.totalDebt ?? fd.totalDebt ?? fd.currentDebt ?? 0;
      const ocf = cf.totalCashFromOperatingActivities ?? fd.operatingCashflow ?? fd.operatingCashFlow ?? 0;
      
      const pe = sd.trailingPE ?? dks.trailingPE ?? null;
      const peg = dks.pegRatio ?? null;
      const pb = dks.priceToBook ?? null;

      const health = scoreFinancialHealth(debtToEquity, cash, debt, ocf);
      const profitability = scoreProfitability(netMargin);
      const growth = scoreGrowth(revenueGrowth);
      const valuation = scoreValuation(pe, peg, pb);
      
      const sentiment = 65; // Fixed assumption
      const risk = 70; // Inverted risk (Fixed assumption)

      // 1. Without Valuation
      const scoreWithout = Math.round(
        (health/100)*35 + (profitability/100)*20 + (growth/100)*15 + (sentiment/100)*15 + (risk/100)*15
      );
      
      // 2. With Valuation
      const scoreWith = Math.round(
        (health/100)*20 + (profitability/100)*20 + (growth/100)*20 + (valuation/100)*15 + (sentiment/100)*10 + (risk/100)*15
      );

      console.log(`\n=== ${symbol} ===`);
      console.log(`Metrics: Health=${health}, Profit=${profitability}, Growth=${growth}, Valuation=${valuation}`);
      console.log(`WITHOUT Val: ${scoreWithout} => ${getVerdict(scoreWithout)}`);
      console.log(`WITH Val   : ${scoreWith} => ${getVerdict(scoreWith)}`);
      
    } catch (e) {
      console.log(`Failed on ${symbol}`);
    }
  }
}

run();
