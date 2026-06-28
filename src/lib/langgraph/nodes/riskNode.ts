import type { AgentState } from "@/types/agent";
import { analyzeRisksWithAI } from "@/lib/services/geminiService";

export async function riskAnalysisNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (state.error || !state.profile || !state.financials || !state.news) {
    return {};
  }

  try {
    const risks = await analyzeRisksWithAI(
      state.profile,
      state.financials,
      state.news
    );
    return { risks };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze risks";
    return { error: message };
  }
}
