import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import { drawCoverPage } from "./pdfCover";
import { drawTOC } from "./pdfTOC";
import { drawSummary } from "./pdfSummary";
import { drawDashboard } from "./pdfDashboard";
import { drawFinancials } from "./pdfFinancials";
import { drawCompetitors } from "./pdfCompetitors";
import { drawRisk } from "./pdfRisks";
import { drawNews } from "./pdfNews";
import { drawConclusion } from "./pdfConclusion";
import { drawFooter, drawWatermark } from "./pdfTheme";

export function generateReport(
    result: AnalysisResult
) {
    const doc = new jsPDF({
        unit: "mm",
        format: "a4",
    });

    drawCoverPage(doc, result);
    drawTOC(doc);
    drawSummary(doc, result);
    drawDashboard(doc, result);
    drawFinancials(doc, result);
    
    if (result.competitors?.length) {
        drawCompetitors(doc, result);
    }

    drawRisk(doc, result);
    
    if (result.news) {
        drawNews(doc, result);
    }
    
    drawConclusion(doc, result);

    drawWatermark(doc);
    drawFooter(doc);

    return doc;
}

export function downloadInvestmentReport(
    result: AnalysisResult
) {
    const doc = generateReport(result);

    const company =
        result.profile.companyName
            .replace(/\s+/g, "_");

    doc.save(`${company}_VERIQO_INTELLIGENCE.pdf`);
}