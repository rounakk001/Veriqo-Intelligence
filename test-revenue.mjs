import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function run() {
  const symbols = [
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", // SBI is SBIN.NS
    "TCS.NS", "INFY.NS",
    "NVDA", "MSFT", "AAPL"
  ];
  
  for (const symbol of symbols) {
    console.log(`\n===========================================`);
    console.log(`SYMBOL: ${symbol}`);
    try {
      // 1. & 2. Quote Summary
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "incomeStatementHistory"]
      });
      
      const fd = summary.financialData || {};
      console.log(`\n[1] financialData.revenueGrowth:`);
      const fdGrowth = fd.revenueGrowth != null ? (fd.revenueGrowth * 100).toFixed(2) + "%" : "N/A";
      console.log(`    => ${fdGrowth}  (Raw: ${fd.revenueGrowth})`);
      
      console.log(`\n[2] incomeStatementHistory:`);
      const stmts = summary.incomeStatementHistory?.incomeStatementHistory || [];
      if (stmts.length >= 2) {
        const rev0 = stmts[0].totalRevenue;
        const rev1 = stmts[1].totalRevenue;
        console.log(`    Current (${stmts[0].endDate.toISOString().split('T')[0]}): ${rev0}`);
        console.log(`    Previous (${stmts[1].endDate.toISOString().split('T')[0]}): ${rev1}`);
        if (rev0 && rev1) {
          const isGrowth = ((rev0 - rev1) / Math.abs(rev1)) * 100;
          console.log(`    => ${isGrowth.toFixed(2)}%`);
        } else {
          console.log(`    => N/A (Missing Revenue)`);
        }
      } else {
        console.log(`    => N/A (Less than 2 statements)`);
      }
      
      // 3. fundamentalsTimeSeries
      console.log(`\n[3] fundamentalsTimeSeries (quarterlyTotalRevenue):`);
      try {
        const fts = await yahooFinance.fundamentalsTimeSeries(symbol, {
          period1: "2023-01-01",
          module: "all",
          type: "quarterlyTotalRevenue"
        });
        
        if (fts && fts.length >= 2) {
          // fts is usually ordered oldest to newest, let's reverse it to get latest
          const revs = [...fts].reverse();
          const r0 = revs[0].reportedValue?.raw;
          const r1 = revs[4]?.reportedValue?.raw; // Trailing Twelve Months vs Previous TTM requires looking back 4 quarters?
          // Wait, quarterlyTotalRevenue is just for 1 quarter. 
          // If we want TTM growth, we need trailingTotalRevenue or compare quarters.
          // Let's just look at the last two available data points for simplicity.
          const current = revs[0];
          const previousYear = revs[4]; // 1 year ago
          
          if (current && previousYear) {
            console.log(`    Current (${current.asOfDate}): ${current.reportedValue?.raw}`);
            console.log(`    Previous YoY (${previousYear.asOfDate}): ${previousYear.reportedValue?.raw}`);
            if (current.reportedValue?.raw && previousYear.reportedValue?.raw) {
              const ftsGrowth = ((current.reportedValue.raw - previousYear.reportedValue.raw) / Math.abs(previousYear.reportedValue.raw)) * 100;
              console.log(`    => ${ftsGrowth.toFixed(2)}% (Quarter YoY)`);
            }
          } else {
             console.log(`    => Not enough quarters to calculate YoY`);
          }
          
        } else {
          console.log(`    => N/A (No timeseries data)`);
        }
      } catch (e) {
        console.log(`    => Error fetching TimeSeries: ${e.message}`);
      }

    } catch (e) {
      console.error(`Failed to process ${symbol}:`, e.message);
    }
  }
}

run();
