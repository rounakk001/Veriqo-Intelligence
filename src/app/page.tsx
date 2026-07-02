"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { History, Keyboard, Search, TrendingUp, X } from "lucide-react";
import { CompanySearchBar } from "@/components/CompanySearchBar";
import { searchHistoryService } from "@/lib/services/searchHistory.service";
import { useAuthGate } from "@/lib/context/AuthGateContext";

import { ExecutiveSummaryCard } from "@/components/ExecutiveSummaryCard";
import { LoadingState, simulateLoadingSteps } from "@/components/LoadingState";
import { OverviewCard } from "@/components/OverviewCard";
import { FinancialCard } from "@/components/FinancialCard";
import { UserNav } from "@/components/UserNav";
import { NewsCard } from "@/components/NewsCard";
import { RiskCard } from "@/components/RiskCard";
import { ScoreCard } from "@/components/ScoreCard";
import { VerdictCard } from "@/components/VerdictCard";
import { CommitteeCard } from "@/components/CommitteeCard";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { MarketDashboard } from "@/components/MarketDashboard";
import { LandingHero, LandingFeatures, LandingWorkflow, LandingTrust, Footer } from "@/components/LandingPageSections";
import { Button } from "@/components/ui/button";
import type { AnalysisResult, LoadingStepId } from "@/types/agent";
import { CompetitorComparisonCard } from "@/components/CompetitorComparisonCard";
import { downloadInvestmentReport } from "@/lib/utils/pdf/generateReport";

import { Download } from "lucide-react";


const HISTORY_KEY = "investment-research-history";
const ANALYSIS_SNAPSHOT_KEY = "veriqo-analysis-snapshot";

export default function HomePage() {
  const { isAuthenticated, setIsAuthenticated, requireAuth } = useAuthGate();

  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    const syncHistory = async () => {
      if (!isAuthenticated) return;
      
      let localHistory: string[] = [];
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) localHistory = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }

      if (localHistory.length > 0) {
        // Merge local history to backend silently
        // Reverse so oldest is saved first, preserving chronological order
        for (const item of [...localHistory].reverse()) {
           await searchHistoryService.saveSearch(item);
        }
        localStorage.removeItem(HISTORY_KEY);
      }
      
      // Load the merged history
      try {
        const h = await searchHistoryService.fetchHistory();
        setHistory(h);
      } catch (err) {
        console.error(err);
      }
    };

    syncHistory();
  }, [isAuthenticated]);


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
      const updated = [name, ...prev.filter((h) => h.toLowerCase() !== name.toLowerCase())].slice(0, 10);
      
      if (isAuthenticated) {
        // Fire and forget: never block the UI or analysis
        searchHistoryService.saveSearch(name);
      } else {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      }
      
      return updated;
    });
  }, [isAuthenticated]);

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

  // Restore analysis snapshot after login redirect.
  // We watch `isAuthenticated` because after login the user navigates back
  // to this page — at that point pendingAction is already null (context was
  // reset during navigation), but sessionStorage still holds the snapshot.
  useEffect(() => {
    if (!isAuthenticated) return;          // only attempt when logged in
    const raw = sessionStorage.getItem(ANALYSIS_SNAPSHOT_KEY);
    if (!raw) return;
    try {
      const snapshot: { company: string; result: AnalysisResult } = JSON.parse(raw);
      sessionStorage.removeItem(ANALYSIS_SNAPSHOT_KEY);   // consume once
      setCompany(snapshot.company);
      setResult(snapshot.result);
      // Auto-trigger the download after state has been restored
      setTimeout(() => {
        downloadInvestmentReport(snapshot.result);
      }, 400);
    } catch {
      sessionStorage.removeItem(ANALYSIS_SNAPSHOT_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  function downloadAnalysisReport(res: AnalysisResult): void {
    if (!isAuthenticated) {
      // 1. Save snapshot BEFORE navigating away — this survives the redirect
      try {
        sessionStorage.setItem(ANALYSIS_SNAPSHOT_KEY, JSON.stringify({ company, result: res }));
      } catch { /* ignore quota errors */ }
      // 2. Store redirect target so login returns here, not to "/"
      requireAuth({ type: "download_report" });
    } else {
      downloadInvestmentReport(res);
    }
  }

  function scrollToSearch() {
    const section = document.getElementById("search-bar");
    section?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      document.getElementById("company-search-input")?.focus();
    }, 600);
  }

  function scrollToDashboard() {
    document.getElementById("market-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            VERIQO
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Quick Search
            </Button>
            <UserNav />
          </div>
        </div>
      </header>

      {(!result && !isLoading && !error) && (
        <LandingHero onStartResearch={scrollToSearch} onExploreDashboard={scrollToDashboard} />
      )}

      <section id="search-bar" className={`border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 transition-all ${result || isLoading ? "sticky top-[60px] z-20 py-4 shadow-sm" : "py-16"}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-full flex flex-col items-center">
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

      </div>

      {/* Market Dashboard — accessible via "Explore Dashboard" CTA */}
      {(!result && !isLoading && !error) && (
        <section id="market-dashboard" className="border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <MarketDashboard />
          </div>
        </section>
      )}

      {(!result && !isLoading && !error) && (
        <>
          <LandingFeatures />
          <LandingWorkflow />
          <LandingTrust onStartResearch={scrollToSearch} />
        </>
      )}

      <Footer />
    </main>
  );
}
