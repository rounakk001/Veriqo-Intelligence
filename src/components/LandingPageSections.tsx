"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimationFrame } from "framer-motion";
import { ArrowRight, BarChart3, Layers, FileText, Shield, LineChart, Zap, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Purely-decorative animated market visualization ───────────────────────

function CandlestickChart() {
  const candles = [
    { h: 80, l: 20, o: 35, c: 70, bull: true },
    { h: 75, l: 30, o: 60, c: 40, bull: false },
    { h: 90, l: 45, o: 50, c: 85, bull: true },
    { h: 70, l: 25, o: 55, c: 30, bull: false },
    { h: 95, l: 50, o: 55, c: 88, bull: true },
    { h: 85, l: 40, o: 75, c: 50, bull: false },
    { h: 100, l: 55, o: 60, c: 95, bull: true },
    { h: 90, l: 35, o: 80, c: 45, bull: false },
    { h: 110, l: 65, o: 70, c: 105, bull: true },
    { h: 105, l: 60, o: 95, c: 70, bull: false },
    { h: 120, l: 75, o: 80, c: 115, bull: true },
  ];

  return (
    <svg viewBox="0 0 220 130" className="w-full h-full" aria-hidden="true">
      {candles.map((c, i) => {
        const x = 10 + i * 20;
        const bodyTop = Math.min(c.o, c.c);
        const bodyH = Math.abs(c.c - c.o);
        const color = c.bull ? "#10b981" : "#f87171";
        const opacity = 0.4 + (i / candles.length) * 0.6;
        return (
          <g key={i} opacity={opacity}>
            {/* Wick */}
            <line x1={x} y1={130 - c.h} x2={x} y2={130 - c.l} stroke={color} strokeWidth={1.5} />
            {/* Body */}
            <rect
              x={x - 5}
              y={130 - bodyTop - bodyH}
              width={10}
              height={Math.max(bodyH, 2)}
              fill={color}
              rx={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

function TrendLine() {
  const pathRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!pathRef.current) return;
    const length = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${length}`;
    pathRef.current.style.strokeDashoffset = `${length}`;
    pathRef.current.animate(
      [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
      { duration: 2200, fill: "forwards", easing: "cubic-bezier(0.4,0,0.2,1)" }
    );
  }, []);

  return (
    <svg viewBox="0 0 300 100" className="w-full h-full absolute inset-0" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d="M0,80 C30,75 50,60 80,55 C110,50 130,35 160,28 C190,22 220,15 260,10 L300,6"
        fill="none"
        stroke="url(#trendGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Glow duplicate */}
      <path
        d="M0,80 C30,75 50,60 80,55 C110,50 130,35 160,28 C190,22 220,15 260,10 L300,6"
        fill="none"
        stroke="#10b981"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.1"
      />
    </svg>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 10 + Math.random() * 80,
    size: 1.5 + Math.random() * 2.5,
    delay: Math.random() * 3,
    dur: 3 + Math.random() * 4,
  }));

  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <circle key={p.id} cx={`${p.x}%`} cy={`${p.y}%`} r={p.size} fill="#10b981" opacity={0.25}>
          <animate attributeName="cy" values={`${p.y}%;${p.y - 12}%;${p.y}%`} dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
        </circle>
      ))}
    </svg>
  );
}

function SoftGrid() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] dark:opacity-[0.05]" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`v${i}`} x1={i * 57} y1={0} x2={i * 57} y2={300} stroke="#10b981" strokeWidth={0.5} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 50} x2={400} y2={i * 50} stroke="#10b981" strokeWidth={0.5} />
      ))}
    </svg>
  );
}

// Animated metric card used in the dashboard preview
function LiveMetricCard({
  label,
  values,
  trend,
  delay = 0,
}: {
  label: string;
  values: string[];
  trend: "up" | "down" | "neutral";
  delay?: number;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % values.length), 2800 + delay * 200);
    return () => clearInterval(t);
  }, [values.length, delay]);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-zinc-400";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">{label}</span>
        <TrendIcon className={`h-3 w-3 ${trendColor}`} />
      </div>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-bold text-white tabular-nums"
      >
        {values[idx]}
      </motion.div>
    </div>
  );
}

function AIScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <svg width="64" height="64" viewBox="0 0 72 72" className="-rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        >
          <animate attributeName="stroke-dasharray" from={`0 ${circ}`} to={`${dash} ${circ - dash}`} dur="1.4s" fill="freeze" />
        </circle>
      </svg>
      <div className="text-center">
        <div className="text-xl font-extrabold text-white leading-none">{score}</div>
        <div className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">AI Score</div>
      </div>
    </div>
  );
}

// The animated right-side dashboard preview
function AnimatedDashboardPreview() {
  return (
    <div className="relative h-[420px] lg:h-[500px] w-full select-none">
      {/* Outer container with perspective */}
      <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/[0.07] bg-zinc-900/80 shadow-2xl shadow-emerald-900/20 backdrop-blur-2xl">
        <SoftGrid />
        <FloatingParticles />

        {/* Header bar */}
        <div className="relative z-10 flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ml-3 text-xs text-zinc-500 font-mono">VERIQO — AI Research</span>
        </div>

        {/* Chart area */}
        <div className="relative z-10 mx-4 mt-3 h-[110px] rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          <TrendLine />
          <div className="absolute inset-0">
            <CandlestickChart />
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] text-emerald-400/70 font-mono tracking-wider">LIVE SIM</div>
        </div>

        {/* Metric cards */}
        <div className="relative z-10 mx-4 mt-3 grid grid-cols-3 gap-2">
          <LiveMetricCard label="Revenue" values={["$47.2B", "$48.1B", "$49.3B"]} trend="up" delay={0} />
          <LiveMetricCard label="P/E Ratio" values={["28.4×", "27.9×", "29.1×"]} trend="neutral" delay={1} />
          <LiveMetricCard label="Risk Score" values={["Low", "Low", "Med"]} trend="down" delay={2} />
        </div>

        {/* AI Score + Verdict — stacked vertically to prevent overlap */}
        <div className="relative z-10 mx-4 mt-3 flex flex-col gap-2">
          {/* Score row */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
            <AIScoreRing score={82} />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">VERIQO Score</div>
              <div className="text-xs text-zinc-300 leading-relaxed">Composite AI investment signal</div>
            </div>
          </div>
          {/* Verdict row */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1 font-semibold">AI Verdict</div>
            <motion.div
              className="text-sm font-bold text-emerald-300"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              Strong Buy
            </motion.div>
            <div className="mt-1 text-[10px] text-zinc-500 leading-relaxed">
              Fundamentals solid. Margin expansion trend confirmed.
            </div>
          </div>
        </div>

        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-950/30 to-transparent pointer-events-none" />
      </div>

      {/* Outer glow halo */}
      <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-emerald-600/10 via-transparent to-emerald-400/5 blur-2xl" />
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────

export function LandingHero({ onStartResearch, onExploreDashboard }: { onStartResearch: () => void; onExploreDashboard?: () => void }) {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 lg:py-28">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-700/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* ── Left: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-950/60 px-4 py-1.5 text-sm font-medium text-emerald-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              AI Investment Research Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Institutional-grade
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                financial analysis.
              </span>
              <br />
              <span className="text-zinc-300">Powered by AI.</span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
              VERIQO combines autonomous AI agents, explainable financial reasoning, portfolio management, and professional investment reports — in one intelligent research experience.
            </p>

            {/* Feature list */}
            <ul className="mt-6 space-y-2">
              {[
                "Explainable AI investment decisions",
                "AI Investment Committee with Bull/Bear debate",
                "One-click professional PDF reports",
                "Real-time market intelligence dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-400">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-950 border border-emerald-600/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={onStartResearch}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-500 hover:shadow-emerald-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Start Research
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => {
                  if (onExploreDashboard) {
                    onExploreDashboard();
                  } else {
                    document.getElementById("market-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <BarChart3 className="h-4 w-4" />
                Explore Dashboard
              </button>
            </div>
          </motion.div>

          {/* ── Right: Animated Preview ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <AnimatedDashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────

export function LandingFeatures() {
  const features = [
    {
      name: "AI Investment Research",
      description: "Autonomous AI agents research companies end-to-end — reading financials, news, and risk signals on your behalf.",
      icon: Search,
    },
    {
      name: "Financial Analysis",
      description: "P/E ratios, revenue growth, profitability margins, and financial health scores — calculated and explained instantly.",
      icon: LineChart,
    },
    {
      name: "Investment Committee",
      description: "Three independent AI personas (Bull, Bear, Moderator) debate every stock before delivering a unified verdict.",
      icon: Layers,
    },
    {
      name: "Professional PDF Reports",
      description: "Generate institutional-grade PDF investment reports in one click. Share with your team or portfolio manager.",
      icon: FileText,
    },
    {
      name: "Risk Assessment",
      description: "Surface hidden red flags, regulatory risks, and competitive threats before you deploy any capital.",
      icon: Shield,
    },
    {
      name: "Market Dashboard",
      description: "Real-time macroeconomic sector performance, market signals, and trending company watchlist.",
      icon: BarChart3,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Platform</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Everything serious investors need
          </h2>
          <p className="mt-5 text-lg text-zinc-500 dark:text-zinc-400">
            VERIQO replaces hours of manual research with instantaneous, explainable AI analysis — without sacrificing depth or accuracy.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 transition-shadow hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:shadow-black/20"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40">
                <feature.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{feature.name}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────

export function LandingWorkflow() {
  const steps = [
    { step: "01", title: "Search Company", desc: "Type any company name or ticker symbol.", icon: Search },
    { step: "02", title: "AI Research", desc: "Autonomous agents gather and analyze financial data.", icon: Zap },
    { step: "03", title: "Committee Debate", desc: "Bull, Bear & Moderator AI personas debate the investment.", icon: Layers },
    { step: "04", title: "PDF Report", desc: "Download an institutional-grade investment report instantly.", icon: FileText },
  ];

  return (
    <section className="py-24 sm:py-32 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            From search to report in seconds
          </h2>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connector line (desktop) */}
          <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent dark:via-emerald-700/40 hidden md:block" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md shadow-zinc-900/8 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                  <s.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{s.step}</div>
                  <div className="font-semibold text-zinc-900 dark:text-white">{s.title}</div>
                  <div className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust / Final CTA Section ────────────────────────────────────────────

export function LandingTrust({ onStartResearch }: { onStartResearch?: () => void }) {
  return (
    <section className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/60 px-4 py-1.5 text-sm text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Built for serious investors
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Research smarter. Invest with confidence.
          </h2>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Every insight is grounded in real financial data, explainable AI reasoning, and transparent logic chains — so you understand the why, not just the what.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartResearch}
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Start Analyzing Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();

  const nav = {
    product: [
      { name: "AI Research", href: "/" },
      { name: "Dashboard", href: "/#market-dashboard" },
      { name: "Portfolio", href: "/portfolio" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "GitHub", href: "#" },
    ],
    company: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Contact", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-zinc-200/80 bg-white py-16 dark:border-zinc-800/60 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">VERIQO</span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              AI-powered investment research platform delivering institutional-grade financial analysis.
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Made with ❤️ and AI. &copy; {year} VERIQO.
            </p>
          </div>

          {/* Links */}
          <div className="mt-16 grid grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white">Product</h3>
              <ul className="mt-4 space-y-3">
                {nav.product.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white">Resources</h3>
              <ul className="mt-4 space-y-3">
                {nav.resources.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white">Company</h3>
              <ul className="mt-4 space-y-3">
                {nav.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200/70 pt-8 dark:border-zinc-800/60">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            For informational purposes only. Not financial advice. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
