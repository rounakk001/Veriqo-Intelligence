"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Verdict, RiskAssessment, ExecutiveSummary } from "@/types/agent.ts";

interface VerdictCardProps {
  verdict: Verdict;
  confidence: number;
  reasoning: string[];
  risks: RiskAssessment;
  executiveSummary: ExecutiveSummary;
}

const verdictConfig: Record<
  Verdict,
  { color: string; bg: string; icon: typeof TrendingUp }
> = {
  "Strong Invest": {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: TrendingUp,
  },
  Invest: {
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
    icon: TrendingUp,
  },
  Neutral: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: TrendingUp,
  },
  Pass: {
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: TrendingDown,
  },
};


const verdictLabel: Record<Verdict, string> = {
  "Strong Invest": "Strong Buy",
  Invest: "Buy",
  Neutral: "Hold",
  Pass: "Sell",
};

export function VerdictCard({
  verdict,
  confidence,
  risks,
  executiveSummary
}: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;






  return (
    <Card className={`border-2 ${config.bg}`}>
      <CardHeader>
        <CardDescription>Final Recommendation</CardDescription>
        <CardTitle className={`flex items-center gap-2 text-2xl ${config.color}`}>
          <Icon className="h-6 w-6" />
          {verdictLabel[verdict]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Confidence</span>
            <Badge variant="outline">{confidence}%</Badge>
          </div>
          <Progress value={confidence} indicatorClassName="bg-emerald-600" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">
              Investment Horizon
            </p>

            <p className="mt-1 font-semibold">
              {executiveSummary.investmentHorizon}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">
              Risk Profile
            </p>

            <p className="mt-1 font-semibold capitalize">
              {risks.overallRiskLevel}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">
              Investor Type
            </p>

            <p className="mt-1 font-semibold">
              {executiveSummary.investorType}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-zinc-500">
              Suggested Action
            </p>

            <p className="mt-1 font-semibold">
              {executiveSummary.action}
            </p>
          </div>
        </div>

       
       
      </CardContent>
    </Card>
  );
}
