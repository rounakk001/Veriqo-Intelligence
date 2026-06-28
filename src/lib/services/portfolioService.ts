import YahooFinance from "yahoo-finance2";
import { getCurrentUser } from "@/lib/services/authService";
import { getPortfolio, savePortfolio } from "@/lib/services/userStore";
import type { LiveHolding, PortfolioSummary, UserPortfolio } from "@/types/portfolio";

const yahooFinance = new YahooFinance({
    suppressNotices: ["yahooSurvey"],
    validation: { logErrors: false },
});

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

    const portfolio = await getPortfolio(user.id);
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

    const quote = await fetchLiveQuote(normalizedSymbol);
    if (quote.price === null) throw new Error(`Could not find live quote for ${normalizedSymbol}.`);

    const portfolio = await getPortfolio(user.id);
    const existing = portfolio.holdings.find((holding) => holding.symbol === normalizedSymbol);

    if (existing) {
        existing.shares += shares;
    } else {
        portfolio.holdings.push({
            symbol: normalizedSymbol,
            shares,
            addedAt: new Date().toISOString(),
        });
    }

    if (!portfolio.featuredSymbol) {
        portfolio.featuredSymbol = normalizedSymbol;
    }

    portfolio.updatedAt = new Date().toISOString();
    await savePortfolio(portfolio);
    return getPortfolioSummary();
}

export async function removePortfolioHolding(symbol: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Authentication required.");

    const portfolio = await getPortfolio(user.id);
    portfolio.holdings = portfolio.holdings.filter((holding) => holding.symbol !== symbol.toUpperCase());
    if (portfolio.featuredSymbol === symbol.toUpperCase()) {
        portfolio.featuredSymbol = portfolio.holdings[0]?.symbol ?? null;
    }
    portfolio.updatedAt = new Date().toISOString();
    await savePortfolio(portfolio);
    return getPortfolioSummary();
}

export async function setFeaturedSymbol(symbol: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Authentication required.");

    const normalizedSymbol = symbol.trim().toUpperCase();
    const portfolio = await getPortfolio(user.id);
    const exists = portfolio.holdings.some((holding) => holding.symbol === normalizedSymbol);
    if (!exists) throw new Error("Add the symbol to your portfolio before setting it as your choice.");

    portfolio.featuredSymbol = normalizedSymbol;
    portfolio.updatedAt = new Date().toISOString();
    await savePortfolio(portfolio);
    return getPortfolioSummary();
}

