export function formatCurrency(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
}

export function formatPercent(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";

    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}