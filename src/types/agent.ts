export interface CompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  website: string;
  ceo: string;
  employees: number;
  ipoDate: string;
  image: string;
}

export interface FinancialMetrics {
  revenue: number;
  revenueGrowth: number | null;
  netIncome: number;
  netIncomeMargin: number | null;
  operatingCashFlow: number;
  freeCashFlow: number;
  totalDebt: number;
  cashAndEquivalents: number;
  debtToEquity: number | null;
  marketCap: number;
  enterpriseValue: number | null;
  peRatio: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  trailingEps: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  ebitdaMargin: number | null;
  dividendYield: number | null;
  healthScore: number;
  profitabilityScore: number;
  growthScore: number;
  analysis: {
    financialHealth: string;
    profitability: string;
    debtLevel: string;
  };
}

export interface CompetitorComparison {
  symbol: string;
  companyName: string;

  revenueGrowth: number | null;
  profitabilityScore: number;
  healthScore: number;

  peRatio: number | null;

  overallScore: number;

  isCurrentCompany?: boolean;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface NewsSummary {
  articles: NewsArticle[];
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentScore: number;
  majorEvents: string[];
  summary: string;
}

export interface RiskItem {
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface RiskAssessment {
  risks: RiskItem[];
  overallRiskLevel: "low" | "medium" | "high";
  riskScore: number;
  summary: string;
}

export type Verdict = "Strong Invest" | "Invest" | "Neutral" | "Pass";

export interface AnalysisResult {
  company: string;
  profile: CompanyProfile;
  financials: FinancialMetrics;
  news: NewsSummary;
  sentiment: {
    score: number;
    label: string;
  };
  risks: RiskAssessment;
  score: number;
  confidence: number;
  verdict: Verdict;
  reasoning: string[];
  executiveSummary: ExecutiveSummary;
  competitors: CompetitorComparison[] | null;
}

export interface AgentState {
  company: string;
  error?: string;
  profile: CompanyProfile | null;
  financials: FinancialMetrics | null;
  news: NewsSummary | null;
  sentiment: { score: number; label: string } | null;
  risks: RiskAssessment | null;
  score: number;
  confidence: number;
  verdict: Verdict | "";
  reasoning: string[];
  executiveSummary: ExecutiveSummary | null;
  competitors: CompetitorComparison[] | null;
}

export interface ExecutiveSummary {
  summary: string;
  keyStrengths: string[];
  keyRisks: string[];
  outlook: string;
recommendationReason: string;
confidenceReason: string;
investmentHorizon: string;
investorType: string;
action: string;
} 

export const LOADING_STEPS = [
  { id: "company", label: "Company Identified" },
  { id: "financials", label: "Financial Statements Retrieved" },
  { id: "news", label: "News Intelligence" },
  { id: "analysis", label: "AI Financial Analysis" },
  { id: "risks", label: "Risk Modeling" },
  { id: "score", label: "Investment Scoring" },
  { id: "decision", label: "Executive Summary" },
] as const;

export type LoadingStepId = (typeof LOADING_STEPS)[number]["id"];
