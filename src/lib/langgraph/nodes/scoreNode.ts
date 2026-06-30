import type { AgentState } from "@/types/agent";
import { calculateCompositeInvestmentScore } from "@/lib/utils/scoring";

export async function investmentScoringNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (!state.financials || !state.news || !state.risks) {
    return { score: 50 };
  }

  const score = calculateCompositeInvestmentScore(
    state.financials,
    state.news.sentimentScore,
    state.risks.riskScore
  );

  return { score };
}
