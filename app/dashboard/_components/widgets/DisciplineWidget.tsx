"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";

/**
 * DisciplineWidget (Trading Plan + Score i ét)
 * - 2 x 4 regler
 * - Grøn/rød ring med ✓ / ✕
 * - Emojis til højre
 * - Dag/Uge/Måned toggle
 */

type Rule = {
    id: string;
    title: string;
    subtitle?: string;
    emoji?: string;
    // 0..1 for hvor ofte reglen holdes i perioden
    adherence: { day: number; week: number; month: number };
    // 0..1 for hvor “kritisk” reglen er (bruges i udvælgelse)
    importance: number;
};

type Props = { instanceId: string };

export default function DisciplineWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // === Stub: dine typiske team-regler (kan senere komme fra backend/form) ===
    const allRules = useMemo<Rule[]>(
        () => [
            {
                id: "r1",
                title: "Maks 1 tab i træk",
                subtitle: "Stop ved 1 rødt, gå væk i 30 min",
                emoji: "",
                adherence: { day: 0.92, week: 0.87, month: 0.84 },
                importance: 0.95,
            },
            {
                id: "r2",
                title: "RR ≥ 1.5",
                subtitle: "Tag kun setups med realiserbar R/R",
                emoji: "",
                adherence: { day: 0.78, week: 0.74, month: 0.71 },
                importance: 0.9,
            },
            {
                id: "r3",
                title: "Ingen revenge-trade",
                subtitle: "Cool-down 10 min efter tab",
                emoji: "",
                adherence: { day: 0.88, week: 0.83, month: 0.8 },
                importance: 0.96,
            },
            {
                id: "r4",
                title: "Følg setup tjekliste",
                subtitle: "Bias, niveau, trigger, stop, mål",
                emoji: "",
                adherence: { day: 0.82, week: 0.79, month: 0.76 },
                importance: 0.82,
            },
            {
                id: "r5",
                title: "Max risiko pr. trade: 0.5%",
                subtitle: "Skaler ned ved usikkerhed",
                emoji: "",
                adherence: { day: 0.74, week: 0.71, month: 0.69 },
                importance: 0.9,
            },
            {
                id: "r6",
                title: "Ingen handel før nyheder",
                subtitle: "10 min før/efter high impact",
                emoji: "",
                adherence: { day: 0.69, week: 0.67, month: 0.66 },
                importance: 0.78,
            },
            {
                id: "r7",
                title: "Vent på lukket trigger",
                subtitle: "Ingen forudindtagede entries",
                emoji: "️",
                adherence: { day: 0.81, week: 0.79, month: 0.77 },
                importance: 0.76,
            },
            {
                id: "r8",
                title: "Journal efter trade",
                subtitle: "Navn, setup, følelser, læring",
                emoji: "",
                adherence: { day: 0.6, week: 0.63, month: 0.65 },
                importance: 0.7,
            },
            {
                id: "r9",
                title: "Tag profit i zoner",
                subtitle: "Skaler ud, flyt SL fornuftigt",
                emoji: "",
                adherence: { day: 0.72, week: 0.7, month: 0.68 },
                importance: 0.74,
            },
            {
                id: "r10",
                title: "Ingen over-trading",
                subtitle: "Max 3 trades/dag",
                emoji: "",
                adherence: { day: 0.66, week: 0.64, month: 0.62 },
                importance: 0.82,
            },
        ],
        []
    );

    // === Udvælg 8 regler: mix af “mest brudte” og “mest overholdte” ===
    const picked = useMemo(() => {
        const key = (r: Rule) => r.adherence[period] ?? 0;
        const byBroken = [...allRules].sort((a, b) => key(a) - key(b)); // lavest adherence først
        const byKept = [...allRules].sort((a, b) => key(b) - key(a)); // højest adherence først

        const takeBroken = takeUnique(byBroken, 4);
        const takeKept = takeUnique(byKept, 4, new Set(takeBroken.map((r) => r.id)));

        // Interleave så de “flyder” sammen
        const out: Rule[] = [];
        for (let i = 0; i < 4; i++) {
            if (takeKept[i]) out.push(takeKept[i]);
            if (takeBroken[i]) out.push(takeBroken[i]);
        }
        return out.slice(0, 8);
    }, [allRules, period]);

    // Samlet efterlevelse for de 8 valgte (viser badge-tekst)
    const adherenceAvg = useMemo(() => {
        if (!picked.length) return 0;
        const sum = picked.reduce((s, r) => s + (r.adherence[period] ?? 0), 0);
        return sum / picked.length;
    }, [picked, period]);

    const adherencePct = Math.round(adherenceAvg * 100);
    const yay = adherencePct >= 85;

    return (
        <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    Trading Plan
                    <HelpTip text="De vigtigste regler udvalgt ud fra brud/efterlevelse for den valgte periode." />
                </div>

                <PeriodToggle
                    instanceId={instanceId}
                    slug="discipline"
                    defaultValue="day"
                    onChange={setPeriod}
                />
            </div>

            {/* Banner / feedback */}
            <div
                className="mt-3 rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm"
                role="status"
            >
                {yay ? (
                    <span>
            🎉 <strong>Yay!</strong> Du har fulgt din plan{" "}
                        <span className="text-emerald-300">{adherencePct}%</span> i{" "}
                        {label(period).toLowerCase()}.
          </span>
                ) : (
                    <span>
            💡 <strong>Husk:</strong> små justeringer slår store spring. Fokuser på 1–2
            regler ad gangen — du er på <span className="text-yellow-300">{adherencePct}%</span> i{" "}
                        {label(period).toLowerCase()}.
          </span>
                )}
            </div>

            {/* 2 × 4 grid (ingen scroll) */}
            <div className="mt-4 grid grid-cols-2 gap-3 flex-1">
                {picked.map((r) => {
                    const kept = (r.adherence[period] ?? 0) >= 0.75; // enkel tærskel for ✓/✕ pr. periode
                    return (
                        <div
                            key={r.id}
                            className="rounded-md border border-neutral-800 bg-neutral-900/40 px-3 py-2 flex items-center justify-between"
                            style={{ minHeight: 56 }}
                        >
                            {/* Venstre: ring + tekst */}
                            <div className="flex items-center gap-3 min-w-0">
                                <Ring kept={kept} />
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{r.title}</div>
                                    {r.subtitle && (
                                        <div className="text-xs text-neutral-400 truncate">
                                            {r.subtitle}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Højre: emoji */}
                            <div className="ml-3 shrink-0 text-2xl leading-none select-none">
                                {r.emoji ?? "⭐"}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ============= UI helpers ============= */

function label(p: PeriodValue) {
    if (p === "day") return "I dag";
    if (p === "week") return "Ugen";
    return "Måneden";
}

function takeUnique<T extends { id: string }>(arr: T[], n: number, seen = new Set<string>()) {
    const out: T[] = [];
    for (const x of arr) {
        if (out.length >= n) break;
        if (seen.has(x.id)) continue;
        seen.add(x.id);
        out.push(x);
    }
    return out;
}

/** Grøn/rød ring med ✓ / ✕ — samme visuelle vægt som to linjer tekst */
function Ring({ kept }: { kept: boolean }) {
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full border ${
                kept ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400"
            }`}
            style={{ width: 28, height: 28, fontSize: 16, lineHeight: 1 }}
            aria-label={kept ? "Fulgt" : "Brudt"}
            title={kept ? "Fulgt" : "Brudt"}
        >
      {kept ? "✓" : "✕"}
    </span>
    );
}
