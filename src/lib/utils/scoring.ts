import type { FinancialMetrics } from "@/types/agent";

export const SCORING_WEIGHTS = {
  financialHealth: 20,
  profitability: 20,
  growth: 20,
  valuation: 15,
  newsSentiment: 10,
  risk: 15,
} as const;

export function invertRiskScore(riskScore: number): number {
  return Math.max(0, 100 - riskScore);
}

export function scoreValuation(pe: number | null, peg: number | null, pb: number | null): number {
  let score = 50;
  let dataPoints = 0;

  if (pe != null) {
    if (pe < 0) score += 0;
    else if (pe < 15) score += 30;
    else if (pe < 25) score += 15;
    else if (pe < 40) score -= 5;
    else if (pe < 80) score -= 20;
    else score -= 30;
    dataPoints++;
  }

  if (peg != null) {
    if (peg > 0 && peg < 1) score += 20;
    else if (peg < 2) score += 5;
    else score -= 15;
    dataPoints++;
  }

  if (pb != null) {
    if (pb > 0 && pb < 2) score += 15;
    else if (pb < 5) score += 5;
    else score -= 10;
    dataPoints++;
  }

  if (dataPoints === 0) return 50;
  return Math.min(100, Math.max(0, score));
}

export function calculateBaseFinancialScore(financials: FinancialMetrics): number {
  const financialHealthComponent = (financials.healthScore / 100) * SCORING_WEIGHTS.financialHealth;
  const profitabilityComponent = (financials.profitabilityScore / 100) * SCORING_WEIGHTS.profitability;
  const growthComponent = (financials.growthScore / 100) * SCORING_WEIGHTS.growth;
  
  const valuationScore = scoreValuation(
    financials.peRatio ?? null,
    financials.pegRatio ?? null,
    financials.priceToBook ?? null
  );
  
  const valuationComponent = (valuationScore / 100) * SCORING_WEIGHTS.valuation;

  // The base financial score alone represents 75 points (20 + 20 + 20 + 15).
  // We normalize this back to a 100-point scale for fair comparison (e.g. competitors).
  const rawSum = financialHealthComponent + profitabilityComponent + growthComponent + valuationComponent;
  return Math.round((rawSum / 75) * 100);
}

export function calculateCompositeInvestmentScore(
  financials: FinancialMetrics,
  sentimentScore: number,
  riskScore: number
): number {
  const baseScoreOutOf100 = calculateBaseFinancialScore(financials);
  const financialComponent = (baseScoreOutOf100 / 100) * 75; // Map back to 75 total points
  
  const sentimentComponent = (sentimentScore / 100) * SCORING_WEIGHTS.newsSentiment;
  const riskComponent = (invertRiskScore(riskScore) / 100) * SCORING_WEIGHTS.risk;

  return Math.round(financialComponent + sentimentComponent + riskComponent);
}
