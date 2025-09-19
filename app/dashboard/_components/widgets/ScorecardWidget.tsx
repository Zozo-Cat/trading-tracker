"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * ScorecardWidget (hydration-safe)
 * - Viser kort status for overholdelse af Tradingplanen
 * - Demo-data er deterministiske via seededRng(instanceId + period)
 * - Ingen <title>-noder i SVG, ingen Date.now – stabil SSR/CSR
 */

type Props = { instanceId: string };

// De 10 vigtigste regler (kun vis de første 6 i listen)
const RULES: string[] = [
    "Flyt SL til BE først efter 1R",
    "Ingen trades ±30 min før røde nyheder",
    "Følg tidsvinduer (fx 08–11, 14–16)",
    "Screenshot før entry",
    "Min. R/R ≥ 1:2 ved entry",
    "Journal-notat inden entry",
    "Risiko ≤ 1–2% pr. trade",
    "Kun handle whitelisted instrumenter",
    "Max 3 trades pr. dag",
    "Brug fast exit-plan (TP/SL) pr. strategi",
];

type RuleState = { name: string; passed: boolean };

function synthRules(instanceId: string, period: PeriodValue): RuleState[] {
    // Eget seed pr. periode → stabil, men forskellig for Day/Week/Month
    const rng = seededRng(`${instanceId}::scorecard::${period}`);
    // “Sværhedsgrad”: lidt lettere at bestå over en dag end uge/måned
    const thresholds: Record<PeriodValue, number> = {
        day: 0.25,
        week: 0.35,
        month: 0.45,
    };
    const th = thresholds[period];

    return RULES.map((name, i) => ({
        name,
        // deterministisk: jo længere nede på listen, jo en anelse sværere
        passed: rng() > Math.min(0.7, th + i * 0.02),
    }));
}

export default function ScorecardWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    const allRules = useMemo(
        () => synthRules(instanceId, period),
        [instanceId, period]
    );

    const top6 = allRules.slice(0, 6);
    const total = allRules.length;
    const passed = allRules.filter((r) => r.passed).length;
    const failed = total - passed;

    // Total score = (#bestået / total) * 100 (afrundet)
    const score = Math.round((passed / Math.max(1, total)) * 100);

    // “Dage i stime” – deterministisk pr. periode
    const streak = useMemo(() => {
        const r = seededRng(`${instanceId}::scorecard::streak::${period}`);
        return Math.floor(r() * 6); // 0..5
    }, [instanceId, period]);

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Scorecard</div>
                    <HelpTip text="Kort status for overholdelse af dine vigtigste regler i Tradingplanen. Detaljer og historik findes i fuldt scorecard." />
                </div>

                <PeriodToggle
                    instanceId={instanceId}
                    slug="scorecard"
                    defaultValue="day"
                    onChange={setPeriod}
                />
            </div>

            {/* KPI række */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <KpiBig label="Total score" value={`${score}/100`} />
                <KpiSmall label="Regler fulgt" value={`${passed}/${total}`} />
                <KpiSmall label="Afvigelser" value={`${failed}`} tone="warn" />
                <KpiSmall label="Dage i stime" value={`${streak}`} />
            </div>

            {/* Regelliste (maks 6) */}
            <div className="space-y-2">
                {top6.map((r, idx) => (
                    <RuleRow key={idx} index={idx + 1} name={r.name} passed={r.passed} />
                ))}
            </div>

            {/* Footer-link (placeholder til rigtig side senere) */}
            <div className="mt-4 text-right">
                <a
                    href="/dashboard/scorecard"
                    className="text-sm text-neutral-300 hover:text-neutral-100 underline underline-offset-4"
                >
                    Se fuldt scorecard
                </a>
            </div>
        </div>
    );
}

/* =================== UI subkomponenter =================== */

function KpiBig({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-neutral-700 p-3">
            <div className="text-sm text-neutral-400">{label}</div>
            <div className="text-2xl font-semibold text-neutral-100">{value}</div>
        </div>
    );
}

function KpiSmall({
                      label,
                      value,
                      tone = "default",
                  }: {
    label: string;
    value: string;
    tone?: "default" | "warn";
}) {
    const color = tone === "warn" ? "#ef4444" : "#10b981";
    return (
        <div className="rounded-lg border border-neutral-700 p-3">
            <div className="text-sm text-neutral-400">{label}</div>
            <div className="text-lg font-semibold" style={{ color }}>
                {value}
            </div>
        </div>
    );
}

function RuleRow({
                     index,
                     name,
                     passed,
                 }: {
    index: number;
    name: string;
    passed: boolean;
}) {
    const bg =
        "rounded-md border border-neutral-700 px-3 py-2 flex items-center justify-between";
    return (
        <div className={bg}>
            <div className="flex items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-700 text-neutral-200 text-xs">
          {index}
        </span>
                <span className="text-sm text-neutral-200">{name}</span>
            </div>
            <span
                className={
                    passed
                        ? "text-emerald-400 text-sm font-medium"
                        : "text-amber-400 text-sm font-medium"
                }
                aria-label={passed ? "Bestået" : "Afvigelse"}
            >
        {passed ? "✅" : "⚠️"}
      </span>
        </div>
    );
}
