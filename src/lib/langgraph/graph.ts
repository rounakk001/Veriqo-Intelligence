import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { AgentState, AnalysisResult } from "@/types/agent";
import { companyResearchNode } from "./nodes/companyNode";
import { financialAnalysisNode } from "./nodes/financialNode";
import { newsAnalysisNode } from "./nodes/newsNode";
import { riskAnalysisNode } from "./nodes/riskNode";
import { investmentScoringNode } from "./nodes/scoreNode";
import { decisionNode } from "./nodes/decisionNode";
import { executiveSummaryNode } from "./nodes/executiveSummaryNode";
import { competitorNode } from "./nodes/competitorNode";

const AgentStateAnnotation = Annotation.Root({
  company: Annotation<string>(),
  error: Annotation<string | undefined>(),
  profile: Annotation<AgentState["profile"]>(),
  financials: Annotation<AgentState["financials"]>(),
  news: Annotation<AgentState["news"]>(),
  sentiment: Annotation<AgentState["sentiment"]>(),
  risks: Annotation<AgentState["risks"]>(),
  score: Annotation<number>(),
  confidence: Annotation<number>(),
  verdict: Annotation<AgentState["verdict"]>(),
  reasoning: Annotation<string[]>(),
  executiveSummary: Annotation<AgentState["executiveSummary"]>(),
  competitors: Annotation<AgentState["competitors"]>(),
});

function shouldContinue(state: AgentState): "continue" | "end" {
  if (state.error) return "end";
  return "continue";
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("companyResearch", companyResearchNode)
  .addNode("financialAnalysis", financialAnalysisNode)
  .addNode("newsAnalysis", newsAnalysisNode)
  .addNode("riskAnalysis", riskAnalysisNode)
  .addNode("investmentScoring", investmentScoringNode)
  .addNode("decision", decisionNode)
  .addNode("generateExecutiveSummary", executiveSummaryNode)
  .addNode("competitorAnalysis", competitorNode)
  .addEdge(START, "companyResearch")
  .addConditionalEdges("companyResearch", shouldContinue, {
    continue: "financialAnalysis",
    end: END,
  })
  .addConditionalEdges("financialAnalysis", shouldContinue, {
    continue: "newsAnalysis",
    end: END,
  })
  .addEdge("newsAnalysis", "riskAnalysis")
  .addConditionalEdges("riskAnalysis", shouldContinue, {
    continue: "investmentScoring",
    end: END,
  })
  .addEdge("investmentScoring", "decision")
  .addEdge("decision", "generateExecutiveSummary")
  .addEdge("generateExecutiveSummary", "competitorAnalysis")
  .addEdge("competitorAnalysis", END)

const compiledGraph = workflow.compile();

export async function runAnalysis(company: string): Promise<AnalysisResult> {
  const initialState: AgentState = {
    company,
    profile: null,
    financials: null,
    news: null,
    sentiment: null,
    risks: null,
    score: 0,
    confidence: 0,
    verdict: "",
    reasoning: [],
    executiveSummary: null,
    competitors: null, 
  };

  const result = await compiledGraph.invoke(initialState);

  console.log(result)

  if (result.error) {
    throw new Error(result.error);
  }

  if (
    !result.profile ||
    !result.financials ||
    !result.news ||
    !result.risks ||
    !result.verdict ||
    !result.executiveSummary
  ) {
    throw new Error("Analysis incomplete — missing required data");
  }

  return {
    company: result.company,
    profile: result.profile,
    financials: result.financials,
    news: result.news,
    sentiment: result.sentiment ?? {
      score: result.news.sentimentScore,
      label: "Mixed",
    },
    risks: result.risks,
    score: result.score,
    confidence: result.confidence,
    verdict: result.verdict,
    reasoning: result.reasoning,
    executiveSummary: result.executiveSummary!,
    competitors: result.competitors ?? [],
  };
}
