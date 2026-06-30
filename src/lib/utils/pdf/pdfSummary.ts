import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace, recommendationColor, drawBadge, drawCard, addWrappedText } from "./pdfHelpers";

export function drawSummary(doc: jsPDF, result: AnalysisResult) {
    let y = PAGE.marginY;

    setSectionTitle(doc, "EXECUTIVE SUMMARY", y);
    y += 15;

    // Investment Thesis Card
    drawCard(doc, PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 45);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("INVESTMENT THESIS", PAGE.marginX + 6, y + 8);
    
    y = addWrappedText(doc, result.executiveSummary.summary, y + 16, 10, PAGE.width - PAGE.marginX * 2 - 12, PAGE.marginX + 6, PDF_THEME.text) + 20;

    // Recommendation & Confidence Split
    const splitWidth = (PAGE.width - PAGE.marginX * 2 - 5) / 2;
    
    // Recommendation Card
    drawCard(doc, PAGE.marginX, y, splitWidth, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("FINAL RECOMMENDATION", PAGE.marginX + 6, y + 8);
    drawBadge(doc, result.verdict.toUpperCase(), PAGE.marginX + 6, y + 12, recommendationColor(result.verdict));

    // Confidence Card
    drawCard(doc, PAGE.marginX + splitWidth + 5, y, splitWidth, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("CONFIDENCE & SCORE", PAGE.marginX + splitWidth + 11, y + 8);
    
    doc.setFontSize(18);
    doc.setTextColor(...PDF_THEME.primary);
    doc.text(`${result.score}/100`, PAGE.marginX + splitWidth + 11, y + 19);
    
    doc.setFontSize(12);
    let color = PDF_THEME.danger;
    if (result.confidence >= 80) color = PDF_THEME.success;
    else if (result.confidence >= 60) color = PDF_THEME.warning;
    doc.setTextColor(...color);
    doc.text(`${result.confidence}%`, PAGE.width - PAGE.marginX - 10, y + 19, { align: "right" });
    
    y += 32;

    // Recommendation Rationale
    y = ensurePageSpace(doc, y, 50);
    drawCard(doc, PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("RECOMMENDATION RATIONALE", PAGE.marginX + 6, y + 8);
    
    y = addWrappedText(doc, result.executiveSummary.recommendationReason, y + 16, 10, PAGE.width - PAGE.marginX * 2 - 12, PAGE.marginX + 6, PDF_THEME.text) + 30;

    // Key Strengths & Risks
    y = ensurePageSpace(doc, y, 60);
    
    // Strengths
    drawCard(doc, PAGE.marginX, y, splitWidth, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.success);
    doc.text("KEY STRENGTHS", PAGE.marginX + 6, y + 8);
    
    let strengthY = y + 16;
    result.executiveSummary.keyStrengths.slice(0, 3).forEach(strength => {
        doc.setFillColor(...PDF_THEME.success);
        doc.circle(PAGE.marginX + 8, strengthY - 1, 1, "F");
        strengthY = addWrappedText(doc, strength, strengthY, 9, splitWidth - 12, PAGE.marginX + 12, PDF_THEME.text) + 4;
    });

    // Risks
    drawCard(doc, PAGE.marginX + splitWidth + 5, y, splitWidth, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.danger);
    doc.text("KEY RISKS", PAGE.marginX + splitWidth + 11, y + 8);
    
    let riskY = y + 16;
    result.executiveSummary.keyRisks.slice(0, 3).forEach(risk => {
        doc.setFillColor(...PDF_THEME.danger);
        doc.circle(PAGE.marginX + splitWidth + 13, riskY - 1, 1, "F");
        riskY = addWrappedText(doc, risk, riskY, 9, splitWidth - 12, PAGE.marginX + splitWidth + 17, PDF_THEME.text) + 4;
    });

    y += 65;
    
    doc.addPage();
    return y;
}
