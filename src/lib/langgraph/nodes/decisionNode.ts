import type { AgentState, Verdict } from "@/types/agent";
import { generateReasoningWithAI } from "@/lib/services/geminiService";

function getVerdict(
  state: AgentState,
  score: number
): Verdict {
  if (!state.financials || !state.news || !state.risks) {
    return "Pass";
  }

  const health = state.financials.healthScore;
  const profitability = state.financials.profitabilityScore;

  const sentiment = state.news.sentimentScore;
  const risk = state.risks.riskScore;

  // Strong Invest
  if (
    score >= 80 &&
    risk <= 30 &&
    sentiment >= 70 &&
    health >= 75
  ) {
    return "Strong Invest";
  }

  // Invest
  if (
    score >= 65 &&
    risk <= 50 &&
    health >= 60 &&
    profitability >= 70
  ) {
    return "Invest";
  }

  // Pass
  if (
    score < 45 ||
    risk >= 75 ||
    sentiment <= 30
  ) {
    return "Pass";
  }

  return "Neutral";
}

function calculateConfidence(
  state: AgentState,
  score: number
): number {
  if (!state.financials || !state.news || !state.risks) {
    return 40;
  }

  let confidence = 50;

  // -------------------------
  // 1. Data Quality (Max +20)
  // -------------------------

  if (state.news.articles.length >= 8) confidence += 8;
  else if (state.news.articles.length >= 5) confidence += 5;
  else confidence -= 5;

  if (state.risks.risks.length === 5) confidence += 5;

  if (
    state.financials.debtToEquity != null &&
    state.financials.peRatio != null &&
    state.financials.returnOnEquity != null
  ) {
    confidence += 7;
  }

  // -------------------------
  // 2. Signal Agreement (Max +20)
  // -------------------------

  const financialPositive =
    state.financials.healthScore >= 65 &&
    state.financials.profitabilityScore >= 65;

  const newsPositive =
    state.news.sentimentScore >= 60;

  const riskLow =
    state.risks.riskScore <= 40;

  const positives = [
    financialPositive,
    newsPositive,
    riskLow,
  ].filter(Boolean).length;

  if (positives === 3) confidence += 20;
  else if (positives === 2) confidence += 12;
  else if (positives === 1) confidence += 5;
  else confidence -= 5;

  // -------------------------
  // 3. Score Conviction (Max +15)
  // -------------------------

  const distance = Math.abs(score - 50);

  if (distance >= 35) confidence += 15;
  else if (distance >= 20) confidence += 10;
  else if (distance >= 10) confidence += 5;

  // -------------------------
  // 4. High Risk Penalty
  // -------------------------

  if (state.risks.riskScore >= 70) confidence -= 8;

  // -------------------------
  // Clamp
  // -------------------------

  return Math.max(40, Math.min(95, Math.round(confidence)));
}

export async function decisionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (
    state.error ||
    !state.profile ||
    !state.financials ||
    !state.news ||
    !state.risks
  ) {
    return {};
  }

  const verdict = getVerdict(state, state.score);
  const confidence = calculateConfidence(state, state.score);

  const reasoning = await generateReasoningWithAI(
    state.profile.companyName,
    state.score,
    verdict,
    state.financials,
    state.news,
    state.risks
  );

  return {
    verdict,
    confidence,
    reasoning,
  };
}
