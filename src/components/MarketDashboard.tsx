"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useId } from "react";
import LogoutButton from "@/components/LogoutButton";
import { useAuthGate } from "@/lib/context/AuthGateContext";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    YAxis
} from "recharts";

import {
    Activity,
    BarChart3,
    BellRing,
    BrainCircuit,
    Building2,
    CandlestickChart,
    CircleDollarSign,
    Landmark,
    Newspaper,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioSummary } from "@/types/portfolio";

interface MarketWidgetItem {
    name: string;
    value: string;
    change: string;
    changeValue: number;
    status: string;
    sparkline: number[];
    lastUpdated: string;
    symbol: string;
}

interface MarketDashboardData {
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
        leader: string;
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

function MetricChip({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
    return (
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
            <span className={positive ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-500 dark:text-red-400"}>
                {value}
            </span>
        </div>
    );
}

function TimeAgo({ timestamp }: { timestamp: string }) {
    const [text, setText] = useState("");

    useEffect(() => {
        const update = () => {
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) {
                setText("—");
                return;
            }
            const diff = Math.floor((Date.now() - date.getTime()) / 1000);
            if (diff < 60) setText(`Updated ${Math.max(0, diff)} seconds ago`);
            else if (diff < 3600) setText(`Updated ${Math.floor(diff / 60)} minutes ago`);
            else setText(`Last synced ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
        };
        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return <span>{text}</span>;
}

function getMomentumLabel(change: number) {
    if (change >= 1.5) return "Strong Bullish";
    if (change >= 0.2) return "Bullish Momentum";
    if (change > -0.2 && change < 0.2) return "Sideways Trend";
    if (change <= -1.5) return "Strong Bearish";
    return "Bearish Momentum";
}

function getMarketStatus(symbol: string, defaultStatus: string) {
    if (defaultStatus && defaultStatus.toUpperCase() !== "CLOSED" && defaultStatus.toUpperCase() !== "UNKNOWN") {
        return defaultStatus.toUpperCase();
    }
    
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcDay = now.getUTCDay();
    
    if (utcDay === 0 || utcDay === 6) return "CLOSED";
    
    const isUS = ["^GSPC", "^IXIC", "^DJI", "^RUT"].includes(symbol);
    if (isUS) {
        if (utcHour >= 13 && utcHour < 14) return "PRE-MARKET";
        if (utcHour >= 14 && utcHour < 20) return "OPEN";
        if (utcHour >= 20 && utcHour < 22) return "AFTER HOURS";
        return "CLOSED";
    }
    
    const isAsia = ["^N225", "^HSI"].includes(symbol);
    if (isAsia) {
        if (utcHour >= 0 && utcHour < 6) return "OPEN";
        return "CLOSED";
    }
    
    const isEuro = ["^FTSE", "^GDAXI"].includes(symbol);
    if (isEuro) {
        if (utcHour >= 7 && utcHour < 15) return "OPEN";
        return "CLOSED";
    }

    const isIndia = symbol.includes("NSE") || symbol.includes("BSE") || ["^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX"].includes(symbol);
    if (isIndia) {
        if (utcHour === 3 && now.getUTCMinutes() >= 45) return "PRE-MARKET";
        if (utcHour >= 4 && utcHour < 10) return "OPEN";
        return "CLOSED";
    }
    
    return "CLOSED";
}

function TrendArrow({ value }: { value: number }) {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-emerald-500 animate-in slide-in-from-bottom-1" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-500 animate-in slide-in-from-top-1" />;
    return <ArrowRight className="h-4 w-4 text-zinc-400" />;
}

function getStrengthWidth(strength: string) {
    const s = strength.toLowerCase();
    if (s.includes("strong") || s.includes("bull")) return "85%";
    if (s.includes("weak") || s.includes("bear") || s.includes("cautious")) return "25%";
    return "50%";
}

// ----------------------------------------------------------------------
// Recharts Visualizations
// ----------------------------------------------------------------------

function MiniAreaChart({ data, positive = true }: { data: number[]; positive?: boolean }) {
    const reactId = useId().replace(/:/g, "");
    if (!data.length) return <div className="h-14 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
    
    const chartData = data.filter(Number.isFinite).map((val, i) => ({ value: val, index: i }));
    const min = Math.min(...chartData.map(d => d.value));
    const max = Math.max(...chartData.map(d => d.value));
    
    const color = positive ? "#10b981" : "#ef4444";
    const gradientId = `gradient-${positive ? 'pos' : 'neg'}-${reactId}`;

    return (
        <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <YAxis domain={[min, max]} hide />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#${gradientId})`} 
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function MiniBarChart({ data, positive = true }: { data: number[]; positive?: boolean }) {
    if (!data.length) return <div className="h-14 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
    
    const chartData = data.filter(Number.isFinite).map((val, i) => ({ value: val, index: i }));
    const min = Math.min(...chartData.map(d => d.value));
    const max = Math.max(...chartData.map(d => d.value));
    const color = positive ? "#10b981" : "#ef4444";

    return (
        <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <YAxis domain={[min, max]} hide />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={true}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={color} fillOpacity={0.4 + (index / chartData.length) * 0.6} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function MiniLineChart({ data, positive = true }: { data: number[]; positive?: boolean }) {
    if (!data.length) return <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
    
    const chartData = data.filter(Number.isFinite).map((val, i) => ({ value: val, index: i }));
    const min = Math.min(...chartData.map(d => d.value));
    const max = Math.max(...chartData.map(d => d.value));
    const color = positive ? "#10b981" : "#ef4444";

    return (
        <div className="h-10 w-[80px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <YAxis domain={[min, max]} hide />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Dashboard
// ----------------------------------------------------------------------

export function MarketDashboard() {
    const [data, setData] = useState<MarketDashboardData | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = () => {
        setPortfolio({
            authenticated: false,
            user: null,
            featuredSymbol: null,
            featured: null,
            holdings: [],
            stats: {
                totalValue: "$0.00",
                dayChange: "0.00%",
                dayChangeValue: 0,
                diversification: "0 Holdings",
                topSector: "—",
                risk: "—",
            },
        });
    };

    const loadDashboard = async () => {
        setIsLoading(true);
        setError(null);
    
        try {
            const [marketResponse, portfolioResponse] = await Promise.all([
                fetch("/api/market", { cache: "no-store" }),
                fetch("/api/portfolio", { cache: "no-store" }),
            ]);
    
            const marketPayload = await marketResponse.json();
            const portfolioPayload = await portfolioResponse.json();
    
            if (!marketResponse.ok) {
                throw new Error(marketPayload.error || "Unable to load market data");
            }
    
            setData(marketPayload);
            setPortfolio(portfolioResponse.ok ? portfolioPayload : null);
    
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load market data"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const { isAuthenticated } = useAuthGate();

    useEffect(() => {
        loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const summary = useMemo(() => {
        if (!data) return null;
        const positiveCount = data.globalMarkets.filter((item) => item.changeValue > 0).length;
        const averageChange = data.globalMarkets.reduce((sum, item) => sum + item.changeValue, 0) / data.globalMarkets.length;
        return {
            positiveCount,
            averageChange,
        };
    }, [data]);

    const watchlistItems = useMemo(() => {
        if (portfolio?.authenticated && portfolio.holdings.length) {
            return portfolio.holdings.map((holding) => ({
                key: holding.symbol,
                name: holding.name,
                sector: `${holding.symbol} • ${holding.sector}`,
                note: holding.note,
                meta: holding.symbol === portfolio.featuredSymbol ? "My choice" : "In your portfolio",
            }));
        }

        return (data?.trending ?? []).map((item) => ({
            key: item.symbol,
            name: item.name,
            sector: item.symbol,
            note: item.note,
            meta: "Trending now",
        }));
    }, [data?.trending, portfolio]);

    const portfolioStats = useMemo(() => {
        if (portfolio?.authenticated) {
            return {
                title: portfolio.user?.name ? `${portfolio.user.name}'s portfolio` : "Your portfolio",
                subtitle: portfolio.stats.totalValue,
                detail: `${portfolio.stats.dayChange} today`,
                diversification: portfolio.stats.diversification,
                topSector: portfolio.stats.topSector,
                risk: data?.fearGreed.riskAppetite ?? portfolio.stats.risk,
                isAuthenticated: true,
            };
        }

        return {
            title: "Create your portfolio",
            subtitle: "Sign in to track your own holdings with live market prices.",
            detail: "Personalized diversification and sector allocation",
            diversification: "Sign in to build",
            topSector: "—",
            risk: data?.fearGreed.riskAppetite ?? "Risk-aware",
            isAuthenticated: false,
        };
    }, [data?.fearGreed.riskAppetite, portfolio]);

    if (isLoading) {
        return (
            <div className="space-y-6 py-8">
                <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-36 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40">
                <CardContent className="p-6 text-sm text-amber-800 dark:text-amber-300">
                    Market data could not be refreshed right now. We will retry automatically on the next load.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 py-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <Card className="group overflow-hidden border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 transition-all hover:shadow-md dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 uppercase">
                            <BrainCircuit className="h-4 w-4 text-emerald-600" />
                            Market Intelligence Terminal
                        </div>
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            Daily research, sector context, and momentum tracking.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
                            Follow global indexes, regional benchmarks, macroeconomic signals, and AI-generated insights natively in one premium workspace.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <MetricChip label="Live" value={summary?.positiveCount ? `${summary.positiveCount}/${data.globalMarkets.length}` : "—"} positive />
                            <MetricChip label="Mood" value={data.fearGreed.classification} positive={data.fearGreed.value > 50} />
                            <MetricChip label="Volatility" value={data.fearGreed.volatility} positive={data.fearGreed.value < 50} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="group transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BellRing className="h-4 w-4 text-emerald-600" />
                            What matters now
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.insights.map((item, i) => (
                            <div key={item.title} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:text-zinc-300 dark:hover:bg-zinc-900" style={{ animationDelay: `${i * 100}ms` }}>
                                {item.content}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* Global Markets (Area Charts) */}
            <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Global Market Overview</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cross-border market pulse with live sentiment markers.</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 self-start sm:self-auto">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <TimeAgo timestamp={data.lastUpdated} />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {data.globalMarkets.map((market, i) => (
                        <Card key={market.name} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/30 dark:hover:border-emerald-500/30" style={{ animationDelay: `${i * 100}ms` }}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{market.name}</p>
                                        <p className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                            {market.value.replace('$', '')}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${market.changeValue >= 0 ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
                                        <TrendArrow value={market.changeValue} />
                                        {market.change}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <MiniAreaChart data={market.sparkline} positive={market.changeValue >= 0} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="uppercase tracking-wider">{getMarketStatus(market.symbol, market.status)}</span>
                                    <span className={`font-semibold ${market.changeValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {getMomentumLabel(market.changeValue)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                {/* Indian Market Pulse (Bar Charts) */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Landmark className="h-4 w-4 text-emerald-600" />
                            Indian Market Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {data.indianMarkets.map((item) => (
                            <div key={item.name} className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{item.name}</p>
                                        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{item.value}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${item.changeValue >= 0 ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
                                        <TrendArrow value={item.changeValue} />
                                        {item.change}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <MiniBarChart data={item.sparkline} positive={item.changeValue >= 0} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="uppercase tracking-wider">{getMarketStatus(item.symbol, item.status)}</span>
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Weekly trend</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Top Movers (Line Charts) */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Top Movers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {(["gainer", "loser", "active"] as const).map((category) => {
                            const items = data.movers.filter((stock) => stock.category === category);
                            if (!items.length) return null;
                            const heading = category === "gainer" ? "Top Gainers" : category === "loser" ? "Top Losers" : "Most Active";
                            return (
                                <div key={category} className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{heading}</p>
                                    <div className="space-y-2">
                                        {items.map((stock) => (
                                            <div key={stock.ticker} className="group flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-200">
                                                        {stock.ticker.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{stock.ticker}</p>
                                                        <p className="max-w-[120px] truncate text-xs text-zinc-500 dark:text-zinc-400">{stock.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:block">
                                                        <MiniLineChart data={stock.sparkline} positive={stock.changeValue >= 0} />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{stock.price}</p>
                                                        <p className={`text-xs font-semibold ${stock.changeValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{stock.change}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr] animate-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                {/* Sector Performance (Progress Indicators) */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="h-4 w-4 text-emerald-600" />
                            Sector Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {data.sectors.map((sector) => (
                            <div key={sector.name} className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{sector.name}</p>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${sector.daily.startsWith("-") ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                                        {sector.strength}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <MetricChip label="D" value={sector.daily} positive={sector.daily.startsWith("+")} />
                                    <MetricChip label="W" value={sector.weekly} positive={sector.weekly.startsWith("+")} />
                                    <MetricChip label="M" value={sector.monthly} positive={sector.monthly.startsWith("+")} />
                                </div>
                                
                                <div className="mt-4 space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-zinc-500 dark:text-zinc-400">Relative Strength</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${sector.daily.startsWith("-") ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-emerald-500 dark:bg-emerald-400'}`}
                                            style={{ width: getStrengthWidth(sector.strength) }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                
                <div className="space-y-6">
                    <Card className="transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-emerald-600" />
                                AI Market Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.insights.map((item) => (
                                <div key={item.title} className="group rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:bg-zinc-100 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:bg-zinc-900">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                                    <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{item.content}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Landmark className="h-4 w-4 text-emerald-600" />
                                Economic Indicators
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {data.indicators.map((indicator) => (
                                <div
                                    key={indicator.label}
                                    className="group rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:hover:bg-zinc-950"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        {indicator.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                        {indicator.value}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {indicator.detail}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3 animate-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                            Commodities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.commodities.map((item) => (
                            <div key={item.name} className="group rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.value}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold ${item.changeValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{item.change}</span>
                                        <TrendArrow value={item.changeValue} />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <MiniAreaChart data={item.sparkline} positive={item.changeValue >= 0} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            Currency
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.currencies.map((item) => (
                            <div key={item.name} className="group rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.value}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold ${item.changeValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{item.change}</span>
                                        <TrendArrow value={item.changeValue} />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <MiniAreaChart data={item.sparkline} positive={item.changeValue >= 0} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CandlestickChart className="h-4 w-4 text-emerald-600" />
                            Crypto Snapshot
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.crypto.map((item) => (
                            <div key={item.name} className="group rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold ${item.changeValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{item.change}</span>
                                        <TrendArrow value={item.changeValue} />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <MiniBarChart data={item.sparkline} positive={item.changeValue >= 0} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] animate-in slide-in-from-bottom-4 duration-500 delay-700 fill-mode-both">
                {/* Fear & Greed Gauge */}
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Fear & Greed Signals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                            {/* Glowing backdrop */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`h-40 w-40 rounded-full opacity-20 blur-3xl transition-colors duration-1000 ${data.fearGreed.value > 50 ? "bg-emerald-500" : "bg-red-500"}`} />
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Market Sentiment</p>
                                <div className="mt-2 text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                                    {data.fearGreed.value}
                                </div>
                                <div className={`mt-4 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold shadow-sm transition-colors ${data.fearGreed.value > 50 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"}`}>
                                    {data.fearGreed.classification}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["Volatility", data.fearGreed.volatility],
                                ["Momentum", data.fearGreed.momentum],
                                ["Safe Haven", data.fearGreed.safeHavenDemand],
                                ["Risk Appetite", data.fearGreed.riskAppetite],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-800/50 dark:bg-zinc-950/50">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                                    <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                            Spotlight & Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="group rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Company of the day</p>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {data.spotlight.companyOfDay?.ticker ?? data.movers.find((item) => item.category === "gainer")?.ticker ?? "—"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {data.spotlight.companyOfDay?.name ?? data.movers.find((item) => item.category === "gainer")?.name ?? "Awaiting market data"}
                            </p>
                        </div>
                        <div className="group rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Upcoming events</p>
                            <p className="mt-2 text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">{data.events[0]?.title ?? "No events"}</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data.events[0]?.detail ?? "Calendar feed is empty."}</p>
                        </div>
                        <div className="group rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Undervalued pick</p>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{data.spotlight.undervaluedPick?.ticker ?? "—"}</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data.spotlight.undervaluedPick?.name ?? "Live screener feed unavailable."}</p>
                        </div>
                        <div className="group rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {portfolio?.authenticated ? "My choice" : "My choice"}
                            </p>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {portfolio?.featured?.symbol ?? "—"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {portfolio?.featured
                                    ? `${portfolio.featured.name} • ${portfolio.featured.price} • ${portfolio.featured.change}`
                                    : "Sign in and add holdings to set your pick."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr] animate-in slide-in-from-bottom-4 duration-500 delay-1000 fill-mode-both">
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Portfolio Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{portfolioStats.title}</p>
                                    <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{portfolioStats.subtitle}</p>
                                    <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">{portfolioStats.detail}</p>
                                </div>
                                {portfolioStats.isAuthenticated ? (
                                    <div className="flex items-center gap-2">
                                        <Link href="/portfolio">
                                            <Button variant="outline" className="font-semibold shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                Manage Portfolio
                                            </Button>
                                        </Link>
                                        <LogoutButton onLogout={handleLogout} />
                                    </div>
                                ) : (
                                    <Link href="/login">
                                        <Button className="font-semibold shadow-sm">
                                            Sign In
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/50 dark:bg-zinc-950/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Diversification</p>
                                <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{portfolioStats.diversification}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/50 dark:bg-zinc-950/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sector allocation</p>
                                <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{portfolioStats.topSector}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/50 dark:bg-zinc-950/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Risk Profile</p>
                                <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{portfolioStats.risk}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Newspaper className="h-4 w-4 text-emerald-600" />
                            Watchlist & Trending
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {watchlistItems.map((item) => (
                            <div key={item.key} className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:border-zinc-700">
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.sector}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.note}</p>
                                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{item.meta}</p>
                                </div>
                            </div>
                        ))}
                        {!watchlistItems.length && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Live trending symbols will appear here shortly.</p>
                        )}
                        {!portfolio?.authenticated && (
                            <Link href="/login" className="inline-block pt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
                                Sign in to replace trending picks with your portfolio
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </section>

            <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/50 p-6 md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
                <div>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Veriqo Intelligence Systems</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        System nominal • <TimeAgo timestamp={data.lastUpdated} />
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.providers.map((provider) => (
                        <span key={provider.name} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                            <span className={`h-1.5 w-1.5 rounded-full ${provider.status === "Healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {provider.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
