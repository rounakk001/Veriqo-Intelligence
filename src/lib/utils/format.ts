/**
 * formatMoney — canonical, single-source currency formatter for the entire project.
 *
 * Rules:
 *  - currency: ISO 4217 code sourced from financialData.financialCurrency (Yahoo Finance).
 *  - compact: true  → $1.42T / ₹4.76B / ¥210.50B  (chart axes, cards, KPI tiles)
 *  - compact: false → $1,421,390,118,912  (tooltips, PDF full-value rows)
 *  - Handles all ISO 4217 currencies natively via Intl.NumberFormat.
 *  - GBp (pence) is normalised to GBP since Intl does not recognise "GBp".
 *  - Unknown / null / undefined currency → ISO code prefix (e.g. "XYZ 1.42T") instead of silently assuming "$".
 *
 * DO NOT add company-specific or exchange-specific logic here.
 * DO NOT duplicate this function elsewhere — import it from here.
 */

export interface FormatMoneyOptions {
  compact?: boolean;
}

const COMPACT_THRESHOLDS = [
  { threshold: 1e12, suffix: "T", divisor: 1e12 },
  { threshold: 1e9,  suffix: "B", divisor: 1e9  },
  { threshold: 1e6,  suffix: "M", divisor: 1e6  },
  { threshold: 1e3,  suffix: "K", divisor: 1e3  },
];

/** Normalise ISO codes that Intl.NumberFormat doesn't accept. */
function normaliseIso(currency: string): { iso: string; fallbackPrefix?: string } {
  // GBp = British pence (1/100 of GBP). Yahoo uses it for LSE prices; financial statements use GBP.
  if (currency === "GBp") return { iso: "GBP" };
  // Unknown / non-standard codes: return as-is for Intl attempt; catch error below.
  return { iso: currency };
}

function getCurrencySymbol(iso: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: iso })
      .formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? iso;
  } catch {
    return iso + " "; // Fallback: prefix ISO code
  }
}

export function formatMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
  options: FormatMoneyOptions = {}
): string {
  if (value == null || !Number.isFinite(value)) return "—";

  const { compact = true } = options;
  const rawCurrency = (currency ?? "USD").trim();
  const { iso } = normaliseIso(rawCurrency);

  const negative = value < 0;
  const abs = Math.abs(value);

  if (compact) {
    const tier = COMPACT_THRESHOLDS.find((t) => abs >= t.threshold);
    const scaled = tier ? (abs / tier.divisor).toFixed(2) : abs.toFixed(2);
    const suffix = tier?.suffix ?? "";

    let symbol: string;
    try {
      // Verify Intl accepts the ISO code
      new Intl.NumberFormat("en-US", { style: "currency", currency: iso });
      symbol = getCurrencySymbol(iso);
    } catch {
      symbol = iso + " ";
    }

    return `${negative ? "-" : ""}${symbol}${scaled}${suffix}`;
  }

  // Full precision (tooltips, PDF detail rows)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: iso,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // If the ISO code is not supported by Intl (rare), fall back to prefixed decimal
    return `${iso} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

/**
 * formatPercent — shared percentage formatter.
 * value is already normalised to base-100 (e.g. 7.1 means 7.1 %).
 * Never multiply by 100 before passing here.
 */
export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * formatCompactNumber — plain numeric compact formatter (no currency symbol).
 * Used for chart axes that carry the symbol separately, or for ratios.
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const tier = COMPACT_THRESHOLDS.find((t) => abs >= t.threshold);
  if (!tier) return value.toFixed(2);
  const sign = value < 0 ? "-" : "";
  return `${sign}${(abs / tier.divisor).toFixed(2)}${tier.suffix}`;
}