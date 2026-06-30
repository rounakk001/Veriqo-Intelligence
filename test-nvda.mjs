import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

async function run() {
  const symbol = "NVDA";
  const summary = await yahooFinance.quoteSummary(symbol, {
    modules: ["incomeStatementHistory", "financialData", "summaryDetail"],
  });

  const incomeStatements = summary.incomeStatementHistory?.incomeStatementHistory || [];
  const latestIncome = incomeStatements[0] ?? {};
  const previousIncome = incomeStatements[1] ?? {};

  const revenue = latestIncome.totalRevenue ?? 0;
  const prevRevenue = previousIncome.totalRevenue ?? 0;

  function growthRate(current, previous) {
    if (!previous || previous === 0) return null;
    return (current - previous) / Math.abs(previous);
  }

  const calculatedGrowth = growthRate(revenue, prevRevenue);

  console.log("=== NVDA Trace ===");
  console.log("Latest Revenue:", revenue);
  console.log("Previous Revenue:", prevRevenue);
  console.log("growthRate() returns:", calculatedGrowth);
  console.log("Is growthRate a decimal?", Math.abs(calculatedGrowth) <= 1 ? "Yes (usually <= 1) but actually could be > 1 if > 100% growth." : (calculatedGrowth > 1 ? "Yes, but > 100% growth" : "No"));
  
  const financialData = summary.financialData ?? {};
  console.log("Raw ROE:", financialData.returnOnEquity);
  console.log("Raw Net Margin:", financialData.profitMargins);
  
  function normalizePercentage(value) {
    if (value == null) return null;
    if (Math.abs(value) <= 1) {
      return value * 100;
    }
    return value;
  }
  
  console.log("Normalized ROE:", normalizePercentage(financialData.returnOnEquity));
  console.log("Normalized Net Margin:", normalizePercentage(financialData.profitMargins));
  console.log("Normalized Growth:", normalizePercentage(calculatedGrowth));
}

run().catch(console.error);
