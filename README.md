# AI Investment Research Agent

A production-quality full-stack web application that researches public companies, analyzes financial data and news, calculates an investment score, and produces explainable investment recommendations — powered by LangGraph and Google Gemini.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black) ![LangGraph](https://img.shields.io/badge/LangGraph-AI%20Workflow-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## Overview

This is **not a chatbot**. It is an AI agent that performs structured investment research:

1. Validates and identifies the company
2. Fetches financial metrics from Financial Modeling Prep
3. Retrieves and analyzes recent news from NewsAPI
4. Evaluates risks using Google Gemini 2.5 Flash
5. Calculates a deterministic investment score (0–100)
6. Generates an **Invest** or **Pass** recommendation with full reasoning

The output is a professional, dashboard-style research report — similar to Perplexity or an institutional research terminal.

---

## Features

- **LangGraph Agent Workflow** — Multi-node pipeline with shared typed state
- **Financial Analysis** — Revenue, net income, cash flow, debt, market cap, P/E ratio
- **News Sentiment Analysis** — Positive/negative classification, major event detection
- **AI Risk Assessment** — Competition, debt, market, regulatory, and business risks
- **Deterministic Scoring** — Weighted composite score with transparent breakdown
- **Explainable Recommendations** — Verdict, confidence, reasons, and risk summary
- **Modern Dashboard UI** — Shadcn-style components, Recharts visualizations
- **Loading Progress** — Step-by-step analysis progress indicator
- **Research History** — Recent searches stored in localStorage
- **Dark Mode** — Automatic system preference support
- **Error Handling** — Graceful failures for invalid companies and API errors

---

## Architecture

```
User Input (Company Name)
        ↓
   POST /api/analyze
        ↓
   LangGraph Workflow
        ↓
┌───────────────────────────────────────────────────┐
│  Company Research → Financial Analysis → News     │
│  → Risk Analysis → Investment Scoring → Decision  │
└───────────────────────────────────────────────────┘
        ↓
   Structured JSON Response
        ↓
   Dashboard UI (Cards, Charts, Verdict)
```

### Folder Structure

```
src/
├── app/
│   ├── page.tsx                 # Homepage & dashboard
│   └── api/analyze/route.ts     # Analysis API endpoint
├── components/
│   ├── SearchBar.tsx
│   ├── LoadingState.tsx
│   ├── OverviewCard.tsx
│   ├── FinancialCard.tsx
│   ├── NewsCard.tsx
│   ├── RiskCard.tsx
│   ├── ScoreCard.tsx
│   ├── VerdictCard.tsx
│   ├── ExplainabilitySection.tsx
│   └── ui/                      # Shadcn-style primitives
├── lib/
│   ├── langgraph/
│   │   ├── graph.ts             # LangGraph workflow definition
│   │   └── nodes/               # Individual agent nodes
│   ├── services/
│   │   ├── financialService.ts  # FMP API integration
│   │   ├── newsService.ts       # NewsAPI integration
│   │   └── geminiService.ts     # Google Gemini AI
│   └── utils.ts
└── types/
    └── agent.ts                 # Shared TypeScript types
```

---

## LangGraph Workflow

```
START
  ↓
Company Research Node     → Validate company, fetch profile
  ↓
Financial Analysis Node   → Revenue, income, cash flow, debt, P/E
  ↓
News Analysis Node        → Fetch news, classify sentiment
  ↓
Risk Analysis Node        → AI-powered risk assessment (Gemini)
  ↓
Investment Scoring Node   → Weighted deterministic score
  ↓
Decision Node             → Verdict, confidence, reasoning
  ↓
END
```

### Scoring Weights

| Factor            | Weight |
|-------------------|--------|
| Financial Health  | 35%    |
| Profitability     | 20%    |
| Growth            | 15%    |
| News Sentiment    | 15%    |
| Risk (inverted)   | 15%    |
| **Total**         | **100%** |

### Verdict Rules

| Score   | Verdict        |
|---------|----------------|
| 80–100  | Strong Invest  |
| 60–79   | Invest         |
| 40–59   | Neutral        |
| 0–39    | Pass           |

---

## How To Run

### Prerequisites

- Node.js 18+
- API keys for Google Gemini, Financial Modeling Prep, and NewsAPI

### Setup

```bash
# Clone and install
git clone <repo-url>
cd project
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a company name (e.g., **Tesla**, **Apple**, **MSFT**).

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable         | Description                          | Required |
|------------------|--------------------------------------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key                | Yes      |
| `FMP_API_KEY`    | Financial Modeling Prep API key      | Yes      |
| `NEWS_API_KEY`   | NewsAPI key                          | Yes      |

### Getting API Keys

- **Google Gemini**: [Google AI Studio](https://aistudio.google.com/apikey) — free tier available
- **Financial Modeling Prep**: [FMP Developer Docs](https://site.financialmodelingprep.com/developer/docs) — free tier (250 calls/day)
- **NewsAPI**: [NewsAPI Register](https://newsapi.org/register) — free tier for development

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Next.js 16 (App Router)           |
| UI          | React 19, Tailwind CSS 4, Shadcn UI |
| Charts      | Recharts                          |
| AI Agent    | LangChain.js, LangGraph.js        |
| LLM         | Google Gemini 2.5 Flash           |
| Financial   | Financial Modeling Prep API       |
| News        | NewsAPI                           |
| Language    | TypeScript                        |

---

## Key Decisions

1. **LangGraph over simple prompt chains** — Enables structured multi-step workflows with conditional routing, shared state, and easy extensibility for future nodes (e.g., SEC filing analysis).

2. **Deterministic scoring with AI reasoning** — The investment score uses fixed weights and formulas for reproducibility. AI (Gemini) is used for risk analysis and natural-language reasoning, not for the score itself.

3. **No database** — Stateless architecture keeps deployment simple. Research history uses localStorage on the client.

4. **Next.js API Routes** — Single deployment target, no separate Express server. The LangGraph workflow runs server-side in `/api/analyze`.

5. **Graceful degradation** — If news or AI analysis fails, the workflow continues with fallback data rather than crashing.

---

## Tradeoffs

| Decision                    | Pro                          | Con                              |
|-----------------------------|------------------------------|----------------------------------|
| No database                 | Simple deployment            | No persistent research history   |
| FMP free tier               | Real financial data          | Rate limits (250 calls/day)      |
| Keyword sentiment           | Fast, no extra API calls     | Less nuanced than LLM sentiment  |
| Server-side only agent      | API keys stay secure         | Longer response times (~15–30s)  |
| Single company analysis     | Focused UX                   | No comparison mode (future)      |

---

## Example Runs

### Tesla (TSLA)

```
Score: 72/100
Verdict: Invest
Confidence: 82%

Reasons:
• Strong revenue growth in EV sector
• Healthy operating cash flow
• Mixed news sentiment with regulatory headwinds
• Moderate debt levels
```

### Apple (AAPL)

```
Score: 85/100
Verdict: Strong Invest
Confidence: 90%

Reasons:
• Excellent profitability margins
• Strong balance sheet with low debt
• Positive news sentiment
• Low overall risk profile
```

---

## Future Improvements

- [ ] PDF report export
- [ ] Side-by-side company comparison
- [ ] SEC filing / 10-K analysis node
- [ ] Real-time streaming progress via SSE
- [ ] Source citation links with confidence scores
- [ ] Portfolio tracking integration
- [ ] Annual report PDF analysis

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Disclaimer

This application is for **informational and educational purposes only**. It does not constitute financial advice. Always conduct your own research and consult a qualified financial advisor before making investment decisions.

---

## License

MIT
