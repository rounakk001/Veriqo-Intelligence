import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace, drawCard, addWrappedText } from "./pdfHelpers";

export function drawNews(doc: jsPDF, result: AnalysisResult) {
    if (!result.news) return;

    let y = PAGE.marginY;
    setSectionTitle(doc, "NEWS & MARKET SENTIMENT", y);
    y += 15;

    // Sentiment Score Card
    const cardWidth = (PAGE.width - PAGE.marginX * 2 - 10) / 2;
    drawCard(doc, PAGE.marginX, y, cardWidth, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("SENTIMENT SCORE", PAGE.marginX + cardWidth / 2, y + 8, { align: "center" });
    
    doc.setFontSize(24);
    let color = PDF_THEME.warning;
    if (result.sentiment.score > 60) color = PDF_THEME.success;
    if (result.sentiment.score < 40) color = PDF_THEME.danger;
    
    doc.setTextColor(...color);
    doc.text(String(result.sentiment.score), PAGE.marginX + cardWidth / 2, y + 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.primary);
    doc.text(result.sentiment.label.toUpperCase(), PAGE.marginX + cardWidth / 2, y + 28, { align: "center" });

    // Article Breakdown
    drawCard(doc, PAGE.marginX + cardWidth + 10, y, cardWidth, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.textLight);
    doc.text("ARTICLE DISTRIBUTION", PAGE.marginX + cardWidth + 10 + cardWidth / 2, y + 8, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.success);
    doc.text(`Positive: ${result.news.positiveCount}`, PAGE.marginX + cardWidth + 20, y + 18);
    
    doc.setTextColor(...PDF_THEME.warning);
    doc.text(`Neutral: ${result.news.neutralCount}`, PAGE.marginX + cardWidth + 20, y + 24);
    
    doc.setTextColor(...PDF_THEME.danger);
    doc.text(`Negative: ${result.news.negativeCount}`, PAGE.marginX + cardWidth + 20, y + 30);

    y += 50;

    // News Summary
    y = ensurePageSpace(doc, y, 60);
    setSectionTitle(doc, "MARKET CONTEXT", y);
    y += 12;

    drawCard(doc, PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(doc, result.news.summary, y + 8, 10, PAGE.width - PAGE.marginX * 2 - 12, PAGE.marginX + 6, PDF_THEME.text);
    y += 35;

    // Recent Articles
    setSectionTitle(doc, "RECENT SIGNIFICANT EVENTS", y);
    y += 12;

    result.news.articles.slice(0, 5).forEach(article => {
        y = ensurePageSpace(doc, y, 35);
        
        doc.setFillColor(250, 251, 252);
        doc.setDrawColor(...PDF_THEME.border);
        doc.roundedRect(PAGE.marginX, y, PAGE.width - PAGE.marginX * 2, 25, 2, 2, "FD");
        
        // Sentiment indicator
        let sColor = PDF_THEME.warning;
        if (article.sentiment === "positive") sColor = PDF_THEME.success;
        if (article.sentiment === "negative") sColor = PDF_THEME.danger;
        doc.setFillColor(...sColor);
        doc.circle(PAGE.marginX + 6, y + 6, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text(doc.splitTextToSize(article.title, PAGE.width - PAGE.marginX * 2 - 20), PAGE.marginX + 12, y + 7);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...PDF_THEME.textLight);
        
        const date = new Date(article.publishedAt).toLocaleDateString();
        doc.text(`${article.source} • ${date}`, PAGE.marginX + 12, y + 16);
        
        y += 28;
    });

    doc.addPage();
}
