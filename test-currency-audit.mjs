import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const symbols = [
  "AAPL", "NVDA", "MSFT", "GOOGL",
  "TCS.NS", "HDFCBANK.NS", "SBIN.NS",
  "7203.T", "VOD.L", "BTC-USD"
];

async function audit() {
  for (const symbol of symbols) {
    console.log(`\n${"=".repeat(55)}`);
    console.log(`SYMBOL: ${symbol}`);
    console.log("=".repeat(55));
    try {
      const s = await yf.quoteSummary(symbol, {
        modules: ["price", "financialData", "summaryDetail"]
      });
      const p  = s.price          ?? {};
      const fd = s.financialData  ?? {};
      const sd = s.summaryDetail  ?? {};

      console.log("price.currency          :", p.currency);
      console.log("price.currencySymbol    :", p.currencySymbol);
      console.log("price.exchangeName      :", p.exchangeName);
      console.log("financialData.financial Currency:", fd.financialCurrency);
      // dump all fd keys for discovery
      const fdKeys = Object.keys(fd);
      const currencyLike = fdKeys.filter(k => k.toLowerCase().includes("currency"));
      if (currencyLike.length) {
        currencyLike.forEach(k => console.log(`  financialData.${k} :`, fd[k]));
      } else {
        console.log("  (no currency key found in financialData)");
      }
      console.log("summaryDetail keys with 'currency':");
      const sdKeys = Object.keys(sd).filter(k => k.toLowerCase().includes("currency"));
      if (sdKeys.length) sdKeys.forEach(k => console.log(`  summaryDetail.${k} :`, sd[k]));
      else console.log("  (none)");

      // Also check price module for all currency-related fields
      console.log("All price module currency fields:");
      Object.keys(p).filter(k => k.toLowerCase().includes("currency")).forEach(k => {
        console.log(`  price.${k} :`, p[k]);
      });

    } catch (e) {
      console.log("ERROR:", e.message);
    }
  }
}

audit();
