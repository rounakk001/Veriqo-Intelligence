import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";

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
        <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            <span className="mr-2 text-zinc-400">{label}</span>
            <span className={positive ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>{value}</span>
        </div>
    );
}

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
    if (!data.length) {
        return <div className="h-12 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
    }

    const width = 120;
    const height = 44;
    const values = data.filter((value) => Number.isFinite(value));
    if (!values.length) {
        return <div className="h-12 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values
        .map((value, index) => {
            const x = (index / (values.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full">
            <polyline
                fill="none"
                stroke={positive ? "#10b981" : "#ef4444"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

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

    useEffect(() => {
        loadDashboard();
    }, []);

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
        <div className="space-y-6 py-8">
            <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-zinc-50 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-zinc-900">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            <BrainCircuit className="h-4 w-4" />
                            Market Intelligence Platform
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            Daily research, sector context, and market momentum in one premium workspace.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                            Follow global indexes, Indian benchmarks, movers, macro signals, and AI-generated insight without leaving the dashboard.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <MetricChip label="Live" value={summary?.positiveCount ? `${summary.positiveCount}/${data.globalMarkets.length}` : "—"} positive />
                            <MetricChip label="Mood" value={data.fearGreed.classification} positive={data.fearGreed.value > 50} />
                            <MetricChip label="Volatility" value={data.fearGreed.volatility} positive={data.fearGreed.value < 50} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BellRing className="h-4 w-4 text-emerald-600" />
                            What matters now
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.insights.map((item) => (
                            <div key={item.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
                                {item.content}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Global Market Overview</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cross-border market pulse with live sentiment markers.</p>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Last updated {formatTime(data.lastUpdated)}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {data.globalMarkets.map((market) => (
                        <Card key={market.name} className="transition-transform hover:-translate-y-1">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{market.name}</p>
                                        <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{market.value}</p>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${market.changeValue >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>
                                        {market.change}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Sparkline data={market.sparkline} positive={market.changeValue >= 0} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                                    <span>{market.status}</span>
                                    <span className="font-medium">{market.changeValue >= 0 ? "Momentum up" : "Momentum down"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Landmark className="h-4 w-4 text-emerald-600" />
                            Indian Market Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {data.indianMarkets.map((item) => (
                            <div key={item.name} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{item.name}</p>
                                        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{item.value}</p>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.changeValue >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>
                                        {item.change}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Sparkline data={item.sparkline} positive={item.changeValue >= 0} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                                    <span>{item.changeValue >= 0 ? "Bullish" : "Cautious"}</span>
                                    <span className="font-medium">Weekly trend</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Top Movers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(["gainer", "loser", "active"] as const).map((category) => {
                            const items = data.movers.filter((stock) => stock.category === category);
                            if (!items.length) return null;
                            const heading = category === "gainer" ? "Top Gainers" : category === "loser" ? "Top Losers" : "Most Active";
                            return (
                                <div key={category}>
                                    <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{heading}</p>
                                    <div className="space-y-2">
                                        {items.map((stock) => (
                                            <div key={stock.ticker} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                                        {stock.ticker.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{stock.name}</p>
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{stock.ticker}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{stock.price}</p>
                                                    <p className={`text-sm ${stock.changeValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>{stock.change}</p>
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

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="h-4 w-4 text-emerald-600" />
                            Sector Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {data.sectors.map((sector) => (
                            <div key={sector.name} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{sector.name}</p>
                                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{sector.strength}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <MetricChip label="Daily" value={sector.daily} positive={sector.daily.startsWith("+")} />
                                    <MetricChip label="Weekly" value={sector.weekly} positive={sector.weekly.startsWith("+")} />
                                    <MetricChip label="Monthly" value={sector.monthly} positive={sector.monthly.startsWith("+")} />
                                </div>
                                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Top company: {sector.leader}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-emerald-600" />
                                AI Market Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.insights.map((item) => (
                                <div key={item.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.content}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
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
                                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
                                >
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {indicator.label}
                                    </p>

                                    <p className="mt-1 text-xl font-bold">
                                        {indicator.value}
                                    </p>

                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {indicator.detail}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                            Commodities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.commodities.map((item) => (
                            <div key={item.name} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.value}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${item.changeValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>{item.change}</span>
                                </div>
                                <Sparkline data={item.sparkline} positive={item.changeValue >= 0} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            Currency
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.currencies.map((item) => (
                            <div key={item.name} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.value}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${item.changeValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>{item.change}</span>
                                </div>
                                <Sparkline data={item.sparkline} positive={item.changeValue >= 0} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CandlestickChart className="h-4 w-4 text-emerald-600" />
                            Crypto Snapshot
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.crypto.map((item) => (
                            <div key={item.name} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.price}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${item.changeValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>{item.change}</span>
                                </div>
                                <Sparkline data={item.sparkline} positive={item.changeValue >= 0} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Fear & Greed Signals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Fear & Greed Index</p>
                                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{data.fearGreed.value} / 100</p>
                                </div>
                                <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-zinc-900/70 dark:text-emerald-300">
                                    {data.fearGreed.classification}
                                </div>
                            </div>
                        </div>
                        {[
                            ["Market Volatility", data.fearGreed.volatility],
                            ["Momentum", data.fearGreed.momentum],
                            ["Safe Haven Demand", data.fearGreed.safeHavenDemand],
                            ["Risk Appetite", data.fearGreed.riskAppetite],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                            Company Spotlight & Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Company of the day</p>
                            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                {data.spotlight.companyOfDay?.ticker ?? data.movers.find((item) => item.category === "gainer")?.ticker ?? "—"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {data.spotlight.companyOfDay?.name ?? data.movers.find((item) => item.category === "gainer")?.name ?? "Awaiting market data"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Upcoming events</p>
                            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{data.events[0]?.title ?? "No events"}</p>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.events[0]?.detail ?? "Calendar feed is currently empty."}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Undervalued pick</p>
                            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{data.spotlight.undervaluedPick?.ticker ?? "—"}</p>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.spotlight.undervaluedPick?.name ?? "Live screener feed unavailable."}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {portfolio?.authenticated ? "My choice" : "My choice"}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                {portfolio?.featured?.symbol ?? "—"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {portfolio?.featured
                                    ? `${portfolio.featured.name} • ${portfolio.featured.price} • ${portfolio.featured.change}`
                                    : portfolio?.authenticated
                                        ? "Set a featured holding in your portfolio."
                                        : "Sign in and add holdings to set your pick."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Portfolio Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{portfolioStats.title}</p>
                                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{portfolioStats.subtitle}</p>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{portfolioStats.detail}</p>
                                </div>
                                {portfolioStats.isAuthenticated ? (
                                    <div className="flex items-center gap-2">
                                        <Link href="/portfolio">
                                            <Button variant="outline" size="sm">
                                                Manage Portfolio
                                            </Button>
                                        </Link>

                                        <LogoutButton onLogout={handleLogout} />
                                    </div>
                                ) : (
                                    <Link href="/login">
                                        <Button size="sm">
                                            Sign In
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Diversification</p>
                                <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{portfolioStats.diversification}</p>
                            </div>
                            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Sector allocation</p>
                                <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{portfolioStats.topSector}</p>
                            </div>
                            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Risk</p>
                                <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{portfolioStats.risk}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Newspaper className="h-4 w-4 text-emerald-600" />
                            Watchlist & Trending Searches
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {watchlistItems.map((item) => (
                            <div key={item.key} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.sector}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-emerald-600">{item.note}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.meta}</p>
                                </div>
                            </div>
                        ))}
                        {!watchlistItems.length && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Live trending symbols will appear here shortly.</p>
                        )}
                        {!portfolio?.authenticated && (
                            <Link href="/login" className="inline-block text-sm text-emerald-600 hover:underline">
                                Sign in to replace trending picks with your portfolio
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Market intelligence footer</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Last updated {formatTime(data.lastUpdated)} • Provider health {data.providers.filter((item) => item.status === "Healthy").length}/{data.providers.length} live</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.providers.map((provider) => (
                            <span key={provider.name} className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                                {provider.name}: {provider.status}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
