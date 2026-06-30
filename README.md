# VERIQO INTELLIGENCE - Investment Research Agent 📈

A production-inspired, full-stack web application designed to automate public company research. It analyzes financial data and news, assesses risks using an AI agent workflow, and produces a structured, explainable investment recommendation report. 

Built as an ambitious effort to create a polished, functional AI product within limited time, this project explores how multi-step reasoning models can be integrated directly into a consumer-grade dashboard.

---

## 1. Project Overview

This is an AI agent that performs structured investment research rather than just acting as a conversational chatbot. When given a company ticker, it systematically:
- Validates the company profile.
- Retrieves financial metrics from financial APIs.
- Analyzes recent news sentiment.
- Evaluates risks using Google Gemini (with OpenRouter and xAI as fallback providers).
- Calculates a deterministic investment score based on a weighted formula.
- Produces a final **Strong Invest**, **Invest**, **Neutral**, or **Pass** recommendation with reasoning.

The output is presented in a clean, dashboard-style interface and can be exported as a professional PDF report.

---

## 2. Key Features

- **Agentic Workflow**: Powered by LangGraph to execute a multi-node pipeline with shared state and deterministic flow control.
- **Enterprise-Grade PDF Generation**: Exports the analysis into a polished, multi-page PDF report with vector charts, data tables, and watermarks using `jsPDF`.
- **Multi-Provider AI Gateway**: Custom circuit-breaker and fallback architecture (Gemini → OpenRouter → xAI) to ensure the AI analysis completes even if a provider goes down or rate limits.
- **Explainable Scoring**: Calculates an investment score (0–100) using a transparent, weighted formula based on financial health, profitability, growth, news sentiment, and risk.
- **Market Dashboard & Peer Comparison**: Provides broader market context and compares the searched company against industry peers.
- **Modern UI/UX**: Responsive dashboard built with React, Tailwind CSS, Shadcn-style components, and Framer Motion for smooth micro-animations.

---

## 3. Screenshots

> *[Placeholder: Add Hero Screenshot of the main dashboard here]*

> *[Placeholder: Add Screenshot of the PDF Report export here]*

---

## 4. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **AI & Agents**: LangChain, LangGraph
- **LLM Providers**: Google Gemini 2.5 Flash, OpenRouter, xAI (Grok)
- **Data Providers**: Financial Modeling Prep (FMP), NewsAPI, Yahoo Finance
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Charts**: Recharts

---

## 5. Architecture

The application follows a stateless, server-side orchestrated architecture. The frontend submits a company query, and the Next.js API route spins up a LangGraph workflow.

> *[Placeholder: Add Architecture Diagram here]*

**High-Level Flow:**
1. **User Input** → Submits company name on the homepage.
2. **API Route** → `POST /api/analyze` handles the request.
3. **LangGraph** → Orchestrates the research pipeline securely on the server.
4. **AI Gateway** → Routes LLM requests through a custom circuit breaker to handle API failures.
5. **Client UI** → Receives the structured JSON response and populates the dashboard components.

---

## 6. LangGraph Workflow

The core reasoning engine is a directed graph where each node focuses on a specific research task. If a node fails gracefully, the graph can still attempt to provide a partial analysis.

> *[Placeholder: Add LangGraph Workflow Diagram here]*

**Nodes in Order:**
1. **Company Research**: Validates the ticker and fetches the company profile.
2. **Financial Analysis**: Retrieves metrics like revenue, cash flow, debt, and P/E ratios.
3. **News Analysis**: Fetches recent headlines and uses the LLM to classify sentiment.
4. **Risk Analysis**: Assesses business, market, and regulatory risks.
5. **Investment Scoring**: Applies a deterministic formula to calculate the final score.
6. **Decision**: Determines the final verdict based on the score threshold.
7. **Executive Summary**: Generates a professional summary and recommendation rationale.
8. **Competitor Analysis**: Identifies and ranks industry peers.

---

## 7. Project Structure

```
src/
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # Server-side endpoints (analyze, market, committee)
│   └── page.tsx          # Main dashboard UI
├── components/           # React Components
│   ├── ui/               # Reusable UI primitives (buttons, inputs)
│   └── ...               # Domain-specific components (Cards, Modals)
├── lib/                  # Core Application Logic
│   ├── langgraph/        # Agent workflow definitions and nodes
│   ├── services/         # External API integrations
│   │   ├── ai-gateway/   # Custom multi-provider LLM router & circuit breaker
│   │   └── ...           # Financial, News, and Auth services
│   └── utils/            
│       └── pdf/          # PDF generation modules (Theme, Helpers, Layouts)
└── types/                # TypeScript interfaces and shared types
```

---

## 8. Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to include your specific API keys (see below).*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to `http://localhost:3000` in your browser.

---

## 9. Environment Variables

Create a `.env.local` file in the root directory. You can use the provided `.env.example` as a template.

```env
# AI Providers
GOOGLE_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
XAI_API_KEY=your_xai_api_key_here

# Financial & Data APIs
FMP_API_KEY=your_financial_modeling_prep_key_here
NEWS_API_KEY=your_newsapi_key_here

# AI Gateway Fallback Configuration
AI_DEFAULT_PROVIDER=gemini
AI_FALLBACK_PROVIDER=openrouter
AI_LAST_PROVIDER=xai
```

---

## 10. How the Application Works

When a user searches for a company:
1. The frontend displays a premium, animated loading screen that tracks the agent's progress.
2. The server-side LangGraph workflow executes step-by-step, pulling data from FMP and NewsAPI.
3. The custom AI Gateway sends prompts to the designated LLM provider. If the primary provider (e.g., Gemini) returns an error (like a 429 Rate Limit or invalid key), the circuit breaker automatically routes the request to the next provider in the chain (OpenRouter or xAI).
4. Once the graph completes, it returns a strictly typed JSON object to the frontend.
5. The frontend populates the dashboard with data visualizations and allows the user to export the findings as a formatted PDF.

---

## 11. Design Decisions and Tradeoffs

- **LangGraph vs. Standard Prompts**: Chose LangGraph to manage complex state transitions and ensure the pipeline remains modular. This makes it much easier to add new research nodes later without rewriting a massive prompt chain.
- **Server-Side Execution**: The entire agent runs in an API route. *Tradeoff:* API responses can take 15-30 seconds, requiring a robust frontend loading state to keep users engaged, but it securely hides all API keys and business logic.
- **Deterministic Scoring**: The final 0-100 score is calculated using standard math formulas based on the gathered data, rather than asking the LLM to "guess" a score. The LLM is only used for qualitative reasoning and risk assessment.
- **No Database**: To keep the project scope manageable and deployment simple, there is no persistent backend database. Search history is stored locally via `localStorage`.

---

## 12. Example Workflow

**Search Query:** "Tesla"

1. **Company Node**: Identifies "TSLA" on the NASDAQ.
2. **Financial Node**: Pulls metrics (e.g., $96B Revenue, 45x P/E ratio, $30B Cash).
3. **News Node**: Reads recent headlines regarding EV demand and regulatory updates.
4. **Risk Node**: LLM evaluates intense competition from Chinese EV makers and regulatory hurdles for autonomous driving.
5. **Score Node**: Calculates a `72/100` based on strong cash flow but high valuation multiples.
6. **Decision Node**: Recommends **"Invest"** with an 82% confidence level.
7. **Frontend**: Renders the dashboard and allows the user to download the `Tesla_VERIQO_INTELLIGENCE.pdf` report.

---

## 13. Deployment Instructions

This project is optimized for deployment on Vercel.

1. Install the Vercel CLI or connect your GitHub repository to Vercel.
2. Add all the required Environment Variables in the Vercel dashboard.
3. Deploy the application:
   ```bash
   vercel --prod
   ```

*Note: Since the LangGraph workflow can take 15-30 seconds, ensure your serverless function timeout limits are configured appropriately (Vercel Pro may be required for functions exceeding 10 seconds, depending on the current platform limits).*

---

## 14. Future Improvements

- **WebSockets / Server-Sent Events (SSE)**: Stream intermediate agent thoughts directly to the UI instead of waiting for the full pipeline to complete.
- **Database Integration**: Implement PostgreSQL (via Prisma or Drizzle) to allow users to save portfolios and track historical report changes over time.
- **10-K Document Parsing**: Add a node to fetch and analyze the company's latest SEC filings using Retrieval-Augmented Generation (RAG).

---

## 15. AI Assisted Development

AI was utilized throughout the lifecycle of this project to accelerate development and improve code quality. LLM tools were involved in:
- Planning and architecture discussions.
- Prompt engineering for the specific LangGraph nodes.
- UI refinement and Tailwind CSS styling.
- Debugging complex type errors in TypeScript.
- Writing documentation and implementation support.

> **Note on Development Logs:** Representative AI development logs are included with the submission to showcase the development process. Due to the size of the project, some implementation-focused conversations containing very large code snippets have been omitted. The shared logs focus primarily on architecture, design decisions, problem-solving, and the overall iterative process.

---

## 16. Acknowledgements

- Financial data provided by [Financial Modeling Prep](https://site.financialmodelingprep.com/)
- News data provided by [NewsAPI](https://newsapi.org/)
- UI Components inspired by [Shadcn UI](https://ui.shadcn.com/)

---

## 17. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
