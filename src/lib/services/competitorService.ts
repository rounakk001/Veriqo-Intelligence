import type { CompetitorComparison } from "@/types/agent";
import { fetchFinancialMetrics } from "./financialService";
import { fetchCompanyProfile } from "./financialService";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY!;

export async function fetchPeers(symbol: string): Promise<string[]> {
    const response = await fetch(
        `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        {
            next: {
                revalidate: 3600,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch competitors");
    }

    const peers: string[] = await response.json();

    return peers
        .filter((peer) => peer !== symbol)
        .slice(0, 3);
}



export async function fetchCompetitors(
    symbol: string
): Promise<CompetitorComparison[]> {
    const peers = await fetchPeers(symbol);

 

    if (peers.length === 0) {
        return [];
    }

    const competitors = await Promise.all(
        peers.map(async (peer) => {
            try {
                const [financials, profile] = await Promise.all([
                    fetchFinancialMetrics(peer),
                    fetchCompanyProfile(peer),
                ]);

                const overallScore = Math.round(
                    financials.healthScore * 0.4 +
                    financials.profitabilityScore * 0.35 +
                    financials.growthScore * 0.25
                );

                return {
                    symbol: peer,
                    companyName: profile.companyName ?? peer,

                    revenueGrowth: financials.revenueGrowth,
                    profitabilityScore: financials.profitabilityScore,
                    healthScore: financials.healthScore,

                    peRatio: financials.peRatio,

                    overallScore,
                };
            } catch (error) {
                console.error(`Failed to fetch competitor ${peer}`, error);
                return null;
            }
        })
    );

    return competitors.filter(
        (company): company is CompetitorComparison => company !== null
    );
}