import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/langgraph/graph";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const company = body?.company?.trim();

    if (!company || typeof company !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid company name." },
        { status: 400 }
      );
    }

    if (company.length > 100) {
      return NextResponse.json(
        { error: "Company name is too long." },
        { status: 400 }
      );
    }

    const result = await runAnalysis(company);

    return NextResponse.json(result);
  } catch (error) {

    console.error("API ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during analysis.";

    const status = message.includes("not find") ||
      message.includes("not configured") ||
      message.includes("not found")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
