import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import { PAGE, PDF_THEME, setTitle } from "./pdfTheme";
import {
    drawBadge,
    formatDate,
    recommendationColor,
} from "./pdfHelpers";

export function drawCoverPage(
    doc: jsPDF,
    result: AnalysisResult
) {
    // Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, PAGE.width, PAGE.height, "F");

    // Top Accent Bar
    doc.setFillColor(
        PDF_THEME.primary[0],
        PDF_THEME.primary[1],
        PDF_THEME.primary[2]
    );
    doc.rect(0, 0, PAGE.width, 12, "F");

    // Title
    setTitle(doc, "AI Investment Research Report");

    // Company Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(
        PDF_THEME.secondary[0],
        PDF_THEME.secondary[1],
        PDF_THEME.secondary[2]
    );

    doc.text(
        result.profile.companyName,
        PAGE.marginX,
        48
    );

    // Symbol
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");

    doc.text(
        `${result.profile.symbol} • ${result.profile.exchange}`,
        PAGE.marginX,
        58
    );

    // Recommendation Badge
    drawBadge(
        doc,
        result.verdict.toUpperCase(),
        PAGE.marginX,
        70,
        recommendationColor(result.verdict)
    );

    // Score Circle
    const centerX = 165;
    const centerY = 70;

    doc.setDrawColor(
        PDF_THEME.primary[0],
        PDF_THEME.primary[1],
        PDF_THEME.primary[2]
    );

    doc.setLineWidth(1.5);

    doc.circle(centerX, centerY, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);

    doc.text(
        String(result.score),
        centerX,
        centerY + 2,
        {
            align: "center",
        }
    );

    doc.setFontSize(9);

    doc.text(
        "/100",
        centerX,
        centerY + 9,
        {
            align: "center",
        }
    );

    // Generated Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        `Generated on ${formatDate()}`,
        PAGE.marginX,
        95
    );

    // Divider
    doc.setDrawColor(220, 220, 220);

    doc.line(
        PAGE.marginX,
        105,
        PAGE.width - PAGE.marginX,
        105
    );

    // Snapshot Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);

    doc.text(
        "Company Snapshot",
        PAGE.marginX,
        120
    );

    // Snapshot Box
    doc.roundedRect(
        PAGE.marginX,
        126,
        178,
        72,
        3,
        3
    );

    const rows = [
        ["Sector", result.profile.sector],
        ["Industry", result.profile.industry],
        ["Country", result.profile.country],
        ["Employees", result.profile.employees.toLocaleString()],
        ["Website", result.profile.website || "-"],
    ];

    let y = 138;

    rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        doc.text(label, 22, y);

        doc.setFont("helvetica", "normal");

        doc.text(String(value), 70, y);

        y += 12;
    });

    // Bottom Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text(
        "Executive Summary",
        PAGE.marginX,
        215
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const summary = doc.splitTextToSize(
        result.executiveSummary.summary,
        178
    );

    doc.text(
        summary,
        PAGE.marginX,
        225
    );

    // Next page
    doc.addPage();
}