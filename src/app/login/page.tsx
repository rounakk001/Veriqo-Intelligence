"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TrendingUp, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Authentication failed.");
            }

            router.push("/portfolio");
            router.refresh();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Veriqo Intelligence
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600 dark:text-zinc-400">
                            Back to dashboard
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                            aria-label="Toggle color theme"
                        >
                            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-md flex-col px-4 py-16">
                <Card>
                    <CardHeader>
                        <CardTitle>{mode === "login" ? "Sign in to your account" : "Create your account"}</CardTitle>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Build a personal portfolio with live Yahoo Finance prices and set your own market pick.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "register" && (
                                <div>
                                    <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Name</label>
                                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required />
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="At least 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                            </Button>
                        </form>
                        <button
                            type="button"
                            onClick={() => {
                                setMode((current) => (current === "login" ? "register" : "login"));
                                setError(null);
                            }}
                            className="mt-4 w-full text-sm text-emerald-600 hover:underline"
                        >
                            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
                        </button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
