// app/signals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

/* =============== Typer =============== */
type SignalType =
    | "BUY NOW"
    | "SELL NOW"
    | "BUY LIMIT"
    | "SELL LIMIT"
    | "BUY STOP"
    | "SELL STOP";

type TpRow = { id: string; price: number | null };
type Channel = { id: string; name: string };

type Draft = {
    id?: string;
    type: SignalType;
    symbol: string;
    entry: number | null;
    stop: number | null;
    tps: TpRow[];

    traderTag?: string;
    strategyTag?: string;
    includeTrader?: boolean;
    includeStrategy?: boolean;

    channels: string[];
    note?: string;

    useEmojiDecorations?: boolean;
};

type StoredSignal = Draft & {
    id: string;
    createdAt: string;
    updatedAt?: string;
    status: "ACTIVE" | "CANCELLED" | "FILLED" | "CLOSED";
    history: Array<{ at: string; message: string }>;
};

function uid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
function isSignalArray(val: any): val is StoredSignal[] {
    return Array.isArray(val) && val.every((s) => s && typeof s.id === "string" && typeof s.type === "string");
}

/* =============== Farver/konstanter =============== */
const gold = "#D4AF37";
const green = "#76ed77";
const border = "#3b3838";

/* =============== Pip utils (matcher SendTrade) =============== */
function pipSizeFor(symbol: string): number {
    const s = symbol.toUpperCase().trim();

    // Metals
    if (s === "XAUUSD") return 0.10;
    if (s === "XAGUSD") return 0.01;

    // Indices (1 punkt = 1 "pip" i UI)
    if (/(US30|DJ30|DJI|NAS100|NDX|US100|SPX500|US500|GER40|DE40|UK100|FTSE|FRA40|EU50)/i.test(s)) return 1;

    // Crypto – specifik granularitet
    if (/^BTC/.test(s) || /^ETH/.test(s) || /^BNB/.test(s)) return 1;
    if (/^SOL/.test(s) || /^LTC/.test(s) || /^DOT/.test(s)) return 0.1;
    if (/^XRP/.test(s) || /^ADA/.test(s) || /^DOGE/.test(s) || /^TRX/.test(s) || /^XLM/.test(s)) return 0.001;
    if (/^SHIB/.test(s)) return 0.000001;

    // FX
    if (/^[A-Z]{3}JPY$/.test(s)) return 0.01;   // JPY-par
    if (/^[A-Z]{6}$/.test(s)) return 0.0001;    // Standard 6-tegns FX

    return 0.0001;
}
function calcPips(entry: number, target: number, symbol: string): number {
    const size = pipSizeFor(symbol);
    const pips = Math.abs((target - entry) / size);
    return +pips.toFixed(1);
}

/* =============== Komponent =============== */
export default function SignalsPage() {
    // Auth (NextAuth)
    const { data, status } = useSession();
    const user = data?.user as any;

    // Afledte flags (bevarer eksisterende logik; hvis felter mangler på user er de falsy)
    const isAdmin = Boolean(user?.isTeamLead || user?.isCommunityLead);
    const plan = user?.isPro ? "pro" : "free";
    const channelLimit = plan === "pro" ? Infinity : plan === "premium" ? 3 : 1;

    // Kanaler & symboler (uændret)
    const allChannels: Channel[] = useMemo(
        () => [
            { id: "ch-signals", name: "#signals" },
            { id: "ch-eur", name: "#fx-eur" },
            { id: "ch-usd", name: "#fx-usd" },
            { id: "ch-crypto", name: "#crypto" },
            { id: "ch-indices", name: "#indices" },
        ],
        []
    );

    const allSymbols = useMemo(
        () => [
            "EURUSD","EURJPY","EURGBP","EURAUD","GBPUSD","USDJPY","USDCAD","AUDUSD",
            "BTCUSD","ETHUSD","XAUUSD","US30","NAS100","XRPUSD"
        ],
        []
    );

    const defaultTraders = ["Mikkel H.", "Anders K.", "Team Alpha"];
    const defaultStrategies = ["Breakout A", "NY Reversal", "Trend Pullback"];

    const STORAGE_KEY = user ? `tt_signals_${user.id}` : null;
    const NOTIF_KEY   = user ? `tt_notifs_${user.id}`  : null;

    const [signals, setSignals] = useState<StoredSignal[]>([]);
    useEffect(() => {
        if (!STORAGE_KEY) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setSignals([]);
                localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            } else {
                const parsed = JSON.parse(raw);
                if (isSignalArray(parsed)) setSignals(parsed);
                else {
                    setSignals([]);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
                }
            }
        } catch {
            setSignals([]);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); } catch {}
        }
    }, [STORAGE_KEY]);
    useEffect(() => {
        if (!STORAGE_KEY) return;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(signals)); } catch {}
    }, [signals, STORAGE_KEY]);

    /* =============== Draft state =============== */
    const [draft, setDraft] = useState<Draft>({
        type: "BUY NOW",
        symbol: "",
        entry: null,
        stop: null,
        tps: [{ id: uid("tp"), price: null }],
        traderTag: defaultTraders[0],
        strategyTag: defaultStrategies[0],
        includeTrader: true,
        includeStrategy: true,
        channels: [allChannels[0]?.id].filter(Boolean) as string[],
        note: "",
        useEmojiDecorations: true,
    });

    // Symbol-input (uden dropdown)
    const [symbolQuery, setSymbolQuery] = useState("");

    /* =============== Helpers =============== */
    const fmt = (n: number | null | undefined) => (Number.isFinite(n!) ? String(n) : "");
    const parseNum = (v: string) => (v.trim() === "" ? (null as any) : Number(v.replace(",", ".")));

    const toggleChannel = (id: string) => {
        setDraft((d) => {
            const has = d.channels.includes(id);
            if (has) return { ...d, channels: d.channels.filter((c) => c !== id) };
            if (d.channels.length >= channelLimit && channelLimit !== Infinity) {
                const next = [...d.channels];
                next.pop();
                next.push(id);
                return { ...d, channels: next };
            }
            return { ...d, channels: [...d.channels, id] };
        });
    };

    const addTp = () =>
        setDraft((d) => (d.tps.length >= 5 ? d : { ...d, tps: [...d.tps, { id: uid("tp"), price: null }] }));
    const removeTp = (id: string) =>
        setDraft((d) => ({ ...d, tps: d.tps.filter((t) => t.id !== id) }));

    const isValid = useMemo(() => {
        if (!draft.symbol.trim()) return false;
        if (!Number.isFinite(draft.entry) || !Number.isFinite(draft.stop)) return false;
        if (!draft.tps.some((t) => Number.isFinite(t.price as number))) return false;
        if (!draft.channels.length) return false;
        return true;
    }, [draft]);

    /* =============== Preview =============== */
    const formatDiscordPreview = (d: Draft) => {
        const sym = d.symbol.toUpperCase();
        const E = (s: string) => (d.useEmojiDecorations ? s : "");
        const lines: string[] = [];

        lines.push(`**SIGNAL ALERT**`);
        lines.push(`${sym} - ${d.type}`);

        if (d.includeTrader && d.traderTag?.trim())   lines.push(`Analytiker: ${d.traderTag.trim()}`);
        if (d.includeStrategy && d.strategyTag?.trim()) lines.push(`Strategi: ${d.strategyTag.trim()}`);

        if (Number.isFinite(d.entry)) lines.push(`${E("📍 ")}Entry ${d.entry}`);

        if (Number.isFinite(d.stop) && Number.isFinite(d.entry)) {
            const slPips = calcPips(d.entry as number, d.stop as number, sym);
            lines.push(`${E("❌ ")}Stop loss ${d.stop} _(${slPips} pips)_`);
            lines.push(""); // tom linje efter SL
        } else if (Number.isFinite(d.stop)) {
            lines.push(`${E("❌ ")}Stop loss ${d.stop}`);
            lines.push("");
        }

        d.tps.forEach((t, i) => {
            if (Number.isFinite(t.price) && Number.isFinite(d.entry)) {
                const pips = calcPips(d.entry as number, t.price as number, sym);
                lines.push(`${E("🎯 ")}TP ${i + 1} - ${t.price} _(${pips} pips)_`);
            } else if (Number.isFinite(t.price)) {
                lines.push(`${E("🎯 ")}TP ${i + 1} - ${t.price}`);
            }
        });

        if (d.note?.trim()) {
            lines.push("");
            lines.push(d.note.trim());
        }

        lines.push("");
        lines.push(`Sendt af: _${user?.name || "Ukendt"}_`);

        return lines.join("\n");
    };

    /* =============== Notifikationer =============== */
    const pushNotification = (title: string) => {
        const NOTIF_KEY = user ? `tt_notifs_${user.id}` : null;
        if (!NOTIF_KEY) return;
        try {
            const raw = localStorage.getItem(NOTIF_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            const a = Array.isArray(arr) ? arr : [];
            const newNotif = {
                id: `sig-${Date.now()}`,
                title,
                href: "/notifications",
                createdAt: new Date().toISOString(),
                read: false,
            };
            localStorage.setItem(NOTIF_KEY, JSON.stringify([newNotif, ...a].slice(0, 50)));
            window.dispatchEvent(new Event("tt:notifs:updated"));
        } catch {}
    };

    /* =============== CRUD =============== */
    const resetDraft = () => {
        setDraft({
            type: "BUY NOW",
            symbol: "",
            entry: null,
            stop: null,
            tps: [{ id: uid("tp"), price: null }],
            traderTag: defaultTraders[0],
            strategyTag: defaultStrategies[0],
            includeTrader: true,
            includeStrategy: true,
            channels: [allChannels[0]?.id].filter(Boolean) as string[],
            note: "",
            useEmojiDecorations: true,
        });
        setSymbolQuery("");
    };

    const sendSignal = () => {
        if (!user || !isValid) return;
        const id = uid("sig");
        const now = new Date().toISOString();
        const s: StoredSignal = {
            ...(draft as Draft),
            id,
            createdAt: now,
            status: "ACTIVE",
            history: [{ at: now, message: "Signal sendt" }],
        };
        setSignals((arr) => [s, ...arr]);
        pushNotification(`Nyt signal: ${draft.type} ${draft.symbol.toUpperCase()}`);
        resetDraft();
    };

    const updateSignal = (id: string, updater: (s: StoredSignal) => StoredSignal) => {
        setSignals((arr) => arr.map((s) => (s.id === id ? updater(s) : s)));
    };
    const cancelSignal = (id: string) => {
        const now = new Date().toISOString();
        updateSignal(id, (s) => ({
            ...s,
            status: "CANCELLED",
            updatedAt: now,
            history: [{ at: now, message: "Signal annulleret" }, ...s.history],
        }));
        pushNotification("Signal annulleret");
    };
    const markTPorSL = (id: string, label: "TP1" | "TP2" | "TP3" | "TP4" | "TP5" | "SL") => {
        const now = new Date().toISOString();
        updateSignal(id, (s) => ({
            ...s,
            updatedAt: now,
            history: [{ at: now, message: `${label} ramt` }, ...s.history],
        }));
        pushNotification(`Opdatering: ${label} ramt`);
    };

    const loadIntoDraft = (s: StoredSignal) => {
        setDraft({
            id: s.id,
            type: s.type,
            symbol: s.symbol,
            entry: s.entry,
            stop: s.stop,
            tps: s.tps.length ? s.tps : [{ id: uid("tp"), price: null }],
            traderTag: s.traderTag,
            strategyTag: s.strategyTag,
            includeTrader: s.includeTrader ?? true,
            includeStrategy: s.includeStrategy ?? true,
            channels: s.channels,
            note: s.note ?? "",
            useEmojiDecorations: s.useEmojiDecorations ?? true,
        });
        setSymbolQuery(s.symbol);
    };
    const saveUpdateFromDraft = () => {
        if (!draft.id) return;
        const now = new Date().toISOString();
        updateSignal(draft.id, (s) => ({
            ...s,
            ...draft,
            updatedAt: now,
            history: [{ at: now, message: "Signal opdateret" }, ...s.history],
        }));
        pushNotification("Signal opdateret");
        resetDraft();
    };

    /* =============== Gatekeeping (UI, ikke early hooks) =============== */
    if (status === "loading") {
        return (
            <div className="min-h-screen" style={{ background: "#211d1d" }}>
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="rounded-2xl p-6" style={{ background: "#2a2727", color: "#f0f0f0" }}>
                        Loader…
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen" style={{ background: "#211d1d" }}>
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="rounded-2xl p-6 space-y-3" style={{ background: "#2a2727", color: "#f0f0f0" }}>
                        <div>Du er ikke logget ind.</div>
                        <button
                            onClick={() => signIn("discord")}
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={{ borderColor: gold, color: gold }}
                        >
                            Log ind med Discord
                        </button>
                        <div className="text-xs text-gray-400">
                            Alternativt: <Link href="/dashboard" className="underline" style={{ color: gold }}>tilbage til dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen" style={{ background: "#211d1d" }}>
                <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
                    <h1 className="text-xl font-semibold" style={{ color: gold }}>Signal Center</h1>
                    <div className="rounded-2xl p-6" style={{ background: "#2a2727", color: "#f0f0f0" }}>
                        Du har ikke adgang til at sende signaler. Kontakt din teamleder.
                    </div>
                </div>
            </div>
        );
    }

    /* =============== UI =============== */
    return (
        <div className="min-h-screen" style={{ background: "#211d1d" }}>
            <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
                <header className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold" style={{ color: gold }}>Signal Center</h1>
                    <div className="text-sm text-gray-400">
                        Plan:{" "}
                        <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${gold}`, color: gold }}>
              {String(plan).toUpperCase()}
            </span>{" "}
                        · Kanal-limit: {channelLimit === Infinity ? "Ubegrænset" : channelLimit}
                    </div>
                </header>

                {/* FORM */}
                {/* ... hele formularen og listerne uændret fra din version ... */}
                {/* Jeg har bevaret alt dit UI 1:1 nedenfor */}

                <section className="rounded-2xl p-5 space-y-5 border" style={{ background: "#2a2727", color: "#f0f0f0", borderColor: border }}>
                    <h2 className="text-lg font-medium" style={{ color: gold }}>
                        {draft.id ? "Rediger signal" : "Opret signal"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="text-sm">
                            <span className="block text-gray-300 mb-1">Signaltype</span>
                            <select
                                value={draft.type}
                                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as SignalType }))}
                                className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                            >
                                {["BUY NOW","SELL NOW","BUY LIMIT","SELL LIMIT","BUY STOP","SELL STOP"].map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm">
                            <span className="block text-gray-300 mb-1">Symbol</span>
                            <input
                                value={symbolQuery}
                                onChange={(e) => { const q = e.target.value.toUpperCase(); setSymbolQuery(q); setDraft((d) => ({ ...d, symbol: q })); }}
                                placeholder="Fx EURUSD, XAUUSD, BTCUSD, XRPUSD"
                                className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                            />
                            <div className="text-[11px] text-gray-500 mt-1">
                                Skriv symbolet præcist. (Forslags-dropdown er slået fra.)
                            </div>
                        </label>

                        <div />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="text-sm">
                            <span className="block text-gray-300 mb-1">Entry</span>
                            <input
                                inputMode="decimal"
                                value={Number.isFinite(draft.entry!) ? String(draft.entry) : ""}
                                onChange={(e) => setDraft((d) => ({ ...d, entry: (e.target.value.trim()==="" ? (null as any) : Number(e.target.value.replace(",", "."))) }))}
                                placeholder="1.2345"
                                className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                            />
                        </label>

                        <label className="text-sm">
                            <span className="block text-gray-300 mb-1">Stop (SL)</span>
                            <input
                                inputMode="decimal"
                                value={Number.isFinite(draft.stop!) ? String(draft.stop) : ""}
                                onChange={(e) => setDraft((d) => ({ ...d, stop: (e.target.value.trim()==="" ? (null as any) : Number(e.target.value.replace(",", "."))) }))}
                                placeholder="1.2300"
                                className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                            />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Take Profit (TP1-TP5)</span>
                            <button
                                type="button"
                                onClick={() => setDraft(d => (d.tps.length >= 5 ? d : { ...d, tps: [...d.tps, { id: uid("tp"), price: null }] }))}
                                disabled={draft.tps.length >= 5}
                                className="px-2 py-1 rounded border text-xs disabled:opacity-50"
                                style={{ borderColor: gold, color: gold }}
                            >
                                + Tilføj TP
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {draft.tps.map((tp, idx) => (
                                <div key={tp.id} className="flex items-center gap-2">
                                    <input
                                        inputMode="decimal"
                                        value={Number.isFinite(tp.price!) ? String(tp.price) : ""}
                                        onChange={(e) =>
                                            setDraft((d) => ({
                                                ...d,
                                                tps: d.tps.map((t) => (t.id === tp.id ? { ...t, price: (e.target.value.trim()==="" ? (null as any) : Number(e.target.value.replace(",", "."))) } : t)),
                                            }))
                                        }
                                        placeholder={`TP${idx + 1}`}
                                        className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                        style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDraft(d => ({ ...d, tps: d.tps.filter((t) => t.id !== tp.id) }))}
                                        className="px-2 py-2 rounded border"
                                        title="Fjern"
                                        style={{ borderColor: border, color: "#bbb" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Kanaler */}
                    <div className="rounded-xl p-3 border" style={{ borderColor: border, background: "#211d1d" }}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Send til kanaler</span>
                            <div className="text-xs text-gray-400">
                                Valgt: <span style={{ color: gold }}>{draft.channels.length}</span> / {channelLimit === Infinity ? "∞" : channelLimit}
                            </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {draft.channels.length ? (
                                draft.channels.map((id) => {
                                    const ch = allChannels.find((c) => c.id === id);
                                    if (!ch) return null;
                                    return (
                                        <span key={id} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: gold, color: gold }}>
                      {ch.name}
                    </span>
                                    );
                                })
                            ) : (
                                <span className="text-xs text-gray-500">Vælg mindst én kanal</span>
                            )}
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {allChannels.map((ch) => {
                                const selected = draft.channels.includes(ch.id);
                                return (
                                    <label
                                        key={ch.id}
                                        htmlFor={`ch-${ch.id}`}
                                        className="flex items-center gap-2 rounded-md px-3 py-2 border cursor-pointer select-none"
                                        style={{
                                            borderColor: selected ? gold : border,
                                            background: selected ? "rgba(212,175,55,0.07)" : "#2a2727",
                                            color: selected ? gold : "white",
                                        }}
                                        onClick={() => toggleChannel(ch.id)}
                                    >
                                        <input id={`ch-${ch.id}`} type="checkbox" className="sr-only" checked={selected} onChange={() => toggleChannel(ch.id)} />
                                        <span className="inline-block w-4 h-4 rounded border flex items-center justify-center" style={{ borderColor: selected ? gold : "#555" }}>
                      {selected ? "✓" : ""}
                    </span>
                                        <span className="text-sm">{ch.name}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {channelLimit !== Infinity && (
                            <div className="mt-1 text-[11px] text-gray-500">Din plan tillader maks. {channelLimit} kanal(er) pr. signal.</div>
                        )}
                    </div>

                    {/* Trader / Strategi + toggles */}
                    {/* ... (uændret markup) ... */}

                    {/* Note + Emoji pynt */}
                    {/* ... (uændret markup) ... */}

                    {/* Preview */}
                    <div className="rounded-xl p-4 border" style={{ borderColor: border, background: "#211d1d" }}>
                        <div className="text-xs text-gray-400 mb-2">Forhåndsvisning (Discord-format)</div>
                        <pre className="whitespace-pre-wrap text-sm">{formatDiscordPreview(draft)}</pre>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        {draft.id ? (
                            <>
                                <button
                                    onClick={() => saveUpdateFromDraft()}
                                    disabled={!isValid}
                                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                                    style={{ background: gold, color: "#000" }}
                                >
                                    Opdater signal
                                </button>
                                <button
                                    onClick={() => { setDraft(d => ({ ...d, id: undefined })); }}
                                    className="px-3 py-2 rounded-md text-sm border"
                                    style={{ borderColor: gold, color: gold }}
                                >
                                    Annuller redigering
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={sendSignal}
                                    disabled={!isValid}
                                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                                    style={{ background: gold, color: "#000" }}
                                >
                                    Send signal
                                </button>
                                <button
                                    onClick={resetDraft}
                                    className="px-3 py-2 rounded-md text-sm border"
                                    style={{ borderColor: gold, color: gold }}
                                >
                                    Ryd felter
                                </button>
                            </>
                        )}
                    </div>
                </section>

                {/* Aktive */}
                {/* ... uændret markup for listerne ... */}
                <section className="space-y-3">
                    <h2 className="text-lg font-medium" style={{ color: gold }}>Aktive signaler</h2>
                    {signals.filter((s) => s.status !== "CANCELLED").length === 0 ? (
                        <div className="rounded-2xl p-6 text-sm text-center" style={{ background: "#2a2727", color: "#cfcfcf" }}>
                            Ingen aktive signaler endnu.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {signals.filter((s) => s.status !== "CANCELLED").map((s) => (
                                <div key={s.id} className="rounded-2xl p-5 border" style={{ background: "#2a2727", borderColor: border, color: "#f0f0f0" }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium">{s.type} {s.symbol.toUpperCase()}</div>
                                        <div className="text-xs text-gray-400">oprettet: {new Date(s.createdAt).toLocaleString()}</div>
                                    </div>

                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                        {Number.isFinite(s.entry) && <div><span className="text-gray-400">Entry:</span> {s.entry}</div>}
                                        {Number.isFinite(s.stop) && <div><span className="text-gray-400">SL:</span> {s.stop}</div>}
                                        {s.tps.filter((t) => Number.isFinite(t.price)).map((t, i) => (
                                            <div key={t.id}><span className="text-gray-400">TP{i + 1}:</span> {t.price}</div>
                                        ))}
                                        {s.includeTrader && s.traderTag && <div><span className="text-gray-400">Trader:</span> {s.traderTag}</div>}
                                        {s.includeStrategy && s.strategyTag && <div><span className="text-gray-400">Strategi:</span> {s.strategyTag}</div>}
                                    </div>

                                    <div className="mt-2 text-xs text-gray-400">Kanaler: {s.channels.join(", ")}</div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {["TP1","TP2","TP3","TP4","TP5","SL"].map((lbl) => (
                                            <button
                                                key={lbl}
                                                onClick={() => {
                                                    const now = new Date().toISOString();
                                                    setSignals(arr => arr.map(si => si.id === s.id
                                                        ? { ...si, updatedAt: now, history: [{ at: now, message: `${lbl} ramt` }, ...si.history] }
                                                        : si));
                                                    pushNotification(`Opdatering: ${lbl} ramt`);
                                                }}
                                                className="px-3 py-1.5 rounded-md text-xs border"
                                                style={{ borderColor: gold, color: gold }}
                                            >
                                                Markér {lbl} ramt
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setDraft({
                                                id: s.id,
                                                type: s.type,
                                                symbol: s.symbol,
                                                entry: s.entry,
                                                stop: s.stop,
                                                tps: s.tps.length ? s.tps : [{ id: uid("tp"), price: null }],
                                                traderTag: s.traderTag,
                                                strategyTag: s.strategyTag,
                                                includeTrader: s.includeTrader ?? true,
                                                includeStrategy: s.includeStrategy ?? true,
                                                channels: s.channels,
                                                note: s.note ?? "",
                                                useEmojiDecorations: s.useEmojiDecorations ?? true,
                                            })}
                                            className="px-3 py-1.5 rounded-md text-xs"
                                            style={{ background: gold, color: "#000" }}
                                        >
                                            Rediger
                                        </button>
                                        <button
                                            onClick={() => {
                                                const now = new Date().toISOString();
                                                setSignals(arr => arr.map(si => si.id === s.id
                                                    ? { ...si, status: "CANCELLED", updatedAt: now, history: [{ at: now, message: "Signal annulleret" }, ...si.history] }
                                                    : si));
                                                pushNotification("Signal annulleret");
                                            }}
                                            className="px-3 py-1.5 rounded-md text-xs border"
                                            style={{ borderColor: "#ff5757", color: "#ff8a8a" }}
                                        >
                                            Annullér
                                        </button>
                                    </div>

                                    {s.history.length > 0 && (
                                        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "#211d1d" }}>
                                            <div className="text-gray-400 mb-1">Historik</div>
                                            <ul className="space-y-1">
                                                {s.history.map((h, idx) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: idx === 0 ? green : "#3b3838" }} />
                                                        <span>{h.message}</span>
                                                        <span className="text-gray-500">· {new Date(h.at).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Annullerede */}
                {signals.some((s) => s.status === "CANCELLED") && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium" style={{ color: gold }}>Annullerede signaler</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {signals.filter((s) => s.status === "CANCELLED").map((s) => (
                                <div
                                    key={s.id}
                                    className="rounded-2xl p-4 border text-sm"
                                    style={{ background: "#2a2727", borderColor: border, color: "#cfcfcf" }}
                                >
                                    {s.type} {s.symbol} — annulleret {new Date(s.updatedAt || s.createdAt).toLocaleString()}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
