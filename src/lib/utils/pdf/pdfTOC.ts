import jsPDF from "jspdf";
import { PAGE, PDF_THEME, setSectionTitle } from "./pdfTheme";
import { ensurePageSpace } from "./pdfHelpers";

export function drawTOC(doc: jsPDF) {
    let y = PAGE.marginY;
    
    setSectionTitle(doc, "TABLE OF CONTENTS", y);
    y += 20;

    const items = [
        "EXECUTIVE SUMMARY",
        "KPI DASHBOARD",
        "COMPANY OVERVIEW & PROFILE",
        "FINANCIAL ANALYSIS",
        "COMPETITIVE LANDSCAPE",
        "RISK ASSESSMENT & MATRIX",
        "NEWS & MARKET SENTIMENT",
        "INVESTMENT CONCLUSION"
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_THEME.text);

    items.forEach((item, index) => {
        y = ensurePageSpace(doc, y, 15);
        
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}.`, PAGE.marginX + 5, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(item, PAGE.marginX + 15, y);
        
        // Draw dotted line
        const textWidth = doc.getTextWidth(item);
        const startX = PAGE.marginX + 20 + textWidth;
        const endX = PAGE.width - PAGE.marginX - 10;
        
        doc.setDrawColor(...PDF_THEME.border);
        doc.setLineWidth(0.5);
        
        for (let i = startX; i < endX; i += 3) {
            doc.circle(i, y - 1, 0.2, "F");
        }

        y += 12;
    });

    doc.addPage();
}
