import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";
import { formatDate } from "./pdfHelpers";

type Color = readonly [number, number, number];

export const PDF_THEME: {
    primary: Color;
    secondary: Color;
    accent: Color;
    success: Color;
    warning: Color;
    danger: Color;
    text: Color;
    textLight: Color;
    muted: Color;
    border: Color;
    background: Color;
    surface: Color;
} = {
    primary: [15, 23, 42], // Deep slate (Enterprise)
    secondary: [51, 65, 85],
    accent: [16, 185, 129], // Emerald

    success: [5, 150, 105],
    warning: [217, 119, 6],
    danger: [220, 38, 38],

    text: [15, 23, 42],
    textLight: [71, 85, 105],
    muted: [148, 163, 184],

    border: [226, 232, 240],
    background: [255, 255, 255],
    surface: [248, 250, 252],
};

export const PAGE = {
    width: 210,
    height: 297,
    marginX: 20,
    marginY: 25,
    contentWidth: 170,
};

// Extends jsPDF to include advanced graphics state (opacity)
interface AdvancedJsPDF extends jsPDF {
    GState: any;
    setGState: (gState: any) => jsPDF;
}

export function drawHeader(doc: jsPDF, result: AnalysisResult) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) { // Skip cover page
        doc.setPage(i);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text("VERIQO INTELLIGENCE", PAGE.marginX, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...PDF_THEME.textLight);
        
        const headerRightText = `Investment Research Report | ${result.profile.companyName} (${result.profile.symbol}) | ${formatDate(new Date())}`;
        doc.text(headerRightText, PAGE.width - PAGE.marginX, 15, { align: "right" });

        doc.setDrawColor(...PDF_THEME.border);
        doc.setLineWidth(0.5);
        doc.line(PAGE.marginX, 18, PAGE.width - PAGE.marginX, 18);
    }
}

export function drawFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const timestamp = new Date().toISOString();
    const reportId = `VQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${new Date().getTime().toString().slice(-4)}`;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(...PDF_THEME.border);
        doc.setLineWidth(0.5);
        doc.line(PAGE.marginX, PAGE.height - 18, PAGE.width - PAGE.marginX, PAGE.height - 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...PDF_THEME.primary);
        doc.text("VERIQO INTELLIGENCE", PAGE.marginX, PAGE.height - 12);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...PDF_THEME.muted);
        doc.text("Confidential", PAGE.marginX, PAGE.height - 8);

        doc.setFontSize(7);
        doc.text(`Generated: ${timestamp} | ID: ${reportId}`, PAGE.width / 2, PAGE.height - 12, { align: "center" });

        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, PAGE.width - PAGE.marginX, PAGE.height - 12, { align: "right" });
    }
}

export function drawWatermark(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const advancedDoc = doc as AdvancedJsPDF;
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(60);
        doc.setTextColor(200, 205, 215); // Light greyish blue
        
        // Attempt to use GState for opacity if available, otherwise fallback to light color
        try {
            if (advancedDoc.GState && advancedDoc.setGState) {
                const gState = new advancedDoc.GState({ opacity: 0.08 });
                advancedDoc.setGState(gState);
            }
        } catch (e) {
            // Ignore if GState is not fully supported in this jsPDF build
        }

        doc.text("VERIQO INTELLIGENCE", PAGE.width / 2, PAGE.height / 2, {
            angle: 45,
            align: "center",
        });

        // Reset opacity
        try {
            if (advancedDoc.GState && advancedDoc.setGState) {
                const gStateNormal = new advancedDoc.GState({ opacity: 1.0 });
                advancedDoc.setGState(gStateNormal);
            }
        } catch (e) {}
    }
}

export function setSectionTitle(doc: jsPDF, title: string, y: number) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PDF_THEME.primary);
    doc.text(title.toUpperCase(), PAGE.marginX, y);
    
    // Sleek underline
    doc.setDrawColor(...PDF_THEME.accent);
    doc.setLineWidth(1.0);
    doc.line(PAGE.marginX, y + 3, PAGE.marginX + 20, y + 3);
    
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.5);
    doc.line(PAGE.marginX + 20, y + 3, PAGE.width - PAGE.marginX, y + 3);
}