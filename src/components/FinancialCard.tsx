"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/utils/format";
import type { FinancialMetrics } from "@/types/agent";

interface FinancialCardProps {
  financials: FinancialMetrics;
}

export function FinancialCard({ financials }: FinancialCardProps) {
  const cur = financials.currency;
  const chartData = [
    {
      name: "Revenue",
      value: financials.revenue,
      display: formatMoney(financials.revenue, cur, { compact: false }),
    },
    {
      name: "Net Income",
      value: financials.netIncome,
      display: formatMoney(financials.netIncome, cur, { compact: false }),
    },
    {
      name: "Op. Cash Flow",
      value: financials.operatingCashFlow,
      display: formatMoney(financials.operatingCashFlow, cur, { compact: false }),
    },
    {
      name: "Free Cash Flow",
      value: financials.freeCashFlow,
      display: formatMoney(financials.freeCashFlow, cur, { compact: false }),
    },
  ];

  const insightLines = [
    financials.revenueGrowth != null
      ? `Revenue ${financials.revenueGrowth >= 0 ? "increased" : "declined"} ${formatPercent(
        Math.abs(financials.revenueGrowth)
      )} year-over-year.`
      : "Revenue trend is unavailable.",
    financials.debtToEquity != null
      ? `Debt-to-equity is ${financials.debtToEquity.toFixed(2)}, ` +
      (financials.debtToEquity < 1
        ? "indicating manageable leverage."
        : "indicating higher leverage risk.")
      : "Debt position is not available.",
    financials.operatingMargin != null
      ? `Operating margin is ${formatPercent(financials.operatingMargin)}, ` +
      (financials.operatingMargin >= 15
        ? "supporting durable profitability."
        : "showing room for margin improvement.")
      : "Operating margin information is not available.",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health</CardTitle>
        <CardDescription>
          A deeper financial ratio dashboard with cash flow and valuation context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {financials.dataQuality !== "full" && (
          <div className={`rounded-md border px-4 py-3 text-sm ${
            financials.dataQuality === "insufficient"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300"
          }`}>
            <span className="font-semibold">
              {financials.dataQuality === "insufficient"
                ? "⚠ Insufficient financial data"
                : "⚠ Limited financial data available"}
            </span>
            {" — "}
            {financials.dataQuality === "insufficient"
              ? "Yahoo Finance does not provide enough financial data for this security. Analysis scores may not be reliable."
              : "This company has a very small market cap. Available data may be incomplete or unreliable."}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Metric label="Market Cap" value={formatMoney(financials.marketCap, cur)} />
          <Metric label="Enterprise Value" value={formatMoney(financials.enterpriseValue, cur)} />
          <Metric label="P/E Ratio" value={financials.peRatio?.toFixed(2) ?? "N/A"} />
          <Metric label="PEG Ratio" value={financials.pegRatio?.toFixed(2) ?? "N/A"} />
          <Metric label="Price / Book" value={financials.priceToBook?.toFixed(2) ?? "N/A"} />
          <Metric label="ROE" value={financials.returnOnEquity != null ? formatPercent(financials.returnOnEquity) : "N/A"} />
          <Metric label="ROA" value={financials.returnOnAssets != null ? formatPercent(financials.returnOnAssets) : "N/A"} />
          <Metric label="EPS" value={financials.trailingEps?.toFixed(2) ?? "N/A"} />
          <Metric label="Current Ratio" value={financials.currentRatio?.toFixed(2) ?? "N/A"} />
          <Metric label="Quick Ratio" value={financials.quickRatio?.toFixed(2) ?? "N/A"} />
          <Metric label="Gross Margin" value={financials.grossMargin != null ? formatPercent(financials.grossMargin) : "N/A"} />
          <Metric label="Operating Margin" value={financials.operatingMargin != null ? formatPercent(financials.operatingMargin) : "N/A"} />
          <Metric label="Net Margin" value={financials.netMargin != null ? formatPercent(financials.netMargin) : "N/A"} />
          <Metric label="EBITDA Margin" value={financials.ebitdaMargin != null ? formatPercent(financials.ebitdaMargin) : "N/A"} />
          <Metric label="Dividend Yield" value={financials.dividendYield != null ? formatPercent(financials.dividendYield) : "N/A"} />
          <Metric label="Debt / Equity" value={financials.debtToEquity?.toFixed(2) ?? "N/A"} />
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatMoney(v, cur)}
              />
              <Tooltip
                formatter={(_value, _name, props) => [
                  props.payload.display,
                  "Amount",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
            {insightLines.map((line) => (
              <p key={line} className="text-sm text-zinc-600 dark:text-zinc-400">
                {line}
              </p>
            ))}
          </div>
          <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
            <AnalysisLine label="Financial Health" text={financials.analysis.financialHealth} />
            <AnalysisLine label="Profitability" text={financials.analysis.profitability} />
            <AnalysisLine label="Debt Level" text={financials.analysis.debtLevel} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function AnalysisLine({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}:</span>{" "}
      <span className="text-zinc-600 dark:text-zinc-400">{text}</span>
    </p>
  );
}
