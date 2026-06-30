import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { drawCard, formatNumber, formatCurrency, formatPercentage } from "./pdfHelpers";

export function drawDashboard(doc: jsPDF, result: AnalysisResult) {
    let y = PAGE.marginY;

    setSectionTitle(doc, "KPI DASHBOARD", y);
    y += 15;

    const kpis = [
        { label: "Market Cap", value: result.financials.marketCap ? "$" + formatCurrency(result.financials.marketCap) : "N/A" },
        { label: "Enterprise Value", value: result.financials.enterpriseValue ? "$" + formatCurrency(result.financials.enterpriseValue) : "N/A" },
        { label: "Revenue", value: "$" + formatCurrency(result.financials.revenue) },
        { label: "Net Income", value: "$" + formatCurrency(result.financials.netIncome) },
        { label: "Operating Cash Flow", value: "$" + formatCurrency(result.financials.operatingCashFlow) },
        { label: "Free Cash Flow", value: "$" + formatCurrency(result.financials.freeCashFlow) },
        { label: "Total Debt", value: "$" + formatCurrency(result.financials.totalDebt) },
        { label: "Cash & Equivalents", value: "$" + formatCurrency(result.financials.cashAndEquivalents) },
        
        { label: "P/E Ratio", value: formatNumber(result.financials.peRatio) },
        { label: "PEG Ratio", value: formatNumber(result.financials.pegRatio) },
        { label: "Price to Book", value: formatNumber(result.financials.priceToBook) },
        { label: "Debt to Equity", value: formatNumber(result.financials.debtToEquity) },
        
        { label: "Gross Margin", value: formatPercentage(result.financials.grossMargin) },
        { label: "Operating Margin", value: formatPercentage(result.financials.operatingMargin) },
        { label: "Net Margin", value: formatPercentage(result.financials.netMargin) },
        { label: "ROE", value: formatPercentage(result.financials.returnOnEquity) }
    ];

    const cols = 4;
    const cardWidth = (PAGE.width - PAGE.marginX * 2 - (cols - 1) * 5) / cols;
    const cardHeight = 22;

    kpis.forEach((kpi, i) => {
        const x = PAGE.marginX + (i % cols) * (cardWidth + 5);
        const currentY = y + Math.floor(i / cols) * (cardHeight + 5);
        
        drawCard(doc, x, currentY, cardWidth, cardHeight);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(kpi.label.toUpperCase(), x + 3, currentY + 7);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text(String(kpi.value), x + 3, currentY + 16);
    });

    y += Math.ceil(kpis.length / cols) * (cardHeight + 5) + 15;
    
    // Draw Financial Health Scores
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...PDF_THEME.primary);
    doc.text("FINANCIAL HEALTH SCORES", PAGE.marginX, y);
    y += 8;

    const scores = [
        { label: "Overall Health", value: result.financials.healthScore },
        { label: "Profitability", value: result.financials.profitabilityScore },
        { label: "Growth", value: result.financials.growthScore }
    ];

    const scoreCardWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 3;

    scores.forEach((score, i) => {
        const x = PAGE.marginX + i * (scoreCardWidth + 5);
        
        drawCard(doc, x, y, scoreCardWidth, 35);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(score.label.toUpperCase(), x + scoreCardWidth / 2, y + 8, { align: "center" });
        
        let color = PDF_THEME.danger;
        if (score.value >= 70) color = PDF_THEME.success;
        else if (score.value >= 40) color = PDF_THEME.warning;
        
        doc.setFontSize(24);
        doc.setTextColor(...color);
        doc.text(String(score.value), x + scoreCardWidth / 2, y + 22, { align: "center" });
        
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.muted);
        doc.text("/100", x + scoreCardWidth / 2, y + 29, { align: "center" });
    });

    doc.addPage();
}
