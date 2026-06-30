import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function run() {
  const symbols = ["NVDA", "MSFT", "AAPL", "HDFCBANK.NS", "TCS.NS", "AMD"];
  
  for (const symbol of symbols) {
    try {
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: [
          "financialData",
          "incomeStatementHistory",
          "balanceSheetHistory",
          "cashflowStatementHistory",
        ],
      });
      
      const incomeStatements = summary.incomeStatementHistory?.incomeStatementHistory || [];
      const hasIncome = incomeStatements.length > 0;
      const revenue = hasIncome ? incomeStatements[0].totalRevenue : null;
      
      console.log(`[${symbol}] IncomeStatements: ${hasIncome ? 'YES' : 'NO'}, Revenue: ${revenue}`);
    } catch (e) {
      console.error(`[${symbol}] Error:`, e.message);
    }
  }
}
run();
