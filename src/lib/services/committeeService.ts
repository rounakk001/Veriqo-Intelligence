import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel, extractJson } from "./geminiService";
import type { 
  CompanyProfile, 
  FinancialMetrics, 
  NewsSummary, 
  RiskAssessment, 
  Verdict 
} from "@/types/agent";

export interface CommitteeResult {
  bull: {
    rating: string;
    confidence: number;
    arguments: string[];
  };
  bear: {
    rating: string;
    confidence: number;
    arguments: string[];
  };
  moderator: {
    winner: string;
    summary: string;
    agreements: string[];
    disagreements: string[];
    finalOpinion: string;
  };
}

export async function runInvestmentCommittee(
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary,
  risks: RiskAssessment,
  currentRecommendation: Verdict
): Promise<CommitteeResult> {
  const model = getModel();

  const backgroundContext = `
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

Risk Profile:
- Overall Risk: ${risks.overallRiskLevel.toUpperCase()}
- Risk Score: ${risks.riskScore}/100
- Summary: ${risks.summary}
`;

  const bullPrompt = `You are a Bull Analyst, acting as a senior growth investor.
Your objective is to argue why an investment in ${profile.companyName} (${profile.symbol}) should be made.
Always focus on growth, financial strength, competitive advantages, long-term upside, and catalysts.

${backgroundContext}

Return ONLY valid JSON in this exact format:
{
  "rating": "BUY",
  "confidence": 0-100,
  "arguments": ["arg1", "arg2", "arg3", "arg4", "arg5"]
}
Provide exactly 5 concise arguments.`;

  const bearPrompt = `You are a Bear Analyst, acting as a hedge fund short seller.
Your objective is to argue why an investment in ${profile.companyName} (${profile.symbol}) should NOT be made.
Always focus on valuation, risks, debt, competition, regulation, macro conditions, and downside.

${backgroundContext}

Return ONLY valid JSON in this exact format:
{
  "rating": "PASS",
  "confidence": 0-100,
  "arguments": ["arg1", "arg2", "arg3", "arg4", "arg5"]
}
Provide exactly 5 concise arguments.`;

  // 1 & 2. Run Bull and Bear concurrently
  const [bullRes, bearRes] = await Promise.all([
    model.invoke([
      new SystemMessage("You are a financial analyst. Respond with valid JSON only."),
      new HumanMessage(bullPrompt),
    ]),
    model.invoke([
      new SystemMessage("You are a financial analyst. Respond with valid JSON only."),
      new HumanMessage(bearPrompt),
    ])
  ]);

  const bullContent = typeof bullRes.content === "string" ? bullRes.content : JSON.stringify(bullRes.content);
  const bearContent = typeof bearRes.content === "string" ? bearRes.content : JSON.stringify(bearRes.content);

  const bullParsed = extractJson<{ rating: string; confidence: number; arguments: string[] }>(bullContent);
  const bearParsed = extractJson<{ rating: string; confidence: number; arguments: string[] }>(bearContent);

  // 3. Run Moderator
  const modPrompt = `You are the Investment Committee Moderator.
You must review the Bull and Bear arguments, the background data, and the current baseline recommendation.

Current Recommendation: ${currentRecommendation}

Bull Argument:
${JSON.stringify(bullParsed, null, 2)}

Bear Argument:
${JSON.stringify(bearParsed, null, 2)}

Your task:
Summarize both viewpoints.
Highlight agreements.
Highlight disagreements.
Explain why one side has the stronger argument.
Return a balanced conclusion. Do NOT simply average both opinions.

Return ONLY valid JSON in this exact format:
{
  "winner": "Bull|Bear",
  "summary": "Moderator summary",
  "agreements": ["agreements..."],
  "disagreements": ["disagreements..."],
  "finalOpinion": "Final balanced opinion explaining who won"
}`;

  const modRes = await model.invoke([
    new SystemMessage("You are an impartial Investment Committee Moderator. Respond with valid JSON only."),
    new HumanMessage(modPrompt),
  ]);

  const modContent = typeof modRes.content === "string" ? modRes.content : JSON.stringify(modRes.content);
  const modParsed = extractJson<{ winner: string; summary: string; agreements: string[]; disagreements: string[]; finalOpinion: string }>(modContent);

  return {
    bull: bullParsed,
    bear: bearParsed,
    moderator: modParsed
  };
}
