"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";

/* =========================
   Types & localStorage keys
   ========================= */

type Rule = {
    id: string;
    text: string;
    priority?: 1 | 2 | 3;
};

type RuleEvent = {
    ruleId: string;
    type: "kept" | "broken";
    ts: number;
    source?: "checklist" | "scorecard" | "journal" | "other";
    tradeId?: string;
};

const LS_RULES_KEYS = ["tt.tradingPlan.items", "tt.plan.items", "tradingPlan.items"];
const LS_EVENTS_KEY = "tt.plan.events.v1";

/* =========================
   Helpers (storage + time)
   ========================= */

function safeParseJSON<T>(raw: string | null): T | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

function loadRules(): Rule[] {
    for (const key of LS_RULES_KEYS) {
        const parsed = safeParseJSON<any>(localStorage.getItem(key));
        if (Array.isArray(parsed)) {
            const rules = parsed
                .map<Rule>((x: any, i: number) =>
                    typeof x === "string"
                        ? { id: String(i), text: x }
                        : { id: String(x?.id ?? i), text: String(x?.text ?? ""), priority: x?.priority }
                )
                .filter((r) => r.text.trim().length > 0);
            if (rules.length) return rules;
        }
    }
    // fallback
    return [
        { id: "r1", text: "Max 3 trades pr. dag" },
        { id: "r2", text: "Journal-notat inden entry" },
        { id: "r3", text: "Ingen handler under røde nyheder" },
        { id: "r4", text: "Flyt SL til BE først efter 1R" },
        { id: "r5", text: "Kun A-setup efter 11:00" },
        { id: "r6", text: "Tag profit i zoner — ikke midt i ingenting" },
        { id: "r7", text: "Ingen revenge trading" },
        { id: "r8", text: "Følg max-risiko pr. trade" },
        { id: "r9", text: "Ingen handler de første 5 min efter åben" },
        { id: "r10", text: "Evaluer plan før luk — scorecard" },
    ];
}

function loadEvents(): RuleEvent[] {
    const arr = safeParseJSON<RuleEvent[]>(localStorage.getItem(LS_EVENTS_KEY));
    if (!Array.isArray(arr)) return [];
    return arr
        .filter((e) => e && typeof e.ruleId === "string" && (e.type === "kept" || e.type === "broken") && typeof e.ts === "number")
        .sort((a, b) => a.ts - b.ts);
}

/* Global logger */
declare global {
    interface Window {
        ttLogRuleEvent?: (payload: Omit<RuleEvent, "ts"> & { ts?: number }) => void;
    }
}

/* =========================
   Metrics & ranking
   ========================= */

const DAY = 24 * 60 * 60 * 1000;

type Metrics = {
    kept30: number;
    broken30: number;
    keptRate30: number;
    broken7: number;
    recentScore: number;
    lastBrokenTs: number | null;
};

function computeMetrics(rules: Rule[], events: RuleEvent[], now = Date.now()): Record<string, Metrics> {
    const byRule: Record<string, RuleEvent[]> = {};
    for (const r of rules) byRule[r.id] = [];
    for (const e of events) {
        if (!byRule[e.ruleId]) continue;
        byRule[e.ruleId].push(e);
    }

    const res: Record<string, Metrics> = {};
    for (const r of rules) {
        const evs = byRule[r.id] ?? [];
        let kept30 = 0, broken30 = 0, broken7 = 0, recentScore = 0;
        let lastBrokenTs: number | null = null;

        for (const e of evs) {
            const age = now - e.ts;
            if (age <= 30 * DAY) (e.type === "kept" ? kept30++ : broken30++);
            if (age <= 7 * DAY && e.type === "broken") broken7++;
            if (e.type === "broken") {
                const days = age / DAY;
                recentScore += Math.exp(-days / 7);
                if (!lastBrokenTs || e.ts > lastBrokenTs) lastBrokenTs = e.ts;
            }
        }

        const keptRate30 = kept30 + broken30 > 0 ? kept30 / (kept30 + broken30) : 0;
        res[r.id] = { kept30, broken30, keptRate30, broken7, recentScore, lastBrokenTs };
    }
    return res;
}

function rankScore(rule: Rule, m: Metrics | undefined) {
    if (!m) return -1;
    const priority = (rule.priority ?? 1) / 3;
    const lowCompliance = 1 - (m.keptRate30 ?? 0);
    const recency = m.recentScore ?? 0;
    return 0.55 * recency + 0.30 * lowCompliance + 0.15 * priority;
}

function pickTop8(rules: Rule[], metrics: Record<string, Metrics>): Rule[] {
    const list = [...rules].sort((a, b) => rankScore(b, metrics[b.id]) - rankScore(a, metrics[a.id]));
    return list.slice(0, 8);
}

/* =========================
   Periode + compliance
   ========================= */

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return +d;
}

function windowStart(period: PeriodValue) {
    const now = Date.now();
    if (period === "day") return startOfToday();
    if (period === "week") return now - 7 * DAY;
    return now - 30 * DAY;
}

function compliance(events: RuleEvent[], period: PeriodValue) {
    const from = windowStart(period);
    let kept = 0, broken = 0;
    for (const e of events) {
        if (e.ts < from) continue;
        if (e.type === "kept") kept++; else broken++;
    }
    const pct = kept + broken > 0 ? kept / (kept + broken) : 0;
    return { kept, broken, pct };
}

/* =========================
   UI helpers
   ========================= */

function StatusIcon({ ok }: { ok: boolean }) {
    const ringColor = ok ? "rgba(16,185,129,.95)" : "rgba(248,113,113,.95)";
    const icon = ok
        ? <path d="M4 9l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        : <path d="M5 5l6 6m0-6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;

    return (
        <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: `2px solid ${ringColor}`, color: ringColor }}
            aria-hidden
        >
            <svg viewBox="0 0 16 16" className="h-5 w-5">{icon}</svg>
        </div>
    );
}

function Ring({ pct, label }: { pct: number; label: string }) {
    const p = Math.max(0, Math.min(1, pct));
    const deg = p * 360;
    const color = p >= 0.85 ? "var(--tt-accent)" : "rgba(16,185,129,.9)";
    return (
        <div className="flex items-center gap-3">
            <div
                className="relative h-12 w-12 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,.08) 0)` }}
                aria-label={`${Math.round(p * 100)}%`}
            >
                <div className="absolute inset-1 rounded-full bg-neutral-900/60 flex items-center justify-center text-xs">
                    {Math.round(p * 100)}%
                </div>
            </div>
            <div className="text-sm opacity-90">{label}</div>
        </div>
    );
}

/* =========================
   Component
   ========================= */

export default function DisciplineWidget({ instanceId }: { instanceId: string }) {
    const [rules, setRules] = useState<Rule[]>([]);
    const [events, setEvents] = useState<RuleEvent[]>([]);
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Exponér global logger
    useEffect(() => {
        if (!window.ttLogRuleEvent) {
            window.ttLogRuleEvent = (payload) => {
                const list = loadEvents();
                list.push({
                    ruleId: payload.ruleId,
                    type: payload.type,
                    ts: payload.ts ?? Date.now(),
                    source: payload.source ?? "other",
                    tradeId: payload.tradeId,
                });
                localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(list));
                setEvents(list);
            };
        }
    }, []);

    useEffect(() => {
        setRules(loadRules());
        setEvents(loadEvents());
    }, []);

    const now = Date.now();
    const metrics = useMemo(() => computeMetrics(rules, events, now), [rules, events, now]);
    const picked = useMemo(() => pickTop8(rules, metrics), [rules, metrics]);
    const comp = useMemo(() => compliance(events, period), [events, period]);

    const okMap = useMemo(() => {
        const from = windowStart(period);
        const map: Record<string, boolean> = {};
        for (const r of rules) map[r.id] = true;
        for (const e of events) {
            if (e.type === "broken" && e.ts >= from) map[e.ruleId] = false;
        }
        return map;
    }, [events, period, rules]);

    const periodLabel = period === "day" ? "i dag" : period === "week" ? "denne uge" : "denne måned";

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="leading-tight">
                    <div className="text-sm font-semibold opacity-90">Discipline</div>
                    <div className="text-[11px] opacity-60">Plan + score i én — 8 vigtige regler</div>
                </div>

                {/* Bruger samme komponent som stats-widgets */}
                <PeriodToggle
                    instanceId={instanceId}
                    slug="discipline"
                    defaultValue="day"
                    onChange={setPeriod}
                />
            </div>

            {/* Hero */}
            <div className="mb-3 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                <Ring
                    pct={comp.pct}
                    label={
                        comp.pct >= 0.85
                            ? `Yay! Du har fulgt din plan ${Math.round(comp.pct * 100)}% ${periodLabel}.`
                            : `Husk at holde linjen — ${Math.round(comp.pct * 100)}% ${periodLabel}.`
                    }
                />
            </div>

            {/* 2×4 regler — kun ring-ikonet til venstre */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 min-h-0 flex-1">
                {picked.slice(0, 8).map((r) => {
                    const m = metrics[r.id];
                    const ok = okMap[r.id] ?? true;
                    const keptPct = Math.round((m?.keptRate30 ?? 0) * 100);
                    return (
                        <div
                            key={r.id + "_" + instanceId}
                            className="rounded-md border border-neutral-800 bg-neutral-900/35 p-2 md:p-3 hover:border-neutral-700"
                        >
                            <div className="flex min-h-[56px] items-center justify-start gap-3">
                                <StatusIcon ok={ok} />
                                <div>
                                    <div className="text-[13px] leading-5 opacity-95">{r.text}</div>
                                    <div className="text-[11px] opacity-65">
                                        30d: {keptPct}% overholdt · 7d brud: {m?.broken7 ?? 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Links */}
            <div className="mt-3 flex items-center justify-end gap-3 text-[11px] opacity-70">
                <a href="#" className="underline underline-offset-2 hover:opacity-100">Åbn fuld plan</a>
                <span>·</span>
                <a href="#" className="underline underline-offset-2 hover:opacity-100">Se afvigelser</a>
            </div>
        </div>
    );
}
