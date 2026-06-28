import type { NewsArticle, NewsSummary } from "@/types/agent";

const POSITIVE_WORDS = [
  "growth",
  "profit",
  "beat",
  "surge",
  "partnership",
  "acquisition",
  "expand",
  "record",
  "innovation",
  "upgrade",
  "bullish",
  "strong",
  "gain",
  "success",
  "launch",
];

const NEGATIVE_WORDS = [
  "loss",
  "decline",
  "lawsuit",
  "layoff",
  "recall",
  "investigation",
  "fine",
  "bankruptcy",
  "miss",
  "cut",
  "bearish",
  "weak",
  "risk",
  "scandal",
  "regulation",
  "downgrade",
];

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

function getApiKey(): string {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    throw new Error("NEWS_API_KEY is not configured");
  }
  return key;
}

function classifySentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negativeHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (positiveHits > negativeHits + 1) return "positive";
  if (negativeHits > positiveHits + 1) return "negative";
  return "neutral";
}

function extractMajorEvents(articles: NewsArticle[]): string[] {
  const events: string[] = [];
  const eventKeywords: Record<string, string> = {
    acquisition: "Acquisition activity detected",
    merger: "Merger activity detected",
    layoff: "Workforce reduction reported",
    partnership: "Strategic partnership announced",
    regulation: "Regulatory developments noted",
    lawsuit: "Legal proceedings reported",
    earnings: "Earnings report coverage",
    ipo: "IPO-related news",
  };

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    for (const [keyword, label] of Object.entries(eventKeywords)) {
      if (text.includes(keyword) && !events.includes(label)) {
        events.push(label);
      }
    }
  }

  return events.slice(0, 6);
}

function buildSummary(
  positive: number,
  negative: number,
  neutral: number,
  events: string[]
): string {
  const total = positive + negative + neutral;
  if (total === 0) return "No recent news coverage found for this company.";

  const sentimentLabel =
    positive > negative * 1.5
      ? "predominantly positive"
      : negative > positive * 1.5
        ? "predominantly negative"
        : "mixed";

  const eventText =
    events.length > 0
      ? ` Key events include: ${events.slice(0, 3).join(", ")}.`
      : "";

  return `Analyzed ${total} recent articles with ${sentimentLabel} sentiment (${positive} positive, ${negative} negative, ${neutral} neutral).${eventText}`;
}

export async function fetchCompanyNews(
  companyName: string,
  symbol: string
): Promise<NewsSummary> {
  const apiKey = getApiKey();
  const query = encodeURIComponent(`"${companyName}" OR ${symbol}`);
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=15&apiKey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error(`News API error: ${response.statusText}`);
  }

  const data: NewsAPIResponse = await response.json();

  if (data.status !== "ok") {
    throw new Error("Failed to fetch news articles");
  }

  const articles: NewsArticle[] = (data.articles || [])
    .filter((a) => a.title && a.title !== "[Removed]")
    .map((a) => {
      const text = `${a.title} ${a.description || ""}`;
      return {
        title: a.title,
        description: a.description || "",
        url: a.url,
        source: a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
        sentiment: classifySentiment(text),
      };
    });

  const positiveCount = articles.filter((a) => a.sentiment === "positive").length;
  const negativeCount = articles.filter((a) => a.sentiment === "negative").length;
  const neutralCount = articles.filter((a) => a.sentiment === "neutral").length;
  const total = positiveCount + negativeCount + neutralCount;

  const sentimentScore =
    total > 0
      ? Math.round(
          ((positiveCount - negativeCount) / total + 1) * 50
        )
      : 50;

  const majorEvents = extractMajorEvents(articles);

  return {
    articles: articles.slice(0, 10),
    positiveCount,
    negativeCount,
    neutralCount,
    sentimentScore: clamp(sentimentScore, 0, 100),
    majorEvents,
    summary: buildSummary(positiveCount, negativeCount, neutralCount, majorEvents),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createEmptyNewsSummary(): NewsSummary {
  return {
    articles: [],
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    sentimentScore: 50,
    majorEvents: [],
    summary: "No recent news coverage available.",
  };
}
