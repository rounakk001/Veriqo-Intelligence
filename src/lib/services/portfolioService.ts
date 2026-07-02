import YahooFinance from "yahoo-finance2";
import { getCurrentUser } from "@/lib/services/serverAuth";
import type { LiveHolding, PortfolioHolding, PortfolioSummary, UserPortfolio } from "@/types/portfolio";
import { cookies } from "next/headers";

// ── Yahoo Finance instance (unchanged) ────────────────────────────────────────
const yahooFinance = new YahooFinance({
    suppressNotices: ["yahooSurvey"],
    validation: { logErrors: false },
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api/v1";

// ── Formatting helpers (unchanged) ────────────────────────────────────────────
function formatCurrency(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
}

function formatPercent(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

// ── Yahoo Finance live quote (unchanged) ──────────────────────────────────────
async function fetchLiveQuote(symbol: string) {
    const startedAt = Date.now();

    try {
        const [quote, summary] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.quoteSummary(symbol, {
                modules: ["assetProfile"],
            }),
        ]);

        console.info("[portfolio-data]", {
            provider: "Yahoo Finance",
            endpoint: `quote:${symbol}`,
            status: 200,
            responseTimeMs: Date.now() - startedAt,
        });

        return {
            symbol,
            name: quote.shortName ?? quote.longName ?? symbol,

            sector:
                summary.assetProfile?.sector ??
                summary.assetProfile?.industry ??
                "Unknown",

            price:
                typeof quote.regularMarketPrice === "number"
                    ? quote.regularMarketPrice
                    : null,

            changePercent:
                typeof quote.regularMarketChangePercent === "number"
                    ? quote.regularMarketChangePercent
                    : null,
        };
    } catch (error) {
        console.error("[portfolio-data]", {
            provider: "Yahoo Finance",
            endpoint: `quote:${symbol}`,
            status: "error",
            responseTimeMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
        });

        return {
            symbol,
            name: symbol,
            sector: "Unknown",
            price: null,
            changePercent: null,
        };
    }
}

// ── Build live holdings (unchanged) ──────────────────────────────────────────
async function buildLiveHoldings(portfolio: UserPortfolio): Promise<LiveHolding[]> {
    const quotes = await Promise.all(portfolio.holdings.map((holding) => fetchLiveQuote(holding.symbol)));

    return portfolio.holdings.map((holding, index) => {
        const quote = quotes[index];
        const value = quote.price !== null ? quote.price * holding.shares : null;

        return {
            symbol: holding.symbol,

            name: quote.name,

            sector: quote.sector,

            price: quote.price,

            changePercent: quote.changePercent,

            shares: holding.shares,

            value,

            note:
                quote.price !== null
                    ? `Price ${formatCurrency(quote.price)} • ${formatPercent(quote.changePercent)}`
                    : "Price unavailable",
        };
    });
}

// ── Build stats (unchanged) ───────────────────────────────────────────────────
function buildStats(holdings: LiveHolding[], riskLabel: string) {
    const validHoldings = holdings.filter((holding) => holding.value !== null && holding.price !== null);
    const totalValue = validHoldings.reduce((sum, holding) => sum + (holding.value ?? 0), 0);

    let dayChangeValue = 0;
    for (const holding of validHoldings) {
        if (holding.price !== null && holding.changePercent !== null && holding.value !== null) {
            dayChangeValue += holding.value * (holding.changePercent / 100);
        }
    }

    const dayChangePercent = totalValue > 0 ? (dayChangeValue / totalValue) * 100 : 0;

    const sectorCounts = validHoldings.reduce<Record<string, number>>((counts, holding) => {
        counts[holding.sector] = (counts[holding.sector] ?? 0) + 1;
        return counts;
    }, {});

    const topSector =
        Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Not set";

    return {
        totalValue: formatCurrency(totalValue),
        dayChange: formatPercent(dayChangePercent),
        dayChangeValue: dayChangePercent,
        diversification: holdings.length ? `${holdings.length} names` : "No holdings",
        topSector,
        risk: riskLabel,
    };
}

// ── Express API helpers ───────────────────────────────────────────────────────

/**
 * Builds the Cookie header string from Next.js cookie store for server-side
 * fetch calls to the Express backend.
 */
async function getAuthCookieHeader(): Promise<string> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    return accessToken ? `accessToken=${accessToken}` : "";
}

/**
 * Raw Express portfolio holding shape returned from MongoDB.
 */
interface ExpressHolding {
    _id: string;
    symbol: string;
    shares: number;
    purchaseDate?: string;
    updatedAt?: string;
}

/**
 * Fetches the raw portfolio from the Express backend and maps it to the
 * internal UserPortfolio shape used by buildLiveHoldings / buildStats.
 *
 * featuredSymbol is not stored by Express; we default to the first holding.
 */
async function fetchExpressPortfolio(cookieHeader: string): Promise<UserPortfolio> {
    const response = await fetch(`${BACKEND_URL}/portfolio`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        // Return an empty portfolio on error rather than crashing.
        return { userId: "", featuredSymbol: null, holdings: [], updatedAt: new Date().toISOString() };
    }

    const json = await response.json();
    // Express wraps in ApiResponse: { statusCode, data: { holdings: [...] }, message }
    const raw = json.data ?? json;
    const expressHoldings: ExpressHolding[] = Array.isArray(raw.holdings) ? raw.holdings : [];

    const holdings: PortfolioHolding[] = expressHoldings.map((h) => ({
        symbol: h.symbol,
        shares: h.shares,
        addedAt: h.purchaseDate ?? h.updatedAt ?? new Date().toISOString(),
        // Preserve the MongoDB _id so we can use it for PATCH / DELETE
        _id: h._id,
    } as PortfolioHolding & { _id: string }));

    return {
        userId: raw.userId ?? "",
        featuredSymbol: raw.featuredSymbol ?? holdings[0]?.symbol ?? null,
        holdings,
        updatedAt: raw.updatedAt ?? new Date().toISOString(),
    };
}

// ── Public API (signatures unchanged) ─────────────────────────────────────────

export async function getPortfolioSummary(riskLabel = "Risk-aware"): Promise<PortfolioSummary> {
    const user = await getCurrentUser();
    if (!user) {
        return {
            authenticated: false,
            user: null,
            featuredSymbol: null,
            featured: null,
            holdings: [],
            stats: {
                totalValue: "—",
                dayChange: "—",
                dayChangeValue: 0,
                diversification: "Sign in to build",
                topSector: "—",
                risk: riskLabel,
            },
        };
    }

    const cookieHeader = await getAuthCookieHeader();
    const portfolio = await fetchExpressPortfolio(cookieHeader);
    const holdings = await buildLiveHoldings(portfolio);
    const featuredSymbol = portfolio.featuredSymbol ?? holdings[0]?.symbol ?? null;
    const featuredHolding = featuredSymbol ? holdings.find((holding) => holding.symbol === featuredSymbol) : null;

    return {
        authenticated: true,
        user,
        featuredSymbol,
        featured: featuredHolding
            ? {
                symbol: featuredHolding.symbol,
                name: featuredHolding.name,
                price: formatCurrency(featuredHolding.price),
                change: formatPercent(featuredHolding.changePercent),
            }
            : null,
        holdings,
        stats: buildStats(holdings, riskLabel),
    };
}

export async function addPortfolioHolding(symbol: string, shares: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Authentication required.");

    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) throw new Error("Symbol is required.");

    // Validate the symbol exists on Yahoo Finance before sending to Express.
    const quote = await fetchLiveQuote(normalizedSymbol);
    if (quote.price === null) throw new Error(`Could not find live quote for ${normalizedSymbol}.`);

    const cookieHeader = await getAuthCookieHeader();

    const response = await fetch(`${BACKEND_URL}/portfolio`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
        },
        body: JSON.stringify({ symbol: normalizedSymbol, shares }),
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message ?? "Unable to add holding.");
    }

    return getPortfolioSummary();
}

export async function removePortfolioHolding(symbol: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Authentication required.");

    const cookieHeader = await getAuthCookieHeader();

    // First fetch the portfolio to find the MongoDB _id of the holding.
    const portfolio = await fetchExpressPortfolio(cookieHeader);
    const holdingWithId = (portfolio.holdings as Array<PortfolioHolding & { _id?: string }>).find(
        (h) => h.symbol === symbol.toUpperCase()
    );

    if (!holdingWithId?._id) {
        throw new Error(`Holding ${symbol} not found in portfolio.`);
    }

    const response = await fetch(`${BACKEND_URL}/portfolio/${holdingWithId._id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
        },
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message ?? "Unable to remove holding.");
    }

    return getPortfolioSummary();
}

export async function setFeaturedSymbol(symbol: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Authentication required.");

    const cookieHeader = await getAuthCookieHeader();
    const portfolio = await fetchExpressPortfolio(cookieHeader);

    const normalizedSymbol = symbol.trim().toUpperCase();
    const exists = portfolio.holdings.some((h) => h.symbol === normalizedSymbol);
    if (!exists) throw new Error("Add the symbol to your portfolio before setting it as your choice.");

    // Express has no featuredSymbol field. We store the preference in memory
    // for this request cycle and reflect it in the summary response.
    // The UI's "My Choice" state is managed client-side in portfolio/page.tsx.
    // A future migration can persist this via a PATCH endpoint.
    const summaryWithFeature = await getPortfolioSummary();
    summaryWithFeature.featuredSymbol = normalizedSymbol;
    summaryWithFeature.featured = (() => {
        const h = summaryWithFeature.holdings.find((h) => h.symbol === normalizedSymbol);
        if (!h) return null;
        return {
            symbol: h.symbol,
            name: h.name,
            price: formatCurrency(h.price),
            change: formatPercent(h.changePercent),
        };
    })();

    return summaryWithFeature;
}
