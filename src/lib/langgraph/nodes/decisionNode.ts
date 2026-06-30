import type { AgentState, Verdict } from "@/types/agent";
import { generateReasoningWithAI } from "@/lib/services/geminiService";

function getVerdict(
  state: AgentState,
  score: number
): Verdict {
  if (!state.risks) {
    return "Pass";
  }

  const riskScore = state.risks.riskScore;
  const overallRisk = state.risks.overallRiskLevel;

  let verdict: Verdict;

  // Base recommendation driven entirely by composite investment score.
  if (score >= 85) {
    verdict = "Strong Invest";
  } else if (score >= 70) {
    verdict = "Invest";
  } else if (score >= 55) {
    verdict = "Neutral";
  } else {
    verdict = "Pass";
  }

  // Extreme risk always overrides everything.
  if (riskScore >= 90) {
    return "Pass";
  }

  // High risk reduces conviction by one level.
  if (overallRisk === "high" || riskScore >= 80) {
    switch (verdict) {
      case "Strong Invest":
        verdict = "Invest";
        break;

      case "Invest":
        verdict = "Neutral";
        break;

      default:
        break;
    }
  }

  return verdict;
}

function calculateConfidence(
  state: AgentState,
  score: number
): number {
  if (!state.financials || !state.news || !state.risks) {
    return 40;
  }

  let confidence = 50;

  // ---------------------------------
  // 1. Data Completeness (Max +20)
  // ---------------------------------

  if (state.news.articles.length >= 8) confidence += 8;
  else if (state.news.articles.length >= 5) confidence += 5;
  else confidence -= 5;

  if (state.risks.risks.length >= 5) confidence += 5;

  if (
    state.financials.debtToEquity != null &&
    state.financials.peRatio != null &&
    state.financials.returnOnEquity != null
  ) {
    confidence += 7;
  }

  // ---------------------------------
  // 2. Cross-signal agreement (Max +20)
  // ---------------------------------

  const financialPositive =
    state.financials.healthScore >= 65 &&
    state.financials.profitabilityScore >= 65;

  const newsPositive =
    state.news.sentimentScore >= 60;

  const lowRisk =
    state.risks.riskScore <= 40;

  const positives = [
    financialPositive,
    newsPositive,
    lowRisk,
  ].filter(Boolean).length;

  switch (positives) {
    case 3:
      confidence += 20;
      break;

    case 2:
      confidence += 12;
      break;

    case 1:
      confidence += 5;
      break;

    default:
      confidence -= 5;
      break;
  }

  // ---------------------------------
  // 3. Score conviction (Max +15)
  // ---------------------------------

  if (score >= 85 || score <= 25) {
    confidence += 15;
  } else if (score >= 70 || score <= 40) {
    confidence += 10;
  } else if (score >= 60 || score <= 50) {
    confidence += 5;
  }

  // ---------------------------------
  // 4. High Risk Penalty
  // ---------------------------------

  if (state.risks.riskScore >= 70) {
    confidence -= 8;
  }

  // ---------------------------------
  // Final Clamp
  // ---------------------------------

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

  const confidence = calculateConfidence(
    state,
    state.score
  );

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