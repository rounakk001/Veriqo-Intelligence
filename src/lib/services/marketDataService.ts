import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import { API } from "@/lib/config/api";


const yahooFinance = new YahooFinance({
    suppressNotices: ["yahooSurvey"],
    validation: { logErrors: false },
});

export interface MarketPoint {
    price: number;
    timestamp: number;
}

export interface MarketWidgetItem {
    name: string;
    value: string;
    change: string;
    changeValue: number;
    status: string;
    sparkline: number[];
    lastUpdated: string;
    symbol: string;
}

export interface MarketDashboardData {
    globalMarkets: MarketWidgetItem[];
    indianMarkets: MarketWidgetItem[];
    movers: Array<{
        ticker: string;
        name: string;
        price: string;
        change: string;
        changeValue: number;
        volume: string;
        sparkline: number[];
        lastUpdated: string;
        category: "gainer" | "loser" | "active";
    }>;
    sectors: Array<{
        name: string;
        daily: string;
        weekly: string;
        monthly: string;
        strength: string;
        sentiment: string;
        leader:{
            symbol:string;
            name:string;
        };
        lastUpdated: string;
    }>;
    commodities: MarketWidgetItem[];
    currencies: MarketWidgetItem[];
    crypto: Array<{
        name: string;
        price: string;
        change: string;
        changeValue: number;
        cap: string;
        volume: string;
        sparkline: number[];
        lastUpdated: string;
    }>;
    insights: Array<{ title: string; content: string }>;
    indicators: Array<{ label: string; value: string; detail: string }>;
    fearGreed: {
        value: number;
        classification: string;
        updatedAt: string;
        volatility: string;
        momentum: string;
        safeHavenDemand: string;
        riskAppetite: string;
    };
    events: Array<{ title: string; detail: string; kind: string }>;
    spotlight: {
        companyOfDay: { ticker: string; name: string } | null;
        undervaluedPick: { ticker: string; name: string } | null;
    };
    trending: Array<{ symbol: string; name: string; note: string }>;
    providers: Array<{ name: string; status: string; detail: string }>;
    lastUpdated: string;
}

const DEFAULT_REVALIDATE = 60;

type ProviderHealthStats = {
    attempts: number;
    successes: number;
};

function createProviderStats(): Record<string, ProviderHealthStats> {
    return {
        "Yahoo Finance": { attempts: 0, successes: 0 },
        "Twelve Data": { attempts: 0, successes: 0 },
        Finnhub: { attempts: 0, successes: 0 },
        CoinGecko: { attempts: 0, successes: 0 },
        "Alternative.me": { attempts: 0, successes: 0 },
    };
}

function recordProviderAttempt(stats: Record<string, ProviderHealthStats>, provider: string, success: boolean) {
    if (!stats[provider]) {
        stats[provider] = { attempts: 0, successes: 0 };
    }
    stats[provider].attempts += 1;
    if (success) {
        stats[provider].successes += 1;
    }
}

function resolveProviderStatus(stats: Record<string, ProviderHealthStats>, provider: string, configured = true): string {
    if (!configured) return "Offline";

    const entry = stats[provider];
    if (!entry || entry.attempts === 0) return "Offline";
    if (entry.successes === 0) return "Offline";
    if (entry.successes === entry.attempts) return "Healthy";
    if (entry.successes / entry.attempts >= 0.5) return "Degraded";
    return "Offline";
}

function formatNumber(value: number | null | undefined, currency = false) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    if (currency) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: value >= 100 ? 0 : 2,
        }).format(value);
    }
    if (Math.abs(value) >= 1000) {
        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: value >= 1000000 ? 0 : 2,
        }).format(value);
    }
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

function formatCompact(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return formatNumber(value);
}

function toSparkline(points: MarketPoint[] | number[] | null | undefined): number[] {
    if (!points || points.length < 2) return [];

    const values =
        typeof points[0] === "number"
            ? (points as number[]).filter((value) => Number.isFinite(value))
            : (points as MarketPoint[])
                  .map((point) => point.price)
                  .filter((value) => Number.isFinite(value));

    if (values.length < 2) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((value) => ((value - min) / range) * 100);
}

function normalizeMarketState(state?: string | null) {
    if (!state) return "Closed";
    const normalized = state.toUpperCase();
    if (normalized.includes("PRE")) return "Pre-Market";
    if (normalized.includes("POST")) return "After Hours";
    if (normalized.includes("REG")) return "Open";
    return normalized.replace(/_/g, " ");
}

function logExternalCall(provider: string, endpoint: string, status: number | string, durationMs: number, error?: unknown) {
    const payload: Record<string, unknown> = {
        provider,
        endpoint,
        status,
        responseTimeMs: durationMs,
    };

    if (error) {
        payload.error = error instanceof Error ? error.message : String(error);
    }

    if (error || (typeof status === "number" && status >= 400)) {
        console.error("[market-data]", payload);
        return;
    }

    console.info("[market-data]", payload);
}

function calculateSeriesChange(history: MarketPoint[] | null | undefined, lookback: number) {
    if (!history || history.length < 2) return null;
    const values = history.slice(-lookback).map((point) => point.price).filter((value) => Number.isFinite(value));
    if (values.length < 2) return null;
    const start = values[0];
    const end = values[values.length - 1];
    if (typeof start !== "number" || typeof end !== "number" || start === 0) return null;
    return ((end - start) / start) * 100;
}

function parseYahooChartHistory(history: unknown): MarketPoint[] {
    const chartData = history as { quotes?: Array<{ close?: number; adjclose?: number; date?: Date | string }> };
    const quotes = Array.isArray(chartData?.quotes) ? chartData.quotes : [];

    return quotes
        .map((entry) => ({
            price: entry.close ?? entry.adjclose ?? null,
            timestamp: entry.date ? Math.floor(new Date(entry.date).getTime() / 1000) : 0,
        }))
        .filter((entry): entry is MarketPoint => typeof entry.price === "number" && Number.isFinite(entry.price));
}

async function fetchYahooChartHistory(symbol: string, providerStats: Record<string, ProviderHealthStats>) {
    const startedAt = Date.now();

    try {
        const history = await yahooFinance.chart(symbol, {
            period1: Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 45) / 1000),
            period2: Math.floor(Date.now() / 1000),
            interval: "1d",
        });

        const prices = parseYahooChartHistory(history);
        logExternalCall("Yahoo Finance", `chart:${symbol}`, 200, Date.now() - startedAt);
        recordProviderAttempt(providerStats, "Yahoo Finance", true);
        return prices;
    } catch (error) {
        console.error(error);
        logExternalCall("Yahoo Finance", `chart:${symbol}`, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Yahoo Finance", false);
        return [];
    }
}

async function fetchYahooSnapshot(symbol: string, providerStats: Record<string, ProviderHealthStats>) {
    const startedAt = Date.now();

    try {
        const [quote, history] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.chart(symbol, {
                period1: Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 45) / 1000),
                period2: Math.floor(Date.now() / 1000),
                interval: "1d",
            }),
        ]);

        const quoteData = quote as {
            regularMarketPrice?: number;
            regularMarketChangePercent?: number;
            regularMarketVolume?: number;
            averageVolume?: number;
            previousClose?: number;
            marketState?: string;
            shortName?: string;
        };

        const prices = parseYahooChartHistory(history);
        const price =
            typeof quoteData.regularMarketPrice === "number"
                ? quoteData.regularMarketPrice
                : typeof quoteData.previousClose === "number"
                  ? quoteData.previousClose
                  : null;
        const changePercent =
            typeof quoteData.regularMarketChangePercent === "number" ? quoteData.regularMarketChangePercent : null;
        const status = normalizeMarketState(quoteData.marketState);

        logExternalCall("Yahoo Finance", `quote+chart:${symbol}`, 200, Date.now() - startedAt);
        recordProviderAttempt(providerStats, "Yahoo Finance", price !== null);

        return {
            symbol,
            price,
            changePercent,
            status,
            sparkline: prices.slice(-12),
            raw: quoteData,
            history: prices,
            volume:
                typeof quoteData.regularMarketVolume === "number"
                    ? quoteData.regularMarketVolume
                    : typeof quoteData.averageVolume === "number"
                      ? quoteData.averageVolume
                      : null,
        };
    } catch (error) {
        console.error(error);
        logExternalCall("Yahoo Finance", `quote+chart:${symbol}`, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Yahoo Finance", false);
        return null;
    }
}

async function fetchTwelveDataQuote(symbol: string, providerStats: Record<string, ProviderHealthStats>) {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    const endpoint = `${API.TWELVE_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=12&apikey=${apiKey}`;
    const startedAt = Date.now();

    if (!apiKey) {
        logExternalCall("Twelve Data", endpoint, "error", 0, new Error("Missing API key"));
        return null;
    }

    try {
        const response = await fetch(endpoint);
        const durationMs = Date.now() - startedAt;
        logExternalCall("Twelve Data", endpoint, response.status, durationMs);

        if (!response.ok) {
            recordProviderAttempt(providerStats, "Twelve Data", false);
            return null;
        }

        const payload = await response.json();
        if (payload?.status === "error") {
            console.error(new Error(payload?.message ?? "Twelve Data API error"));
            logExternalCall("Twelve Data", endpoint, "error", durationMs, new Error(payload?.message ?? "Twelve Data API error"));
            recordProviderAttempt(providerStats, "Twelve Data", false);
            return null;
        }

        const values = payload?.values ?? [];
        if (!values.length) {
            recordProviderAttempt(providerStats, "Twelve Data", false);
            return null;
        }

        const latest = values[0];
        const previous = values[1] ?? values[0];
        const price = Number(latest?.close);
        const previousPrice = Number(previous?.close);
        const changePercent = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;
        const history: MarketPoint[] = values
            .slice()
            .reverse()
            .map((entry: { close?: string; datetime?: string }, index: number) => ({
                price: Number(entry.close),
                timestamp: entry.datetime ? Math.floor(new Date(entry.datetime).getTime() / 1000) : index,
            }))
            .filter((entry: MarketPoint) => Number.isFinite(entry.price));

        recordProviderAttempt(providerStats, "Twelve Data", Number.isFinite(price));

        return {
            symbol,
            price,
            changePercent,
            status: "Open",
            sparkline: history,
            history,
        };
    } catch (error) {
        console.error(error);
        logExternalCall("Twelve Data", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Twelve Data", false);
        return null;
    }
}

async function fetchFredSeries(seriesId: string) {
    const apiKey = process.env.FRED_API_KEY;

    if (!apiKey) {
        return null;
    }

    try {
        const url =
            `${API.FRED_BASE_URL}/series/observations` +
            `?series_id=${seriesId}` +
            `&api_key=${apiKey}` +
            `&file_type=json` +
            `&sort_order=desc` +
            `&limit=1`;

        const response = await fetch(url, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return data?.observations?.[0]?.value ?? null;
    } catch {
        return null;
    }
}

async function fetchAlternativeFearGreed(providerStats: Record<string, ProviderHealthStats>) {
        const endpoint = `${API.ALTERNATIVE_BASE_URL}/fng/?limit=1&format=json`;
        const startedAt = Date.now();

        try {
            const response = await fetch(endpoint);
        logExternalCall("Alternative.me", endpoint, response.status, Date.now() - startedAt);

        if (!response.ok) {
            recordProviderAttempt(providerStats, "Alternative.me", false);
            return null;
        }

        const payload = await response.json();
        const item = payload?.data?.[0];
        if (!item) {
            recordProviderAttempt(providerStats, "Alternative.me", false);
            return null;
        }

        recordProviderAttempt(providerStats, "Alternative.me", true);
        return {
            value: Number(item.value),
            classification: item.value_classification,
            updatedAt: item.timestamp,
            volatility: Number(item.value) > 60 ? "Elevated" : "Moderate",
            momentum: Number(item.value) > 60 ? "Positive" : "Balanced",
            safeHavenDemand: Number(item.value) > 60 ? "High" : "Normal",
            riskAppetite: Number(item.value) > 60 ? "Risk-on" : "Risk-aware",
        };
    } catch (error) {
        console.error(error);
        logExternalCall("Alternative.me", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Alternative.me", false);
        return null;
    }
}

async function fetchFinnhubEvents(providerStats: Record<string, ProviderHealthStats>) {
    const apiKey = process.env.FINNHUB_API_KEY;
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString().slice(0, 10);
    const endpoint = `${API.FINNHUB_BASE_URL}/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`;
    const startedAt = Date.now();

    if (!apiKey) {
        logExternalCall("Finnhub", endpoint, "error", 0, new Error("Missing API key"));
        return [];
    }

    try {
        const response = await fetch(endpoint);
        logExternalCall("Finnhub", endpoint, response.status, Date.now() - startedAt);

        if (!response.ok) {
            recordProviderAttempt(providerStats, "Finnhub", false);
            return [];
        }

        const payload = await response.json();
        recordProviderAttempt(providerStats, "Finnhub", true);
        return (payload?.earningsCalendar ?? []).slice(0, 4).map((entry: { symbol?: string; companyName?: string; estimate?: string }) => ({
            title: entry.symbol ?? "Unknown",
            detail: `${entry.companyName ?? entry.symbol ?? "Company"} • ${entry.estimate ?? "Earnings release"}`,
            kind: "earnings",
        }));
    } catch (error) {
        console.error(error);
        logExternalCall("Finnhub", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Finnhub", false);
        return [];
    }
}

async function fetchCoingeckoCrypto(providerStats: Record<string, ProviderHealthStats>) {
    const endpoint = `${API.COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,dogecoin&price_change_percentage=24h&sparkline=true`;
    const startedAt = Date.now();

    try {
        const response = await fetch(endpoint);
        logExternalCall("CoinGecko", endpoint, response.status, Date.now() - startedAt);

        if (!response.ok) {
            recordProviderAttempt(providerStats, "CoinGecko", false);
            return [];
        }

        const payload = await response.json();
        recordProviderAttempt(providerStats, "CoinGecko", Array.isArray(payload) && payload.length > 0);
        return payload;
    } catch (error) {
        console.error(error);
        logExternalCall("CoinGecko", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "CoinGecko", false);
        return [];
    }
}

type YahooScreenerQuote = {
    symbol?: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
    regularMarketVolume?: number;
};

async function fetchYahooScreener(
    scrId: "day_gainers" | "day_losers" | "most_actives" | "undervalued_large_caps",
    count: number,
    providerStats: Record<string, ProviderHealthStats>
): Promise<YahooScreenerQuote[]> {
    const endpoint = `screener:${scrId}`;
    const startedAt = Date.now();

    try {
        const result = await yahooFinance.screener({ scrIds: scrId, count });
        logExternalCall("Yahoo Finance", endpoint, 200, Date.now() - startedAt);
        recordProviderAttempt(providerStats, "Yahoo Finance", (result.quotes?.length ?? 0) > 0);
        return (result.quotes ?? []) as YahooScreenerQuote[];
    } catch (error) {
        const validationResult =
            error instanceof Error && "result" in error && (error as { result?: { quotes?: YahooScreenerQuote[] } }).result?.quotes
                ? (error as { result: { quotes: YahooScreenerQuote[] } }).result.quotes
                : null;

        if (validationResult?.length) {
            logExternalCall("Yahoo Finance", endpoint, 200, Date.now() - startedAt);
            recordProviderAttempt(providerStats, "Yahoo Finance", true);
            return validationResult.slice(0, count);
        }

        console.error(error);
        logExternalCall("Yahoo Finance", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Yahoo Finance", false);
        return [];
    }
}

async function buildMarketMovers(providerStats: Record<string, ProviderHealthStats>) {
    const [gainerQuotes, loserQuotes, activeQuotes] = await Promise.all([
        fetchYahooScreener("day_gainers", 3, providerStats),
        fetchYahooScreener("day_losers", 3, providerStats),
        fetchYahooScreener("most_actives", 3, providerStats),
    ]);

    const categories = [
        { category: "gainer" as const, quotes: gainerQuotes },
        { category: "loser" as const, quotes: loserQuotes },
        { category: "active" as const, quotes: activeQuotes },
    ];

    const movers = await Promise.all(
        categories.flatMap(({ category, quotes }) =>
            quotes.map(async (quote) => {
                const symbol = quote.symbol ?? "—";
                const history = symbol !== "—" ? await fetchYahooChartHistory(symbol, providerStats) : [];

                return {
                    ticker: symbol,
                    name: quote.shortName ?? quote.longName ?? symbol,
                    price: formatCurrency(quote.regularMarketPrice),
                    change: formatPercent(quote.regularMarketChangePercent),
                    changeValue: quote.regularMarketChangePercent ?? 0,
                    volume: quote.regularMarketVolume ? formatCompact(quote.regularMarketVolume) : "—",
                    sparkline: toSparkline(history),
                    lastUpdated: new Date().toISOString(),
                    category,
                };
            })   
        )
    );

    return movers;
}

async function fetchUndervaluedPick(providerStats: Record<string, ProviderHealthStats>) {
    const quotes = await fetchYahooScreener("undervalued_large_caps", 1, providerStats);
    const pick = quotes[0];
    if (!pick?.symbol) return null;
    return {
        ticker: pick.symbol,
        name: pick.shortName ?? pick.longName ?? pick.symbol,
    };
}

async function fetchTrendingSymbols(providerStats: Record<string, ProviderHealthStats>) {
    const startedAt = Date.now();
    const endpoint = "trendingSymbols:US";

    try {
        const result = await yahooFinance.trendingSymbols("US");
        logExternalCall("Yahoo Finance", endpoint, 200, Date.now() - startedAt);
        recordProviderAttempt(providerStats, "Yahoo Finance", (result.quotes?.length ?? 0) > 0);

        const symbols = (result.quotes ?? []).slice(0, 4).map((entry) => entry.symbol).filter(Boolean) as string[];
        const quotes = await Promise.all(symbols.map((symbol) => fetchYahooSnapshot(symbol, providerStats)));

        return quotes
            .filter(Boolean)
            .map((quote) => ({
                symbol: quote!.symbol,
                name: quote!.raw?.shortName ?? quote!.symbol,
                note:
                    typeof quote!.price === "number"
                        ? `Price ${formatCurrency(quote!.price)} • ${formatPercent(quote!.changePercent)}`
                        : "Price unavailable",
            }));
    } catch (error) {
        console.error(error);
        logExternalCall("Yahoo Finance", endpoint, "error", Date.now() - startedAt, error);
        recordProviderAttempt(providerStats, "Yahoo Finance", false);
        return [];
    }
}

async function buildMarketDashboardData(): Promise<MarketDashboardData> {
    const providerStats = createProviderStats();
    
    const [
        fedFunds,
        inflation,
        cpi,
        gdp,
    ] = await Promise.all([
        fetchFredSeries("FEDFUNDS"),
        fetchFredSeries("FPCPITOTLZGUSA"),
        fetchFredSeries("CPIAUCSL"),
        fetchFredSeries("GDP"),
    ]);

    const globalSymbols = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^FTSE", "^N225", "^HSI", "^GDAXI"];
    const globalResults = await Promise.allSettled(globalSymbols.map((symbol) => fetchYahooSnapshot(symbol, providerStats)));
    const globalMarkets = globalResults
        .map((result, index) => {
            if (result.status !== "fulfilled" || !result.value) return null;
            const item = result.value;
            return {
                name: ["S&P 500", "Nasdaq", "Dow Jones", "Russell 2000", "FTSE 100", "Nikkei", "Hang Seng", "DAX"][index],
                value: formatNumber(item.price, true),
                change: formatPercent(item.changePercent),
                changeValue: item.changePercent ?? 0,
                status: item.status,
                sparkline: toSparkline(item.sparkline),
                lastUpdated: new Date().toISOString(),
                symbol: item.symbol,
            };
        })
        .filter(Boolean) as MarketWidgetItem[];




    const indianDefinitions = [
        { name: "NIFTY 50", yahooSymbol: "^NSEI", twelveSymbol: "NSE:NIFTY50" },
        { name: "NIFTY BANK", yahooSymbol: "^NSEBANK", twelveSymbol: "NSE:NIFTYBANK" },
        { name: "SENSEX", yahooSymbol: "^BSESN", twelveSymbol: "BSE:SENSEX" },
        { name: "MIDCAP 100", yahooSymbol: "NIFTY_MIDCAP_100.NS", twelveSymbol: "NSE:NIFTYMIDCAP100" },
        { name: "SMALLCAP", yahooSymbol: "^CNXSC", twelveSymbol: "NSE:NIFTYSMALLCAP250" },
        { name: "INDIA VIX", yahooSymbol: "^INDIAVIX", twelveSymbol: "NSE:INDIAVIX" },
        { name: "NIFTY IT", yahooSymbol: "^CNXIT", twelveSymbol: "NSE:NIFTYIT" },
        { name: "NIFTY AUTO", yahooSymbol: "^CNXAUTO", twelveSymbol: "NSE:NIFTYAUTO" },
        { name: "NIFTY PHARMA", yahooSymbol: "^CNXPHARMA", twelveSymbol: "NSE:NIFTYPHARMA" },
        { name: "NIFTY FMCG", yahooSymbol: "^CNXFMCG", twelveSymbol: "NSE:NIFTYFMCG" },
    ];

    const indianResults = await Promise.allSettled(
        indianDefinitions.map(async (item) => {
            const twelve = await fetchTwelveDataQuote(item.twelveSymbol, providerStats);
            if (twelve) {
                return { ...twelve, name: item.name, symbol: item.yahooSymbol };
            }

            const yahoo = await fetchYahooSnapshot(item.yahooSymbol, providerStats);
            if (yahoo) {
                return { ...yahoo, name: item.name, symbol: item.yahooSymbol };
            }

            return null;
        })
    );

    const indianMarkets = indianResults
        .map((result) => {
            if (result.status !== "fulfilled" || !result.value) return null;
            const item = result.value;
            return {
                name: item.name,
                value: formatNumber(item.price, false),
                change: formatPercent(item.changePercent),
                changeValue: item.changePercent ?? 0,
                status: item.status ?? "Closed",
                sparkline: toSparkline(item.sparkline),
                lastUpdated: new Date().toISOString(),
                symbol: item.symbol,
            };
        })
        .filter(Boolean) as MarketWidgetItem[];

    const movers = await buildMarketMovers(providerStats);

    // marketDataService.ts



    const sectorDefinitions = [
        {
            name:"Technology",
            symbol:"XLK",
            companies:["MSFT","NVDA","AAPL","GOOGL","META"]
        },
        {
            name:"Banking",
            symbol:"XLF",
            companies:["JPM","BAC","WFC","GS","MS"]
        },
        {
            name:"Healthcare",
            symbol:"XLV",
            companies:["LLY","JNJ","PFE","MRK","ABBV"]
        },
        {
            name:"Energy",
            symbol:"XLE",
            companies:["XOM","CVX","COP","SLB","EOG"]
        },
        {
            name:"Automobile",
            symbol:"CARZ",
            companies:["TSLA","GM","F","TM","RIVN"]
        },
        {
            name:"Telecom",
            symbol:"IYZ",
            companies:["T","VZ","TMUS","CMCSA"]
        },
        {
            name:"Real Estate",
            symbol:"XLRE",
            companies:["PLD","AMT","EQIX","SPG"]
        },
        {
            name:"Utilities",
            symbol:"XLU",
            companies:["DUK","SO","NEE","AEP"]
        },
        {
            name:"Consumer",
            symbol:"XLY",
            companies:["AMZN","HD","MCD","NKE"]
        },
        {
            name:"Pharma",
            symbol:"XPH",
            companies:["LLY","PFE","MRK","ABBV","BMY"]
        }
        ];

        async function getSectorLeader(companies:string[]){

            const quotes = await Promise.allSettled(
                companies.map(symbol =>
                    yahooFinance.quote(symbol)
                )
            );
        
            const valid = quotes
                .filter(r=>r.status==="fulfilled")
                .map(r=>(r as PromiseFulfilledResult<any>).value);
        
            if(!valid.length)
                return "N/A";
        
            valid.sort(
                (a,b)=>
                (b.marketCap??0)-(a.marketCap??0)
            );
        
            return valid[0].shortName || valid[0].symbol;
        }

        

    const sectorResults = await Promise.allSettled(sectorDefinitions.map(({ symbol }) => fetchYahooSnapshot(symbol, providerStats)));

    const sectors = (
        await Promise.all(
          sectorResults.map(async (result, index) => {
            if (result.status !== "fulfilled" || !result.value) return null;
      
            const item = result.value;
      
            const daily = item.changePercent ?? 0;
            const weekly = calculateSeriesChange(item.history, 7) ?? daily;
            const monthly = calculateSeriesChange(item.history, 30) ?? daily;
      
            return {
              name: sectorDefinitions[index].name,
              daily: formatPercent(daily),
              weekly: formatPercent(weekly),
              monthly: formatPercent(monthly),
              strength: daily > 1 ? "Strong" : daily > -0.5 ? "Steady" : "Soft",
              sentiment: daily > 1 ? "Bullish" : daily > 0 ? "Positive" : "Cautious",
      
              leader: await getSectorLeader(
                sectorDefinitions[index].companies
              ),
      
              lastUpdated: new Date().toISOString(),
            };
          })
        )
      ).filter(Boolean) as MarketDashboardData["sectors"];
      

    const commodityDefinitions = [
        { name: "Gold", yahooSymbol: "GC=F", twelveSymbol: "XAU/USD" },
        { name: "Silver", yahooSymbol: "SI=F", twelveSymbol: "XAG/USD" },
        { name: "Crude Oil", yahooSymbol: "CL=F", twelveSymbol: "WTI/USD" },
    ];
    const commodityResults = await Promise.allSettled(
        commodityDefinitions.map(async (item) => {
            const twelve = await fetchTwelveDataQuote(item.twelveSymbol, providerStats);
            if (twelve) {
                return { ...twelve, name: item.name, symbol: item.yahooSymbol };
            }

            const yahoo = await fetchYahooSnapshot(item.yahooSymbol, providerStats);
            if (yahoo) {
                return { ...yahoo, name: item.name, symbol: item.yahooSymbol };
            }

            return null;
        })
    );
    const commodities = commodityResults
        .map((result) => {
            if (result.status !== "fulfilled" || !result.value) return null;
            const item = result.value;
            return {
                name: item.name,
                value: formatCurrency(item.price),
                change: formatPercent(item.changePercent),
                changeValue: item.changePercent ?? 0,
                status: item.status ?? "Closed",
                sparkline: toSparkline(item.sparkline),
                lastUpdated: new Date().toISOString(),
                symbol: item.symbol,
            };
        })
        .filter(Boolean) as MarketWidgetItem[];

    const currencyDefinitions = [
        { name: "USD/INR", yahooSymbol: "INR=X", twelveSymbol: "USD/INR" },
        { name: "EUR/USD", yahooSymbol: "EURUSD=X", twelveSymbol: "EUR/USD" },
        { name: "GBP/USD", yahooSymbol: "GBPUSD=X", twelveSymbol: "GBP/USD" },
    ];
    const currencyResults = await Promise.allSettled(
        currencyDefinitions.map(async (item) => {
            const twelve = await fetchTwelveDataQuote(item.twelveSymbol, providerStats);
            if (twelve) {
                return { ...twelve, name: item.name, symbol: item.yahooSymbol };
            }

            const yahoo = await fetchYahooSnapshot(item.yahooSymbol, providerStats);
            if (yahoo) {
                return { ...yahoo, name: item.name, symbol: item.yahooSymbol };
            }

            return null;
        })
    );
    const currencies = currencyResults
        .map((result) => {
            if (result.status !== "fulfilled" || !result.value) return null;
            const item = result.value;
            return {
                name: item.name,
                value: formatNumber(item.price, false),
                change: formatPercent(item.changePercent),
                changeValue: item.changePercent ?? 0,
                status: item.status ?? "Closed",
                sparkline: toSparkline(item.sparkline),
                lastUpdated: new Date().toISOString(),
                symbol: item.symbol,
            };
        })
        .filter(Boolean) as MarketWidgetItem[];

    const [cryptoData, fearGreedData, eventsData, undervaluedPick, trending] = await Promise.all([
        fetchCoingeckoCrypto(providerStats),
        fetchAlternativeFearGreed(providerStats),
        fetchFinnhubEvents(providerStats),
        fetchUndervaluedPick(providerStats),
        fetchTrendingSymbols(providerStats),
    ]);

    const crypto = (cryptoData as Array<{
        name: string;
        current_price: number;
        price_change_percentage_24h?: number;
        market_cap?: number;
        total_volume?: number;
        sparkline_in_7d?: { price?: number[] };
    }>)
        .slice(0, 6)
        .map((item) => ({
            name: item.name,
            price: formatCurrency(item.current_price),
            change: formatPercent(item.price_change_percentage_24h ?? 0),
            changeValue: item.price_change_percentage_24h ?? 0,
            cap: formatCompact(item.market_cap),
            volume: formatCompact(item.total_volume),
            sparkline: toSparkline(Array.isArray(item.sparkline_in_7d?.price) ? item.sparkline_in_7d.price.slice(-12) : []),
            lastUpdated: new Date().toISOString(),
        }));

    const tnxSnapshot = await fetchYahooSnapshot("^TNX", providerStats);
    
    const indicators = [
        {
            label: "US Interest Rate",
            value: fedFunds ? `${fedFunds}%` : "—",
            detail: fedFunds ? "Live (FRED)" : "Unavailable",
        },
        {
            label: "Inflation",
            value: inflation ? `${inflation}%` : "—",
            detail: inflation ? "Latest (FRED)" : "Unavailable",
        },
        {
            label: "CPI",
            value: cpi ?? "—",
            detail: cpi ? "Monthly (FRED)" : "Unavailable",
        },
        {
            label: "GDP Growth",
            value: gdp ?? "—",
            detail: gdp ? "Quarterly (FRED)" : "Unavailable",
        },
        {
            label: "US 10Y Treasury",
            value: formatNumber(tnxSnapshot?.price ?? null, false),
            detail: "Live",
        },
        {
            label: "India Repo Rate",
            value: "—",
            detail: "Coming soon",
        },
    ];

    const topGainer = movers.find((item) => item.category === "gainer");
    const insightSeries = [
        {
            title: "Market Summary",
            content: `${globalMarkets.filter((item) => item.changeValue > 0).length} of ${globalMarkets.length} key indices are trading above their prior close, while the fear & greed score sits at ${fearGreedData?.value ?? "n/a"}.`,
        },
        {
            title: "Key Events",
            content: eventsData.length
                ? eventsData.map((entry: { title: string }) => entry.title).join(" • ")
                : "No calendar events were available from the configured provider.",
        },
        {
            title: "Risk Factors",
            content: `${fearGreedData?.riskAppetite ?? "Risk-aware"} conditions and rate-sensitive leadership are shaping near-term trading ranges.`,
        },
        {
            title: "Bullish Signals",
            content: `Momentum is strongest in ${topGainer?.ticker ?? "major growth names"} and the broader market is balancing volatility with improving breadth.`,
        },
    ];

    const providers = [
        {
            name: "Yahoo Finance",
            status: resolveProviderStatus(providerStats, "Yahoo Finance"),
            detail: "Quotes, screeners, and historical series",
        },
        {
            name: "CoinGecko",
            status: resolveProviderStatus(providerStats, "CoinGecko"),
            detail: "Crypto pricing",
        },
        {
            name: "Alternative.me",
            status: resolveProviderStatus(providerStats, "Alternative.me"),
            detail: "Fear & Greed Index",
        },
        {
            name: "Finnhub",
            status: resolveProviderStatus(providerStats, "Finnhub", Boolean(process.env.FINNHUB_API_KEY)),
            detail: "Earnings calendar",
        },
        {
            name: "Twelve Data",
            status: resolveProviderStatus(providerStats, "Twelve Data", Boolean(process.env.TWELVE_DATA_API_KEY)),
            detail: "Indian and macro market data",
        },
    ];

    return {
        globalMarkets,
        indianMarkets,
        movers,
        sectors,
        commodities,
        currencies,
        crypto,
        insights: insightSeries,
        indicators,
        fearGreed: {
            value: fearGreedData?.value ?? 50,
            classification: fearGreedData?.classification ?? "Neutral",
            updatedAt: fearGreedData?.updatedAt ? new Date(Number(fearGreedData.updatedAt) * 1000).toISOString() : new Date().toISOString(),
            volatility: fearGreedData?.volatility ?? "Moderate",
            momentum: fearGreedData?.momentum ?? "Balanced",
            safeHavenDemand: fearGreedData?.safeHavenDemand ?? "Normal",
            riskAppetite: fearGreedData?.riskAppetite ?? "Risk-aware",
        },
        events: eventsData,
        spotlight: {
            companyOfDay: topGainer ? { ticker: topGainer.ticker, name: topGainer.name } : null,
            undervaluedPick: undervaluedPick
                ? { ticker: undervaluedPick.ticker, name: undervaluedPick.name }
                : null,
        },
        trending,
        providers,
        lastUpdated: new Date().toISOString(),
    };
}

function formatCurrency(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
}

export const getCachedMarketDashboardData = unstable_cache(
    async () => buildMarketDashboardData(),
    ["market-dashboard-data"],
    { revalidate: DEFAULT_REVALIDATE }
);
