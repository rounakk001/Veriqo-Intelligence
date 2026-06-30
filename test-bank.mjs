import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

async function run() {
  const symbol = "HDFCBANK.NS";
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ["incomeStatementHistory", "financialData", "defaultKeyStatistics", "summaryDetail", "cashflowStatementHistory"],
    });
    
    console.log("Income Statements:");
    const stmts = summary.incomeStatementHistory?.incomeStatementHistory || [];
    stmts.forEach((s, i) => {
      console.log(`\n[${i}] Date:`, s.endDate);
      console.log(`Total Revenue:`, s.totalRevenue);
      console.log(`Operating Revenue:`, s.operatingRevenue);
    });
    
    console.log("\nCash Flow:");
    const cf = summary.cashflowStatementHistory?.cashflowStatements || [];
    cf.forEach((s, i) => {
      console.log(`\n[${i}] Date:`, s.endDate);
      console.log(`Operating Cash Flow:`, s.totalCashFromOperatingActivities);
    });

    console.log("\nFinancial Data OCF:", summary.financialData?.operatingCashflow);
    console.log("Financial Data Total Revenue:", summary.financialData?.totalRevenue);

  } catch (e) {
    console.error(e);
  }
}
run();
