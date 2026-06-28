import type { AgentState } from "@/types/agent";
import {
  fetchCompanyProfile,
  resolveCompanySymbol,
} from "@/lib/services/financialService";

export async function companyResearchNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  try {
    const { symbol } = await resolveCompanySymbol(state.company);
    const profile = await fetchCompanyProfile(symbol);

    return {
      profile,
      error: undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to research company";
    return { error: message };
  }
}
