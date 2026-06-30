import jsPDF from "jspdf";
import type { AnalysisResult, RiskItem } from "@/types/agent";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace, drawCard, addWrappedText } from "./pdfHelpers";

function severityColor(severity: string) {
    switch (severity.toLowerCase()) {
        case "low": return PDF_THEME.success;
        case "medium": return PDF_THEME.warning;
        default: return PDF_THEME.danger;
    }
}

export function drawRisk(doc: jsPDF, result: AnalysisResult) {
    let y = PAGE.marginY;

    setSectionTitle(doc, "RISK ASSESSMENT & MATRIX", y);
    y += 15;

    // Overview Cards
    const scoreCardWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 2;
    
    // Risk Score
    drawCard(doc, PAGE.marginX, y, scoreCardWidth, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("OVERALL RISK SCORE", PAGE.marginX + scoreCardWidth / 2, y + 8, { align: "center" });
    
    doc.setFontSize(24);
    let scoreColor = PDF_THEME.success;
    if (result.risks.riskScore > 40) scoreColor = PDF_THEME.warning;
    if (result.risks.riskScore > 70) scoreColor = PDF_THEME.danger;
    
    doc.setTextColor(...scoreColor);
    doc.text(String(result.risks.riskScore), PAGE.marginX + scoreCardWidth / 2, y + 22, { align: "center" });
    
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.muted);
    doc.text("/100", PAGE.marginX + scoreCardWidth / 2, y + 29, { align: "center" });

    // Risk Level
    drawCard(doc, PAGE.marginX + scoreCardWidth + 10, y, scoreCardWidth, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("RISK CLASSIFICATION", PAGE.marginX + scoreCardWidth + 10 + scoreCardWidth / 2, y + 8, { align: "center" });
    
    const riskLevelText = result.risks.overallRiskLevel.toUpperCase();
    const riskLevelColor = severityColor(result.risks.overallRiskLevel);
    
    doc.setFillColor(...riskLevelColor);
    doc.roundedRect(PAGE.marginX + scoreCardWidth + 10 + scoreCardWidth / 2 - 25, y + 14, 50, 10, 2, 2, "F");
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(riskLevelText, PAGE.marginX + scoreCardWidth + 10 + scoreCardWidth / 2, y + 21, { align: "center" });

    y += 45;

    // Executive Summary of Risks
    drawCard(doc, PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("RISK SUMMARY", PAGE.marginX + 6, y + 8);
    y = addWrappedText(doc, result.risks.summary, y + 16, 10, PAGE.width - PAGE.marginX * 2 - 12, PAGE.marginX + 6, PDF_THEME.text);

    y += 20;

    // Risk List (Traffic Lights)
    setSectionTitle(doc, "IDENTIFIED RISKS", y);
    y += 15;

    result.risks.risks.forEach(risk => {
        y = ensurePageSpace(doc, y, 40);
        
        const lines = doc.splitTextToSize(risk.description, PAGE.width - PAGE.marginX * 2 - 30);
        const cardHeight = Math.max(16, lines.length * 4.5 + 10);
        
        // Background
        doc.setFillColor(...PDF_THEME.surface);
        doc.rect(PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, cardHeight, "F");
        
        // Traffic light indicator
        doc.setFillColor(...severityColor(risk.severity));
        doc.circle(PAGE.marginX + 10, y + cardHeight / 2, 3, "F");

        // Category
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.text);
        doc.text(risk.category.toUpperCase(), PAGE.marginX + 20, y + 8);

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(lines, PAGE.marginX + 20, y + 14);

        // Divider
        doc.setDrawColor(...PDF_THEME.border);
        doc.setLineWidth(0.2);
        doc.line(PAGE.marginX, y + cardHeight, PAGE.width - PAGE.marginX, y + cardHeight);

        y += cardHeight + 2;
    });

    doc.addPage();
}