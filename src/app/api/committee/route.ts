import { NextResponse } from "next/server";
import { runInvestmentCommittee } from "@/lib/services/committeeService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Pass the entire AnalysisResult object fields
    const { profile, financials, news, risks, verdict } = body;
    
    if (!profile || !financials || !news || !risks || !verdict) {
      return NextResponse.json(
        { error: "Missing required fields for committee analysis" },
        { status: 400 }
      );
    }

    const result = await runInvestmentCommittee(
      profile,
      financials,
      news,
      risks,
      verdict
    );

    console.count("Committee API Called");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Committee API Error:", error);
    return NextResponse.json(
      { error: "Failed to run investment committee" },
      { status: 500 }
    );
  }
}
