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
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { FinancialMetrics } from "@/types/agent";

interface FinancialCardProps {
  financials: FinancialMetrics;
}

export function FinancialCard({ financials }: FinancialCardProps) {
  const chartData = [
    {
      name: "Revenue",
      value: Math.abs(financials.revenue) / 1e9,
      display: formatCurrency(financials.revenue),
    },
    {
      name: "Net Income",
      value: Math.abs(financials.netIncome) / 1e9,
      display: formatCurrency(financials.netIncome),
    },
    {
      name: "Op. Cash Flow",
      value: Math.abs(financials.operatingCashFlow) / 1e9,
      display: formatCurrency(financials.operatingCashFlow),
    },
    {
      name: "Free Cash Flow",
      value: Math.abs(financials.freeCashFlow) / 1e9,
      display: formatCurrency(financials.freeCashFlow),
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
      (financials.operatingMargin >= 0.15
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Metric label="Market Cap" value={formatCurrency(financials.marketCap)} />
          <Metric label="Enterprise Value" value={formatCurrency(financials.enterpriseValue)} />
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
                tickFormatter={(v) => `$${v}B`}
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
