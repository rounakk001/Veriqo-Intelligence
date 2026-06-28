"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { LOADING_STEPS, type LoadingStepId } from "@/types/agent";

interface LoadingStateProps {
  currentStep: LoadingStepId | null;
  completedSteps: LoadingStepId[];
}

export function LoadingState({ currentStep, completedSteps }: LoadingStateProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-center text-sm font-medium text-zinc-500">
        Running AI Investment Analysis
      </h3>
      <ul className="space-y-3">
        {LOADING_STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                isComplete && "text-emerald-600 dark:text-emerald-400",
                isCurrent && !isComplete && "text-zinc-900 dark:text-zinc-100",
                !isComplete && !isCurrent && "text-zinc-400"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600" />
              )}
              {step.label}
            </li>
          );
        })}
      </ul>
    </div>
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
