"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, RefreshCcw, Landmark, Trophy, BarChart2, Scale, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/types/agent";

interface CommitteeResult {
  bull: {
    rating: string;
    confidence: number;
    arguments: string[];
  };
  bear: {
    rating: string;
    confidence: number;
    arguments: string[];
  };
  moderator: {
    winner: string;
    summary: string;
    agreements: string[];
    disagreements: string[];
    finalOpinion: string;
  };
}

interface CommitteeModalProps {
  result: AnalysisResult;
  onClose: () => void;
}

const STAGED_STEPS = [
  { id: 1, pending: "Bull Analyst is preparing thesis...", done: "Bull thesis completed" },
  { id: 2, pending: "Bear Analyst is reviewing risks...", done: "Bear review completed" },
  { id: 3, pending: "Moderator is comparing both viewpoints...", done: "Committee decision ready" }
];

export function CommitteeModal({ result, onClose }: CommitteeModalProps) {
  const [data, setData] = useState<CommitteeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0); 

  const fetchCommittee = async () => {
    setError(null);
    setData(null);
    setLoadingStep(0);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= 5) {
        setLoadingStep(currentStep);
      }
    }, 2000);

    try {
      const res = await fetch("/api/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: result.profile,
          financials: result.financials,
          news: result.news,
          risks: result.risks,
          verdict: result.verdict
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch committee opinion");
      }

      const json = await res.json();
      
      clearInterval(interval);
      setLoadingStep(6);
      
      setTimeout(() => {
        setData(json);
      }, 500);
      
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCommittee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div 
        key="committee-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative flex max-h-[85vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl outline-none dark:bg-zinc-950 dark:border dark:border-zinc-800"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 shrink-0">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Landmark className="h-5 w-5 text-indigo-500" />
                AI Investment Committee
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Three independent AI analysts evaluate the investment before reaching a balanced conclusion.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 custom-scrollbar">
            {error && !data ? (
              <div className="flex flex-col items-center pt-8 pb-10 text-center space-y-4">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">Committee Review Failed</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-sm">
                  We encountered an issue while generating the AI committee report. Please try again.
                </p>
                <Button onClick={fetchCommittee} className="mt-4 gap-2">
                  <RefreshCcw className="h-4 w-4" /> Retry Committee
                </Button>
              </div>
            ) : !data ? (
              <div className="pt-6 pb-8 max-w-sm mx-auto space-y-6">
                {STAGED_STEPS.map((step, idx) => {
                  const stepIndex = idx * 2;
                  const isPending = loadingStep === stepIndex;
                  const isDone = loadingStep > stepIndex;
                  const opacity = isPending || isDone ? 1 : 0.4;
                  
                  return (
                    <motion.div 
                      key={`step-${step.id}-${idx}`} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity, x: 0 }}
                      className="flex items-center gap-4"
                    >
                      <div className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isPending ? (
                          <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDone ? "text-emerald-500" : isPending ? "text-zinc-900 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}`}>
                          {isDone ? step.done : step.pending}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                
                {/* Top Row: 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Bull Card */}
                  <div className="bg-zinc-50 dark:bg-[#111111] border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3 flex flex-col relative overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.03)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                        <div>
                          <h3 className="text-emerald-700 dark:text-emerald-500 font-bold text-xs">Bull Analyst</h3>
                          <p className="text-[9px] text-zinc-500">Optimistic</p>
                        </div>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {data.bull.rating}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-[9px] text-zinc-500 mb-0.5">Rating</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500 uppercase leading-none">{data.bull.rating}</div>
                      </div>
                      <div className="w-20">
                        <div className="flex justify-between text-[9px] text-zinc-500 dark:text-zinc-400 mb-1">
                          <span>Confidence</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{data.bull.confidence}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${data.bull.confidence}%` }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800/50 mb-2"></div>
                    
                    <ul className="space-y-1.5 flex-1">
                      {data.bull.arguments.slice(0, 3).map((arg, i) => (
                        <li key={`bull-arg-${i}`} className="flex gap-2 items-start">
                          <span className="flex items-center justify-center h-3.5 w-3.5 rounded-full border border-emerald-500/40 text-emerald-600 dark:text-emerald-500 text-[8px] shrink-0 mt-[1px] bg-emerald-500/10 font-bold">{i + 1}</span>
                          <span className="text-[10px] text-zinc-700 dark:text-zinc-300 leading-snug">{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bear Card */}
                  <div className="bg-zinc-50 dark:bg-[#111111] border border-red-200 dark:border-red-900/40 rounded-lg p-3 flex flex-col relative overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.03)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                        <div>
                          <h3 className="text-red-700 dark:text-red-500 font-bold text-xs">Bear Analyst</h3>
                          <p className="text-[9px] text-zinc-500">Conservative</p>
                        </div>
                      </div>
                      <div className="bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {data.bear.rating}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-[9px] text-zinc-500 mb-0.5">Rating</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-500 uppercase leading-none">{data.bear.rating}</div>
                      </div>
                      <div className="w-20">
                        <div className="flex justify-between text-[9px] text-zinc-500 dark:text-zinc-400 mb-1">
                          <span>Confidence</span>
                          <span className="text-red-600 dark:text-red-400 font-bold">{data.bear.confidence}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${data.bear.confidence}%` }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800/50 mb-2"></div>
                    
                    <ul className="space-y-1.5 flex-1">
                      {data.bear.arguments.slice(0, 3).map((arg, i) => (
                        <li key={`bear-arg-${i}`} className="flex gap-2 items-start">
                          <span className="flex items-center justify-center h-3.5 w-3.5 rounded-full border border-red-500/40 text-red-600 dark:text-red-500 text-[8px] shrink-0 mt-[1px] bg-red-500/10 font-bold">{i + 1}</span>
                          <span className="text-[10px] text-zinc-700 dark:text-zinc-300 leading-snug">{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Moderator Card */}
                  <div className="bg-zinc-50 dark:bg-[#111111] border border-indigo-200 dark:border-indigo-900/40 rounded-lg p-3 flex flex-col relative overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.03)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <h3 className="text-indigo-700 dark:text-indigo-400 font-bold text-xs">Moderator</h3>
                          <p className="text-[9px] text-zinc-500">Independent</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-[9px] text-zinc-500 mb-0.5">Final</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-none">{data.moderator.winner}</div>
                      </div>
                      <div className="w-20">
                        <div className="flex justify-between text-[9px] text-zinc-500 dark:text-zinc-400 mb-1">
                          <span>Confidence</span>
                          <span className="text-indigo-600 dark:text-indigo-300 font-bold">{result.confidence ?? 68}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${result.confidence ?? 68}%` }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800/50 mb-2"></div>
                    
                    <div className="flex-1 flex flex-col gap-2">
                      <div>
                        <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2 italic">
                          &quot;{data.moderator.summary}&quot;
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <ul className="space-y-1">
                          {data.moderator.agreements.slice(0, 2).map((arg, i) => (
                            <li key={`mod-agree-${i}`} className="flex gap-1 items-start">
                              <CheckCircle2 className="h-3 w-3 text-indigo-500 shrink-0 mt-[1px]" />
                              <span className="text-[9px] text-zinc-700 dark:text-zinc-400 leading-tight truncate">{arg}</span>
                            </li>
                          ))}
                        </ul>
                        <ul className="space-y-1">
                          {data.moderator.disagreements.slice(0, 2).map((arg, i) => (
                            <li key={`mod-disagree-${i}`} className="flex gap-1 items-start">
                              <XCircle className="h-3 w-3 text-red-500/80 shrink-0 mt-[1px]" />
                              <span className="text-[9px] text-zinc-700 dark:text-zinc-400 leading-tight truncate">{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Comparison Table */}
                <div className="border border-zinc-200 dark:border-zinc-800/60 rounded-lg overflow-hidden bg-white dark:bg-[#111111]">
                  <div className="bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-300">Side-by-Side Comparison</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] text-left whitespace-nowrap md:whitespace-normal">
                      <thead className="text-zinc-600 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0a0a0a]/50">
                        <tr>
                          <th className="px-3 py-1.5 font-medium w-[15%]">Factor</th>
                          <th className="px-3 py-1.5 font-medium text-center w-[28%]">Bull Analyst</th>
                          <th className="px-3 py-1.5 font-medium text-center w-[28%]">Bear Analyst</th>
                          <th className="px-3 py-1.5 font-medium text-center w-[28%]">Moderator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-400">Recommendation</td>
                          <td className="px-3 py-1.5 text-center font-bold text-emerald-600 dark:text-emerald-500 uppercase">{data.bull.rating}</td>
                          <td className="px-3 py-1.5 text-center font-bold text-red-600 dark:text-red-500 uppercase">{data.bear.rating}</td>
                          <td className="px-3 py-1.5 text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase">{data.moderator.winner}</td>
                        </tr>
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors bg-zinc-50/50 dark:bg-[#0a0a0a]/20">
                          <td className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-400">Confidence Level</td>
                          <td className="px-3 py-1.5 text-center text-emerald-600/80 dark:text-emerald-500/80">{data.bull.confidence}%</td>
                          <td className="px-3 py-1.5 text-center text-red-600/80 dark:text-red-500/80">{data.bear.confidence}%</td>
                          <td className="px-3 py-1.5 text-center text-indigo-600/80 dark:text-indigo-400/80">{result.confidence ?? 68}%</td>
                        </tr>
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-400">Investment Thesis</td>
                          <td className="px-3 py-1.5 text-center text-emerald-700/80 dark:text-emerald-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bull.arguments[0] || "Strong growth trajectory"}</td>
                          <td className="px-3 py-1.5 text-center text-red-700/80 dark:text-red-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bear.arguments[0] || "Overvalued with execution risks"}</td>
                          <td className="px-3 py-1.5 text-center text-indigo-700/80 dark:text-indigo-400/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.moderator.summary.split('.')[0] + "."}</td>
                        </tr>
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors bg-zinc-50/50 dark:bg-[#0a0a0a]/20">
                          <td className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-400">Key Strength</td>
                          <td className="px-3 py-1.5 text-center text-emerald-700/80 dark:text-emerald-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bull.arguments[1] || "Financial strength"}</td>
                          <td className="px-3 py-1.5 text-center text-red-700/80 dark:text-red-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bear.arguments[1] || "Risk identification"}</td>
                          <td className="px-3 py-1.5 text-center text-indigo-700/80 dark:text-indigo-400/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.moderator.agreements[0] || "Objective analysis"}</td>
                        </tr>
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-400">Primary Concern</td>
                          <td className="px-3 py-1.5 text-center text-emerald-700/80 dark:text-emerald-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bull.arguments[2] || "Short-term volatility"}</td>
                          <td className="px-3 py-1.5 text-center text-red-700/80 dark:text-red-500/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.bear.arguments[2] || "Valuation & competition"}</td>
                          <td className="px-3 py-1.5 text-center text-indigo-700/80 dark:text-indigo-400/80 truncate max-w-[120px] md:max-w-none md:whitespace-normal">{data.moderator.disagreements[0] || "Execution uncertainty"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Decision Panel */}
                <div className="border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 rounded-lg p-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 relative overflow-hidden">
                  <div className="absolute top-1/2 left-12 -translate-y-1/2 w-32 h-32 bg-amber-500/10 blur-[40px] pointer-events-none hidden dark:block"></div>
                  
                  <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.15)] z-10">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-[100px] z-10 border-b sm:border-b-0 sm:border-r border-amber-200 dark:border-amber-500/20 pb-2 sm:pb-0 sm:pr-4 w-full sm:w-auto">
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-500/80 uppercase tracking-wider font-semibold mb-0.5">Decision</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400 uppercase leading-none">{data.moderator.winner}</span>
                    <span className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-1">Recommended Action</span>
                  </div>
                  
                  <div className="flex-1 text-[11px] text-zinc-700 dark:text-zinc-300 z-10 leading-relaxed text-center sm:text-left">
                    {data.moderator.finalOpinion}
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Custom Scrollbar Styles for the Modal */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(150, 150, 150, 0.5);
        }
      `}} />
    </AnimatePresence>,
    document.body
  );
}
