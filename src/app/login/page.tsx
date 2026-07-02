"use client";

import Link from "next/link";
import { loginUser, registerUser } from "@/lib/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { TrendingUp, Eye, EyeOff, Sun, Moon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthGate } from "@/lib/context/AuthGateContext";

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1")
  .replace(/\/api\/v1\/?$/, "");

// Animated floating orb
function Orb({ className }: { className: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 dark:opacity-10 animate-pulse pointer-events-none ${className}`}
    />
  );
}

// Google "G" icon
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIsAuthenticated, consumePendingAction, checkSession } = useAuthGate();

  const redirect = searchParams.get("redirect") || "/";
  const googleError = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    googleError === "GoogleAuthFailed"
      ? "Google sign-in failed. Please try again or use your email and password."
      : null
  );
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Subtle mouse-follow glow on the card
  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
      glow.style.opacity = "1";
    };
    const handleMouseLeave = () => {
      glow.style.opacity = "0";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setSuccess(false);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await loginUser({ email, password });
      } else {
        await registerUser({ fullname: name, email, password });
      }

      setSuccess(true);

      // Refresh full session — this populates user in AuthGateContext
      // and causes UserNav to immediately render the authenticated Avatar.
      await checkSession();

      // Execute any pending action (e.g. download report, open committee)
      const pending = consumePendingAction();

      setTimeout(() => {
        // Validate redirect to trusted paths only
        const safeRedirect =
          redirect.startsWith("/") && !redirect.startsWith("//")
            ? redirect
            : "/";
        router.push(safeRedirect);
        router.refresh();

        // If there's a pending action, the destination page will pick it up
        if (pending) {
          console.debug("[AuthGate] Pending action after login:", pending);
        }
      }, 800);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        anyErr?.response?.data?.message ||
          anyErr?.message ||
          "Authentication failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Build Google redirect URL passing through our frontend redirect param
  const googleLoginUrl = `${BACKEND_BASE}/api/v1/auth/google?redirect=${encodeURIComponent(redirect)}`;

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-emerald-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20 pointer-events-none" />

      {/* Floating orbs */}
      <Orb className="w-[600px] h-[600px] bg-emerald-400 dark:bg-emerald-500 -top-64 -right-32" />
      <Orb className="w-[500px] h-[500px] bg-violet-400 dark:bg-violet-600 -bottom-48 -left-24" />
      <Orb className="w-[300px] h-[300px] bg-sky-400 dark:bg-sky-600 top-1/2 right-1/4" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200/60 bg-white/60 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-emerald-600 dark:text-zinc-200 dark:hover:text-emerald-400"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </motion.div>
            VERIQO
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-500 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              Back to dashboard
            </Link>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle color theme"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/60 text-zinc-500 backdrop-blur-sm transition-all hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo mark */}
          <div className="mb-8 flex flex-col items-center text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25"
            >
              <TrendingUp className="h-6 w-6 text-white" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                {mode === "login" ? "Welcome back" : "Create your account"}
              </motion.h1>
            </AnimatePresence>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {mode === "login"
                ? "Sign in to access your portfolio and AI research tools."
                : "Start your free account. No credit card required."}
            </p>
          </div>

          {/* Glass card */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 p-8 shadow-2xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/80 dark:shadow-zinc-900/40"
          >
            {/* Mouse-follow glow */}
            <div
              ref={glowRef}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl transition-opacity duration-300 dark:bg-emerald-400/10"
              style={{ opacity: 0, left: "50%", top: "50%" }}
            />

            {/* Google button */}
            <a
              href={googleLoginUrl}
              id="google-signin-btn"
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </a>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700/70" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">or</span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700/70" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AnimatePresence>
                {mode === "register" && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label
                      htmlFor="fullname"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required={mode === "register"}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-800 dark:focus:ring-emerald-500/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-800 dark:focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                    minLength={mode === "register" ? 8 : undefined}
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit(e as unknown as FormEvent);
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-3.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:bg-zinc-800 dark:focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    id="auth-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {mode === "login" ? "Signed in! Redirecting…" : "Account created! Redirecting…"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                id="auth-submit-btn"
                type="submit"
                disabled={isLoading || success}
                whileHover={!isLoading && !success ? { scale: 1.01 } : {}}
                whileTap={!isLoading && !success ? { scale: 0.99 } : {}}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait…
                  </span>
                ) : mode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </motion.button>
            </form>

            {/* Switch mode */}
            <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            By signing in, you agree to our terms of service. For informational purposes only — not financial advice.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
