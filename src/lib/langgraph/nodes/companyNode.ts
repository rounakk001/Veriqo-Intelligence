import type { AgentState } from "@/types/agent";
import {
  fetchCompanyProfile,
  resolveCompanySymbol,
} from "@/lib/services/financialService";

export async function companyResearchNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  try {
    const resolution = await resolveCompanySymbol(state.company);
    const profile = await fetchCompanyProfile(resolution.symbol);

    if (process.env.NODE_ENV !== "production") {
      console.log("\n=== API RESOLUTION AUDIT LOG ===");
      console.log(`User Input      : ${state.company}`);
      console.log(`Resolved Company: ${resolution.name}`);
      console.log(`Resolved Symbol : ${resolution.symbol}`);
      console.log(`Provider Used   : Yahoo Finance`);
      console.log(`Fallback Used   : None`);
      console.log(`Final Company   : ${profile.companyName}`);
      console.log("================================\n");
    }

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
