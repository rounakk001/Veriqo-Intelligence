import yahooFinance from "yahoo-finance2";

async function check() {
  const summary = await yahooFinance.quoteSummary("TSLA", { modules: ["cashflowStatementHistory", "financialData"] });
  console.log("Cashflow Statement Keys:", Object.keys(summary.cashflowStatementHistory.cashflowStatements[0]));
  console.log("Financial Data Keys:", Object.keys(summary.financialData));
}

check().catch(console.error);
