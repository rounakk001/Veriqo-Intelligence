"use client";

import { Check, Loader2, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { LOADING_STEPS, type LoadingStepId } from "@/types/agent";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  currentStep: LoadingStepId | null;
  completedSteps: LoadingStepId[];
  companyName?: string;
}

const LIVE_STATUSES = [
  "Analyzing quarterly financial statements...",
  "Evaluating revenue trends...",
  "Calculating profitability...",
  "Scanning market news...",
  "Assessing business risks...",
  "Comparing industry peers...",
  "Computing investment score...",
  "Preparing executive summary...",
  "Generating recommendation...",
];

export function LoadingState({ currentStep, completedSteps, companyName }: LoadingStateProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  const FUN_FACTS = [
    "Free cash flow often matters more than reported earnings.",
    "Companies with strong balance sheets generally perform better during downturns.",
    "High ROE should always be evaluated alongside debt.",
    "Consistent operating cash flow is a strong indicator of business quality.",
    "Revenue growth without profitability may not be sustainable."
  ];

  // Rotate statuses every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LIVE_STATUSES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Rotate facts every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [FUN_FACTS.length]);

  const isAlmostDone = completedSteps.length >= LOADING_STEPS.length - 2;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-200/20 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-800"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          <BrainCircuit className="h-7 w-7 text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-100">
          AI Investment Analysis in Progress
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Our multi-agent system is researching {companyName ? `${companyName.toUpperCase()} ` : "the company "}using financial data, market news, risk models and AI reasoning.
        </p>
      </div>

      {/* Progress Bar & ETA */}
      <div className="mb-8 w-full">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>Progress</span>
          <span>
            <AnimatePresence mode="wait">
              <motion.span
                key={isAlmostDone ? "almost" : "eta"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isAlmostDone ? "Almost finished..." : "Estimated completion: 15–30 seconds"}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 shadow-inner">
          <motion.div 
            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(5, (completedSteps.length / LOADING_STEPS.length) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Timeline */}
      <ul className="mb-8 space-y-4 px-2">
        {LOADING_STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <motion.li
              key={step.id}
              initial={false}
              animate={{ opacity: isComplete || isCurrent ? 1 : 0.4 }}
              className="flex items-center gap-4 text-sm"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/50"
                  >
                    <Check className="h-3 w-3 font-bold" />
                  </motion.div>
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
                )}
              </div>
              <span className={cn(
                "transition-colors duration-300",
                isComplete ? "text-zinc-300" : isCurrent ? "text-emerald-400 font-medium tracking-wide" : "text-zinc-600"
              )}>
                {step.label}
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* Live Status */}
      <div className="mb-6 flex min-h-[3rem] items-center justify-center overflow-hidden border-y border-zinc-800/50 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={statusIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-center text-sm font-medium italic text-zinc-400"
          >
            {LIVE_STATUSES[statusIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fun Facts & ETA */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-3 min-h-[3rem] w-full px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={factIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs leading-relaxed text-zinc-500"
            >
              <span className="font-semibold text-zinc-400">Insight:</span> {FUN_FACTS[factIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="rounded-full bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-500/80 ring-1 ring-emerald-900/50">
          {isAlmostDone ? "Almost finished..." : "Estimated completion: 15–30 seconds"}
        </p>
      </div>
    </motion.div>
  );
}

export function simulateLoadingSteps(
  onStepChange: (step: LoadingStepId | null, completed: LoadingStepId[]) => void
): () => void {
  const steps = LOADING_STEPS.map((s) => s.id);
  let index = 0;
  const completed: LoadingStepId[] = [];

  onStepChange(steps[0], completed);

  const interval = setInterval(() => {
    if (index < steps.length) {
      completed.push(steps[index]);
      index++;
      const next = index < steps.length ? steps[index] : null;
      onStepChange(next, [...completed]);
    }
  }, 1200);

  return () => clearInterval(interval);
}
