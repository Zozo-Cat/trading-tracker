// app/dashboard/_components/widgets/RiskPerTradeWidget.tsx
"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

/**
 * RiskPerTradeWidget
 * - Risk% pr. trade = (SL-distance × size) / balance * 100
 * - Mode:
 *    - "initial" (default): entry → første SL (planlagt risiko)
 *    - "current": entry → seneste/aktuelle SL (BE → ~0%)
 * - KPI: gennemsnitlig risk% (+ guideline badge)
 * - Histogram: fordeling i buckets
 * - Håndterer missing stops særskilt
 * - Hydration-safe (ingen randomness / Date.now() i markup)
 */

type Props = {
    instanceId: string;
    /** Brugerens guideline (i %) – fx [1, 2]. Default [1, 2]. */
    guideline?: number[];
    /** Hvordan risk% beregnes pr. trade. Default "initial". */
    riskMode?: "initial" | "current";
};

type Trade = {
    id: string;
    entry: number;          // pris ved entry
    stop?: number;          // seneste/aktuelle SL (kan være flyttet til BE)
    initialStop?: number;   // SL ved entry (bruges i "initial")
    size: number;           // lots/units
    balance: number;        // konto-balance (samme valuta)
};

function demoTrades(): Trade[] {
    return [
        // SL flyttet til BE → current≈0%, initial>0%
        { id: "t1", entry: 100, stop: 100, initialStop: 99,   size: 1000, balance: 10000 },
        { id: "t2", entry: 50,  stop: 49.5, initialStop: 49,  size: 2000, balance: 10000 },
        { id: "t3", entry: 75,  stop: 74,   initialStop: 74,  size: 500,  balance: 10000 },
        // mangler SL
        { id: "t4", entry: 100, /* stop: undefined */         size: 1000, balance: 10000 },
        { id: "t5", entry: 200, stop: 198,  initialStop: 198, size: 300,  balance: 10000 },
    ];
}

// ==== helpers ====
function riskPct(t: Trade, mode: "initial" | "current") {
    const refStop = mode === "initial" ? (t.initialStop ?? t.stop) : t.stop;
    if (refStop == null) return null;
    const stopDist = Math.abs(t.entry - refStop);
    const riskAmount = stopDist * t.size;
    return (riskAmount / t.balance) * 100;
}

const BUCKETS = [
    { key: "<1%", label: "<1%", min: 0, max: 1 },
    { key: "1-2%", label: "1–2%", min: 1, max: 2 },
    { key: "2-5%", label: "2–5%", min: 2, max: 5 },
    { key: ">5%", label: ">5%", min: 5 },
];

export default function RiskPerTradeWidget({
                                               instanceId,
                                               guideline,
                                               riskMode = "initial",
                                           }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const trades = useMemo(() => demoTrades(), [period]);

    // === Mode toggle (UI) ===
    const [mode, setMode] = useState<"initial" | "current">(riskMode);

    // === Guideline (Anbefalet vs Custom) ===
    const recommended = (guideline && guideline.length ? guideline : [1, 2]) as [number, number];
    const [guideMode, setGuideMode] = useState<"recommended" | "custom">("recommended");
    const [customGuide, setCustomGuide] = useState<{ min: number; max: number }>({
        min: recommended[0],
        max: recommended[1],
    });
    const guide: [number, number] =
        guideMode === "recommended" ? recommended : [customGuide.min, customGuide.max];

    const calc = useMemo(() => {
        const risks: number[] = [];
        let missing = 0;

        for (const t of trades) {
            const r = riskPct(t, mode);
            if (r == null) missing++;
            else risks.push(r);
        }

        if (!risks.length) {
            return {
                avg: null as number | null,
                min: 0,
                max: 0,
                buckets: [] as Array<{ key: string; label: string; count: number }>,
                total: 0,
                missing,
            };
        }

        const avg = risks.reduce((a, b) => a + b, 0) / risks.length;
        const min = Math.min(...risks);
        const max = Math.max(...risks);

        const buckets = BUCKETS.map((b) => {
            const count = risks.filter((r) => {
                if (b.min !== undefined && r < b.min) return false;
                if (b.max !== undefined && r >= b.max) return false;
                return true;
            }).length;
            return { key: b.key, label: b.label, count };
        });

        return { avg, min, max, buckets, total: risks.length, missing };
    }, [trades, mode]);

    const header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Risk per Trade</div>
                <HelpTip
                    text={`Risk% = (SL-distance × size) / balance. Målt som ${
                        mode === "initial" ? "planlagt risiko ved entry (entry→første SL)" : "nuværende SL (entry→seneste SL; BE≈0%)"
                    }. Guideline: ${guide[0]}–${guide[1]}%.`}
                />
            </div>

            {/* Right controls: Mode + Period */}
            <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-neutral-700">
                    <button
                        onClick={() => setMode("initial")}
                        className={`px-2 py-1 text-xs ${mode === "initial" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                        title="Brug første SL ved entry (planlagt risiko)"
                    >
                        Initial
                    </button>
                    <button
                        onClick={() => setMode("current")}
                        className={`px-2 py-1 text-xs ${mode === "current" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                        title="Brug nuværende/aktuel SL (BE≈0%)"
                    >
                        Current
                    </button>
                </div>

                <PeriodToggle instanceId={instanceId} slug="riskPerTrade" defaultValue="day" onChange={setPeriod} />
            </div>
        </div>
    );

    if (calc.avg === null) {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
                {header}
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen trades med gyldig stop-loss i perioden.
                </div>
            </div>
        );
    }

    const inGuideline = calc.avg >= guide[0] && calc.avg <= guide[1];

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {header}

            <div className="flex flex-col gap-3">
                {/* KPI + guideline badge + guideline controls */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                        <div className="text-3xl font-bold text-neutral-100">{calc.avg.toFixed(2)}%</div>
                        <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                                background: inGuideline ? "#10b98122" : "#ef444422",
                                color: inGuideline ? "#10b981" : "#ef4444",
                                border: `1px solid ${inGuideline ? "#10b98166" : "#ef444466"}`,
                            }}
                        >
              {inGuideline ? "Indenfor guideline" : "Udenfor guideline"}
            </span>
                    </div>

                    {/* Guideline selector (Anbefalet / Custom) */}
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden border border-neutral-700">
                            <button
                                onClick={() => setGuideMode("recommended")}
                                className={`px-2 py-1 text-xs ${guideMode === "recommended" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                                title="Anbefalet 1–2%"
                            >
                                Anbefalet
                            </button>
                            <button
                                onClick={() => setGuideMode("custom")}
                                className={`px-2 py-1 text-xs ${guideMode === "custom" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                                title="Sæt dit eget mål"
                            >
                                Custom
                            </button>
                        </div>

                        {guideMode === "custom" && (
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={customGuide.min}
                                    onChange={(e) => setCustomGuide((g) => ({ ...g, min: Number(e.target.value) }))}
                                    className="w-14 px-1 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-200"
                                    aria-label="Min guideline (%)"
                                    title="Min guideline (%)"
                                />
                                <span className="text-neutral-400">–</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={customGuide.max}
                                    onChange={(e) => setCustomGuide((g) => ({ ...g, max: Number(e.target.value) }))}
                                    className="w-14 px-1 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-200"
                                    aria-label="Max guideline (%)"
                                    title="Max guideline (%)"
                                />
                                <span className="text-neutral-400">%</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-xs text-neutral-400">
                    Gennemsnitlig risiko pr. trade · Min {calc.min.toFixed(2)}% · Max {calc.max.toFixed(2)}%
                </div>

                {/* Histogram */}
                <div className="flex flex-col gap-2">
                    {calc.buckets.map((b) => {
                        const pct = calc.total ? (b.count / calc.total) * 100 : 0;
                        return (
                            <div key={b.key} className="flex items-center gap-2">
                                <div className="w-16 text-xs text-neutral-300">{b.label}</div>
                                <div className="flex-1 h-4 bg-neutral-800 rounded">
                                    <div
                                        className="h-full rounded bg-blue-500 transition-all"
                                        style={{ width: `${pct}%` }}
                                        title={`${b.label}: ${b.count} trades`}
                                    />
                                </div>
                                <div className="w-8 text-right text-xs text-neutral-400">{b.count}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Missing stops note */}
                {calc.missing > 0 && (
                    <div className="text-xs text-yellow-400">
                        {calc.missing} trade{calc.missing === 1 ? "" : "s"} mangler stop – kan ikke beregne risiko.
                    </div>
                )}
            </div>
        </div>
    );
}
