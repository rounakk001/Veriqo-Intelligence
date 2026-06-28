import type { AgentState } from "@/types/agent";
import {
  createEmptyNewsSummary,
  fetchCompanyNews,
} from "@/lib/services/newsService";

export async function newsAnalysisNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  if (state.error || !state.profile) {
    return {};
  }

  try {
    const news = await fetchCompanyNews(
      state.profile.companyName,
      state.profile.symbol
    );

    const sentiment = {
      score: news.sentimentScore,
      label:
        news.sentimentScore >= 65
          ? "Positive"
          : news.sentimentScore <= 35
            ? "Negative"
            : "Mixed",
    };

    return { news, sentiment };
  } catch (error) {
    console.error(error);
    const emptyNews = createEmptyNewsSummary();
    return {
      news: emptyNews,
      sentiment: { score: 50, label: "Mixed" },
    };
  }
}
