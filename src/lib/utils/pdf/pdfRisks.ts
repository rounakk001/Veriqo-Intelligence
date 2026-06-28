import jsPDF from "jspdf";
import type {
    AnalysisResult,
    RiskItem,
} from "@/types/agent";

import {
    PAGE,
    PDF_THEME,
    setSectionTitle,
} from "./pdfTheme";

import {
    ensurePageSpace,
} from "./pdfHelpers";

function severityColor(
    severity: RiskItem["severity"]
) {
    switch (severity) {
        case "low":
            return PDF_THEME.success;

        case "medium":
            return PDF_THEME.warning;

        default:
            return PDF_THEME.danger;
    }
}

function riskLevelColor(
    level: AnalysisResult["risks"]["overallRiskLevel"]
) {
    switch (level) {
        case "low":
            return PDF_THEME.success;

        case "medium":
            return PDF_THEME.warning;

        default:
            return PDF_THEME.danger;
    }
}

function drawRiskBadge(
    doc: jsPDF,
    text: string,
    x: number,
    y: number
) {
    const color = riskLevelColor(
        text.toLowerCase() as
        | "low"
        | "medium"
        | "high"
    );

    doc.setFillColor(...color);

    doc.roundedRect(
        x,
        y,
        28,
        9,
        2,
        2,
        "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);

    doc.text(
        text.toUpperCase(),
        x + 14,
        y + 6,
        {
            align: "center",
        }
    );

    doc.setTextColor(...PDF_THEME.text);
}

function drawRiskScore(
    doc: jsPDF,
    score: number,
    x: number,
    y: number
) {
    const color =
        score <= 30
            ? PDF_THEME.success
            : score <= 60
                ? PDF_THEME.warning
                : PDF_THEME.danger;

    doc.setDrawColor(...color);
    doc.setLineWidth(2);

    doc.circle(x, y, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...color);

    doc.text(
        String(score),
        x,
        y + 2,
        {
            align: "center",
        }
    );

    doc.setFontSize(9);

    doc.text(
        "/100",
        x,
        y + 9,
        {
            align: "center",
        }
    );

    doc.setTextColor(...PDF_THEME.text);
}

function overviewSection(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    setSectionTitle(
        doc,
        "Risk Overview",
        y
    );

    y += 18;

    drawRiskScore(
        doc,
        result.risks.riskScore,
        42,
        y + 18
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text(
        "Overall Risk Level",
        70,
        y + 10
    );

    drawRiskBadge(
        doc,
        result.risks.overallRiskLevel,
        70,
        y + 16
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const summary =
        doc.splitTextToSize(
            result.risks.summary,
            110
        );

    doc.text(
        summary,
        70,
        y + 34
    );

    return y + 70;
}

function drawRiskTableHeader(
    doc: jsPDF,
    y: number
) {
    doc.setFillColor(...PDF_THEME.primary);

    doc.rect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        9,
        "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    doc.text(
        "Category",
        22,
        y + 6
    );

    doc.text(
        "Severity",
        110,
        y + 6
    );

    doc.text(
        "Description",
        195,
        y + 6,
        {
            align: "right",
        }
    );
}

function drawRiskRow(
    doc: jsPDF,
    risk: RiskItem,
    y: number,
    shaded: boolean
) {
    const desc =
        doc.splitTextToSize(
            risk.description,
            75
        );

    const rowHeight =
        Math.max(
            10,
            desc.length * 5 + 4
        );

    if (shaded) {
        doc.setFillColor(248, 250, 252);

        doc.rect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            rowHeight,
            "F"
        );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
        risk.category,
        22,
        y + 6
    );

    const color =
        severityColor(
            risk.severity
        );

    doc.setTextColor(...color);

    doc.text(
        risk.severity.toUpperCase(),
        110,
        y + 6
    );

    doc.setTextColor(...PDF_THEME.text);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        desc,
        195,
        y + 6,
        {
            align: "right"
        }
    );

    doc.setDrawColor(
        ...PDF_THEME.border
    );

    doc.line(
        PAGE.marginX,
        y + rowHeight,
        PAGE.width - PAGE.marginX,
        y + rowHeight
    );

    return y + rowHeight;
}

export function drawRisk(
    doc: jsPDF,
    result: AnalysisResult
) {
    let y = PAGE.marginY;

    y = overviewSection(
        doc,
        result,
        y
    );

    y = ensurePageSpace(
        doc,
        y,
        120
    );

    setSectionTitle(
        doc,
        "Risk Breakdown",
        y
    );

    y += 15;

    drawRiskTableHeader(
        doc,
        y
    );

    y += 9;

    result.risks.risks.forEach(
        (
            risk,
            index
        ) => {
            y = ensurePageSpace(
                doc,
                y,
                30
            );

            y = drawRiskRow(
                doc,
                risk,
                y,
                index % 2 === 0
            );
        }
    );
    function drawSeveritySummary(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        const risks = result.risks.risks;

        const high = risks.filter(
            r => r.severity === "high"
        ).length;

        const medium = risks.filter(
            r => r.severity === "medium"
        ).length;

        const low = risks.filter(
            r => r.severity === "low"
        ).length;

        y = ensurePageSpace(doc, y, 70);

        setSectionTitle(
            doc,
            "Risk Distribution",
            y
        );

        y += 16;

        const cards = [
            {
                title: "High",
                value: high,
                color: PDF_THEME.danger,
            },
            {
                title: "Medium",
                value: medium,
                color: PDF_THEME.warning,
            },
            {
                title: "Low",
                value: low,
                color: PDF_THEME.success,
            },
        ];

        const width = 54;

        cards.forEach((card, index) => {
            const x =
                PAGE.marginX +
                index * (width + 8);

            doc.setDrawColor(...PDF_THEME.border);

            doc.roundedRect(
                x,
                y,
                width,
                24,
                3,
                3
            );

            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(10);
            doc.setTextColor(
                ...card.color
            );

            doc.text(
                card.title,
                x + 5,
                y + 8
            );

            doc.setFontSize(16);

            doc.text(
                String(card.value),
                x + 5,
                y + 18
            );
        });

        return y + 36;
    }

    function drawCriticalRisks(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        const critical =
            result.risks.risks.filter(
                r =>
                    r.severity === "high"
            );

        if (!critical.length) {
            return y;
        }

        y = ensurePageSpace(
            doc,
            y,
            80
        );

        setSectionTitle(
            doc,
            "Critical Risk Alerts",
            y
        );

        y += 16;

        critical.forEach(risk => {
            const lines =
                doc.splitTextToSize(
                    risk.description,
                    PAGE.contentWidth - 18
                );

            const height =
                Math.max(
                    20,
                    lines.length * 5 + 14
                );

            doc.setFillColor(
                254,
                242,
                242
            );

            doc.setDrawColor(
                ...PDF_THEME.danger
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

            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(11);

            doc.setTextColor(
                ...PDF_THEME.danger
            );

            doc.text(
                risk.category,
                PAGE.marginX + 5,
                y + 8
            );

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(10);

            doc.setTextColor(
                ...PDF_THEME.text
            );

            doc.text(
                lines,
                PAGE.marginX + 5,
                y + 16
            );

            y += height + 8;
        });

        return y;
    }

    function drawMitigation(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        y = ensurePageSpace(
            doc,
            y,
            100
        );

        setSectionTitle(
            doc,
            "Risk Mitigation",
            y
        );

        y += 16;

        const suggestions =
            result.risks.risks.map(
                risk => {
                    switch (
                    risk.severity
                    ) {
                        case "high":
                            return `Prioritize monitoring ${risk.category.toLowerCase()} and reassess investment assumptions regularly.`;

                        case "medium":
                            return `Track ${risk.category.toLowerCase()} each quarter for meaningful changes.`;

                        default:
                            return `Continue routine monitoring of ${risk.category.toLowerCase()}.`;
                    }
                }
            );

        suggestions.forEach(
            suggestion => {
                doc.circle(
                    PAGE.marginX + 2,
                    y - 1,
                    1.2,
                    "F"
                );

                const lines =
                    doc.splitTextToSize(
                        suggestion,
                        PAGE.contentWidth - 10
                    );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(10);

                doc.text(
                    lines,
                    PAGE.marginX + 7,
                    y
                );

                y +=
                    lines.length * 5 +
                    4;
            }
        );

        return y;
    }

    function drawExecutiveRiskSummary(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        y = ensurePageSpace(
            doc,
            y,
            90
        );

        setSectionTitle(
            doc,
            "Executive Risk Summary",
            y
        );

        y += 16;

        const summary =
            `The overall investment risk is assessed as ${result.risks.overallRiskLevel.toUpperCase()} with a composite risk score of ${result.risks.riskScore}/100. ${result.risks.summary} Investors should evaluate these risks alongside the company's financial performance, competitive positioning and long-term growth outlook before making an investment decision.`;

        const lines =
            doc.splitTextToSize(
                summary,
                PAGE.contentWidth - 12
            );

        const height =
            lines.length * 5 + 18;

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

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(10);

        doc.text(
            lines,
            PAGE.marginX + 6,
            y + 10
        );

        return y + height + 10;
    }
    y += 10;

    y = drawSeveritySummary(
        doc,
        result,
        y
    );

    y = drawCriticalRisks(
        doc,
        result,
        y
    );

    y = drawMitigation(
        doc,
        result,
        y
    );

    y = drawExecutiveRiskSummary(
        doc,
        result,
        y
    );

    y = ensurePageSpace(
        doc,
        y,
        85
    );

    setSectionTitle(
        doc,
        "Investment Risk Takeaway",
        y
    );

    y += 16;

    const riskCount = result.risks.risks.length;
    const highCount = result.risks.risks.filter(
        r => r.severity === "high"
    ).length;

    const takeaway =
        `This analysis identified ${riskCount} material risk${riskCount === 1 ? "" : "s"}, including ${highCount} high-severity item${highCount === 1 ? "" : "s"}. The overall risk profile is classified as ${result.risks.overallRiskLevel.toUpperCase()} with a composite score of ${result.risks.riskScore}/100. While these risks should be considered carefully, they should also be weighed alongside the company's financial strength, competitive position, valuation, and long-term growth prospects before reaching an investment decision.`;

    const takeawayLines = doc.splitTextToSize(
        takeaway,
        PAGE.contentWidth - 12
    );

    const boxHeight =
        takeawayLines.length * 5 + 24;

    doc.setFillColor(245, 250, 255);
    doc.setDrawColor(...PDF_THEME.primary);

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        boxHeight,
        3,
        3,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PDF_THEME.secondary);

    doc.text(
        "Risk Assessment Conclusion",
        PAGE.marginX + 6,
        y + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.text);

    doc.text(
        takeawayLines,
        PAGE.marginX + 6,
        y + 20
    );

    doc.addPage();
}