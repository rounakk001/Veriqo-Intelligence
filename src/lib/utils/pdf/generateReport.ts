import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import { drawCoverPage } from "./pdfCover";
import { drawSummary } from "./pdfSummary";
import { drawFinancials } from "./pdfFinancials";
import { drawCompetitors } from "./pdfCompetitors";
import { drawRisk } from "./pdfRisks";
import { drawFooter, drawWatermark } from "./pdfTheme";

export function generateReport(
    result: AnalysisResult
) {
    const doc = new jsPDF({
        unit: "mm",
        format: "a4",
    });

    drawCoverPage(doc, result);

    drawFinancials(doc, result);

    if (result.competitors?.length) {
        drawCompetitors(doc, result);
    }

    drawRisk(doc, result);

    drawSummary(doc, result);

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

    doc.save(`${company}_Investment_Report.pdf`);
}