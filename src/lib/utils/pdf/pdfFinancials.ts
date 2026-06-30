import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace, drawCard, drawVectorChart } from "./pdfHelpers";

export function drawFinancials(doc: jsPDF, result: AnalysisResult) {
    let y = PAGE.marginY;

    setSectionTitle(doc, "FINANCIAL ANALYSIS", y);
    y += 15;

    const analysis = result.financials.analysis;
    const narratives = [
        { title: "PROFITABILITY & PERFORMANCE", text: analysis.profitability },
        { title: "LIQUIDITY & DEBT LEVEL", text: analysis.debtLevel },
        { title: "OVERALL FINANCIAL HEALTH", text: analysis.financialHealth }
    ];

    narratives.forEach(narrative => {
        y = ensurePageSpace(doc, y, 60);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(narrative.text, PAGE.contentWidth - 12);
        const textHeight = lines.length * 4.5;
        const cardHeight = textHeight + 20;

        drawCard(doc, PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, cardHeight);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text(narrative.title, PAGE.marginX + 6, y + 8);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_THEME.text);
        doc.text(lines, PAGE.marginX + 6, y + 15);

        y += cardHeight + 10;
    });

    y = ensurePageSpace(doc, y, 100);
    setSectionTitle(doc, "FINANCIAL TRENDS & METRICS", y);
    y += 15;

    const chartWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 2;
    const chartHeight = 60;

    const marginsData = [
        result.financials.grossMargin || 0,
        result.financials.operatingMargin || 0,
        result.financials.netMargin || 0
    ];
    drawVectorChart(doc, PAGE.marginX, y, chartWidth, chartHeight, marginsData, ["Gross", "Oper", "Net"], "Profit Margins");

    const cfData = [
        result.financials.operatingCashFlow || 0,
        result.financials.freeCashFlow || 0,
        -(result.financials.totalDebt || 0) / 10
    ];
    drawVectorChart(doc, PAGE.marginX + chartWidth + 10, y, chartWidth, chartHeight, cfData, ["OpCF", "FCF", "Debt(S)"], "Cash Flow vs Debt");

    y += chartHeight + 15;

    doc.addPage();
}
