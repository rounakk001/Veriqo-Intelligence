/**
 * EXCHANGE LIQUIDITY RANKING
 *
 * Used by resolveCompanySymbol and /api/search to prefer major, liquid exchanges
 * over OTC / pink sheet markets when multiple matches exist for the same query.
 *
 * Rules:
 *  - Lower rank number = more preferred.
 *  - Ranks are purely based on exchange tier / liquidity, NOT on geography or sector.
 *  - OTC / pink sheet / unknown exchanges get the highest (worst) rank.
 *  - No company, country, or sector is hardcoded here.
 *
 * Keys include names from both Yahoo Finance (`exchDisp`) and FMP (`exchange`).
 * Lookup is case-insensitive — see exchangeRank().
 */
const EXCHANGE_RANK_RAW: Record<string, number> = {
  // US Tier 1  (Yahoo names + FMP names)
  "NasdaqGS":          1,
  "NYSE":              1,
  "Nasdaq":            1,
  "NASDAQ":            1,  // FMP name
  "NasdaqCM":          2,
  "NYSE American":     2,
  "CBOE":              2,
  "AMEX":              2,  // FMP name

  // Major International  (Yahoo names + FMP names)
  "NSE":               3,
  "BSE":               3,
  "Bombay":            3,
  "Tokyo":             3,
  "JPX":               3,  // FMP name
  "TSE":               3,  // FMP name
  "London":            3,
  "LSE":               3,  // FMP name
  "Hong Kong":         3,
  "HKSE":              3,  // FMP name
  "Shanghai":          3,
  "SHH":               3,  // FMP name
  "Shenzhen":          3,
  "SHZ":               3,  // FMP name
  "Toronto":           3,
  "TSX":               3,  // FMP name
  "Frankfurt":         3,
  "Paris":             3,
  "Amsterdam":         3,
  "Zurich":            3,
  "SIX":               3,  // FMP name
  "Sydney":            3,
  "ASX":               3,  // FMP name
  "Singapore":         3,
  "SGX":               3,  // FMP name
  "Seoul":             3,
  "KSC":               3,  // FMP name
  "KOSDAQ":            3,  // FMP name
  "Taiwan":            3,
  "TWSE":              3,  // FMP name

  // International Secondary
  "XETRA":             4,  // FMP name — German electronic exchange
  "FSX":               4,  // FMP name — Frankfurt secondary
  "NEO":               4,  // FMP name — Canadian alternative
  "MIL":               4,  // FMP name — Milan
  "BRU":               4,  // FMP name — Brussels
  "Kuala Lumpur Stock Exchange": 4,
  "Taipei":            4,

  // US Secondary / Regional
  "NYSE ARCA":         5,
  "BATS":              5,

  // OTC / Pink Sheet (always lowest priority)
  "OTC Markets":       90,
  "OTC Markets OTCID": 90,
  "OTC Bulletin Board": 90,
  "Pink Sheets":       90,
  "OID":               90,
  "OTC":               90,  // FMP name

  // Crypto (lowest)
  "CCC":               95,  // Yahoo crypto
  "CRYPTO":            95,  // FMP crypto
};

// Build a case-insensitive lookup map at module load time
const EXCHANGE_RANK_NORMALIZED = new Map<string, number>();
for (const [key, rank] of Object.entries(EXCHANGE_RANK_RAW)) {
  EXCHANGE_RANK_NORMALIZED.set(key.toLowerCase(), rank);
}

// Keep the old named export for backward compatibility with any imports
export const EXCHANGE_RANK = EXCHANGE_RANK_RAW;

export function exchangeRank(exchDisp: string | null | undefined): number {
  if (!exchDisp) return 99;
  return EXCHANGE_RANK_NORMALIZED.get(exchDisp.toLowerCase()) ?? 50;
}

/**
 * DATA QUALITY THRESHOLDS
 *
 * These represent the minimum market-cap and the minimum number of critical
 * financial fields required for the engine to produce a meaningful analysis.
 *
 * Companies below these thresholds receive a "Limited Data" flag in FinancialMetrics.
 * The flag does NOT prevent analysis — it surfaces a disclosure to the user.
 *
 * No company, country, or sector is hardcoded here.
 * Thresholds are based purely on financial data availability and market size.
 */

/** Market cap below this value indicates a micro/nano-cap where Yahoo data is often unreliable. */
export const MIN_RELIABLE_MARKET_CAP = 10_000_000; // $10M USD equivalent

/** Minimum number of the 6 critical financial fields that must be non-null. */
export const MIN_CRITICAL_FIELDS = 4;

/**
 * List of critical fields checked against FinancialMetrics.
 * If fewer than MIN_CRITICAL_FIELDS are present (non-null, non-zero), data is flagged as limited.
 */
export const CRITICAL_FINANCIAL_FIELDS = [
  "revenue",
  "operatingCashFlow",
  "netMargin",
  "returnOnEquity",
  "grossMargin",
  "marketCap",
] as const;
