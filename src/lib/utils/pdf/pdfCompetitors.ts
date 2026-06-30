import jsPDF from "jspdf";
import type { AnalysisResult, CompetitorComparison } from "@/types/agent";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace, formatPercentage, drawCard, addWrappedText, drawBadge } from "./pdfHelpers";

export function drawCompetitors(doc: jsPDF, result: AnalysisResult) {
    if (!result.competitors || result.competitors.length === 0) return;

    let y = PAGE.marginY;
    setSectionTitle(doc, "COMPETITIVE LANDSCAPE", y);
    y += 15;

    const current = result.competitors.find(c => c.isCurrentCompany);
    
    // Top Performer & Current Company Overview
    if (current) {
        const sorted = [...result.competitors].sort((a, b) => b.overallScore - a.overallScore);
        const best = sorted[0];

        const cardWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 2;
        
        // Subject Company Card
        drawCard(doc, PAGE.marginX, y, cardWidth, 35);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text("SUBJECT COMPANY", PAGE.marginX + 6, y + 8);
        
        doc.setFontSize(14);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text(current.companyName, PAGE.marginX + 6, y + 18);
        
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(`Score: ${current.overallScore}/100`, PAGE.marginX + 6, y + 26);
        
        // Top Peer Card
        drawCard(doc, PAGE.marginX + cardWidth + 10, y, cardWidth, 35);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text("TOP PERFORMING PEER", PAGE.marginX + cardWidth + 16, y + 8);
        
        doc.setFontSize(14);
        doc.setTextColor(...PDF_THEME.success);
        doc.text(best.companyName, PAGE.marginX + cardWidth + 16, y + 18);
        
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.textLight);
        doc.text(`Score: ${best.overallScore}/100`, PAGE.marginX + cardWidth + 16, y + 26);
        
        y += 50;
    }

    // Comparison Table Alternative (Matrix Style)
    y = ensurePageSpace(doc, y, 100);
    setSectionTitle(doc, "PEER COMPARISON MATRIX", y);
    y += 15;

    result.competitors.sort((a, b) => b.overallScore - a.overallScore).forEach((comp, idx) => {
        y = ensurePageSpace(doc, y, 20);
        
        doc.setFillColor(comp.isCurrentCompany ? 245 : 252, comp.isCurrentCompany ? 250 : 252, comp.isCurrentCompany ? 255 : 252);
        doc.rect(PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 16, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...(comp.isCurrentCompany ? PDF_THEME.primary : PDF_THEME.text));
        doc.text(`${idx + 1}. ${comp.companyName}`, PAGE.marginX + 6, y + 10);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        
        const metrics = `Score: ${comp.overallScore} | Growth: ${formatPercentage(comp.revenueGrowth)} | Health: ${comp.healthScore}`;
        doc.text(metrics, PAGE.width - PAGE.marginX - 6, y + 10, { align: "right" });
        
        doc.setDrawColor(...PDF_THEME.border);
        doc.setLineWidth(0.2);
        doc.line(PAGE.marginX, y + 16, PAGE.width - PAGE.marginX, y + 16);
        
        y += 16;
    });

    y += 15;

    // Strengths & Weaknesses
    if (current) {
        y = ensurePageSpace(doc, y, 80);
        setSectionTitle(doc, "RELATIVE POSITIONING", y);
        y += 15;

        const swCardWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 2;
        
        // Strengths
        drawCard(doc, PAGE.marginX, y, swCardWidth, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.success);
        doc.text("COMPETITIVE ADVANTAGES", PAGE.marginX + 6, y + 8);
        
        let sY = y + 16;
        if (current.healthScore >= 70) {
            sY = addWrappedText(doc, "• Strong relative financial health", sY, 9, swCardWidth - 12, PAGE.marginX + 6, PDF_THEME.text) + 2;
        }
        if (current.profitabilityScore >= 70) {
            sY = addWrappedText(doc, "• Above-average profitability", sY, 9, swCardWidth - 12, PAGE.marginX + 6, PDF_THEME.text) + 2;
        }
        if (sY === y + 16) {
            addWrappedText(doc, "• Maintaining market position", sY, 9, swCardWidth - 12, PAGE.marginX + 6, PDF_THEME.text);
        }

        // Weaknesses
        drawCard(doc, PAGE.marginX + swCardWidth + 10, y, swCardWidth, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.danger);
        doc.text("AREAS FOR IMPROVEMENT", PAGE.marginX + swCardWidth + 16, y + 8);
        
        let wY = y + 16;
        if (current.healthScore < 50) {
            wY = addWrappedText(doc, "• Below-average financial stability", wY, 9, swCardWidth - 12, PAGE.marginX + swCardWidth + 16, PDF_THEME.text) + 2;
        }
        if (current.profitabilityScore < 50) {
            wY = addWrappedText(doc, "• Underperforming profit margins", wY, 9, swCardWidth - 12, PAGE.marginX + swCardWidth + 16, PDF_THEME.text) + 2;
        }
        if (wY === y + 16) {
            addWrappedText(doc, "• No critical relative weaknesses", wY, 9, swCardWidth - 12, PAGE.marginX + swCardWidth + 16, PDF_THEME.text);
        }
    }

    doc.addPage();
}