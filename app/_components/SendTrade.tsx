// app/_components/SendTrade.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDummySession } from "@/lib/dummyAuth";
import {
    TRADING_EMOJIS,
    GENERAL_EMOJIS,
    SEARCH_POOL,
    type EmojiItem,
} from "@/app/_data/emojis";

/* ===================== Typer ===================== */
type SignalType =
    | "BUY NOW"
    | "SELL NOW"
    | "BUY LIMIT"
    | "SELL LIMIT"
    | "BUY STOP"
    | "SELL STOP";

type Channel = { id: string; name: string };
type TpRow = { id: string; priceStr: string };

export type TradeSignalInput = {
    symbol: string;
    type: SignalType;
    entry: number;
    stop: number;
    tps: number[]; // kun TP’er med værdi
    note?: string; // selve teksten (uden "Note:")
    traderTag?: string; // gemmes altid
    strategyTag?: string; // gemmes altid
    includeTrader?: boolean;
    includeStrategy?: boolean;
    useEmojiDecorations?: boolean;
    channels: string[]; // channel IDs
    sentBy: string; // afsendernavn (user.name)
    disclaimer?: string; // snapshot af valgt disclaimer
};

/* ===================== Utils ===================== */
function uid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

const ALL_SYMBOLS = [
    "EURUSD", "EURJPY", "EURGBP", "EURAUD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD",
    "BTCUSD", "ETHUSD", "XAUUSD", "US30", "NAS100", "XRPUSD"
];

const gold = "#D4AF37";
const border = "#3b3838";

/** Pip-størrelse pr. instrument (kan let udvides) */
function pipSizeFor(symbol: string): number {
    const s = symbol.toUpperCase().trim();

    // Metals (typisk: 1 pip = 0.10 for XAU, 0.01 for XAG)
    if (s === "XAUUSD") return 0.10;
    if (s === "XAGUSD") return 0.01;

    // Indices (for UI: 1 punkt = 1 pip)
    if (/(US30|DJ30|DJI|NAS100|NDX|US100|SPX500|US500|GER40|DE40|UK100|FTSE|FRA40|EU50)/i.test(s)) return 1;

    // ---- Crypto (symbol-specifik pip-size for bedre skala) ----
    if (/^BTC/.test(s) || /^ETH/.test(s) || /^BNB/.test(s)) return 1;       // high price → 1 USD pr. pip
    if (/^SOL/.test(s) || /^LTC/.test(s) || /^DOT/.test(s)) return 0.1;     // mid price → 0.1
    if (/^XRP/.test(s) || /^ADA/.test(s) || /^DOGE/.test(s) || /^TRX/.test(s) || /^XLM/.test(s)) return 0.001; // low price → 0.001
    if (/^SHIB/.test(s)) return 0.000001;                                   // ultra low

    // FX
    if (/^[A-Z]{3}JPY$/.test(s)) return 0.01;    // JPY-par
    if (/^[A-Z]{6}$/.test(s)) return 0.0001;     // Standard 6-tegns FX

    // Fallback
    return 0.0001;
}

/** Pips = |target - entry| / pipSize  (vises med 1 decimal for pænt UI) */
function calcPips(entry: number, target: number, symbol: string): number {
    const size = pipSizeFor(symbol);
    const pips = Math.abs(target - entry) / size;
    return +pips.toFixed(1);
}

/* ============ Favorit‑emojis (per bruger) ============ */
const favKey = (uid: string) => `tt_fav_emojis_${uid}`;
function loadFavs(uid: string): string[] {
    try {
        const raw = localStorage.getItem(favKey(uid));
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch { return []; }
}
function saveFavs(uid: string, favs: string[]) {
    try {
        localStorage.setItem(favKey(uid), JSON.stringify([...new Set(favs)].slice(0, 12)));
    } catch {}
}

/* ============ Org‑config (midlertidigt i localStorage) ============ */
type OrgConfig = {
    disclaimerChoice?: "neutral" | "ojd" | "custom";
    disclaimerCustom?: string;
    emojiDecorDefault?: boolean;
};
const ORG_KEY = "tt_org_config";

function loadOrgConfig(): OrgConfig {
    try {
        const raw = localStorage.getItem(ORG_KEY);
        const json = raw ? JSON.parse(raw) : {};
        return typeof json === "object" && json ? json : {};
    } catch { return {}; }
}
function saveOrgConfig(cfg: OrgConfig) {
    try {
        const prev = loadOrgConfig();
        localStorage.setItem(ORG_KEY, JSON.stringify({ ...prev, ...cfg }));
    } catch {}
}

const DISCLAIMER_NEUTRAL =
    "Dette er ikke finansiel rådgivning. Handel indebærer risiko. Du handler altid på eget ansvar.";

const DISCLAIMER_OJD = [
    "One Journey Denmark er ikke finansielle rådgivere, og dette er ikke finansiel rådgivning.",
    "Tidligere resultater er ingen garanti for fremtidige resultater.",
    "Alt indhold er kun til læring, og hvis du handler ud fra det, gør du det på eget ansvar."
].join("\n");

/* ============ Lille emoji‑vælger (kun til fav‑redigering) ============ */
function EmojiPickerMini({ onPick }: { onPick: (emoji: string) => void }) {
    const [q, setQ] = useState("");
    const ql = q.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!ql) return null;
        return SEARCH_POOL.filter(
            (it) => it.e.includes(ql) || it.k.some((kw) => kw.toLowerCase().includes(ql))
        );
    }, [ql]);

    const Btn = ({ it }: { it: EmojiItem }) => (
        <button
            type="button"
            onClick={() => onPick(it.e)}
            className="flex items-center justify-center rounded hover:bg-white/10"
            style={{ width: 32, height: 32, fontSize: 20, lineHeight: 1 }}
            title={it.k.join(", ")}
        >
            {it.e}
        </button>
    );

    return (
        <div
            className="absolute right-0 top-full mt-2 z-[1000] rounded-2xl border shadow-xl p-3"
            style={{ background: "#2a2727", borderColor: border, width: 320 }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="text-[11px] mb-2 text-gray-400">Tilføj favorit‑emojis (max 12). Klik for at tilføje.</div>
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Søg (fx rocket/target/sol)…"
                className="w-full mb-3 rounded-md px-3 py-2 text-sm outline-none border"
                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                autoFocus
            />
            <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">Trading</div>
            <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                {(filtered || TRADING_EMOJIS).map((it) => <Btn key={`t-${it.e}-${it.k[0] || ""}`} it={it} />)}
            </div>
            {!filtered && (
                <>
                    <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">General</div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                        {GENERAL_EMOJIS.map((it) => <Btn key={`g-${it.e}-${it.k[0] || ""}`} it={it} />)}
                    </div>
                </>
            )}
        </div>
    );
}

/* ===================== Hovedkomponent ===================== */
export default function SendTrade({ onSend }: { onSend: (t: TradeSignalInput) => void }) {
    const { user } = useDummySession();

    const [open, setOpen] = useState(false);

    // Plan/kanal-limit
    const plan = user?.isPro ? "pro" : "free"; // evt. premium senere
    const channelLimit = plan === "pro" ? Infinity : plan === "premium" ? 3 : 1;

    // Kanaler (dummy) — kommer fra Config senere
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

    // Gem/indlæs præferencer (traderTag/strategyTag/channels) pr. bruger
    const PREF_KEY = user ? `tt_sendtrade_prefs_${user.id}` : null;
    type Prefs = { traderTag?: string; strategyTag?: string; channels?: string[]; emojiDecor?: boolean };
    const loadPrefs = (): Prefs => {
        try {
            if (!PREF_KEY) return {};
            const raw = localStorage.getItem(PREF_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    };
    const savePrefs = (p: Prefs) => {
        try {
            if (!PREF_KEY) return;
            const prev = loadPrefs();
            localStorage.setItem(PREF_KEY, JSON.stringify({ ...prev, ...p }));
        } catch {}
    };

    const defaultTraders = ["Mikkel H.", "Anders K.", "Team Alpha"];
    const defaultStrategies = ["Breakout A", "NY Reversal", "Trend Pullback"];
    const defaultNotes = ["TP1 ramt → flyt SL til BE", "Skaler 50% ved TP1", "Nyhedsrisiko – reducér størrelse"];

    // Autosuggest symboler (dropdown fjernet; feltet bruges stadig)
    const [symbolQuery, setSymbolQuery] = useState("");
    // (vi beholder filteredSymbols hvis du senere vil genaktivere listen)
    const filteredSymbols = useMemo(() => {
        const q = symbolQuery.trim().toUpperCase();
        if (!q) return ALL_SYMBOLS;
        return ALL_SYMBOLS.filter((s) => s.includes(q));
    }, [symbolQuery]);

    // Formfelter
    const [type, setType] = useState<SignalType>("BUY NOW");
    const [symbol, setSymbol] = useState("");
    const [entryStr, setEntryStr] = useState("");
    const [stopStr, setStopStr] = useState("");
    const [tps, setTps] = useState<TpRow[]>([{ id: uid("tp"), priceStr: "" }]);

    const [traderTag, setTraderTag] = useState<string>(defaultTraders[0]);
    const [strategyTag, setStrategyTag] = useState<string>(defaultStrategies[0]);
    const [traderMode, setTraderMode] = useState<"select" | "custom">("select");
    const [strategyMode, setStrategyMode] = useState<"select" | "custom">("select");
    const [includeTrader, setIncludeTrader] = useState(true);
    const [includeStrategy, setIncludeStrategy] = useState(true);

    const [noteMode, setNoteMode] = useState<"pick" | "custom">("pick");
    const [notePick, setNotePick] = useState<string>(defaultNotes[0]);
    const [note, setNote] = useState<string>(defaultNotes[0]);

    const [useEmojiDecorations, setUseEmojiDecorations] = useState<boolean>(true);

    const [channels, setChannels] = useState<string[]>([allChannels[0]?.id].filter(Boolean) as string[]);

    // Favorit-emojis til NOTE
    const noteRef = useRef<HTMLInputElement | null>(null);
    const [favs, setFavs] = useState<string[]>([]);
    const [editFavs, setEditFavs] = useState(false);

    // Org‑disclaimer valg
    const [orgChoice, setOrgChoice] = useState<"neutral" | "ojd" | "custom">("ojd");
    const [orgCustom, setOrgCustom] = useState<string>("");

    // Åbning: hent prefs + favs + org config, fokus på symbol
    useEffect(() => {
        if (!open) return;
        // Bruger-prefs
        const p = loadPrefs();
        if (p.traderTag) setTraderTag(p.traderTag);
        if (p.strategyTag) setStrategyTag(p.strategyTag);
        if (typeof p.emojiDecor === "boolean" || typeof (p as any).emojiDecor === "boolean") {
            const val = (p as any).emojiDecor ?? p.emojiDecor;
            setUseEmojiDecorations(!!val);
        }
        if (Array.isArray(p.channels) && p.channels.length) {
            setChannels(p.channels.slice(0, channelLimit === Infinity ? undefined : channelLimit));
        }
        if (user?.id) setFavs(loadFavs(user.id));

        // Org config (midlertidigt lokalt)
        const org = loadOrgConfig();
        setOrgChoice(org.disclaimerChoice ?? "ojd");
        setOrgCustom(org.disclaimerCustom ?? "");

        // Fokus
        setTimeout(() => (document.getElementById("sendtrade-symbol-input") as HTMLInputElement | null)?.focus(), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Helpers
    const toNumber = (v: string): number | null => {
        if (v == null) return null;
        const s = v.replace(",", ".").trim();
        if (!s) return null;
        if (s === "." || s === "-" || s === "-.") return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    };

    const toggleChannel = (id: string) => {
        setChannels((chs) => {
            const has = chs.includes(id);
            if (has) {
                const next = chs.filter((c) => c !== id);
                savePrefs({ channels: next });
                return next;
            }
            if (chs.length >= channelLimit) {
                const next = [...chs];
                next.pop();
                next.push(id);
                savePrefs({ channels: next });
                return next;
            }
            const next = [...chs, id];
            savePrefs({ channels: next });
            return next;
        });
    };

    const addTp = () =>
        setTps((rows) => (rows.length >= 5 ? rows : [...rows, { id: uid("tp"), priceStr: "" }]));
    const removeTp = (id: string) => setTps((rows) => rows.filter((r) => r.id !== id));

    // Validering
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const entryNum = toNumber(entryStr);
    const stopNum = toNumber(stopStr);
    const tpNums = tps.map((t) => toNumber(t.priceStr)).filter((n): n is number => n != null);

    const errors = {
        symbol: symbol.trim() ? "" : "Angiv et symbol (fx EURUSD)",
        entry: entryNum != null ? "" : "Angiv et gyldigt Entry",
        stop: stopNum != null ? "" : "Angiv et gyldigt Stop (SL)",
        tps: tpNums.length > 0 ? "" : "Mindst én TP skal udfyldes",
        channels: channels.length ? "" : "Vælg mindst én kanal",
    };
    const isValid = !errors.symbol && !errors.entry && !errors.stop && !errors.tps && !errors.channels;

    // Enter‑genvej
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (e.key === "Enter" && isValid && target.tagName !== "TEXTAREA") {
                e.preventDefault();
                handleSubmit();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, isValid]); // eslint-disable-line

    // Notifikation
    const pushNotification = (title: string) => {
        try {
            const key = user ? `tt_notifs_${user.id}` : null;
            if (!key) return;
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            const a = Array.isArray(arr) ? arr : [];
            const newNotif = {
                id: `trade-${Date.now()}`,
                title,
                href: "/notifications",
                createdAt: new Date().toISOString(),
                read: false,
            };
            localStorage.setItem(key, JSON.stringify([newNotif, ...a].slice(0, 50)));
            window.dispatchEvent(new Event("tt:notifs:updated"));
        } catch {}
    };

    /* ============ Preview formatter ============ */
    const formatPreview = () => {
        const sym = symbol.toUpperCase();
        const E = (s: string) => (useEmojiDecorations ? s : "");

        const lines: string[] = [];
        lines.push(`**SIGNAL ALERT**`);
        lines.push(`${sym} - ${type}`);

        if (includeTrader && traderTag?.trim()) lines.push(`Analytiker: ${traderTag.trim()}`);
        if (includeStrategy && strategyTag?.trim()) lines.push(`Strategi: ${strategyTag.trim()}`);

        // Entry
        lines.push(`${E("📍 ")}Entry ${entryStr}`);

        // Stop loss + pips
        if (stopStr) {
            const slPips = entryNum != null ? calcPips(entryNum, Number(stopStr), sym) : null;
            lines.push(`${E("❌ ")}Stop loss ${stopStr}${slPips != null ? ` _(${slPips} pips)_` : ""}`);
            lines.push(""); // tom linje mellem SL og TP'er
        }

        // TP’er + pips
        tps.forEach((t, i) => {
            if (t.priceStr) {
                const pips = entryNum != null ? calcPips(entryNum, Number(t.priceStr), sym) : null;
                lines.push(`${E("🎯 ")}TP ${i + 1} - ${t.priceStr}${pips != null ? ` _(${pips} pips)_` : ""}`);
            }
        });

        // NOTE (over "Sendt af")
        if (note?.trim()) {
            lines.push("");
            lines.push(note.trim());
        }

        lines.push("");
        lines.push(`Sendt af: _${user?.name || "Ukendt"}_`);

        // Disclaimer nederst
        const disc = orgChoice === "ojd" ? DISCLAIMER_OJD : orgChoice === "neutral" ? DISCLAIMER_NEUTRAL : (orgCustom || DISCLAIMER_NEUTRAL);
        lines.push("");
        lines.push(`_${disc.replace(/\n/g, "\n")}_`);

        return lines.join("\n");
    };

    const handleSubmit = () => {
        if (!isValid) return;

        // Gem nogle prefs
        savePrefs({
            traderTag,
            strategyTag,
            channels,
            emojiDecor: useEmojiDecorations,
        });

        // Gem org‑valg (midlertidigt her – flyttes til Config‑side)
        saveOrgConfig({
            disclaimerChoice: orgChoice,
            disclaimerCustom: orgCustom,
        });

        const sym = symbol.toUpperCase();
        const payload: TradeSignalInput = {
            symbol: sym,
            type,
            entry: entryNum as number,
            stop: stopNum as number,
            tps: tpNums,
            note: note?.trim() ? note.trim() : undefined,
            traderTag: traderTag?.trim() || undefined,
            strategyTag: strategyTag?.trim() || undefined,
            includeTrader,
            includeStrategy,
            useEmojiDecorations,
            channels,
            sentBy: user?.name || "Ukendt",
            disclaimer: orgChoice === "ojd" ? DISCLAIMER_OJD : orgChoice === "neutral" ? DISCLAIMER_NEUTRAL : (orgCustom || DISCLAIMER_NEUTRAL),
        };

        onSend(payload);
        pushNotification(`Trade signal: ${type} ${payload.symbol} @ ${payload.entry} (SL ${payload.stop})`);

        // reset light
        setType("BUY NOW");
        setSymbol(""); setSymbolQuery("");
        setEntryStr(""); setStopStr("");
        setTps([{ id: uid("tp"), priceStr: "" }]);
        setNoteMode("pick"); setNotePick(defaultNotes[0]); setNote(defaultNotes[0]);
        setTraderMode("select"); setStrategyMode("select");
        setIncludeTrader(true); setIncludeStrategy(true);
        setOpen(false);
        setTouched({});
    };

    // Emoji indsæt i note
    const insertEmojiInNote = (emoji: string) => {
        const el = noteRef.current;
        if (!el) {
            setNote((d) => d + emoji);
            return;
        }
        const start = el.selectionStart ?? note.length;
        const end = el.selectionEnd ?? note.length;
        const before = note.slice(0, start);
        const after = note.slice(end);
        const next = before + emoji + after;
        setNote(next);
        requestAnimationFrame(() => {
            el.focus();
            const caret = start + emoji.length;
            el.setSelectionRange(caret, caret);
        });
    };

    const addFav = (e: string) => {
        if (!user?.id) return;
        const next = [...new Set([...favs, e])].slice(0, 12);
        setFavs(next);
        saveFavs(user.id, next);
    };
    const removeFav = (e: string) => {
        if (!user?.id) return;
        const next = favs.filter((x) => x !== e);
        setFavs(next);
        saveFavs(user.id, next);
    };

    return (
        <>
            {/* Trigger-knap */}
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: gold, color: "#000" }}
            >
                Send trade
            </button>

            {/* Modal */}
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[999] flex items-center justify-center"
                    onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                    style={{ background: "rgba(0,0,0,0.45)" }}
                >
                    <div
                        className="w-[95vw] max-w-3xl rounded-2xl border shadow-xl p-5"
                        style={{ background: "#2a2727", borderColor: border }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold" style={{ color: gold }}>Send trade</h3>
                            <div className="text-xs text-gray-400">
                                Plan:{" "}
                                <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${gold}`, color: gold }}>
                  {(plan as string).toUpperCase()}
                </span>{" "}
                                · Kanal‑limit: {channelLimit === Infinity ? "Ubegrænset" : channelLimit}
                            </div>
                        </div>

                        {/* Symbol + Type + Entry/SL */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="text-sm">
                                <span className="block text-gray-300 mb-1">Symbol</span>
                                <input
                                    id="sendtrade-symbol-input"
                                    value={symbolQuery}
                                    onBlur={() => setTouched((t) => ({ ...t, symbol: true }))}
                                    onChange={(e) => { const q = e.target.value.toUpperCase(); setSymbolQuery(q); setSymbol(q); }}
                                    placeholder="F.eks. EURUSD, XAUUSD, BTCUSD, XRPUSD"
                                    className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                    style={{ background: "#211d1d", color: "#f0f0f0", borderColor: errors.symbol && touched.symbol ? "#ff5757" : border }}
                                    aria-invalid={!!errors.symbol && touched.symbol}
                                    aria-describedby="symbol-help"
                                />
                                {/* Dropdown med forslag er fjernet bevidst */}
                                <div id="symbol-help" className="text-[11px] text-gray-400 mt-1">Skriv symbolet præcist (fx XRPUSD).</div>
                                {!!errors.symbol && touched.symbol && <div className="text-[11px] text-[#ff8a8a] mt-1">{errors.symbol}</div>}
                            </label>

                            <label className="text-sm">
                                <span className="block text-gray-300 mb-1">Signaltype</span>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as SignalType)}
                                    className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                    style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                >
                                    {["BUY NOW","SELL NOW","BUY LIMIT","SELL LIMIT","BUY STOP","SELL STOP"].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm">
                                    <span className="block text-gray-300 mb-1">Entry</span>
                                    <input
                                        inputMode="decimal"
                                        value={entryStr}
                                        onBlur={() => setTouched((t) => ({ ...t, entry: true }))}
                                        onChange={(e) => setEntryStr(e.target.value)}
                                        placeholder="1.2345"
                                        className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                        style={{ background: "#211d1d", color: "#f0f0f0", borderColor: errors.entry && touched.entry ? "#ff5757" : border }}
                                        aria-invalid={!!errors.entry && touched.entry}
                                    />
                                    {!!errors.entry && touched.entry && <div className="text-[11px] text-[#ff8a8a] mt-1">{errors.entry}</div>}
                                </label>
                                <label className="text-sm">
                                    <span className="block text-gray-300 mb-1">Stop (SL)</span>
                                    <input
                                        inputMode="decimal"
                                        value={stopStr}
                                        onBlur={() => setTouched((t) => ({ ...t, stop: true }))}
                                        onChange={(e) => setStopStr(e.target.value)}
                                        placeholder="1.2300"
                                        className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                        style={{ background: "#211d1d", color: "#f0f0f0", borderColor: errors.stop && touched.stop ? "#ff5757" : border }}
                                        aria-invalid={!!errors.stop && touched.stop}
                                    />
                                    {!!errors.stop && touched.stop && <div className="text-[11px] text-[#ff8a8a] mt-1">{errors.stop}</div>}
                                </label>
                            </div>
                        </div>

                        {/* TP’er */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Take Profit (TP1‑TP5)</span>
                                <button
                                    type="button"
                                    onClick={addTp}
                                    disabled={tps.length >= 5}
                                    className="px-2 py-1 rounded border text-xs disabled:opacity-50"
                                    style={{ borderColor: gold, color: gold }}
                                >
                                    + Tilføj TP
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {tps.map((tp, idx) => (
                                    <div key={tp.id} className="flex items-center gap-2">
                                        <label className="text-sm w-full">
                                            <span className="block text-gray-300 mb-1">TP{idx + 1}</span>
                                            <input
                                                inputMode="decimal"
                                                value={tp.priceStr}
                                                onBlur={() => setTouched((t) => ({ ...t, [`tp${idx}`]: true }))}
                                                onChange={(e) => setTps((rows) => rows.map((r) => (r.id === tp.id ? { ...r, priceStr: e.target.value } : r)))}
                                                placeholder={idx === 0 ? "F.eks. 1.2400" : ""}
                                                className="w-full rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => removeTp(tp.id)}
                                            className="px-2 py-2 rounded border"
                                            title="Fjern"
                                            style={{ borderColor: border, color: "#bbb" }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {!!errors.tps && (touched.tp0 || touched.tp1 || touched.tp2 || touched.tp3 || touched.tp4) && (
                                <div className="text-[11px] text-[#ff8a8a]">{errors.tps}</div>
                            )}
                        </div>

                        {/* ====== KANALER ====== */}
                        <div className="mt-4 rounded-xl p-3 border" style={{ borderColor: border, background: "#211d1d" }}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Send til kanaler</span>
                                <div className="text-xs text-gray-400">
                                    Valgt: <span style={{ color: gold }}>{channels.length}</span> / {channelLimit === Infinity ? "∞" : channelLimit}
                                </div>
                            </div>

                            {/* Badges over valgte */}
                            <div className="mt-2 flex flex-wrap gap-2">
                                {channels.length ? (
                                    channels.map((id) => {
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

                            {/* Checkbokse i gitter */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {allChannels.map((ch) => {
                                    const selected = channels.includes(ch.id);
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
                                            <input
                                                id={`ch-${ch.id}`}
                                                type="checkbox"
                                                className="sr-only"
                                                checked={selected}
                                                onChange={() => toggleChannel(ch.id)}
                                            />
                                            <span
                                                className="inline-block w-4 h-4 rounded border flex items-center justify-center"
                                                style={{ borderColor: selected ? gold : "#555" }}
                                            >
                        {selected ? "✓" : ""}
                      </span>
                                            <span className="text-sm">{ch.name}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {!!errors.channels && touched.channels && (
                                <div className="mt-2 text-[11px] text-[#ff8a8a]">{errors.channels}</div>
                            )}
                            {channelLimit !== Infinity && (
                                <div className="mt-1 text-[11px] text-gray-500">Din plan tillader maks. {channelLimit} kanal(er) pr. signal.</div>
                            )}
                        </div>

                        {/* Analytiker + Strategi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Analytiker</span>
                                    <label className="flex items-center gap-2 text-xs text-gray-300">
                                        <input type="checkbox" checked={includeTrader} onChange={(e) => setIncludeTrader(e.target.checked)} />
                                        Medtag i besked
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    {traderMode === "select" ? (
                                        <>
                                            <select
                                                value={traderTag}
                                                onChange={(e) => setTraderTag(e.target.value)}
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            >
                                                {defaultTraders.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setTraderMode("custom")}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Skriv eget navn"
                                            >
                                                ✏️
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                value={traderTag}
                                                onChange={(e) => setTraderTag(e.target.value)}
                                                placeholder="Skriv analytiker…"
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setTraderMode("select")}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Brug liste"
                                            >
                                                ↩︎
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Strategi</span>
                                    <label className="flex items-center gap-2 text-xs text-gray-300">
                                        <input type="checkbox" checked={includeStrategy} onChange={(e) => setIncludeStrategy(e.target.checked)} />
                                        Medtag i besked
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    {strategyMode === "select" ? (
                                        <>
                                            <select
                                                value={strategyTag}
                                                onChange={(e) => setStrategyTag(e.target.value)}
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            >
                                                {defaultStrategies.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setStrategyMode("custom")}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Skriv egen strategi"
                                            >
                                                ✏️
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                value={strategyTag}
                                                onChange={(e) => setStrategyTag(e.target.value)}
                                                placeholder="Skriv strategi…"
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setStrategyMode("select")}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Brug liste"
                                            >
                                                ↩︎
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Note + favoritter + emoji pynt toggle */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-300">Note (valgfri)</div>
                                <label className="flex items-center gap-2 text-xs text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={useEmojiDecorations}
                                        onChange={(e) => { setUseEmojiDecorations(e.target.checked); savePrefs({ emojiDecor: e.target.checked }); }}
                                    />
                                    Emoji pynt (📍/❌/🎯)
                                </label>
                            </div>

                            {/* Vælg/skriv note */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex gap-2">
                                    {noteMode === "pick" ? (
                                        <>
                                            <select
                                                value={notePick}
                                                onChange={(e) => { setNotePick(e.target.value); setNote(e.target.value); }}
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            >
                                                {defaultNotes.map((n) => <option key={n} value={n}>{n}</option>)}
                                                <option value="__custom__">✏️ Skriv ny…</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => { setNoteMode("custom"); if (notePick === "__custom__") setNote(""); }}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Skriv ny"
                                            >
                                                ✏️
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                ref={noteRef}
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Skriv note (vises uden 'Note:')"
                                                className="flex-1 rounded-md px-3 py-2 text-sm outline-none border"
                                                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setNoteMode("pick"); setNotePick(defaultNotes[0]); setNote(defaultNotes[0]); }}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                                title="Brug liste"
                                            >
                                                ↩︎
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Favorit-emojis til note */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-400">Favorit‑emojis (indsættes i note)</div>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setEditFavs((v) => !v)}
                                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                                style={{ borderColor: gold, color: gold }}
                                            >
                                                ⭐ Redigér
                                            </button>
                                            {editFavs && <EmojiPickerMini onPick={(e) => addFav(e)} />}
                                        </div>
                                    </div>

                                    {favs.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {favs.map((e) => (
                                                <div key={e} className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertEmojiInNote(e)}
                                                        className="px-2 py-1 rounded border hover:bg-white/5"
                                                        style={{ borderColor: gold, color: gold }}
                                                        title="Indsæt emoji i note"
                                                    >
                                                        {e}
                                                    </button>
                                                    {editFavs && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFav(e)}
                                                            className="px-1.5 py-1 rounded border text-xs hover:bg-white/5"
                                                            style={{ borderColor: border, color: "#bbb" }}
                                                            title="Fjern fra favoritter"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs text-gray-500">
                                            Ingen favoritter endnu. Klik <span style={{ color: gold }}>⭐ Redigér</span> for at tilføje (max 12).
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Org‑disclaimer (midlertidigt “admin” felt i modal) */}
                        <div className="mt-5 rounded-xl border p-3" style={{ borderColor: border }}>
                            <div className="text-xs text-gray-400 mb-2">Disclaimer (midlertidig, flyttes til Config‑side):</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="disc"
                                        checked={orgChoice === "neutral"}
                                        onChange={() => { setOrgChoice("neutral"); saveOrgConfig({ disclaimerChoice: "neutral" }); }}
                                    />
                                    Neutral
                                </label>
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="disc"
                                        checked={orgChoice === "ojd"}
                                        onChange={() => { setOrgChoice("ojd"); saveOrgConfig({ disclaimerChoice: "ojd" }); }}
                                    />
                                    One Journey Denmark
                                </label>
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="disc"
                                        checked={orgChoice === "custom"}
                                        onChange={() => { setOrgChoice("custom"); saveOrgConfig({ disclaimerChoice: "custom" }); }}
                                    />
                                    Custom…
                                </label>
                            </div>
                            {orgChoice === "custom" && (
                                <textarea
                                    value={orgCustom}
                                    onChange={(e) => { setOrgCustom(e.target.value); saveOrgConfig({ disclaimerCustom: e.target.value }); }}
                                    rows={3}
                                    className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none border"
                                    style={{ background: "#211d1d", color: "#f0f0f0", borderColor: border }}
                                    placeholder="Skriv jeres standard‑disclaimer…"
                                />
                            )}
                        </div>

                        {/* Preview */}
                        <div className="rounded-xl p-4 border mt-4" style={{ borderColor: border, background: "#211d1d" }}>
                            <div className="text-xs text-gray-400 mb-2">Forhåndsvisning (Discord‑format)</div>
                            <pre className="whitespace-pre-wrap text-sm">{formatPreview()}</pre>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-gray-500">
                                Tip: Tryk <span style={{ color: gold }}>Enter</span> for at sende, når alle felter er gyldige.
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setTouched({ symbol: true, entry: true, stop: true, tp0: true, channels: true });
                                        if (!isValid) return;
                                        handleSubmit();
                                    }}
                                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                                    style={{ background: gold, color: "#000" }}
                                >
                                    Send trade
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="px-3 py-2 rounded-md text-sm border"
                                    style={{ borderColor: gold, color: gold }}
                                >
                                    Luk
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
