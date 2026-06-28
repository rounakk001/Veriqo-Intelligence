import jsPDF from "jspdf";
import type { AnalysisResult } from "@/types/agent";

import {
    PAGE,
    PDF_THEME,
    setSectionTitle,
} from "./pdfTheme";

import {
    ensurePageSpace,
    formatCurrency,
    formatPercentage,
} from "./pdfHelpers";

const CARD_HEIGHT = 22;
const CARD_WIDTH = 84;
const GAP = 10;

function card(
    doc: jsPDF,
    title: string,
    value: string,
    x: number,
    y: number
) {
    doc.setDrawColor(...PDF_THEME.border);
    doc.setFillColor(...PDF_THEME.background);

    doc.roundedRect(
        x,
        y,
        CARD_WIDTH,
        CARD_HEIGHT,
        2,
        2,
        "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.muted);

    doc.text(title, x + 5, y + 7);

    doc.setFontSize(13);
    doc.setTextColor(...PDF_THEME.secondary);

    doc.text(value, x + 5, y + 16);
}

function scoreCard(
    doc: jsPDF,
    title: string,
    score: number,
    x: number,
    y: number
) {
    let color: readonly [number, number, number] =
        PDF_THEME.danger;

    if (score >= 80)
        color = PDF_THEME.success;
    else if (score >= 60)
        color = PDF_THEME.warning;

    doc.setDrawColor(...PDF_THEME.border);

    doc.roundedRect(
        x,
        y,
        CARD_WIDTH,
        CARD_HEIGHT,
        2,
        2
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.muted);

    doc.text(title, x + 5, y + 7);

    doc.setFontSize(16);

    doc.setTextColor(...color);

    doc.text(
        `${score}/100`,
        x + 5,
        y + 16
    );
}

function tableHeader(
    doc: jsPDF,
    y: number
) {
    doc.setFillColor(...PDF_THEME.primary);

    doc.rect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        8,
        "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);

    doc.text("Metric", 22, y + 5.5);

    doc.text(
        "Value",
        PAGE.width - 25,
        y + 5.5,
        {
            align: "right",
        }
    );
}

function tableRow(
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    shaded = false
) {
    if (shaded) {
        doc.setFillColor(249, 250, 251);

        doc.rect(
            PAGE.marginX,
            y,
            PAGE.contentWidth,
            8,
            "F"
        );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.setTextColor(...PDF_THEME.secondary);

    doc.text(label, 22, y + 5);

    doc.setFont("helvetica", "bold");

    doc.text(
        value,
        PAGE.width - 25,
        y + 5,
        {
            align: "right",
        }
    );

    doc.setDrawColor(...PDF_THEME.border);

    doc.line(
        PAGE.marginX,
        y + 8,
        PAGE.width - PAGE.marginX,
        y + 8
    );
}

function financialHealthSection(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const f = result.financials;

    card(
        doc,
        "Market Cap",
        formatCurrency(f.marketCap),
        PAGE.marginX,
        y
    );

    card(
        doc,
        "Enterprise Value",
        formatCurrency(
            f.enterpriseValue
        ),
        PAGE.marginX + CARD_WIDTH + GAP,
        y
    );

    y += CARD_HEIGHT + 8;

    card(
        doc,
        "Revenue",
        formatCurrency(f.revenue),
        PAGE.marginX,
        y
    );

    card(
        doc,
        "Net Income",
        formatCurrency(
            f.netIncome
        ),
        PAGE.marginX + CARD_WIDTH + GAP,
        y
    );

    y += CARD_HEIGHT + 8;

    card(
        doc,
        "Operating Cash Flow",
        formatCurrency(
            f.operatingCashFlow
        ),
        PAGE.marginX,
        y
    );

    card(
        doc,
        "Free Cash Flow",
        formatCurrency(
            f.freeCashFlow
        ),
        PAGE.marginX + CARD_WIDTH + GAP,
        y
    );

    y += CARD_HEIGHT + 12;

    scoreCard(
        doc,
        "Financial Health",
        f.healthScore,
        PAGE.marginX,
        y
    );

    scoreCard(
        doc,
        "Growth Score",
        f.growthScore,
        PAGE.marginX + CARD_WIDTH + GAP,
        y
    );

    y += CARD_HEIGHT + 8;

    scoreCard(
        doc,
        "Profitability",
        f.profitabilityScore,
        PAGE.marginX,
        y
    );

    return y + 32;
}

function valuationTable(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const f = result.financials;

    setSectionTitle(
        doc,
        "Valuation Metrics",
        y
    );

    y += 14;

    tableHeader(doc, y);

    y += 8;

    tableRow(
        doc,
        "Market Capitalization",
        formatCurrency(
            f.marketCap
        ),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Enterprise Value",
        formatCurrency(
            f.enterpriseValue
        ),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Price / Earnings",
        String(f.peRatio ?? "-"),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "PEG Ratio",
        String(f.pegRatio ?? "-"),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Price / Book",
        String(f.priceToBook ?? "-"),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Trailing EPS",
        String(
            f.trailingEps ?? "-"
        ),
        y
    );

    return y + 18;
}

export function drawFinancials(
    doc: jsPDF,
    result: AnalysisResult
) {
    let y = PAGE.marginY;

    setSectionTitle(
        doc,
        "Financial Overview",
        y
    );

    y += 16;

    y = financialHealthSection(
        doc,
        result,
        y
    );

    y = ensurePageSpace(
        doc,
        y,
        100
    );
    
    y = valuationTable(
        doc,
        result,
        y
    );

    y = profitabilityTable(
        doc,
        result,
        y
    );

    y = liquidityTable(
        doc,
        result,
        y
    );

    y = growthTable(
        doc,
        result,
        y
    );

    y = analysisCards(
        doc,
        result,
        y
    );

    y = ensurePageSpace(doc, y, 70);

    setSectionTitle(
        doc,
        "Financial Highlights",
        y
    );

    y += 16;

    const highlights = [
        `Revenue: ${formatCurrency(result.financials.revenue)}`,
        `Net Income: ${formatCurrency(result.financials.netIncome)}`,
        `Free Cash Flow: ${formatCurrency(result.financials.freeCashFlow)}`,
        `Market Capitalization: ${formatCurrency(result.financials.marketCap)}`,
        `Revenue Growth: ${formatPercentage(result.financials.revenueGrowth)}`,
        `Net Margin: ${formatPercentage(result.financials.netMargin)}`,
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_THEME.text);

    highlights.forEach((item) => {
        doc.circle(PAGE.marginX + 2, y - 1, 1.2, "F");
        doc.text(item, PAGE.marginX + 7, y);
        y += 8;
    });

    y += 8;

    y = ensurePageSpace(doc, y, 80);

    setSectionTitle(
        doc,
        "Overall Financial Assessment",
        y
    );

    y += 16;

    const assessment = [
        `Financial Health: ${result.financials.analysis.financialHealth}`,
        `Profitability: ${result.financials.analysis.profitability}`,
        `Debt Position: ${result.financials.analysis.debtLevel}`,
    ].join("\n\n");

    const lines = doc.splitTextToSize(
        assessment,
        PAGE.contentWidth
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_THEME.text);

    doc.text(
        lines,
        PAGE.marginX,
        y
    );

    y += lines.length * 6 + 12;

    y = ensurePageSpace(doc, y, 70);

    doc.setDrawColor(...PDF_THEME.primary);
    doc.setFillColor(245, 250, 255);

    const boxHeight = 42;

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
        "Financial Summary",
        PAGE.marginX + 6,
        y + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.text);

    const summary = doc.splitTextToSize(
        `The company demonstrates a financial health score of ${result.financials.healthScore}/100, profitability score of ${result.financials.profitabilityScore}/100 and growth score of ${result.financials.growthScore}/100. Combined with positive cash flow generation and current valuation metrics, these indicators provide the quantitative foundation for the final investment recommendation presented later in this report.`,
        PAGE.contentWidth - 12
    );

    doc.text(
        summary,
        PAGE.marginX + 6,
        y + 18
    );

    doc.addPage();
}
function profitabilityTable(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const f = result.financials;

    y = ensurePageSpace(doc, y, 90);

    setSectionTitle(
        doc,
        "Profitability Metrics",
        y
    );

    y += 14;

    tableHeader(doc, y);

    y += 8;

    tableRow(
        doc,
        "Return on Equity (ROE)",
        formatPercentage(f.returnOnEquity),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Return on Assets (ROA)",
        formatPercentage(f.returnOnAssets),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Gross Margin",
        formatPercentage(f.grossMargin),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Operating Margin",
        formatPercentage(f.operatingMargin),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Net Margin",
        formatPercentage(f.netMargin),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "EBITDA Margin",
        formatPercentage(f.ebitdaMargin),
        y
    );

    return y + 18;
}

function liquidityTable(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const f = result.financials;

    y = ensurePageSpace(doc, y, 90);

    setSectionTitle(
        doc,
        "Liquidity & Debt",
        y
    );

    y += 14;

    tableHeader(doc, y);

    y += 8;

    tableRow(
        doc,
        "Cash & Equivalents",
        formatCurrency(f.cashAndEquivalents),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Operating Cash Flow",
        formatCurrency(f.operatingCashFlow),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Free Cash Flow",
        formatCurrency(f.freeCashFlow),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Total Debt",
        formatCurrency(f.totalDebt),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Debt / Equity",
        f.debtToEquity?.toFixed(2) ?? "-",
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Current Ratio",
        f.currentRatio?.toFixed(2) ?? "-",
        y
    );

    y += 8;

    tableRow(
        doc,
        "Quick Ratio",
        f.quickRatio?.toFixed(2) ?? "-",
        y,
        true
    );

    return y + 18;
}

function growthTable(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const f = result.financials;

    y = ensurePageSpace(doc, y, 90);

    setSectionTitle(
        doc,
        "Growth Analysis",
        y
    );

    y += 14;

    tableHeader(doc, y);

    y += 8;

    tableRow(
        doc,
        "Revenue Growth",
        formatPercentage(f.revenueGrowth),
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Dividend Yield",
        formatPercentage(f.dividendYield),
        y
    );

    y += 8;

    tableRow(
        doc,
        "Health Score",
        `${f.healthScore}/100`,
        y,
        true
    );

    y += 8;

    tableRow(
        doc,
        "Profitability Score",
        `${f.profitabilityScore}/100`,
        y
    );

    y += 8;

    tableRow(
        doc,
        "Growth Score",
        `${f.growthScore}/100`,
        y,
        true
    );

    return y + 18;
}

function analysisCards(
    doc: jsPDF,
    result: AnalysisResult,
    y: number
) {
    const analysis = result.financials.analysis;

    y = ensurePageSpace(doc, y, 80);

    setSectionTitle(
        doc,
        "Financial Analysis",
        y
    );

    y += 16;

    const width = PAGE.contentWidth;

    const drawAnalysisCard = (
        title: string,
        body: string,
        top: number
    ) => {
        const lines = doc.splitTextToSize(
            body,
            width - 10
        );

        const height =
            Math.max(
                18,
                lines.length * 5 + 12
            );

        doc.setDrawColor(...PDF_THEME.border);
        doc.setFillColor(...PDF_THEME.background);

        doc.roundedRect(
            PAGE.marginX,
            top,
            width,
            height,
            2,
            2,
            "FD"
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.setTextColor(
            ...PDF_THEME.secondary
        );

        doc.text(
            title,
            PAGE.marginX + 5,
            top + 7
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
            top + 14
        );

        return top + height + 8;
    };

    y = drawAnalysisCard(
        "Financial Health",
        analysis.financialHealth,
        y
    );

    y = drawAnalysisCard(
        "Profitability",
        analysis.profitability,
        y
    );

    y = drawAnalysisCard(
        "Debt Analysis",
        analysis.debtLevel,
        y
    );

    return y;
}
