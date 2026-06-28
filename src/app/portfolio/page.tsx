"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Star, TrendingUp, Trash2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PortfolioSummary } from "@/types/portfolio";

export default function PortfolioPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [symbol, setSymbol] = useState("");
    const [shares, setShares] = useState("1");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function loadPortfolio() {
        setIsLoading(true);
        setError(null);
        try {
            const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
            const mePayload = await meResponse.json();
            if (!mePayload.user) {
                router.push("/login");
                return;
            }

            const response = await fetch("/api/portfolio", { cache: "no-store" });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Unable to load portfolio.");
            setSummary(payload);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to load portfolio.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadPortfolio();
    }, []);

    async function handleAdd(event: FormEvent) {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add",
                    symbol,
                    shares: Number(shares) || 1,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Unable to add holding.");
            setSummary(payload);
            setSymbol("");
            setShares("1");
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to add holding.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRemove(ticker: string) {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", symbol: ticker }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Unable to remove holding.");
            setSummary(payload);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to remove holding.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleFeature(ticker: string) {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "feature", symbol: ticker }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Unable to update your choice.");
            setSummary(payload);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to update your choice.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    if (isLoading) {
        return <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-zinc-500">Loading portfolio...</div>;
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Veriqo Intelligence
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
                            Dashboard
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                            aria-label="Toggle color theme"
                        >
                            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Your Portfolio</h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Signed in as {summary?.user?.name}. Holdings use live Yahoo Finance prices.
                    </p>
                </div>

                {summary && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-zinc-500">Total value</p>
                                <p className="mt-1 text-xl font-semibold">{summary.stats.totalValue}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-zinc-500">Day change</p>
                                <p className={`mt-1 text-xl font-semibold ${summary.stats.dayChangeValue >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    {summary.stats.dayChange}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-zinc-500">My choice</p>
                                <p className="mt-1 text-xl font-semibold">{summary.featured?.symbol ?? "Not set"}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Add a holding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                            <Input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="Symbol (e.g. AAPL, TCS.NS)" required />
                            <Input type="number" min="0.01" step="0.01" value={shares} onChange={(event) => setShares(event.target.value)} placeholder="Shares" required />
                            <Button type="submit" disabled={isSaving}>
                                Add
                            </Button>
                        </form>
                        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Holdings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!summary?.holdings.length && (
                            <p className="text-sm text-zinc-500">No holdings yet. Add a symbol above to start your portfolio.</p>
                        )}
                        {summary?.holdings.map((holding) => (
                            <div key={holding.symbol} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                                        {holding.name} ({holding.symbol})
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        {holding.shares} shares • {holding.sector} • {holding.note}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={summary.featuredSymbol === holding.symbol ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFeature(holding.symbol)}
                                        disabled={isSaving}
                                    >
                                        

                                        {summary.featuredSymbol === holding.symbol
                                            ? "⭐ My Choice"
                                            : "Set as My Choice"}
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleRemove(holding.symbol)} disabled={isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
