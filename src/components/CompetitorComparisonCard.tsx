"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import type { CompetitorComparison } from "@/types/agent";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

interface CompetitorComparisonCardProps {
    companyName: string;
    competitors: CompetitorComparison[];
}

export function CompetitorComparisonCard({
    companyName,
    competitors,
}: CompetitorComparisonCardProps) {
    const [expanded, setExpanded] = useState(false);

    const winner = useMemo(() => {
        if (competitors.length === 0) return null;

        return [...competitors].sort(
            (a, b) => b.overallScore - a.overallScore
        )[0];
    }, [competitors]);

    const rankedCompanies = useMemo(() => {
        return [...competitors].sort(
            (a, b) => b.overallScore - a.overallScore
        );
    }, [competitors]);
    if (competitors.length <= 1) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Competitor Comparison</CardTitle>
                    <CardDescription>
                        Compare this company with similar publicly listed companies.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <p className="text-lg font-semibold">
                            No comparable competitors found
                        </p>

                        <p className="mt-2 text-sm text-zinc-500">
                            This company doesn't currently have enough publicly listed peers for a meaningful comparison.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Compare with Industry Leaders</CardTitle>

                <CardDescription>
                    See how {companyName} compares against its top competitors.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {!expanded ? (
                    <div className="flex justify-center">
                        <Button
                            onClick={() => setExpanded(true)}
                            className="group"
                        >
                            Compare Now

                            <ChevronDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                        </Button>
                    </div>
                ) : (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-100 dark:bg-zinc-900">
                                        <tr>
                                            <th className="p-3 text-center">Rank</th>
                                            <th className="p-3 text-left">Company</th>
                                            <th className="p-3 text-center">Score</th>
                                            <th className="p-3 text-center">Growth</th>
                                            <th className="p-3 text-center">Profitability</th>
                                            <th className="p-3 text-center">P/E</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {rankedCompanies.map((company, index) => (
                                            <tr
                                                key={company.symbol}
                                                className={
                                                    winner?.symbol === company.symbol
                                                        ? "bg-emerald-50 dark:bg-emerald-950/20"
                                                        : company.isCurrentCompany
                                                            ? "bg-blue-50 dark:bg-blue-950/20"
                                                            : ""
                                                }
                                            >
                                                <td className="p-3 text-center text-lg">
                                                    {index === 0
                                                        ? ""
                                                        : index === 1
                                                            ? "🥈"
                                                            : index === 2
                                                                ? "🥉"
                                                                : index + 1}
                                                </td>

                                                <td className="p-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {winner?.symbol === company.symbol && (
                                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                                        )}

                                                        <span>{company.companyName}</span>

                                                        {company.isCurrentCompany && (
                                                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-3 text-center font-semibold">
                                                    {company.overallScore}
                                                </td>

                                                <td className="p-3 text-center">
                                                    {company.revenueGrowth != null
                                                        ? `${(company.revenueGrowth * 100).toFixed(1)}%`
                                                        : "-"}
                                                </td>

                                                <td className="p-3 text-center">
                                                    {company.profitabilityScore}
                                                </td>

                                                <td className="p-3 text-center">
                                                    {company.peRatio?.toFixed(1) ?? "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {winner && (
                                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                                        🏆 Best Performing Company
                                    </p>

                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <strong>{winner.companyName}</strong> currently ranks #1 with an
                                        overall score of <strong>{winner.overallScore}/100</strong>.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setExpanded(false)}
                                >
                                    Hide Comparison
                                </Button>
                            </div>
                        </div>
                )}
            </CardContent>
        </Card>
    );
}