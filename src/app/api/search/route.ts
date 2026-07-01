import { NextRequest, NextResponse } from "next/server";
import { exchangeRank } from "@/lib/config/financialConstants";

/**
 * Root cause: FMP deprecated all /api/v3/search* endpoints as of August 2025.
 * The new stable endpoints are:
 *   /stable/search-symbol  — matches by ticker symbol (e.g. "MSFT", "TCS")
 *   /stable/search-name    — matches by company name (e.g. "apple", "hdfc bank")
 *
 * We call BOTH in parallel and merge/deduplicate results, then rank by exchange
 * liquidity so the primary listing always surfaces first (e.g. AAPL before AAPL.DE).
 */

const FMP_BASE   = "https://financialmodelingprep.com/stable";
const MAX_QUERY  = 60;
const FETCH_LIMIT = 8;   // per endpoint
const RETURN_LIMIT = 8;  // final merged result
const TIMEOUT_MS  = 6000;

export interface SearchSuggestion {
  symbol:   string;
  name:     string;
  exchange: string;
  currency: string;
  isBestMatch?: boolean;
}

// Shape a raw FMP stable result into our lean SearchSuggestion
function shape(item: Record<string, unknown>): SearchSuggestion | null {
  const symbol = typeof item.symbol === "string" ? item.symbol.trim() : null;
  const name   = typeof item.name   === "string" ? item.name.trim()   : null;
  if (!symbol || !name) return null;
  return {
    symbol,
    name,
    exchange: typeof item.exchange === "string" ? item.exchange.trim() : "Unknown",
    currency: typeof item.currency === "string" ? item.currency.trim() : "USD",
  };
}

async function fmpSearch(
  endpoint: "search-symbol" | "search-name",
  query: string,
  apiKey: string
): Promise<SearchSuggestion[]> {
  const url = new URL(`${FMP_BASE}/${endpoint}`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(FETCH_LIMIT));
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return [];

  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) return [];

  return (raw as Record<string, unknown>[])
    .map(shape)
    .filter((s): s is SearchSuggestion => s !== null);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.FMP_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Search service unavailable." }, { status: 503 });
  }

  // ── Input validation ──────────────────────────────────────────────────────
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) return NextResponse.json([] as SearchSuggestion[]);

  if (q.length > MAX_QUERY) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  // Reject obviously malformed input
  if (!/^[\w\s.\-&',()]+$/i.test(q)) {
    return NextResponse.json([] as SearchSuggestion[]);
  }

  // ── Parallel fetch both endpoints ─────────────────────────────────────────
  // symbol search: handles "MSFT", "NVDA", "TCS.NS"
  // name search:   handles "apple", "hdfc bank", "vodafone idea"
  let symbolResults: SearchSuggestion[] = [];
  let nameResults:   SearchSuggestion[] = [];

  try {
    [symbolResults, nameResults] = await Promise.all([
      fmpSearch("search-symbol", q, apiKey),
      fmpSearch("search-name",   q, apiKey),
    ]);
  } catch {
    // Both timed out or network error — return empty gracefully
    return NextResponse.json([] as SearchSuggestion[]);
  }

  // ── Merge, deduplicate by symbol, and SCORE ──────────────
  const seen = new Set<string>();
  const merged: (SearchSuggestion & { _score: number })[] = [];

  const combined = [...symbolResults, ...nameResults];
  const qLower = q.toLowerCase();

  for (const item of combined) {
    if (!seen.has(item.symbol)) {
      seen.add(item.symbol);
      
      const nameLower = item.name.toLowerCase();
      const symbolLower = item.symbol.toLowerCase();
      
      let textScore = 0;
      
      // 1. Exact matches (highest priority)
      if (symbolLower === qLower || nameLower === qLower) {
        textScore = 10000;
      }
      // 2. Starts with matches
      else if (symbolLower.startsWith(qLower) || nameLower.startsWith(qLower)) {
        textScore = 5000;
      }
      // 3. Contains matches
      else if (nameLower.includes(qLower) || symbolLower.includes(qLower)) {
        textScore = 1000;
      }

      // Base liquidity points (0-99). A rank 1 exchange gives 99 points.
      // Rank 90 (OTC) gives 10 points. Rank 99 (Unknown) gives 1 point.
      const liquidityPoints = 100 - exchangeRank(item.exchange);
      
      merged.push({
        ...item,
        _score: textScore + liquidityPoints,
      });
    }
  }

  // Sort by highest score first
  merged.sort((a, b) => b._score - a._score);

  const results: SearchSuggestion[] = merged.slice(0, RETURN_LIMIT).map((r, i) => ({
    symbol: r.symbol,
    name: r.name,
    exchange: r.exchange,
    currency: r.currency,
    isBestMatch: i === 0 && r._score >= 1000,
  }));
  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
