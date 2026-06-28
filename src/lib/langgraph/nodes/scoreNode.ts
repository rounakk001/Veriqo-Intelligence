import type { AgentState } from "@/types/agent";

const WEIGHTS = {
  financialHealth: 35,
  profitability: 20,
  growth: 15,
  newsSentiment: 15,
  risk: 15,
} as const;

function invertRiskScore(riskScore: number): number {
  return Math.max(0, 100 - riskScore);
}

export async function investmentScoringNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (
    state.error ||
    !state.financials ||
    !state.news ||
    !state.risks
  ) {
    return {};
  }

  const financialHealthComponent =
    (state.financials.healthScore / 100) * WEIGHTS.financialHealth;
  const profitabilityComponent =
    (state.financials.profitabilityScore / 100) * WEIGHTS.profitability;
  const growthComponent =
    (state.financials.growthScore / 100) * WEIGHTS.growth;
  const sentimentComponent =
    (state.news.sentimentScore / 100) * WEIGHTS.newsSentiment;
  const riskComponent =
    (invertRiskScore(state.risks.riskScore) / 100) * WEIGHTS.risk;

  const score = Math.round(
    financialHealthComponent +
      profitabilityComponent +
      growthComponent +
      sentimentComponent +
      riskComponent
  );

  return {
    score: Math.min(100, Math.max(0, score)),
  };
}
