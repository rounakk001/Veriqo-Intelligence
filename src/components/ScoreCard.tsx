"use client";

import { useEffect, useState } from "react";
import { SCORING_WEIGHTS } from "@/lib/config/scoring";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  score: number;
  breakdown?: {
    financialHealth: number;
    profitability: number;
    growth: number;
    newsSentiment: number;
    risk: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number) {

  if (score >= 80) return "Excellent";

  if (score >= 64) return "Strong";

  if (score >= 50) return "Moderate";

  if (score >= 40) return "Weak";

  return "Poor";
}

export function ScoreCard({ score, breakdown }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;

    const step = Math.max(1, Math.ceil(score / 40));

    const interval = setInterval(() => {
      current += step;

      if (current >= score) {
        current = score;
        clearInterval(interval);
      }

      setAnimatedScore(current);
    }, 20);

    return () => clearInterval(interval);
  }, [score]);

  const color = getScoreColor(animatedScore);

  const chartData = [
    { name: "Score", value: animatedScore },
    { name: "Remaining", value: 100 - animatedScore },
  ];

  const defaultBreakdown = breakdown ?? {
    financialHealth: Math.round(score * (SCORING_WEIGHTS.FINANCIAL_HEALTH / 100)),
    profitability: Math.round(score * (SCORING_WEIGHTS.PROFITABILITY / 100)),
    growth: Math.round(score * (SCORING_WEIGHTS.GROWTH / 100)),
    newsSentiment: Math.round(score * (SCORING_WEIGHTS.NEWS_SENTIMENT / 100)),
    risk: Math.round(score * (SCORING_WEIGHTS.RISK / 100)),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Score</CardTitle>
        <CardDescription>
          Weighted composite score across financial, sentiment, and risk factors
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={900}
                >
                  <Cell fill={color} />
                  <Cell fill="#e4e4e7" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-extrabold tabular-nums transition-colors duration-300"
                style={{ color }}
              >
                {animatedScore}
              </span>

              <span className="text-xs text-zinc-500">
                / 100
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <p className="text-sm font-medium">
              Rating{" "}
              <span style={{ color }}>
                {getScoreLabel(animatedScore)}
              </span>
            </p>

            <BreakdownBar
              label={`Financial Health (${SCORING_WEIGHTS.FINANCIAL_HEALTH}%)`}
              value={defaultBreakdown.financialHealth}
              max={SCORING_WEIGHTS.FINANCIAL_HEALTH}
            />

            <BreakdownBar
              label={`Profitability (${SCORING_WEIGHTS.PROFITABILITY}%)`}
              value={defaultBreakdown.profitability}
              max={SCORING_WEIGHTS.PROFITABILITY}
            />

            <BreakdownBar
              label={`Growth (${SCORING_WEIGHTS.GROWTH}%)`}
              value={defaultBreakdown.growth}
              max={SCORING_WEIGHTS.GROWTH}
            />

            <BreakdownBar
              label={`News Sentiment (${SCORING_WEIGHTS.NEWS_SENTIMENT}%)`}
              value={defaultBreakdown.newsSentiment}
              max={SCORING_WEIGHTS.NEWS_SENTIMENT}
            />

            <BreakdownBar
              label={`Risk (${SCORING_WEIGHTS.RISK}%)`}
              value={defaultBreakdown.risk}
              max={SCORING_WEIGHTS.RISK}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-500">
          {label}
        </span>

        <span className="font-medium">
          {value}/{max}
        </span>
      </div>

      <Progress
        value={value}
        max={max}
        className="h-1.5"
      />
    </div>
  );
}