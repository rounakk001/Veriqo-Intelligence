import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

async function run() {
  try {
    const symbol = "NVDA";
    console.log("Fetching fundamentalsTimeSeries for", symbol);
    const fundamentals = await yahooFinance.fundamentalsTimeSeries(symbol, {
      period1: "2023-01-01",
      module: "all",
      type: "quarterlyTotalRevenue,quarterlyNetIncome,quarterlyFreeCashFlow,quarterlyTotalDebt",
    });
    console.log(JSON.stringify(fundamentals, null, 2));
  } catch (error) {
    console.error(error);
  }
}
run();
