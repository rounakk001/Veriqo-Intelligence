import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type {
  CompanyProfile,
  FinancialMetrics,
  NewsSummary,
  RiskAssessment,
  RiskItem,
  ExecutiveSummary,
  Verdict,
} from "@/types/agent";

function getModel(): ChatGoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey,
    temperature: 0.2,
    maxOutputTokens: 4096,
  });
}

function extractJson<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

export async function analyzeRisksWithAI(
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary
): Promise<RiskAssessment> {
  const model = getModel();

  const prompt = `You are a senior investment analyst. Analyze risks for ${profile.companyName} (${profile.symbol}).

Company Profile:
- Sector: ${profile.sector}
- Industry: ${profile.industry}
- Description: ${profile.description.slice(0, 500)}

Financial Data:
- Revenue: $${financials.revenue}
- Revenue Growth: ${financials.revenueGrowth != null ? (financials.revenueGrowth * 100).toFixed(1) + "%" : "N/A"}
- Net Income: $${financials.netIncome}
- Debt/Equity: ${financials.debtToEquity ?? "N/A"}
- P/E Ratio: ${financials.peRatio ?? "N/A"}
- Operating Cash Flow: $${financials.operatingCashFlow}

News Summary:
- Sentiment Score: ${news.sentimentScore}/100
- Positive: ${news.positiveCount}, Negative: ${news.negativeCount}
- Major Events: ${news.majorEvents.join(", ") || "None"}

Identify exactly 5 risks across these categories: Competition, Debt, Market, Regulatory, Business.

Return ONLY valid JSON in this exact format:
{
  "risks": [
    {"category": "Competition", "severity": "low|medium|high", "description": "..."}
  ],
  "overallRiskLevel": "low|medium|high",
  "riskScore": 0-100,
  "summary": "One paragraph risk summary"
}

riskScore: 0 = lowest risk, 100 = highest risk.`;

  try {
    const response = await model.invoke([
      new SystemMessage("You are a financial risk analyst. Respond with valid JSON only."),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    console.log(content);

    const parsed = extractJson<{
      risks: RiskItem[];
      overallRiskLevel: "low" | "medium" | "high";
      riskScore: number;
      summary: string;
    }>(content);

    return {
      risks: parsed.risks.slice(0, 5),
      overallRiskLevel: parsed.overallRiskLevel,
      riskScore: Math.min(100, Math.max(0, parsed.riskScore)),
      summary: parsed.summary,
    };
  } catch (error) {
    console.error(error);
    return buildFallbackRiskAssessment(profile, financials, news);
  }
}

function buildFallbackRiskAssessment(
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary
): RiskAssessment {
  const risks: RiskItem[] = [];



  risks.push({
    category: "Competition",
    severity: profile.sector === "Technology" ? "high" : "medium",
    description: `${profile.companyName} operates in the ${profile.industry} industry with significant competitive pressures.`,
  });

  risks.push({
    category: "Debt",
    severity:
      financials.debtToEquity != null && financials.debtToEquity > 1.5
        ? "high"
        : financials.debtToEquity != null && financials.debtToEquity > 0.8
          ? "medium"
          : "low",
    description: financials.analysis.debtLevel,
  });

  risks.push({
    category: "Market",
    severity: "medium",
    description: "Exposure to broader market volatility and macroeconomic conditions.",
  });

  risks.push({
    category: "Regulatory",
    severity: news.majorEvents.some((e) => e.includes("Regulatory")) ? "high" : "low",
    description: "Potential regulatory changes could impact operations and compliance costs.",
  });

  risks.push({
    category: "Business",
    severity: financials.revenueGrowth != null && financials.revenueGrowth < 0 ? "high" : "medium",
    description:
      financials.revenueGrowth != null && financials.revenueGrowth < 0
        ? "Declining revenue indicates business model challenges."
        : "Operational execution and market positioning remain key business risks.",
  });

  const highCount = risks.filter((r) => r.severity === "high").length;
  const overallRiskLevel: "low" | "medium" | "high" =
    highCount >= 2 ? "high" : highCount >= 1 ? "medium" : "low";
  const riskScore = highCount * 25 + risks.filter((r) => r.severity === "medium").length * 10;

  return {
    risks,
    overallRiskLevel,
    riskScore: Math.min(100, riskScore),
    summary: `${profile.companyName} faces ${overallRiskLevel} overall risk based on financial metrics and market conditions.`,
  };
}



export async function generateReasoningWithAI(
  companyName: string,
  score: number,
  verdict: string,
  financials: FinancialMetrics,
  news: NewsSummary,
  risks: RiskAssessment
): Promise<string[]> {
  const model = getModel();

  const prompt = `
You are a senior equity research analyst at Goldman Sachs.

Analyze ${companyName} and generate professional investment reasoning.

Investment Decision
- Score: ${score}/100
- Recommendation: ${verdict}

Financial Analysis
- Financial Health: ${financials.healthScore}/100
- Profitability: ${financials.profitabilityScore}/100
- Growth: ${financials.growthScore}/100
- Revenue Growth: ${financials.revenueGrowth != null
      ? (financials.revenueGrowth * 100).toFixed(1) + "%"
      : "N/A"
    }
- Net Margin: ${financials.netMargin ?? "N/A"}%
- ROE: ${financials.returnOnEquity ?? "N/A"}%
- Debt/Equity: ${financials.debtToEquity ?? "N/A"}
- P/E Ratio: ${financials.peRatio ?? "N/A"}

Market Sentiment
- News Score: ${news.sentimentScore}/100
- Risk Level: ${risks.overallRiskLevel}

Generate EXACTLY 4 concise professional bullet points.

Requirements:
- Mention actual financial metrics where relevant.
- Do NOT repeat the score.
- Do NOT repeat the recommendation.
- Do NOT say "financial health is 40/100".
- Sound like an equity research report.
- Keep every point under 25 words.
- Avoid generic statements.

Return ONLY valid JSON.

Example:

[
  "Revenue continues to expand while profitability remains above industry averages.",
  "Current valuation appears reasonable relative to expected earnings growth.",
  "Neutral news flow provides limited short-term catalysts for upside.",
  "Moderate leverage and regulatory exposure remain key investment risks."
]
`;

  try {
    const response = await model.invoke([
      new SystemMessage("Respond with a valid JSON array of strings only."),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const parsed = extractJson<string[]>(content);
    return parsed.slice(0, 8);
  } catch (error) {
    console.error(error);
    return buildFallbackReasoning(companyName, score, verdict, financials, news, risks);
  }
}

function buildFallbackReasoning(
  companyName: string,
  score: number,
  verdict: string,
  financials: FinancialMetrics,
  news: NewsSummary,
  risks: RiskAssessment
): string[] {
  const reasons: string[] = [];

  reasons.push(financials.analysis.financialHealth);
  reasons.push(financials.analysis.profitability);
  reasons.push(financials.analysis.debtLevel);

  if (financials.revenueGrowth != null) {
    reasons.push(
      `Revenue ${financials.revenueGrowth >= 0 ? "grew" : "declined"} ${Math.abs(financials.revenueGrowth * 100).toFixed(1)}% year-over-year.`
    );
  }

  reasons.push(
    `News sentiment is ${news.sentimentScore >= 60 ? "positive" : news.sentimentScore <= 40 ? "negative" : "mixed"} (${news.sentimentScore}/100).`
  );
  reasons.push(`Overall risk level assessed as ${risks.overallRiskLevel}.`);
  reasons.push(`Final investment score: ${score}/100. Recommendation: ${verdict}.`);

  return reasons;


}

function buildFallbackExecutiveSummary(
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary,
  risks: RiskAssessment,
  score: number,
  verdict: Verdict
): ExecutiveSummary {
  return {
    summary: `${profile.companyName} operates in the ${profile.industry} industry. Based on its financial performance, market sentiment, and risk profile, the company has received an investment score of ${score}/100 with a recommendation of ${verdict}.`,

    keyStrengths: [
      financials.analysis.financialHealth,
      financials.analysis.profitability,
      `News sentiment score is ${news.sentimentScore}/100.`,
    ],

    keyRisks: [
      financials.analysis.debtLevel,
      `Overall risk level is ${risks.overallRiskLevel}.`,
      "Future performance depends on market conditions and execution.",
    ],

    outlook:
      verdict === "Strong Invest" || verdict === "Invest"
        ? "Positive long-term outlook with moderate risks."
        : verdict === "Neutral"
          ? "Mixed outlook requiring close monitoring."
          : "Cautious outlook until fundamentals improve.",

    recommendationReason:
      `The recommendation of ${verdict} is based on the company's financial health, valuation, news sentiment and overall risk profile.`,

    confidenceReason:
      "Confidence is derived from the availability and consistency of financial data, market news and AI analysis.",

    investmentHorizon: "Not Available",
    investorType: "Not Available",
    action: "Not Available",
  };
}


export async function generateExecutiveSummaryWithAI(
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary,
  risks: RiskAssessment,
  score: number,
  verdict: Verdict
): Promise<ExecutiveSummary> {

  const model = getModel();

  const prompt = `
You are a senior CFA equity research analyst.

Generate a professional executive investment summary for ${profile.companyName}.

Company Profile:
- Sector: ${profile.sector}
- Industry: ${profile.industry}

Financial Metrics:
- Revenue Growth: ${financials.revenueGrowth != null
      ? (financials.revenueGrowth * 100).toFixed(1) + "%"
      : "N/A"
    }
- Net Margin: ${financials.netMargin ?? "N/A"}%
- Return on Equity: ${financials.returnOnEquity ?? "N/A"}%
- Debt to Equity: ${financials.debtToEquity ?? "N/A"}
- P/E Ratio: ${financials.peRatio ?? "N/A"}

News:
- Sentiment Score: ${news.sentimentScore}/100
- Major Events: ${news.majorEvents.join(", ") || "None"}

Risk:
- Overall Risk: ${risks.overallRiskLevel}

Investment Score:
${score}/100

Recommendation:
${verdict}

Return ONLY valid JSON in this exact format:


{
  "summary": "...",
  "keyStrengths": [
    "...",
    "...",
    "..."
  ],
  "keyRisks": [
    "...",
    "...",
    "..."
  ],
  "outlook": "...",
  "recommendationReason": "...",
  "confidenceReason": "...",
  "investmentHorizon": "...",
  "investorType": "...",
  "action": "..."
}

Rules:
- summary must be under 100 words
- exactly 3 strengths
- exactly 3 risks
- outlook under 40 words
- no markdown
- no extra text

- investmentHorizon should be one of:
  "Short-term (0–1 Year)"
  "Medium-term (1–3 Years)"
  "Long-term (3–5 Years)"
  "Very Long-term (5+ Years)"

- investorType should describe the ideal investor.
  Example:
  "Growth Investors"
  "Long-term Investors"
  "Value Investors"
  "Income Investors"
  "Aggressive Investors"

- action should be a single sentence investment action.
  Examples:
  "Accumulate on market corrections."
  "Hold existing positions."
  "Wait for better valuation."
  "Avoid new investments until fundamentals improve."
`;

  try {
    const response = await model.invoke([
      new SystemMessage(
        "You are a CFA equity research analyst. Respond ONLY with valid JSON."
      ),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);




    const parsed = extractJson<ExecutiveSummary>(content);

    console.log("AI Executive Summary:", parsed);


    return {
      summary: parsed.summary,
      keyStrengths: parsed.keyStrengths.slice(0, 3),
      keyRisks: parsed.keyRisks.slice(0, 3),
      outlook: parsed.outlook,
      recommendationReason: parsed.recommendationReason,
      confidenceReason: parsed.confidenceReason,
      investmentHorizon: parsed.investmentHorizon,
      investorType: parsed.investorType,
      action: parsed.action
    };
  } catch (error) {
    console.error("Executive Summary Error", error);

    return buildFallbackExecutiveSummary(
      profile,
      financials,
      news,
      risks,
      score,
      verdict
    );
  }
}
