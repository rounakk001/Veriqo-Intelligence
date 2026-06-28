import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import {
    PAGE,
    PDF_THEME,
    setSectionTitle,
} from "./pdfTheme";

import {
    ensurePageSpace,
    recommendationColor,
    drawBadge,
} from "./pdfHelpers";

function drawRecommendationHero(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    doc.setDrawColor(...PDF_THEME.primary);
    doc.setFillColor(248, 250, 252);

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        42,
        3,
        3,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...PDF_THEME.secondary);

    doc.text(
        result.profile.companyName,
        PAGE.marginX + 6,
        y + 12
    );

    drawBadge(
        doc,
        result.verdict.toUpperCase(),
        PAGE.width - 58,
        y + 6,
        recommendationColor(result.verdict)
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_THEME.text);

    doc.text(
        `${result.profile.symbol} • ${result.profile.exchange}`,
        PAGE.marginX + 6,
        y + 22
    );

    doc.text(
        `Overall Investment Score: ${result.score}/100`,
        PAGE.marginX + 6,
        y + 33
    );

    return y + 54;
}

function drawConfidenceCard(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    doc.setDrawColor(...PDF_THEME.border);

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        32,
        3,
        3
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text(
        "Confidence Level",
        PAGE.marginX + 6,
        y + 10
    );

    const percent =
        `${result.confidence}%`;

    let color = PDF_THEME.danger;

    if (result.confidence >= 80)
        color = PDF_THEME.success;
    else if (result.confidence >= 60)
        color = PDF_THEME.warning;

    doc.setFontSize(18);
    doc.setTextColor(...color);

    doc.text(
        percent,
        PAGE.width - 22,
        y + 18,
        {
            align: "right",
        }
    );

    doc.setTextColor(...PDF_THEME.text);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const reason =
        doc.splitTextToSize(
            result.executiveSummary.confidenceReason,
            PAGE.contentWidth - 12
        );

    doc.text(
        reason,
        PAGE.marginX + 6,
        y + 24
    );

    return y + 42;
}

function drawExecutiveSummary(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    setSectionTitle(
        doc,
        "Executive Summary",
        y
    );

    y += 16;

    const summary =
        doc.splitTextToSize(
            result.executiveSummary.summary,
            PAGE.contentWidth
        );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_THEME.text);

    doc.text(
        summary,
        PAGE.marginX,
        y
    );

    return (
        y +
        summary.length * 5 +
        12
    );
}

function drawRecommendationReason(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    y = ensurePageSpace(
        doc,
        y,
        70
    );

    setSectionTitle(
        doc,
        "Recommendation Rationale",
        y
    );

    y += 16;

    const text =
        doc.splitTextToSize(
            result.executiveSummary.recommendationReason,
            PAGE.contentWidth - 12
        );

    const height =
        text.length * 5 + 18;

    doc.setFillColor(
        245,
        250,
        255
    );

    doc.setDrawColor(
        ...PDF_THEME.primary
    );

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        height,
        3,
        3,
        "FD"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        text,
        PAGE.marginX + 6,
        y + 10
    );

    return y + height + 8;
}

export function drawSummary(
    doc: jsPDF,
    result: AnalysisResult
) {
    let y = PAGE.marginY;

    setSectionTitle(
        doc,
        "Final Investment Summary",
        y
    );

    y += 18;

    y = drawRecommendationHero(
        doc,
        result,
        y
    );

    y = drawConfidenceCard(
        doc,
        result,
        y
    );

    y = drawExecutiveSummary(
        doc,
        result,
        y
    );

    y = drawRecommendationReason(
        doc,
        result,
        y
    );
    return y;
}
