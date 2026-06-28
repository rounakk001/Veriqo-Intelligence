"use client";

import {
    Brain,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Target,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import type { ExecutiveSummary } from "@/types/agent";

interface ExecutiveSummaryCardProps {
    executiveSummary: ExecutiveSummary;
}

export function ExecutiveSummaryCard({
    executiveSummary,
}: ExecutiveSummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-600" />
                    AI Executive Summary
                </CardTitle>
            </CardHeader>

            <CardContent>
                <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                    {executiveSummary.summary}
                </p>

                <div className="mt-6">
                    <h3 className="mb-3 font-semibold text-emerald-500">
                        Key Strengths
                    </h3>

                    <ul className="space-y-2">
                        {executiveSummary.keyStrengths.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-2 text-sm text-zinc-300"
                            >
                                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6">
                        <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-500">
                            <AlertTriangle className="h-4 w-4" />
                            Key Risks
                        </h3>

                        <ul className="space-y-2">
                            {executiveSummary.keyRisks.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2 text-sm text-zinc-300"
                                >
                                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            
        </CardContent>
        </Card >
    );
}