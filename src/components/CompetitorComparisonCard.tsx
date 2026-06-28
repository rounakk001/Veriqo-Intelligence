"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronRight, Trophy, X } from "lucide-react";
import { createPortal } from "react-dom";
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Scroll lock and focus trap
    useEffect(() => {
        if (!isModalOpen) {
            // Restore focus when closing
            triggerRef.current?.focus();
            return;
        }

        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        modalRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalStyle;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModalOpen]);

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

    const modalContent = isModalOpen && mounted ? createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="relative flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl outline-none dark:bg-zinc-950 dark:border dark:border-zinc-800 animate-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <div>
                        <h2 id="modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Industry Comparison
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Performance analysis against top peers
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full shrink-0"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="overflow-y-auto p-6">
                    <div className="space-y-5">
                        <div className="overflow-x-auto rounded-lg border dark:border-zinc-800">
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
                                                        : "border-t border-zinc-100 dark:border-zinc-800"
                                            }
                                        >
                                            <td className="p-3 text-center text-lg">
                                                {index === 0
                                                    ? "🥇"
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
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                    <Trophy className="h-4 w-4" /> Best Performing Company
                                </p>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <strong>{winner.companyName}</strong> currently ranks #1 with an
                                    overall score of <strong>{winner.overallScore}/100</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Competitor Comparison</CardTitle>
                    <CardDescription>
                        See how {companyName} compares against its top peers in the industry.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        ref={triggerRef}
                        onClick={() => setIsModalOpen(true)}
                        className="w-full group"
                        variant="default"
                    >
                        View Competitor Comparison
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </CardContent>
            </Card>
            {modalContent}
        </>
    );
}