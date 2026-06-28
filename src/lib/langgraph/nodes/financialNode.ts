import type { AgentState } from "@/types/agent";
import { fetchFinancialMetrics } from "@/lib/services/financialService";

export async function financialAnalysisNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (state.error || !state.profile) {
    return {};
  }

  try {
    const financials = await fetchFinancialMetrics(state.profile.symbol);
    return { financials };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch financial data";
    return { error: message };
  }
}
