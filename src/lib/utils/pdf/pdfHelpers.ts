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
    const width = text.length * 2.5 + 8;
    doc.roundedRect(x, y, width, 6, 1.5, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(text, x + width / 2, y + 4.2, { align: "center" });

    doc.setTextColor(...PDF_THEME.text);
}

export function addWrappedText(
    doc: jsPDF,
    text: string,
    y: number,
    fontSize = 10,
    maxWidth = PAGE.contentWidth,
    x = PAGE.marginX,
    color = PDF_THEME.textLight
) {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);

    return y + lines.length * (fontSize * 0.45);
}

export function ensurePageSpace(
    doc: jsPDF,
    currentY: number,
    requiredHeight = 40
) {
    if (currentY + requiredHeight > PAGE.height - 25) {
        doc.addPage();
        return PAGE.marginY + 10; // Extra padding for top of new page
    }
    return currentY;
}

export function drawCard(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string,
    value?: string,
    subtitle?: string
) {
    // Card background
    doc.setFillColor(...PDF_THEME.surface);
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, "FD");

    if (title) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(title.toUpperCase(), x + 4, y + 6);
    }
    
    if (value) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PDF_THEME.primary);
        doc.text(value, x + 4, y + 14);
    }

    if (subtitle) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_THEME.muted);
        doc.text(subtitle, x + 4, y + 19);
    }
}

export function drawVectorChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: number[],
    labels: string[],
    title: string
) {
    drawCard(doc, x, y, width, height);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_THEME.primary);
    doc.text(title, x + 5, y + 7);

    if (data.length === 0) return;

    const chartX = x + 10;
    const chartY = y + 15;
    const chartW = width - 15;
    const chartH = height - 25;

    const maxVal = Math.max(...data, 0);
    const minVal = Math.min(...data, 0);
    const range = maxVal - minVal || 1;
    
    // Draw 0 line
    const zeroY = chartY + chartH - ((0 - minVal) / range) * chartH;
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.2);
    doc.line(chartX, zeroY, chartX + chartW, zeroY);

    const barW = chartW / data.length - 2;

    data.forEach((val, i) => {
        const barH = (Math.abs(val) / range) * chartH;
        const bx = chartX + i * (chartW / data.length) + 1;
        const by = val >= 0 ? zeroY - barH : zeroY;

        doc.setFillColor(...(val >= 0 ? PDF_THEME.primary : PDF_THEME.danger));
        doc.rect(bx, by, barW, barH, "F");

        // Label
        if (labels[i]) {
            doc.setFontSize(6);
            doc.setTextColor(...PDF_THEME.muted);
            doc.text(labels[i].substring(0, 4), bx + barW / 2, chartY + chartH + 4, { align: "center" });
        }
    });
}