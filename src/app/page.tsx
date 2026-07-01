"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { History, Keyboard, Moon, Search, Sun, TrendingUp, X } from "lucide-react";
import { CompanySearchBar } from "@/components/CompanySearchBar";

import { ExecutiveSummaryCard } from "@/components/ExecutiveSummaryCard";
import {
  LoadingState,
  simulateLoadingSteps,
} from "@/components/LoadingState";
import { OverviewCard } from "@/components/OverviewCard";
import { FinancialCard } from "@/components/FinancialCard";
import { NewsCard } from "@/components/NewsCard";
import { RiskCard } from "@/components/RiskCard";
import { ScoreCard } from "@/components/ScoreCard";
import { VerdictCard } from "@/components/VerdictCard";
import { CommitteeCard } from "@/components/CommitteeCard";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { MarketDashboard } from "@/components/MarketDashboard";
import { Button } from "@/components/ui/button";
import type { AnalysisResult, LoadingStepId } from "@/types/agent";
import { CompetitorComparisonCard } from "@/components/CompetitorComparisonCard";
import { downloadInvestmentReport } from "@/lib/utils/pdf/generateReport";

import { Download } from "lucide-react";


const HISTORY_KEY = "investment-research-history";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<LoadingStepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<LoadingStepId[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const stopSimulation = useRef<(() => void) | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setHistory(JSON.parse(stored));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);


  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen(true);
      }

      if (event.key === "Escape") {
        setIsCommandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const saveToHistory = useCallback((name: string) => {
    setHistory((prev) => {
      const updated = [name, ...prev.filter((h) => h.toLowerCase() !== name.toLowerCase())].slice(0, 8);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleAnalyze = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? company).trim();
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCompletedSteps([]);
    setCurrentStep("company");

    stopSimulation.current = simulateLoadingSteps((step, completed) => {
      setCurrentStep(step);
      setCompletedSteps(completed);
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      stopSimulation.current?.();
      setCompletedSteps([
        "company",
        "financials",
        "news",
        "analysis",
        "risks",
        "score",
        "decision",
      ]);
      setCurrentStep(null);
      setResult(data as AnalysisResult);
      saveToHistory(query);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      stopSimulation.current?.();
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [company, saveToHistory]);

  const handleCommandSubmit = useCallback(() => {
    const query = commandQuery.trim();
    if (!query) return;
    setCompany(query);
    setIsCommandOpen(false);
    handleAnalyze(query);
  }, [commandQuery, handleAnalyze]);

  function downloadAnalysisReport(result: AnalysisResult): void {
    downloadInvestmentReport(result);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Veriqo Intelligence
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/portfolio">
                  <Button variant="outline" size="sm">
                    Portfolio
                  </Button>
                </Link>


              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Quick Search
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle color theme"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              Premium AI Market Intelligence
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              A daily operating system for modern investors.
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
              Follow the market, research companies, and surface actionable insights from one refined workspace built for serious users.
            </p>
            <div className="mt-8 w-full flex flex-col items-center">
              <CompanySearchBar
                value={company}
                onChange={setCompany}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
              {history.length > 0 && !isLoading && !result && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <History className="h-4 w-4 text-zinc-400" />
                  {history.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCompany(item)}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isCommandOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-zinc-950/50 px-4 pt-24">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleCommandSubmit();
                  }
                }}
                placeholder="Search a company, sector, or market signal"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
              <Button size="sm" onClick={handleCommandSubmit}>
                Analyze
              </Button>
            </div>
            <p className="mt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">
              Press Enter to run a full research analysis or Esc to close.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <X className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Analysis Failed
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="py-12 flex justify-center w-full">
            <LoadingState
              currentStep={currentStep}
              completedSteps={completedSteps}
              companyName={company}
            />
          </div>
        )}

        {result && !isLoading && (
          <div ref={resultsRef} className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end">
              <Button
                onClick={() => downloadAnalysisReport(result)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                <ExecutiveSummaryCard executiveSummary={result.executiveSummary} />
                <OverviewCard profile={result.profile} />
                <FinancialCard financials={result.financials} />
                
                {/* AI Explanation immediately after Financial Analysis */}
                <ExplainabilitySection
                  reasoning={result.reasoning}
                  score={result.score}
                  verdict={result.verdict}
                />
                
                {/* Risk section immediately after AI explanation */}
                <RiskCard risks={result.risks} />
                
                {/* News section as the final section */}
                <NewsCard news={result.news} />
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-6">
                <ScoreCard score={result.score} />
                <VerdictCard
                  verdict={result.verdict}
                  confidence={result.confidence}
                  reasoning={result.reasoning}
                  risks={result.risks}
                  executiveSummary={result.executiveSummary}
                />
                
                {/* AI Investment Committee */}
                <CommitteeCard result={result} />
                
                {/* Competitor section below the verdict card */}
                <CompetitorComparisonCard
                  companyName={result.profile.companyName}
                  competitors={[
                    {
                      symbol: result.profile.symbol,
                      companyName: result.profile.companyName,
                      revenueGrowth: result.financials.revenueGrowth,
                      profitabilityScore: result.financials.profitabilityScore,
                      healthScore: result.financials.healthScore,
                      peRatio: result.financials.peRatio,
                      overallScore: result.score,
                      isCurrentCompany: true,
                    },
                    ...(result.competitors ?? []),
                  ]}
                />
              </div>
            </div>
          </div>
          
        )}

        {!isLoading && !result && !error && (
          <div className="space-y-8">
            <MarketDashboard />
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
              Enter a company name above to unlock the deeper AI company analysis experience.
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Market Intelligence Platform · For informational purposes only · Not financial advice
      </footer>
    </main>
  );
}
