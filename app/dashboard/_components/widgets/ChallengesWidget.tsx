"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type ChallengeType = "Personal" | "Prop";
type ChallengePhase = "Phase 1" | "Phase 2" | "Verification" | "Live";

type Challenge = {
    id: string;
    name: string;
    type: ChallengeType;
    broker?: string;
    currency: "USD" | "EUR" | "DKK";
    startBalance: number;
    currentEquity: number;
    profitTargetPct: number;
    daysTotal: number;
    daysElapsed: number;
    phase?: ChallengePhase;
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
            <div className="h-full flex items-center justify-center rounded-xl border border-neutral-800 p-4 text-sm text-neutral-400">
                Ingen challenges endnu. Opret dem under Min side.
            </div>
        );
    }

    const pnlAbs = active.currentEquity - active.startBalance;
    const pnlPct = pct(pnlAbs, active.startBalance);

    const targetAbs = (active.startBalance * active.profitTargetPct) / 100;
    const progressToTargetPct = clamp((pnlAbs / targetAbs) * 100, -50, 150);
    const daysLeft = Math.max(0, active.daysTotal - active.daysElapsed);

    const tone: "ok" | "prog" | "neg" =
        progressToTargetPct >= 100 ? "ok" : progressToTargetPct >= 0 ? "prog" : "neg";

    // farver til bar/donut
    const colorHex = tone === "ok" ? "#10b981" : tone === "prog" ? "#D4AF37" : "#ef4444";
    const barClass = tone === "ok" ? "bg-emerald-500" : tone === "prog" ? "bg-yellow-400" : "bg-red-500";

    const targetLabel = money(active.startBalance + targetAbs, active.currency);

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden" id={`${instanceId}-challenges`}>
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    Challenge-overblik
                    <HelpTip text="Se fremdrift mod dit profit target. Vælg en challenge og følg P/L, dage tilbage og status." />
                </div>

                {challenges.length > 1 && (
                    <select
                        value={activeId}
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

            {/* Midtersektion: stor donut + 3x2 facts (fylder godt uden scroll) */}
            <div className="mt-3 flex items-stretch gap-5 shrink-0">
                <Donut
                    size={140}
                    stroke={12}
                    pct={clamp(progressToTargetPct, 0, 150)}
                    color={colorHex}
                    labelTop="Progress"
                    labelMid={`${Math.max(0, Math.min(999, Math.round(progressToTargetPct)))}%`}
                    labelBot={`Target ${fmtPct(active.profitTargetPct)}`}
                />

                <div className="flex-1 grid grid-cols-3 gap-3">
                    <Fact
                        label="Type"
                        value={active.type === "Prop" ? (active.broker ? `Prop • ${active.broker}` : "Prop") : "Personal"}
                    />
                    <Fact label="Fase" value={active.phase ?? "—"} />
                    <Fact label="P/L" value={signPct(pnlPct)} tone={pnlPct >= 0 ? "pos" : "neg"} />

                    <Fact label="Dage tilbage" value={`${daysLeft}`} />
                    <Fact label="Start" value={money(active.startBalance, active.currency)} />
                    <Fact label="Equity" value={money(active.currentEquity, active.currency)} />
                </div>
            </div>

            {/* Progress mod target: fuld bredde i bunden (ingen scroll) */}
            <div className="mt-4 shrink-0">
                <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                    <span>Fremdrift mod target</span>
                    <span>
            mål: <span className="text-neutral-200">{targetLabel}</span>
          </span>
                </div>
                <div className="h-2 rounded bg-neutral-800 overflow-hidden">
                    <div
                        className={`h-2 ${barClass}`}
                        style={{ width: `${clamp(progressToTargetPct, 0, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ====== Donut / små helpers / seed ====== */
function Donut({
                   size,
                   stroke,
                   pct,
                   color,
                   labelTop,
                   labelMid,
                   labelBot,
               }: {
    size: number;
    stroke: number;
    pct: number;
    color: string;
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

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} role="img" aria-label="Challenge progress">
                <circle cx={c} cy={c} r={r} stroke="#2e2e2e" strokeWidth={stroke} fill="none" />
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
                {labelTop ? <div className="text-[11px] text-neutral-400">{labelTop}</div> : null}
                {labelMid ? <div className="text-2xl font-semibold text-neutral-100">{labelMid}</div> : null}
                {labelBot ? <div className="text-[11px] text-neutral-400">{labelBot}</div> : null}
            </div>
        </div>
    );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
    const color =
        tone === "pos" ? "text-emerald-300" : tone === "neg" ? "text-red-300" : "text-neutral-100";
    return (
        <div className="rounded-md border border-neutral-800 p-2 h-full flex flex-col justify-center">
            <div className="text-[11px] text-neutral-400">{label}</div>
            <div className={`text-sm ${color}`}>{value}</div>
        </div>
    );
}

function seedChallenges(rng: () => number): Challenge[] {
    const arr: Challenge[] = [];
    {
        const start = 20_000,
            p = (rng() - 0.35) * 7;
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
    {
        const start = 50_000,
            p = (rng() - 0.4) * 8;
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
    {
        const start = 10_000,
            p = (rng() - 0.4) * 6;
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

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}
function pct(n: number, base: number) {
    return base ? (n / base) * 100 : 0;
}
function fmtPct(n: number) {
    return `${n.toFixed(1).replace(".", ",")}%`;
}
function signPct(n: number) {
    const s = n >= 0 ? "+" : "";
    return `${s}${n.toFixed(2).replace(".", ",")}%`;
}
function money(n: number, ccy: "USD" | "EUR" | "DKK") {
    return new Intl.NumberFormat(
        ccy === "DKK" ? "da-DK" : ccy === "EUR" ? "de-DE" : "en-US",
        { style: "currency", currency: ccy, maximumFractionDigits: 0 }
    ).format(n);
}
