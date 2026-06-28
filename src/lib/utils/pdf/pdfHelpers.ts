import jsPDF from "jspdf";
import { PAGE, PDF_THEME } from "./pdfTheme";

export function formatCurrency(value: number | null | undefined) {
    if (value == null) return "-";

    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatPercentage(
    value: number | null | undefined
) {
    if (value == null) return "-";

    return `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(
    value: number | null | undefined
) {
    if (value == null) return "-";

    return value.toLocaleString();
}

export function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
    }).format(date);
}

export function recommendationColor(
    verdict: string
) {
    switch (verdict) {
        case "Strong Invest":
        case "Invest":
            return PDF_THEME.success;

        case "Neutral":
            return PDF_THEME.warning;

        default:
            return PDF_THEME.danger;
    }
}

export function drawBadge(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    color: readonly [number, number, number]

) {
    doc.setFillColor(color[0], color[1], color[2]);

    doc.roundedRect(
        x,
        y,
        text.length * 3.4 + 10,
        8,
        2,
        2,
        "F"
    );

    doc.setTextColor(
        PDF_THEME.text[0],
        PDF_THEME.text[1],
        PDF_THEME.text[2]
    );

    doc.setFontSize(10);

    doc.setFont("helvetica", "bold");

    doc.text(
        text,
        x + 5,
        y + 5.5
    );

    doc.setTextColor(...PDF_THEME.text);
}

export function addWrappedText(
    doc: jsPDF,
    text: string,
    y: number,
    fontSize = 11
) {
    doc.setFontSize(fontSize);

    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(
        text,
        PAGE.contentWidth
    );

    doc.text(
        lines,
        PAGE.marginX,
        y
    );

    return y + lines.length * 5;
}

export function ensurePageSpace(
    doc: jsPDF,
    currentY: number,
    requiredHeight = 40
) {
    if (
        currentY + requiredHeight >
        PAGE.height - 25
    ) {
        doc.addPage();

        return PAGE.marginY;
    }

    return currentY;
}