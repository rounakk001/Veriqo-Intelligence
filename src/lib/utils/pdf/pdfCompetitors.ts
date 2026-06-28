import jsPDF from "jspdf";
import type {
    AnalysisResult,
    CompetitorComparison,
} from "@/types/agent";

import {
    PAGE,
    PDF_THEME,
    setSectionTitle,
} from "./pdfTheme";

import {
    ensurePageSpace,
    formatPercentage,
} from "./pdfHelpers";

const ROW_HEIGHT = 10;
const HEADER_HEIGHT = 9;

function scoreColor(score: number) {
    if (score >= 80) return PDF_THEME.success;
    if (score >= 60) return PDF_THEME.warning;
    return PDF_THEME.danger;
}

function drawScoreBadge(
    doc: jsPDF,
    score: number,
    x: number,
    y: number
) {
    const color = scoreColor(score);

    doc.setFillColor(...color);

    doc.roundedRect(
        x,
        y,
        18,
        8,
        2,
        2,
        "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.setTextColor(255, 255, 255);

    doc.text(
        `${score}`,
        x + 9,
        y + 5.4,
        {
            align: "center",
        }
    );

    doc.setTextColor(...PDF_THEME.text);
}

function drawCompanyCard(
    doc: jsPDF,
    company: CompetitorComparison,
    y: number
) {
    const height = 28;

    doc.setDrawColor(...PDF_THEME.border);
    doc.setFillColor(...PDF_THEME.background);

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        height,
        3,
        3,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);

    doc.text(
        company.companyName,
        PAGE.marginX + 6,
        y + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        company.symbol,
        PAGE.marginX + 6,
        y + 18
    );

    if (company.isCurrentCompany) {
        doc.setFillColor(...PDF_THEME.primary);

        doc.roundedRect(
            PAGE.width - 54,
            y + 6,
            30,
            8,
            2,
            2,
            "F"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        doc.text(
            "CURRENT",
            PAGE.width - 39,
            y + 11.5,
            {
                align: "center",
            }
        );

        doc.setTextColor(...PDF_THEME.text);
    }

    drawScoreBadge(
        doc,
        company.overallScore,
        PAGE.width - 46,
        y + 17
    );
}

function drawTableHeader(
    doc: jsPDF,
    y: number
) {
    doc.setFillColor(...PDF_THEME.primary);

    doc.rect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        HEADER_HEIGHT,
        "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.setTextColor(255, 255, 255);

    doc.text("Company", 20, y + 6);
    doc.text("Score", 95, y + 6);
    doc.text("Growth", 120, y + 6);
    doc.text("Health", 150, y + 6);
    doc.text("P/E", 182, y + 6, {
        align: "right",
    });
}

function drawCompetitorRow(
    doc: jsPDF,
    competitor: CompetitorComparison,
    y: number,
    shaded: boolean,
    rank: number
) {
    if (shaded) {
        doc.setFillColor(248, 250, 252);

        doc.rect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            ROW_HEIGHT,
            "F"
        );
    }

    if (competitor.isCurrentCompany) {
        doc.setFillColor(230, 255, 240);

        doc.rect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            ROW_HEIGHT,
            "F"
        );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
        `${rank}. ${competitor.companyName}`,
        20,
        y + 6
    );

    drawScoreBadge(
        doc,
        competitor.overallScore,
        88,
        y + 1
    );

    doc.setFont("helvetica", "normal");

    doc.text(
        formatPercentage(
            competitor.revenueGrowth
        ),
        120,
        y + 6
    );

    doc.text(
        competitor.healthScore.toString(),
        150,
        y + 6
    );

    doc.text(
        competitor.peRatio?.toFixed(1) ??
        "-",
        182,
        y + 6,
        {
            align: "right",
        }
    );

    doc.setDrawColor(...PDF_THEME.border);

    doc.line(
        PAGE.marginX,
        y + ROW_HEIGHT,
        PAGE.width - PAGE.marginX,
        y + ROW_HEIGHT
    );
}

function drawComparisonTable(
    doc: jsPDF,
    competitors: CompetitorComparison[],
    y: number
) {
    drawTableHeader(doc, y);

    y += HEADER_HEIGHT;

    competitors
        .sort(
            (a, b) =>
                b.overallScore -
                a.overallScore
        )
        .forEach((company, index) => {
            drawCompetitorRow(
                doc,
                company,
                y,
                index % 2 === 0,
                index + 1
            );

            y += ROW_HEIGHT;
        });

    return y + 10;
}

export function drawCompetitors(
    doc: jsPDF,
    result: AnalysisResult
) {
    if (
        !result.competitors ||
        result.competitors.length === 0
    ) {
        return;
    }

    let y = PAGE.marginY;

    setSectionTitle(
        doc,
        "Industry Competitor Analysis",
        y
    );

    y += 18;

    const current =
        result.competitors.find(
            c => c.isCurrentCompany
        );

    if (current) {
        drawCompanyCard(
            doc,
            current,
            y
        );

        y += 38;
    }

    y = ensurePageSpace(
        doc,
        y,
        120
    );

    y = drawComparisonTable(
        doc,
        [...result.competitors],
        y
    );
    function metricStatus(
        current: number | null,
        best: number | null,
        higherIsBetter = true
    ) {
        if (current == null || best == null) {
            return "N/A";
        }

        if (higherIsBetter) {
            if (current >= best) return "Leader";
            if (current >= best * 0.9) return "Competitive";
            return "Behind";
        }

        if (current <= best) return "Leader";
        if (current <= best * 1.1) return "Competitive";
        return "Behind";
    }

    function insightCard(
        doc: jsPDF,
        title: string,
        body: string,
        y: number
    ) {
        const lines = doc.splitTextToSize(
            body,
            PAGE.contentWidth - 10
        );

        const height =
            Math.max(
                22,
                lines.length * 5 + 14
            );

        doc.setDrawColor(...PDF_THEME.border);
        doc.setFillColor(...PDF_THEME.background);

        doc.roundedRect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            height,
            3,
            3,
            "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...PDF_THEME.secondary);

        doc.text(
            title,
            PAGE.marginX + 5,
            y + 8
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_THEME.text);

        doc.text(
            lines,
            PAGE.marginX + 5,
            y + 16
        );

        return y + height + 8;
    }

    function drawTopPerformer(
        doc: jsPDF,
        competitors: CompetitorComparison[],
        y: number
    ) {
        const best = [...competitors]
            .sort(
                (a, b) =>
                    b.overallScore -
                    a.overallScore
            )[0];

        doc.setFillColor(255, 248, 220);
        doc.setDrawColor(225, 180, 30);

        doc.roundedRect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            34,
            3,
            3,
            "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);

        doc.text(
            "Top Performer",
            PAGE.marginX + 6,
            y + 10
        );

        doc.setFontSize(12);

        doc.text(
            `${best.companyName} (${best.symbol})`,
            PAGE.marginX + 6,
            y + 20
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(
            `Overall Score: ${best.overallScore}/100`,
            PAGE.marginX + 6,
            y + 28
        );

        drawScoreBadge(
            doc,
            best.overallScore,
            PAGE.width - 42,
            y + 12
        );

        return y + 44;
    }

    function drawCompetitivePosition(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        const competitors =
            result.competitors ?? [];

        const current =
            competitors.find(
                c => c.isCurrentCompany
            );

        if (!current) return y;

        const bestGrowth = Math.max(
            ...competitors.map(
                c => c.revenueGrowth ?? -Infinity
            )
        );

        const bestHealth = Math.max(
            ...competitors.map(
                c => c.healthScore
            )
        );

        const bestProfitability =
            Math.max(
                ...competitors.map(
                    c => c.profitabilityScore
                )
            );

        const growthStatus = metricStatus(
            current.revenueGrowth,
            bestGrowth
        );

        const healthStatus = metricStatus(
            current.healthScore,
            bestHealth
        );

        const profitabilityStatus =
            metricStatus(
                current.profitabilityScore,
                bestProfitability
            );

        y = ensurePageSpace(
            doc,
            y,
            110
        );

        setSectionTitle(
            doc,
            "Competitive Position",
            y
        );

        y += 16;

        const rows = [
            [
                "Revenue Growth",
                growthStatus,
            ],
            [
                "Financial Health",
                healthStatus,
            ],
            [
                "Profitability",
                profitabilityStatus,
            ],
        ];

        rows.forEach(
            ([metric, status], index) => {
                const shaded =
                    index % 2 === 0;

                if (shaded) {
                    doc.setFillColor(
                        248,
                        250,
                        252
                    );

                    doc.rect(
                        PAGE.marginX,
                        y,
                        PAGE.contentWidth,
                        10,
                        "F"
                    );
                }

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(10);

                doc.text(
                    metric,
                    PAGE.marginX + 4,
                    y + 6
                );

                let color =
                    PDF_THEME.danger;

                if (
                    status ===
                    "Leader"
                )
                    color =
                        PDF_THEME.success;

                else if (
                    status ===
                    "Competitive"
                )
                    color =
                        PDF_THEME.warning;

                doc.setTextColor(
                    ...color
                );

                doc.text(
                    status,
                    PAGE.width - 22,
                    y + 6,
                    {
                        align:
                            "right",
                    }
                );

                doc.setTextColor(
                    ...PDF_THEME.text
                );

                y += 10;
            }
        );

        return y + 8;
    }

    function drawPeerInsights(
        doc: jsPDF,
        result: AnalysisResult,
        y: number
    ) {
        const current =
            result.competitors?.find(
                c => c.isCurrentCompany
            );

        if (!current) return y;

        const insight =
            `${current.companyName} currently holds an overall peer score of ${current.overallScore}/100. The company demonstrates ${current.healthScore >= 80 ? "strong" : current.healthScore >= 60 ? "healthy" : "weak"} financial health relative to competitors while maintaining ${current.profitabilityScore >= 80 ? "excellent" : current.profitabilityScore >= 60 ? "good" : "limited"} profitability. Revenue growth remains ${current.revenueGrowth != null && current.revenueGrowth > 0.1 ? "above industry expectations" : "within industry norms"}, indicating its current competitive standing within the sector.`;

        return insightCard(
            doc,
            "Peer Comparison Insights",
            insight,
            y
        );
    }
    y = ensurePageSpace(doc, y, 60);

    y = drawTopPerformer(
        doc,
        result.competitors,
        y
    );

    y = drawCompetitivePosition(
        doc,
        result,
        y
    );

    y = drawPeerInsights(
        doc,
        result,
        y
    );

    y = ensurePageSpace(doc, y, 110);

    setSectionTitle(
        doc,
        "Competitive Strengths & Weaknesses",
        y
    );

    y += 16;

   

    if (current) {
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (current.healthScore >= 80)
            strengths.push(
                "Excellent financial health compared to peers."
            );
        else if (current.healthScore < 60)
            weaknesses.push(
                "Financial health trails industry leaders."
            );

        if (current.profitabilityScore >= 80)
            strengths.push(
                "Industry-leading profitability."
            );
        else if (current.profitabilityScore < 60)
            weaknesses.push(
                "Profitability below peer average."
            );

        if (
            current.revenueGrowth != null &&
            current.revenueGrowth > 0.10
        )
            strengths.push(
                "Healthy revenue growth momentum."
            );
        else
            weaknesses.push(
                "Revenue growth could improve."
            );

        if (
            current.peRatio != null &&
            current.peRatio < 25
        )
            strengths.push(
                "Reasonable valuation relative to peers."
            );

        if (strengths.length === 0)
            strengths.push(
                "Stable market position."
            );

        if (weaknesses.length === 0)
            weaknesses.push(
                "No significant competitive weakness identified."
            );

        const drawList = (
            title: string,
            items: string[],
            startY: number,
            color: readonly [number, number, number]
        ) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...color);

            doc.text(
                title,
                PAGE.marginX,
                startY
            );

            startY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...PDF_THEME.text);

            items.forEach(item => {
                const lines =
                    doc.splitTextToSize(
                        item,
                        PAGE.contentWidth - 10
                    );

                doc.circle(
                    PAGE.marginX + 2,
                    startY - 1,
                    1.1,
                    "F"
                );

                doc.text(
                    lines,
                    PAGE.marginX + 7,
                    startY
                );

                startY +=
                    lines.length * 5 + 4;
            });

            return startY;
        };

        y = drawList(
            "Strengths",
            strengths,
            y,
            PDF_THEME.success
        );

        y += 6;

        y = drawList(
            "Weaknesses",
            weaknesses,
            y,
            PDF_THEME.danger
        );
    }

    y += 10;

    y = ensurePageSpace(doc, y, 90);

    setSectionTitle(
        doc,
        "Competitive Takeaway",
        y
    );

    y += 16;



    const rank =
        [...result.competitors]
            .sort(
                (a, b) =>
                    b.overallScore -
                    a.overallScore
            )
            .findIndex(
                c => c.isCurrentCompany
            ) + 1;

    const takeaway =
        `Among ${result.competitors.length} companies analysed, ${result.profile.companyName} ranks #${rank} with an overall peer score of ${current?.overallScore ?? "-"} /100. ${rank === 1 ? "The company leads its peer group in overall quality and financial strength." : "While not the top-ranked company, it remains competitive across key financial metrics."} Investors should evaluate this competitive position alongside valuation, financial health and long-term growth prospects before making an investment decision.`;

    const takeawayLines =
        doc.splitTextToSize(
            takeaway,
            PAGE.contentWidth - 12
        );

    const height =
        takeawayLines.length * 5 + 20;

    doc.setDrawColor(...PDF_THEME.primary);
    doc.setFillColor(245, 250, 255);

    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        height,
        3,
        3,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PDF_THEME.secondary);

    doc.text(
        "Executive Peer Summary",
        PAGE.marginX + 6,
        y + 9
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.text);

    doc.text(
        takeawayLines,
        PAGE.marginX + 6,
        y + 18
    );

    doc.addPage();
}