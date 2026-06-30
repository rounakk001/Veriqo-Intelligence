import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

async function run() {
  const symbols = ["NVDA", "AAPL", "HDFCBANK.NS", "TCS.NS"];
  for (const symbol of symbols) {
    try {
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "defaultKeyStatistics"],
      });
      const fd = summary.financialData || {};
      console.log(`\n=== ${symbol} ===`);
      console.log("Revenue Growth:", fd.revenueGrowth);
      console.log("Earnings Growth:", fd.earningsGrowth);
      console.log("Total Revenue:", fd.totalRevenue);
      console.log("Operating Cash Flow:", fd.operatingCashflow);
      console.log("Current Ratio:", fd.currentRatio);
      console.log("Quick Ratio:", fd.quickRatio);
    } catch (e) {
      console.error(e);
    }
  }
}
run();
