import type { AgentState } from "@/types/agent";
import { fetchCompetitors } from "@/lib/services/competitorService";

export async function competitorNode(
    state: AgentState
): Promise<Partial<AgentState>> {
    if (state.error || !state.profile) {
        return {};
    }

    try {
        const competitors = await fetchCompetitors(
            state.profile.symbol
        );

        return {
            competitors,
        };
    } catch (error) {
        console.error(error);

        return {
            competitors: [],
        };
    }
}