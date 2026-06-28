import type { AgentState } from "@/types/agent";
import { generateExecutiveSummaryWithAI } from "@/lib/services/geminiService"; // <-- apna actual path

export async function executiveSummaryNode(
  state: AgentState
): Promise<Partial<AgentState>> {
    if (
        !state.profile ||
        !state.financials ||
        !state.news ||
        !state.risks ||
        !state.verdict
      ) {
        return {
          error: "Missing data for executive summary generation.",
        };
      }
      const executiveSummary =
      await generateExecutiveSummaryWithAI(
        state.profile,
        state.financials,
        state.news,
        state.risks,
        state.score,
        state.verdict
      );
      return {
        executiveSummary,
      };
    }