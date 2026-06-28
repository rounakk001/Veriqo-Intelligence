import { NextResponse } from "next/server";
import { getCachedMarketDashboardData } from "@/lib/services/marketDataService";

export async function GET() {
    try {
        const data = await getCachedMarketDashboardData();
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("[market-api]", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load market data" },
            { status: 502 }
        );
    }
}
