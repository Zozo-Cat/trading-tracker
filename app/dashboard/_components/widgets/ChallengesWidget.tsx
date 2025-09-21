// app/dashboard/_components/widgets/ChallengesWidget.tsx
"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * ChallengesWidget (kompakt)
 * - Donut progress mod profit target (ingen tredjeparts charts)
 * - Virker for både "Personal" og "Prop/Funded"-agtige challenges
 * - Liten fact-boks: Target %, P/L %, Dage tilbage, Fase/Type
 * - Dropdown til at vælge mellem brugerens challenges (hvis flere)
 * - Hydration-safe demo/seed (deterministisk via seededRng)
 *
 * NB: Returnerer KUN widget-indhold (ingen yder-ramme). /dashboard wrapper i WidgetChrome.
 */

type Props = { instanceId: string };

type ChallengeType = "Personal" | "Prop";
type ChallengePhase = "Phase 1" | "Phase 2" | "Verification" | "Live";

type Challenge = {
    id: string;
    name: string;
    type: ChallengeType;
    broker?: string;            // valgfri ved Personal
    currency: "USD" | "EUR" | "DKK";
    startBalance: number;       // bruges også til Personal for enkel visning
    currentEquity: number;      // equity nu
    profitTargetPct: number;    // fx 8
    daysTotal: number;          // challenge længde
    daysElapsed: number;
    phase?: ChallengePhase;     // mest relevant for Prop
};

export default function ChallengesWidget({ instanceId }: Props) {
    const rng = useMemo(() => seededRng(`${instanceId}::challenges-compact`), [instanceId]);
    const challenges = useMemo<Challenge[]>(() => seedChallenges(rng), [rng]);

    const [activeId, setActiveId] = useState(challenges[0]?.id ?? "");

    const active = useMemo(
        () => challenges.find((c) => c.id === activeId) ?? challenges[0],
        [activeId, challenges]
    );

    if (!active) {
        return (
            <div className="rounded-xl border border-neutral-800 p-4 text-sm text-neutral-400">
                Ingen challenges endnu. Opret dem under Min side.
            </div>
        );
    }

    // Afledte værdier
    const pnlAbs = active.currentEquity - active.startBalance;
    const pnlPct = pct(pnlAbs, active.startBalance);
    const targetAbs = (active.startBalance * active.profitTargetPct) / 100;
    const progressToTargetPct = clamp((pnlAbs / targetAbs) * 100, -50, 150); // tillad lidt under/over

    const daysLeft = Math.max(0, active.daysTotal - active.daysElapsed);

    // Farvevalg til donut
    const donutTone =
        progressToTargetPct >= 100 ? "ok" : progressToTargetPct >= 0 ? "prog" : "neg";

    return (
        <div className="space-y-4">
            {/* Mikro-headerlinje */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    Challenge-overblik
                    <HelpTip text="Se fremdrift mod dit profit target. Vælg en challenge og følg P/L, dage tilbage og status." />
                </div>

                {challenges.length > 1 && (
                    <select
                        value={active.id}
                        onChange={(e) => setActiveId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs"
                        title="Vælg challenge"
                    >
                        {challenges.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.type === "Prop" && c.broker ? `• ${c.broker}` : ""}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Hovedindhold: Donut + facts */}
            <div className="flex items-center gap-4">
                <Donut
                    size={120}
                    stroke={12}
                    pct={clamp(progressToTargetPct, 0, 150)}
                    tone={donutTone}
                    labelTop="Progress"
                    labelMid={`${Math.max(0, Math.min(999, Math.round(progressToTargetPct)))}%`}
                    labelBot={`Target ${fmtPct(active.profitTargetPct)}`}
                />

                <div className="flex-1 grid grid-cols-2 gap-3">
                    <Fact label="Type" value={active.type === "Prop" ? (active.broker ? `Prop • ${active.broker}` : "Prop") : "Personal"} />
                    <Fact label="Fase" value={active.phase ?? "—"} />

                    <Fact label="P/L" value={signPct(pnlPct)} tone={pnlPct >= 0 ? "pos" : "neg"} />
                    <Fact label="Dage tilbage" value={`${daysLeft}`} />

                    <Fact label="Start" value={money(active.startBalance, active.currency)} />
                    <Fact label="Equity" value={money(active.currentEquity, active.currency)} />
                </div>
            </div>

            {/* CTA (kan routes senere) */}
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                    onClick={() => {}}
                >
                    Se detaljer
                </button>
                <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-md text-xs border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
                    onClick={() => {}}
                >
                    Administrér challenges
                </button>
            </div>
        </div>
    );
}

/* ===================== Donut (ren SVG) ===================== */

function Donut({
                   size,
                   stroke,
                   pct, // 0..150 (vi viser maks 100 i ringen; >100 farves "ok")
                   tone, // "prog" | "ok" | "neg"
                   labelTop,
                   labelMid,
                   labelBot,
               }: {
    size: number;
    stroke: number;
    pct: number;
    tone: "prog" | "ok" | "neg";
    labelTop?: string;
    labelMid?: string;
    labelBot?: string;
}) {
    const r = (size - stroke) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;

    const shown = clamp(pct, 0, 100);
    const dash = (shown / 100) * circumference;
    const gap = circumference - dash;

    const color =
        tone === "ok" ? "#10b981" : tone === "prog" ? "#D4AF37" : "#ef4444"; // grøn / guld / rød

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} role="img" aria-label="Challenge progress">
                {/* Underlag */}
                <circle cx={c} cy={c} r={r} stroke="#2e2e2e" strokeWidth={stroke} fill="none" />
                {/* Fremdrift */}
                <circle
                    cx={c}
                    cy={c}
                    r={r}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${c} ${c})`}
                />
            </svg>

            {/* Labels i midten */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
                {labelTop ? <div className="text-[11px] text-neutral-400">{labelTop}</div> : null}
                {labelMid ? <div className="text-xl font-semibold text-neutral-100">{labelMid}</div> : null}
                {labelBot ? <div className="text-[11px] text-neutral-400">{labelBot}</div> : null}
            </div>
        </div>
    );
}

/* ===================== Små UI-brikker ===================== */

function Fact({
                  label,
                  value,
                  tone,
              }: {
    label: string;
    value: string;
    tone?: "pos" | "neg";
}) {
    const color =
        tone === "pos" ? "text-emerald-300" : tone === "neg" ? "text-red-300" : "text-neutral-100";
    return (
        <div className="rounded-md border border-neutral-800 p-2">
            <div className="text-[11px] text-neutral-400">{label}</div>
            <div className={`text-sm ${color}`}>{value}</div>
        </div>
    );
}

/* ===================== Demo seed (hydration-safe) ===================== */

function seedChallenges(rng: () => number): Challenge[] {
    const arr: Challenge[] = [];

    // Personal
    {
        const start = 20_000;
        const p = (rng() - 0.35) * 7; // ca -2.8..+4.2%
        arr.push({
            id: "ch-personal-1",
            name: "Q4 Consistency",
            type: "Personal",
            currency: "USD",
            startBalance: start,
            currentEquity: Math.round(start * (1 + p / 100)),
            profitTargetPct: 6,
            daysTotal: 45,
            daysElapsed: 18,
        });
    }
    // Prop Phase 1
    {
        const start = 50_000;
        const p = (rng() - 0.4) * 8; // ca -3.2..+4.8%
        arr.push({
            id: "ch-prop-1",
            name: "FTMO 50k",
            type: "Prop",
            broker: "FTMO",
            currency: "USD",
            startBalance: start,
            currentEquity: Math.round(start * (1 + p / 100)),
            profitTargetPct: 8,
            daysTotal: 30,
            daysElapsed: 12,
            phase: "Phase 1",
        });
    }
    // Prop Verification
    {
        const start = 10_000;
        const p = (rng() - 0.4) * 6; // ca -2.4..+3.6%
        arr.push({
            id: "ch-prop-2",
            name: "Verification 10k",
            type: "Prop",
            broker: "IC Markets",
            currency: "EUR",
            startBalance: start,
            currentEquity: Math.round(start * (1 + p / 100)),
            profitTargetPct: 5,
            daysTotal: 20,
            daysElapsed: 7,
            phase: "Verification",
        });
    }

    return arr;
}

/* ===================== Utils/format ===================== */

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}
function pct(n: number, base: number) {
    if (!base) return 0;
    return (n / base) * 100;
}
function fmtPct(n: number) {
    return `${n.toFixed(1).replace(".", ",")}%`;
}
function signPct(n: number) {
    const s = n >= 0 ? "+" : "";
    return `${s}${n.toFixed(2).replace(".", ",")}%`;
}
function money(n: number, ccy: Challenge["currency"]) {
    return new Intl.NumberFormat(ccy === "DKK" ? "da-DK" : ccy === "EUR" ? "de-DE" : "en-US", {
        style: "currency",
        currency: ccy,
        maximumFractionDigits: 0,
    }).format(n);
}
