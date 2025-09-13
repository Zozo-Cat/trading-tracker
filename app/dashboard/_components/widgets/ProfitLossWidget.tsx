"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

type Props = {
    instanceId: string;
};

/* ========================
   Stubs (kan udskiftes senere)
   ======================== */

// Fallback for display currency (senere: læs fra brugerindstillinger)
function useDisplayCurrency() {
    return "USD" as const;
}

// Fallback kontoliste (senere: hent rigtige konti)
type Account = { id: string; name: string; currency: "USD" | "EUR" | "DKK" };
function useAccounts(): Account[] {
    return [
        { id: "acc-usd", name: "Main USD", currency: "USD" },
        { id: "acc-eur", name: "Swing EUR", currency: "EUR" },
    ];
}

// Fallback konvertering (senere: brug FX-kurser)
function convert(amount: number, from: string, to: string) {
    if (!Number.isFinite(amount)) return 0;
    if (from === to) return amount;
    // TODO: erstat med rigtig konvertering
    return amount;
}

// Formatter ud fra display currency
function makeCurrencyFormatter(currency: string) {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency });
    } catch {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    }
}

/* ========================
   Widget
   ======================== */

export default function ProfitLossWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const accounts = useAccounts();
    const displayCurrency = useDisplayCurrency();

    // Account filter: "all" eller specifik account.id
    const [accountFilter, setAccountFilter] = useState<"all" | string>("all");

    // Dummy datasets pr. konto og periode (senere: erstat med rigtige data)
    const rawSeriesByAccount = useMemo(() => {
        const base =
            period === "day"
                ? [200, -120, 50, 180, -60, 90]
                : period === "week"
                    ? [450, -220, 180, 90, 130, -75, 210]
                    : [800, -300, 220, 140, -120, 260, 90, -60, 110, 75, -40, 180];

        const map: Record<string, number[]> = {};
        for (const acc of accounts) {
            const factor = acc.currency === "EUR" ? 0.9 : 1;
            map[acc.id] = base.map((v, i) => Math.round(v * factor + (i % 3 === 0 ? 15 : 0)));
        }
        return map;
    }, [accounts, period]);

    // Historisk gennemsnit til badge (samme granularitet)
    const historicalAvgByAccount = useMemo(() => {
        const base = period === "day" ? 120 : period === "week" ? 320 : 640;
        const map: Record<string, number> = {};
        for (const acc of accounts) {
            const factor = acc.currency === "EUR" ? 0.9 : 1;
            map[acc.id] = Math.round(base * factor);
        }
        return map;
    }, [accounts, period]);

    // Saml data for valgt filter og konverter til display currency
    const { totalPL, avgBenchmark } = useMemo(() => {
        const chosen = accountFilter === "all" ? accounts.map((a) => a.id) : [accountFilter];
        let total = 0;
        let bench = 0;

        for (const accId of chosen) {
            const acc = accounts.find((a) => a.id === accId);
            if (!acc) continue;
            const series = rawSeriesByAccount[accId] || [];
            const sum = series.reduce((s, n) => s + n, 0);
            total += convert(sum, acc.currency, displayCurrency);
            bench += convert(historicalAvgByAccount[accId] || 0, acc.currency, displayCurrency);
        }
        return { totalPL: total, avgBenchmark: bench };
    }, [accountFilter, accounts, rawSeriesByAccount, historicalAvgByAccount, displayCurrency]);

    const fmt = makeCurrencyFormatter(displayCurrency);

    // KPI farve (grøn / rød / brand-guld for 0)
    const kpiColor = totalPL > 0 ? "#10b981" : totalPL < 0 ? "#ef4444" : "#D4AF37";

    // Badge (% diff mod gennemsnit), null hvis bench=0 eller mangler
    const badge = useMemo(() => {
        if (!Number.isFinite(avgBenchmark) || avgBenchmark === 0) return null;
        const diff = ((totalPL - avgBenchmark) / Math.abs(avgBenchmark)) * 100;
        const abs = Math.abs(diff);
        let color = "#D4AF37";
        let arrow = "→"; // neutral
        if (diff >= 5) {
            color = "#10b981";
            arrow = "▲"; // tydelig op-pil
        } else if (diff <= -5) {
            color = "#ef4444";
            arrow = "▼"; // tydelig ned-pil
        }
        return { arrow, percentText: `${diff >= 0 ? "+" : "-"}${abs.toFixed(0)}%`, color };
    }, [totalPL, avgBenchmark]);

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header: Titel + help + controls */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Profit / Loss</div>
                    <HelpTip text="Netto realiseret P/L i valgt periode" />
                </div>

                <div className="flex items-center gap-3">
                    {/* Account filter */}
                    <label className="sr-only" htmlFor={`${instanceId}-acc`}>
                        Konto
                    </label>
                    <select
                        id={`${instanceId}-acc`}
                        className="text-sm rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1
                       focus:outline-none focus:ring-2 focus:ring-neutral-500"
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value as any)}
                        aria-label="Konto"
                    >
                        <option value="all">All accounts</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({a.currency})
                            </option>
                        ))}
                    </select>

                    <PeriodToggle
                        instanceId={instanceId}
                        slug="profitLoss"
                        defaultValue="day"
                        onChange={setPeriod}
                    />
                </div>
            </div>

            {/* KPI + badge (pilen ved tallet) */}
            <div className="flex items-baseline justify-between gap-6">
                <div className="flex flex-col">
                    <div className="text-sm text-neutral-400">Netto P/L</div>

                    {/* Tallet + badge ved siden af */}
                    <div className="flex items-center gap-2">
                        <div className="text-3xl font-semibold" style={{ color: kpiColor }} aria-live="polite">
                            {formatWithSign(totalPL, fmt)}
                        </div>

                        {/* Badge: tydelig pil + procent med hover-tooltip */}
                        {badge ? (
                            <TooltipBadge
                                arrow={badge.arrow}
                                percentText={badge.percentText}
                                color={badge.color}
                                tooltip={`Sammenlignet med gennemsnitligt ${label(period)}-P/L (samme konto-filter)`}
                            />
                        ) : (
                            <span className="text-xs text-neutral-500" title="Ingen historik til gennemsnit endnu">
                —
              </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Skærmlæsertekst */}
            <p className="sr-only">
                Profit og tab i valgt periode er {fmt.format(totalPL)} i {displayCurrency} for {label(period)}.
            </p>
        </div>
    );
}

/* ======= Hjælpere ======= */

function label(p: PeriodValue) {
    if (p === "day") return "I dag";
    if (p === "week") return "Uge";
    return "Måned";
}

function formatWithSign(value: number, fmt: Intl.NumberFormat) {
    const abs = Math.abs(value);
    const formatted = fmt.format(abs);
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
}

/**
 * Lille badge med tydelig pil og hover-tooltip.
 * Viser ↑ / ↓ / → og procenttekst, med stærk kontrastkant.
 */
function TooltipBadge({
                          arrow,
                          percentText,
                          color,
                          tooltip,
                      }: {
    arrow: "▲" | "▼" | "→";
    percentText: string;
    color: string;
    tooltip: string;
}) {
    return (
        <span className="relative inline-flex items-center group">
      {/* Badge */}
            <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-md border select-none"
                style={{ color, borderColor: color }}
            >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{arrow}</span>
                {percentText}
      </span>

            {/* Tooltip (vises på hover/focus) */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 hidden
                   whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100
                   text-xs px-3 py-2 shadow-lg group-hover:block group-focus-within:block"
            >
        {tooltip}
      </span>
    </span>
    );
}
