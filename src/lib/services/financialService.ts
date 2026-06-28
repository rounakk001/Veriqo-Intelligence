import YahooFinance from "yahoo-finance2";
import type { CompanyProfile, FinancialMetrics } from "@/types/agent";

const yahooFinance = new YahooFinance();

type YahooSearchRawQuote = {
  symbol: string;
  exchDisp?: string;
  exchange?: string;
  shortname?: string;
  longname?: string;
  name?: string;
  currency?: string;
  quoteType?: string;
};

type YahooSearchRaw = {
  quotes?: YahooSearchRawQuote[];
};

type QuoteSummaryRaw = {
  summaryProfile?: {
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
    country?: string;
    website?: string;
    fullTimeEmployees?: number;
    name?: string;
    startDate?: Date | string;
    description?: string;
    companyOfficers?: Array<{ name?: string; title?: string } | unknown>;
  };
  assetProfile?: {
    sector?: string;
    industry?: string;
    country?: string;
    website?: string;
    fullTimeEmployees?: number;
    name?: string;
  };
  price?: {
    marketCap?: number;
    exchangeName?: string;
    currency?: string;
  };
  summaryDetail?: {
    marketCap?: number;
    trailingPE?: number;
    dividendYield?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    ebitdaMargins?: number;
  };
  financialData?: {
    totalDebt?: number;
    currentDebt?: number;
    totalCash?: number;
    freeCashFlow?: number;
    operatingCashflow?: number;
    operatingCashFlow?: number;
    debtToEquity?: number;
    profitMargins?: number;
    returnOnEquity?: number;
    returnOnAssets?: number;
    currentRatio?: number;
    quickRatio?: number;
    grossMargins?: number;
    operatingMargins?: number;
    ebitdaMargins?: number;
  };
  defaultKeyStatistics?: {
    trailingPE?: number;
    debtToEquity?: number;
    pegRatio?: number;
    priceToBook?: number;
    trailingEps?: number;
    enterpriseValue?: number;
  };
  incomeStatementHistory?: {
    incomeStatementHistory?: Array<{
      totalRevenue?: number;
      netIncome?: number;
    }>;
  };
  balanceSheetHistory?: {
    balanceSheetStatements?: Array<{
      totalDebt?: number;
      cash?: number;
      totalStockholdersEquity?: number;
    }>;
  };
  cashflowStatementHistory?: {
    cashflowStatements?: Array<{
      totalCashFromOperatingActivities?: number;
      freeCashFlow?: number;
    }>;
  };
};

type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
};

function coerceNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toDateString(value: Date | string | undefined | null): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  return undefined;
}

function findCeo(officers: Array<unknown> | undefined): string {
  if (!Array.isArray(officers) || officers.length === 0) return "Unknown";

  const candidates = officers
    .filter(
      (entry): entry is { name?: unknown; title?: unknown } =>
        typeof entry === "object" && entry !== null
    )
    .map((entry) => ({
      name: (entry as { name?: unknown }).name,
      title: (entry as { title?: unknown }).title,
    }))
    .filter(
      (entry): entry is { name: string; title: string } =>
        typeof entry.name === "string" && typeof entry.title === "string"
    );

  const ceo = candidates.find((entry) => /chief executive officer|\bceo\b/i.test(entry.title));
  return ceo?.name ?? candidates[0]?.name ?? "Unknown";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function growthRate(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function scoreFinancialHealth(
  debtToEquity: number | null,
  cash: number,
  debt: number,
  operatingCashFlow: number
): number {
  let score = 50;

  if (debtToEquity != null) {
    if (debtToEquity < 0.5) score += 25;
    else if (debtToEquity < 1) score += 15;
    else if (debtToEquity < 2) score += 5;
    else score -= 15;
  }

  if (operatingCashFlow > 0) score += 15;
  else score -= 20;

  if (cash > debt) score += 10;
  else if (debt > cash * 2) score -= 10;

  return clamp(score, 0, 100);
}

function scoreProfitability(netMargin: number | null): number {
  if (netMargin == null) return 50;
  if (netMargin > 0.2) return 90;
  if (netMargin > 0.1) return 75;
  if (netMargin > 0.05) return 60;
  if (netMargin > 0) return 45;
  return 20;
}

function scoreGrowth(revenueGrowth: number | null): number {
  if (revenueGrowth == null) return 50;
  if (revenueGrowth > 0.25) return 95;
  if (revenueGrowth > 0.15) return 80;
  if (revenueGrowth > 0.05) return 65;
  if (revenueGrowth > 0) return 55;
  if (revenueGrowth > -0.05) return 40;
  return 25;
}

export async function searchCompany(query: string): Promise<SearchResult[]> {
  const response = await yahooFinance.search(query, {
    quotesCount: 15,
    lang: "en-US",
  });

  const quotes = Array.isArray((response as YahooSearchRaw).quotes)
    ? (response as YahooSearchRaw).quotes
    : [];

  return (quotes ?? [])
    .filter((quote): quote is YahooSearchRawQuote => typeof quote.symbol === "string")
    .map((quote) => ({
      symbol: quote.symbol,
      name:
        coerceString(quote.shortname) ||
        coerceString(quote.longname) ||
        coerceString(quote.name) ||
        quote.symbol,
      exchange:
        coerceString(quote.exchDisp) ||
        coerceString(quote.exchange) ||
        "Unknown",
      currency: coerceString(quote.currency) || "USD",
    }));
}

export async function fetchCompanyProfile(
  symbol: string
): Promise<CompanyProfile> {
  const summary = await yahooFinance.quoteSummary(symbol, {
    modules: ["summaryProfile", "assetProfile", "price"],
  });

  const profile: Record<string, unknown> = (summary as QuoteSummaryRaw).summaryProfile ?? {};
  const assetProfile: Record<string, unknown> = (summary as QuoteSummaryRaw).assetProfile ?? {};
  
  const price: Record<string, unknown> = (summary as QuoteSummaryRaw).price ?? {};

  const companyName =
    coerceString(price.longName) ||
    coerceString(price.shortName) ||
    coerceString(profile.longName) ||
    coerceString(assetProfile.longName) ||
    symbol;

  const description =
    coerceString(profile.longBusinessSummary) ||
    coerceString(profile.description) ||
    "No description available.";
  const sector =
    coerceString(profile.sector) ||
    coerceString(assetProfile.sector) ||
    "Unknown";
  const industry =
    coerceString(profile.industry) ||
    coerceString(assetProfile.industry) ||
    "Unknown";
  const country =
    coerceString(profile.country) ||
    coerceString(assetProfile.country) ||
    "Unknown";
  const exchange =
    coerceString(price.exchangeName) ||
    "Unknown";
  const website =
    coerceString(profile.website) ||
    coerceString(assetProfile.website) ||
    "";
  const ceo = findCeo(profile.companyOfficers as unknown[] | undefined);
  const employees = (profile.fullTimeEmployees as number) ?? (assetProfile.fullTimeEmployees as number) ?? 0;
  const ipoDate = toDateString(profile.startDate as string | undefined) || "Unknown";
  const image = "";

  return {
    symbol,
    companyName,
    description,
    sector,
    industry,
    country,
    exchange,
    website,
    ceo,
    employees,
    ipoDate,
    image,
  };
}

export async function fetchFinancialMetrics(
  symbol: string
): Promise<FinancialMetrics> {
  const summary = await yahooFinance.quoteSummary(symbol, {
    modules: [
      "financialData",
      "defaultKeyStatistics",
      "assetProfile",
      "price",
      "summaryDetail",
      "incomeStatementHistory",
      "balanceSheetHistory",
      "cashflowStatementHistory",
    ],
  });

  const financialData = (summary as QuoteSummaryRaw).financialData ?? {};
  const defaultKeyStatistics =
    (summary as QuoteSummaryRaw).defaultKeyStatistics ?? {};
  const price = (summary as QuoteSummaryRaw).price ?? {};
  const summaryDetail = (summary as QuoteSummaryRaw).summaryDetail ?? {};

  const incomeStatements = Array.isArray(
    (summary as QuoteSummaryRaw).incomeStatementHistory?.incomeStatementHistory
  )
    ? (summary as QuoteSummaryRaw).incomeStatementHistory!.incomeStatementHistory!
    : [];
  const balanceStatements = Array.isArray(
    (summary as QuoteSummaryRaw).balanceSheetHistory?.balanceSheetStatements
  )
    ? (summary as QuoteSummaryRaw).balanceSheetHistory!
      .balanceSheetStatements!
    : [];
  const cashflowStatements = Array.isArray(
    (summary as QuoteSummaryRaw).cashflowStatementHistory?.cashflowStatements
  )
    ? (summary as QuoteSummaryRaw).cashflowStatementHistory!
      .cashflowStatements!
    : [];

  const latestIncome = incomeStatements[0] ?? {};
  const previousIncome = incomeStatements[1];
  const latestBalance = balanceStatements[0] ?? {};
  const latestCashFlow = cashflowStatements[0] ?? {};

  const revenue = coerceNumber(latestIncome.totalRevenue) ?? 0;
  const netIncome = coerceNumber(latestIncome.netIncome) ?? 0;
  const revenueGrowth =
    previousIncome && coerceNumber(previousIncome.totalRevenue) != null
      ? growthRate(revenue, coerceNumber(previousIncome.totalRevenue) ?? 0)
      : null;
  const netIncomeMargin = revenue ? netIncome / revenue : null;
  const operatingCashFlow =
    coerceNumber(latestCashFlow.totalCashFromOperatingActivities) ??
    coerceNumber(financialData.operatingCashFlow) ??
    coerceNumber(financialData.operatingCashflow) ??
    0;
  const capitalExpenditure = coerceNumber((latestCashFlow as any).capitalExpenditures) ?? 0;
  const calculatedFcf = operatingCashFlow - Math.abs(capitalExpenditure);

  const freeCashFlow =
    coerceNumber(latestCashFlow.freeCashFlow) ??
    coerceNumber((financialData as any).freeCashflow) ??
    coerceNumber(financialData.freeCashFlow) ??
    calculatedFcf;
  const totalDebt =
    coerceNumber(latestBalance.totalDebt) ??
    coerceNumber(financialData.totalDebt) ??
    coerceNumber(financialData.currentDebt) ??
    0;
  const cashAndEquivalents =
    coerceNumber(latestBalance.cash) ??
    coerceNumber(financialData.totalCash) ??
    0;
  const totalShareholdersEquity =
    coerceNumber(latestBalance.totalStockholdersEquity);
  const debtToEquity =
    coerceNumber(financialData.debtToEquity) ??
    coerceNumber(defaultKeyStatistics.debtToEquity) ??
    (totalShareholdersEquity
      ? totalDebt / totalShareholdersEquity
      : null);
  const marketCap =
    coerceNumber(price.marketCap) ??
    coerceNumber(summaryDetail.marketCap) ??
    0;
  const peRatio =
    coerceNumber(summaryDetail.trailingPE) ??
    coerceNumber(defaultKeyStatistics.trailingPE) ??
    null;
  const pegRatio =
    coerceNumber(defaultKeyStatistics.pegRatio) ??
    null;
  const priceToBook =
    coerceNumber(defaultKeyStatistics.priceToBook) ??
    null;
  const returnOnEquity =
    coerceNumber(financialData.returnOnEquity) ??
    null;
  const returnOnAssets =
    coerceNumber(financialData.returnOnAssets) ??
    null;
  const trailingEps =
    coerceNumber(defaultKeyStatistics.trailingEps) ??
    null;
  const currentRatio =
    coerceNumber(financialData.currentRatio) ??
    null;
  const quickRatio =
    coerceNumber(financialData.quickRatio) ??
    null;
  const grossMargin =
    coerceNumber(financialData.grossMargins) ??
    coerceNumber(summaryDetail.grossMargins) ??
    null;
  const operatingMargin =
    coerceNumber(financialData.operatingMargins) ??
    coerceNumber(summaryDetail.operatingMargins) ??
    null;
  const netMargin =
    coerceNumber(financialData.profitMargins) ??
    coerceNumber(summaryDetail.profitMargins) ??
    null;
  const ebitdaMargin =
    coerceNumber(financialData.ebitdaMargins) ??
    coerceNumber(summaryDetail.ebitdaMargins) ??
    null;
  const dividendYield =
    coerceNumber(summaryDetail.dividendYield) ??
    null;
  const enterpriseValue =
    coerceNumber(defaultKeyStatistics.enterpriseValue) ??
    null;

  const healthScore = scoreFinancialHealth(
    debtToEquity,
    cashAndEquivalents,
    totalDebt,
    operatingCashFlow
  );
  const profitabilityScore = scoreProfitability(netIncomeMargin);
  const growthScore = scoreGrowth(revenueGrowth);

  const debtLevel =
    debtToEquity == null
      ? "Debt data unavailable"
      : debtToEquity < 0.5
        ? "Low debt — strong balance sheet"
        : debtToEquity < 1.5
          ? "Moderate debt — manageable leverage"
          : "High debt — elevated leverage risk";

  const financialHealth =
    healthScore >= 70
      ? "Strong financial health with solid liquidity"
      : healthScore >= 50
        ? "Adequate financial health with some concerns"
        : "Weak financial health — monitor closely";

  const profitability =
    profitabilityScore >= 70
      ? "Highly profitable with strong margins"
      : profitabilityScore >= 50
        ? "Moderately profitable"
        : "Low or negative profitability";

  return {
    revenue,
    revenueGrowth,
    netIncome,
    netIncomeMargin,
    operatingCashFlow,
    freeCashFlow,
    totalDebt,
    cashAndEquivalents,
    debtToEquity,
    marketCap,
    enterpriseValue,
    peRatio,
    pegRatio,
    priceToBook,
    returnOnEquity,
    returnOnAssets,
    trailingEps,
    currentRatio,
    quickRatio,
    grossMargin,
    operatingMargin,
    netMargin,
    ebitdaMargin,
    dividendYield,
    healthScore,
    profitabilityScore,
    growthScore,
    analysis: {
      financialHealth,
      profitability,
      debtLevel,
    },
  };
}

export async function resolveCompanySymbol(
  companyName: string
): Promise<{ symbol: string; name: string }> {
  const results = await searchCompany(companyName);

  if (!results.length) {
    throw new Error(
      `Could not find a public company matching "${companyName}". Try the exact ticker symbol.`
    );
  }

  const normalized = companyName.trim().toLowerCase();
  const cleanName = (name: string) => name.toLowerCase().replace(/\b(inc|corp|plc|ltd|co|corporation|company)\b\.?/gi, '').trim();
  const normalizedClean = cleanName(companyName);

  const exactSymbol = results.find(
    (r) => r.symbol.toLowerCase() === normalized
  );
  if (exactSymbol) return exactSymbol;

  const exactName = results.find(
    (r) => cleanName(r.name) === normalizedClean
  );
  if (exactName) return exactName;

  const startsWith = results.find((r) =>
    cleanName(r.name).startsWith(normalizedClean)
  );

  return startsWith || results[0];
}
