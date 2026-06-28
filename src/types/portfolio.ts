export interface PortfolioHolding {
    symbol: string;
    shares: number;
    addedAt: string;
}

export interface UserPortfolio {
    userId: string;
    featuredSymbol: string | null;
    holdings: PortfolioHolding[];
    updatedAt: string;
}

export interface LiveHolding {
    symbol: string;
    name: string;
    sector: string;

    price: number | null;
    changePercent: number | null;

    shares: number;

    value: number | null;

    note: string;
}

export interface PortfolioSummary {
    authenticated: boolean;
    user: { id: string; name: string; email: string } | null;
    featuredSymbol: string | null;
    featured: { symbol: string; name: string; price: string; change: string } | null;
    holdings: LiveHolding[];
    stats: {
        totalValue: string;
        dayChange: string;
        dayChangeValue: number;
        diversification: string;
        topSector: string;
        risk: string;
    };
}
