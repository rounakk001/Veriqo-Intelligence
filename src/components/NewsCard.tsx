"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsSummary } from "@/types/agent";

interface NewsCardProps {
  news: NewsSummary;
}

const sentimentVariant = {
  positive: "default" as const,
  negative: "destructive" as const,
  neutral: "secondary" as const,
};

export function NewsCard({ news }: NewsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          News Summary
        </CardTitle>
        <CardDescription>{news.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">{news.positiveCount} Positive</Badge>
          <Badge variant="destructive">{news.negativeCount} Negative</Badge>
          <Badge variant="secondary">{news.neutralCount} Neutral</Badge>
          <Badge variant="outline">Sentiment: {news.sentimentScore}/100</Badge>
        </div>

        {news.majorEvents.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Major Events
            </p>
            <ul className="space-y-1">
              {news.majorEvents.map((event) => (
                <li key={event} className="text-sm text-zinc-600 dark:text-zinc-400">
                  • {event}
                </li>
              ))}
            </ul>
          </div>
        )}

        {news.articles.length > 0 ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {news.articles.slice(0, 5).map((article) => (
              <li key={article.url} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-1 text-sm font-medium hover:text-emerald-600"
                    >
                      <span className="line-clamp-2">{article.title}</span>
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">
                      {article.source} ·{" "}
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={sentimentVariant[article.sentiment]} className="shrink-0">
                    {article.sentiment}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No recent articles found.</p>
        )}
      </CardContent>
    </Card>
  );
}
