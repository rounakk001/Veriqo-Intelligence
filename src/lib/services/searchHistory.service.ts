import { api } from "../api/api";

export interface SearchHistoryEntry {
    _id: string;
    symbol: string;
    updatedAt: string;
}

export const searchHistoryService = {
    async fetchHistory(): Promise<string[]> {
        try {
            const response = await api.get("/searchHistory");
            const entries: SearchHistoryEntry[] = response.data?.data || [];
            // Map the symbols and take top 8 to match UI expectations
            return entries.map(entry => entry.symbol).slice(0, 8);
        } catch (error) {
            console.error("Failed to fetch search history from API", error);
            return [];
        }
    },

    async saveSearch(symbol: string): Promise<void> {
        if (!symbol) return;
        try {
            // We run this asynchronously, no need to await in the main thread
            // to avoid blocking the analysis flow
            await api.post("/searchHistory", { symbol });
        } catch (error) {
            console.error("Failed to save search to API", error);
        }
    }
};
