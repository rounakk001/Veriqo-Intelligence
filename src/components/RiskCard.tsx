"use client";

import { AlertTriangle, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RiskAssessment } from "@/types/agent";

interface RiskCardProps {
  risks: RiskAssessment;
}

const severityVariant = {
  low: "default" as const,
  medium: "warning" as const,
  high: "destructive" as const,
};

const levelColors = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

export function RiskCard({ risks }: RiskCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Analysis
        </CardTitle>
        <CardDescription>
          Overall risk:{" "}
          <span className={`font-semibold capitalize ${levelColors[risks.overallRiskLevel]}`}>
            {risks.overallRiskLevel}
          </span>{" "}
          (Score: {risks.riskScore}/100)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{risks.summary}</p>
        <ul className="space-y-3">
          {risks.risks.map((risk) => (
            <li
              key={`${risk.category}-${risk.description.slice(0, 20)}`}
              className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
            >
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  risk.severity === "high"
                    ? "text-red-500"
                    : risk.severity === "medium"
                      ? "text-amber-500"
                      : "text-emerald-500"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{risk.category}</span>
                  <Badge variant={severityVariant[risk.severity]}>{risk.severity}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {risk.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
