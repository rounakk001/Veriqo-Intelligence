import { NextResponse } from "next/server";
import {
    addPortfolioHolding,
    getPortfolioSummary,
    removePortfolioHolding,
    setFeaturedSymbol,
} from "@/lib/services/portfolioService";

export async function GET() {
    try {
        const summary = await getPortfolioSummary();
        return NextResponse.json(summary);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Unable to load portfolio." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const action = typeof body.action === "string" ? body.action : "add";

        if (action === "add") {
            const symbol = typeof body.symbol === "string" ? body.symbol : "";
            const shares = typeof body.shares === "number" ? body.shares : Number(body.shares) || 1;
            const summary = await addPortfolioHolding(symbol, shares);
            return NextResponse.json(summary);
        }

        if (action === "remove") {
            const symbol = typeof body.symbol === "string" ? body.symbol : "";
            const summary = await removePortfolioHolding(symbol);
            return NextResponse.json(summary);
        }

        if (action === "feature") {
            const symbol = typeof body.symbol === "string" ? body.symbol : "";
            const summary = await setFeaturedSymbol(symbol);
            return NextResponse.json(summary);
        }

        return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Portfolio update failed." },
            { status: 400 }
        );
    }
}
