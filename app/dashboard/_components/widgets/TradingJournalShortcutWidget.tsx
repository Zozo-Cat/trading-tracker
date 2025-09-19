// app/dashboard/_components/widgets/TradingJournalShortcutWidget.tsx
"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * TradingJournalShortcutWidget
 * - Hurtig note (med skabeloner, tag, tilknyt trade, pseudo-vedhæft)
 * - Counters (klikbare badges → kan routes senere)
 * - Seneste noter (3 stk)
 * - Hydration-safe: al seeded demo-data er deterministisk og UTC-ankret
 *
 * ÆNDRING: “Unavngivne/utaggede trades” er fjernet.
 * I stedet vises “Trades uden note” (antal lukkede trades uden tilknyttet note).
 */

type Props = { instanceId: string };

// ===== Types =====
type Trade = {
    id: string;
    symbol: string;
    kind: "open" | "closed";
    time: number; // UTC ms
    plR?: number; // kun for lukkede
    named?: boolean; // (ikke brugt mere i counters – men beholdt for evt. senere)
};

type Note = {
    id: string;
    text: string;
    tags: string[];
    tradeId?: string;
    time: number; // UTC ms
};

const BASE_UTC = Date.UTC(2024, 7, 1, 8, 0, 0, 0); // 2024-08-01 08:00Z — fast for demo

export default function TradingJournalShortcutWidget({ instanceId }: Props) {
    // ===== Seeded demo-data (deterministisk) =====
    const rng = useMemo(() => seededRng(`${instanceId}::journalShortcut`), [instanceId]);

    const openTrades = useMemo<Trade[]>(() => seedOpenTrades(rng), [rng]);
    const recentClosed = useMemo<Trade[]>(() => seedRecentClosedTrades(rng), [rng]);
    const initialNotes = useMemo<Note[]>(
        () => seedNotes(rng, recentClosed),
        [rng, recentClosed]
    );

    // Local, klient-side tilføjelser
    const [notes, setNotes] = useState<Note[]>(initialNotes);

    // ===== Quick note state =====
    const [text, setText] = useState("");
    const [selectedTradeId, setSelectedTradeId] = useState<string | "none">("none");
    const [newTag, setNewTag] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const tradeOptions: Trade[] = useMemo(
        () => [...openTrades, ...recentClosed].sort((a, b) => b.time - a.time),
        [openTrades, recentClosed]
    );

    // ===== Counters =====
    // Ny: lukkede trades der ikke har nogen note
    const tradesWithoutNote = useMemo(
        () => recentClosed.filter((t) => !notes.some((n) => n.tradeId === t.id)).length,
        [recentClosed, notes]
    );

    const notesWithoutTag = useMemo(
        () => notes.filter((n) => n.tags.length === 0).length,
        [notes]
    );

    const losingWithoutReview = useMemo(
        () =>
            recentClosed.filter(
                (t) => (t.plR ?? 0) < 0 && !notes.some((n) => n.tradeId === t.id)
            ).length,
        [recentClosed, notes]
    );

    // ===== Handlers =====
    const addTemplate = (tpl: string) => {
        setText((prev) => (prev.trim() ? `${prev}\n${tpl}` : tpl));
    };

    const addTag = () => {
        const cleaned = newTag.trim();
        if (!cleaned) return;
        if (!tags.includes(cleaned)) setTags((prev) => [...prev, cleaned]);
        setNewTag("");
    };

    const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

    const handleSave = () => {
        const body = text.trim();
        if (!body) return;

        // Gem “nu” som fast forskydning ift BASE_UTC for determinisme i demo
        const t = BASE_UTC + 12 * 60 * 60 * 1000 + Math.floor(rng() * 3600_000); // ca. 20Z ± ~60m

        const n: Note = {
            id: `n-${Math.random().toString(36).slice(2, 9)}`,
            text: body,
            tags: [...tags],
            tradeId: selectedTradeId === "none" ? undefined : selectedTradeId,
            time: t,
        };
        setNotes((prev) => [n, ...prev].slice(0, 30));
        setText("");
        setTags([]);
        setSelectedTradeId("none");
    };

    // ===== Render =====
    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Trading Journal Shortcut</div>
                    <HelpTip text="Skriv en hurtig note, tilknyt den til en trade og tilføj tags. Se også de seneste noter og afklaringsopgaver." />
                </div>

                {/* Sekundære genveje */}
                <div className="flex items-center gap-2">
                    <HeaderLink label="Dagligt review" onClick={() => { /* route senere */ }} />
                    <HeaderLink label="Navngiv/Tag trades" onClick={() => { /* route senere */ }} />
                    <PrimaryLink label="Åbn fuld journal" onClick={() => { /* route senere */ }} />
                </div>
            </div>

            {/* Quick note */}
            <div className="rounded-lg border border-neutral-700 p-3 mb-4">
                {/* Top-række: skabeloner */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-neutral-400">Skabeloner:</span>
                    <Chip onClick={() => addTemplate("Plan før åbning: ")}>Plan før åbning</Chip>
                    <Chip onClick={() => addTemplate("Post-trade: ")}>Post-trade</Chip>
                    <Chip onClick={() => addTemplate("Emotion: ")}>Emotion</Chip>
                    <Chip onClick={() => addTemplate("Læring: ")}>Læring</Chip>
                </div>

                {/* Tekstfelt */}
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Skriv note…"
                    className="w-full bg-neutral-900/70 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500 mb-2"
                />

                {/* Tilknyt trade + tags */}
                <div className="flex flex-wrap gap-2 items-center">
                    <select
                        value={selectedTradeId}
                        onChange={(e) => setSelectedTradeId(e.target.value as any)}
                        className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-sm"
                        title="Tilknyt til trade"
                    >
                        <option value="none">Uden trade</option>
                        {tradeOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.symbol} · {t.kind === "open" ? "Åben" : `Lukket ${fmtHHMMUTC(t.time)}`}{" "}
                                {t.kind === "closed" ? `· ${fmtR(t.plR!)}` : ""}
                            </option>
                        ))}
                    </select>

                    {/* Tags inline */}
                    <div className="flex items-center gap-1">
                        {tags.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 text-xs border border-neutral-600 rounded-md px-2 py-1"
                            >
                #{t}
                                <button
                                    type="button"
                                    className="text-neutral-400 hover:text-neutral-200"
                                    onClick={() => removeTag(t)}
                                    title="Fjern tag"
                                >
                  ×
                </button>
              </span>
                        ))}
                        <input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                            placeholder="Nyt tag…"
                            className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-sm w-28"
                            title="Tilføj tag"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                        >
                            Tilføj
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!text.trim()}
                        className="px-3 py-1.5 rounded-md text-sm border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Gem note"
                    >
                        Gem note
                    </button>
                </div>
            </div>

            {/* Counters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                    label="Trades uden note"
                    value={tradesWithoutNote}
                    tone={tradesWithoutNote > 0 ? "warn" : "neutral"}
                    onClick={() => {}}
                />
                <Badge
                    label="Noter uden tag"
                    value={notesWithoutTag}
                    tone={notesWithoutTag > 0 ? "warn" : "neutral"}
                    onClick={() => {}}
                />
                <Badge
                    label="Tabsgivende uden review"
                    value={losingWithoutReview}
                    tone={losingWithoutReview > 0 ? "warn" : "neutral"}
                    onClick={() => {}}
                />
            </div>

            {/* Seneste noter */}
            <div className="space-y-2">
                {notes.slice(0, 3).map((n) => {
                    const t = tradeOptions.find((x) => x.id === n.tradeId);
                    return (
                        <div
                            key={n.id}
                            className="rounded-lg border border-neutral-700 px-3 py-2 flex items-start justify-between"
                        >
                            <div className="min-w-0">
                                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-2">
                                    <span>{fmtHHMMUTC(n.time)}</span>
                                    {t ? (
                                        <>
                                            <span>•</span>
                                            <span className="text-neutral-300">{t.symbol}</span>
                                            {t.kind === "closed" && typeof t.plR === "number" ? (
                                                <>
                                                    <span>•</span>
                                                    <span className={t.plR >= 0 ? "text-emerald-300" : "text-red-300"}>
                            {fmtR(t.plR)}
                          </span>
                                                </>
                                            ) : null}
                                        </>
                                    ) : null}
                                    {n.tags.length > 0 ? (
                                        <>
                                            <span>•</span>
                                            <span className="text-neutral-400">#{n.tags.join(", #")}</span>
                                        </>
                                    ) : null}
                                </div>
                                <div className="text-sm text-neutral-100 whitespace-pre-wrap">
                                    {n.text}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="shrink-0 ml-3 px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                                title="Åbn i fuld journal"
                                onClick={() => {}}
                            >
                                Åbn
                            </button>
                        </div>
                    );
                })}

                {notes.length === 0 && (
                    <div className="rounded-lg border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">
                        Ingen noter endnu i dag – start med en hurtig note ovenfor.
                    </div>
                )}
            </div>

            <p className="sr-only">
                Opret hurtige noter og se de seneste journalnoter. Du kan tilknytte noter til trades og tilføje tags.
            </p>
        </div>
    );
}

/* =================== UI subkomponenter =================== */

function HeaderLink({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
        >
            {label}
        </button>
    );
}
function PrimaryLink({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-2.5 py-1.5 rounded-md text-xs border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
        >
            {label}
        </button>
    );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
        >
            {children}
        </button>
    );
}

function Badge({
                   label,
                   value,
                   tone,
                   onClick,
               }: {
    label: string;
    value: number;
    tone: "neutral" | "warn";
    onClick: () => void;
}) {
    const border =
        tone === "warn" ? "border-amber-600 text-amber-200 hover:bg-amber-900/25" : "border-neutral-600 text-neutral-200 hover:bg-neutral-800";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-2 py-1 rounded-md text-xs border ${border}`}
            title={label}
        >
            {label}: <span className="font-semibold">{value}</span>
        </button>
    );
}

/* =================== Demo/seed helpers (hydration-safe) =================== */

function seedOpenTrades(rng: () => number): Trade[] {
    const syms = ["US100", "SPX500", "XAUUSD"];
    const out: Trade[] = [];
    for (let i = 0; i < 2; i++) {
        out.push({
            id: `o-${i}`,
            symbol: syms[i % syms.length],
            kind: "open",
            time: BASE_UTC + (i + 1) * 45 * 60 * 1000, // +45m, +90m
            named: rng() > 0.5, // (ikke længere brugt i counters)
        });
    }
    return out;
}

function seedRecentClosedTrades(rng: () => number): Trade[] {
    const syms = ["EURUSD", "US100", "XAUUSD", "GBPUSD"];
    const out: Trade[] = [];
    for (let i = 0; i < 4; i++) {
        const pl = Math.round(((rng() - 0.45) * 2.2) * 100) / 100; // ca -1.0..+1.2R
        out.push({
            id: `c-${i}`,
            symbol: syms[i % syms.length],
            kind: "closed",
            time: BASE_UTC + (i + 2) * 60 * 60 * 1000, // +2h, +3h, ...
            plR: pl,
            named: rng() > 0.6,
        });
    }
    return out;
}

function seedNotes(rng: () => number, trades: Trade[]): Note[] {
    const tmpls = [
        "Post-trade: fulgte planen, men exit kunne være bedre.",
        "Læring: pas på overtrading efter tab.",
        "Emotion: utålmodig – husk tjekliste før entry.",
    ];
    const out: Note[] = [];
    for (let i = 0; i < 3; i++) {
        const trade = trades[i] ?? trades[0];
        out.push({
            id: `n-seed-${i}`,
            text: tmpls[i % tmpls.length],
            tags: rng() > 0.5 ? ["plan"] : [],
            tradeId: trade?.id,
            time: BASE_UTC + (i + 1) * 70 * 60 * 1000, // +70m, +140m, +210m
        });
    }
    return out;
}

function fmtHHMMUTC(ms: number) {
    const d = new Date(ms);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}Z`;
}
function fmtR(v: number) {
    const s = (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",") + "R";
    return s;
}
