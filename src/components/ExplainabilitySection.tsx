"use client";

import { Brain } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExplainabilitySectionProps {
  reasoning: string[];
  score: number;
  verdict: string;
}

export function ExplainabilitySection({
  reasoning,
  score,
  verdict,
}: ExplainabilitySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Reasoning & Explainability
        </CardTitle>
        <CardDescription>
          Transparent breakdown of how the investment recommendation was derived
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <ol className="space-y-3">
            {reasoning.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-zinc-700 dark:text-zinc-300">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Final score {score}/100. Recommendation: {verdict}.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
