// app/config/(sections)/news-tracker/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getConfig, saveConfig } from "@/lib/configStore";

/* Genbrugelige Discord-selectors (eksisterende) */
import ServerSelect from "@/app/_components/discord/ServerSelect";
import ChannelSelect from "@/app/_components/discord/ChannelSelect";
import RoleMultiSelect from "@/app/_components/discord/RoleMultiSelect";

/* Emoji (direkte sti) */
import EmojiPopover from "@/app/_components/emoji/EmojiPopover";

/* ===================== UI helpers ===================== */
function InfoIcon({ title }: { title: string }) {
    return (
        <span
            title={title}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
        >
      ?
    </span>
    );
}
function Toggle({
                    checked,
                    onChange,
                    label,
                }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
}) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
          className="w-10 h-6 rounded-full relative"
          style={{ backgroundColor: checked ? "#76ed77" : "#444", transition: "background-color .15s ease" }}
          onClick={() => onChange(!checked)}
      >
        <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            style={{ transform: checked ? "translateX(20px)" : "translateX(0)", transition: "transform .15s ease" }}
        />
      </span>
            {label && <span style={{ color: "var(--tt-accent)" }}>{label}</span>}
        </label>
    );
}
function Hint({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
            {children}
        </p>
    );
}

/** Nummerfelt der lader dig slette helt mens du skriver */
function NumberField({
                         value,
                         onChange,
                         min,
                         max,
                         step,
                         placeholder,
                         style,
                         className,
                     }: {
    value: number | "" | undefined;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    style?: React.CSSProperties;
    className?: string;
}) {
    const [raw, setRaw] = useState<string>(value === "" || value === undefined ? "" : String(value));
    useEffect(() => {
        const target = value === "" || value === undefined ? "" : String(value);
        setRaw(target);
    }, [value]);
    return (
        <>
            <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{ -webkit-appearance: none; margin: 0; }
        input[type=number]{ -moz-appearance: textfield; }
      `}</style>
            <input
                inputMode="numeric"
                type="text"
                value={raw}
                placeholder={placeholder}
                onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                        setRaw("");
                        (window as any).ttSetDirty?.(true);
                        return;
                    }
                    if (!/^-?\d*(?:[.,]\d*)?$/.test(v)) return;
                    setRaw(v);
                    (window as any).ttSetDirty?.(true);
                }}
                onBlur={() => {
                    let v = raw.replace(",", ".");
                    if (v === "") return;
                    let num = Number(v);
                    if (!isFinite(num)) return;
                    if (min != null && num < min) num = min;
                    if (max != null && num > max) num = max;
                    onChange(num);
                }}
                className={`w-full rounded-lg px-3 py-2 ${className || ""}`}
                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff", ...(style || {}) }}
            />
        </>
    );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { type, ...rest } = props;
    return (
        <input
            type={type || "text"}
            {...rest}
            className={`w-full rounded-lg px-3 py-2 ${rest.className || ""}`}
            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff", ...(rest.style || {}) }}
            onChange={(e) => {
                rest.onChange?.(e);
                (window as any).ttSetDirty?.(true);
            }}
        />
    );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`w-full rounded-lg px-3 py-2 ${props.className || ""}`}
            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff", ...(props.style || {}) }}
            onChange={(e) => {
                props.onChange?.(e);
                (window as any).ttSetDirty?.(true);
            }}
        />
    );
}

/* ===================== Data & typer ===================== */
const TZ_LIST = [
    "Europe/Copenhagen",
    "Europe/Oslo",
    "Europe/Stockholm",
    "Europe/Berlin",
    "Europe/London",
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Hong_Kong",
    "Asia/Tokyo",
    "Australia/Sydney",
];

const MARKETS: { code: string; name: string }[] = [
    { code: "USD", name: "USA (US Dollar)" },
    { code: "EUR", name: "Eurozone (Euro)" },
    { code: "GBP", name: "Storbritannien (Pound)" },
    { code: "JPY", name: "Japan (Yen)" },
    { code: "AUD", name: "Australien (AUD)" },
    { code: "NZD", name: "New Zealand (NZD)" },
    { code: "CAD", name: "Canada (CAD)" },
    { code: "CHF", name: "Schweiz (CHF)" },
    { code: "CNY", name: "Kina (CNY)" },
    { code: "SEK", name: "Sverige (SEK)" },
    { code: "NOK", name: "Norge (NOK)" },
    { code: "DKK", name: "Danmark (DKK)" },
];

type Importance = 1 | 2 | 3;

/** >>> NY: importance som MULTI (fx { USD: [1,2,3], EUR:[2,3] }) – bagudkompatibel */
type ImportanceMulti = Record<string, Importance[] | Importance>;

/* Config-typer */
type WidgetsCfg = {
    enabled?: boolean;
    allowMemberDisable?: boolean;
    /** nu multi-importance pr. marked (bagudkompatibel med single number) */
    markets?: ImportanceMulti;
};
type WarningsRule = {
    id: string;
    serverId?: string;
    channelId?: string;
    roleIds?: string[];
    preMinutes: number;
    markets: string[]; // bevarer enkel liste til warnings for nu
    importance: Importance; // fælles importance for warning (kan udvides senere)
    template: string;
};
type WarningsCfg = { enabled?: boolean; rules?: WarningsRule[] };
type DigestCfg = {
    enabled?: boolean;
    serverId?: string;
    channelId?: string;
    roleIds?: string[];
    sendHour?: number; // 1–12
    ampm?: "AM" | "PM";
    template?: string;
    /** >>> NY: også i digest */
    markets?: ImportanceMulti;
};
type NewsCfg = { timezone?: string; widgets?: WidgetsCfg; warnings?: WarningsCfg; digest?: DigestCfg };
type Cfg = { news?: NewsCfg };

/* Sektioner (venstre liste) */
const SECTION_KEYS = ["general", "widgets", "warnings", "digest"] as const;
type SectionKey = typeof SECTION_KEYS[number];
const SECTION_TITLES: Record<SectionKey, string> = {
    general: "Generelt",
    widgets: "Dashboard widgets",
    warnings: "Discord warnings",
    digest: "Daily digest",
};
const SECTION_DESCS: Record<SectionKey, string> = {
    general: "Tidszone for planlægning og lokale klokkeslæt.",
    widgets: "Vælg markeder og importance (Lav*, Medium**, Høj***) – du kan vælge flere pr. marked.",
    warnings: "Send pre-warning X minutter før events (server/kanal/roller).",
    digest: "Daglig oversigt (server/kanal/roller, klokkeslæt og tekstskabelon).",
};

/* ===================== Del-komponenter ===================== */
function TimezoneSelect({
                            value,
                            onChange,
                        }: {
    value?: string;
    onChange: (v: string) => void;
}) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const n = q.trim().toLowerCase();
        if (!n) return TZ_LIST;
        return TZ_LIST.filter((t) => t.toLowerCase().includes(n));
    }, [q]);

    return (
        <div>
            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                <span className="text-sm">Tidszone</span>
                <InfoIcon title="Vælg din lokale tidszone. Brug søgefeltet for at finde den rigtige (fx 'Europe/Copenhagen')." />
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                <Select value={value || ""} onChange={(e) => onChange(e.target.value)}>
                    <option value="">— vælg tidszone —</option>
                    {filtered.map((tz) => (
                        <option key={tz} value={tz}>
                            {tz}
                        </option>
                    ))}
                </Select>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søg (fx copen/new_york)" />
            </div>
            <Hint>Bruges til at udregne præcis sendetid for warnings og daily digest.</Hint>
        </div>
    );
}

/** >>> NY: Multi-importance picker (bagudkompatibel) */
function MarketImportancePicker({
                                    value,
                                    onChange,
                                }: {
    value: ImportanceMulti;
    onChange: (v: ImportanceMulti) => void;
}) {
    const [q, setQ] = useState("");
    const rules = value || {};
    const list = useMemo(
        () =>
            MARKETS.filter((m) => m.code.toLowerCase().includes(q.toLowerCase()) || m.name.toLowerCase().includes(q.toLowerCase())),
        [q]
    );

    const getArr = (code: string): Importance[] => {
        const v = rules[code];
        if (Array.isArray(v)) return v as Importance[];
        if (v == null) return [];
        // bagudkompatibel: single → array
        return [v as Importance];
    };

    const toggleActive = (code: string) => {
        const curr = getArr(code);
        const next: ImportanceMulti = { ...rules };
        if (curr.length === 0) next[code] = [2]; // default Medium
        else delete next[code];
        onChange(next);
    };

    const toggleImp = (code: string, imp: Importance) => {
        const curr = new Set(getArr(code));
        if (curr.has(imp)) curr.delete(imp);
        else curr.add(imp);
        const arr = Array.from(curr).sort() as Importance[];
        const next: ImportanceMulti = { ...rules };
        if (arr.length === 0) delete next[code];
        else next[code] = arr;
        onChange(next);
    };

    const has = (code: string, imp: Importance) => getArr(code).includes(imp);

    return (
        <div className="rounded-lg p-2 space-y-3" style={{ border: "1px solid var(--tt-accent)" }}>
            <div className="flex items-center justify-between">
                <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Søg fx 'USD' eller 'Japan'…"
                    style={{ maxWidth: 320 }}
                />
                <div className="text-xs" style={{ color: "var(--tt-accent)" }}>
                    Valgt: <b style={{ color: "#fff" }}>{Object.keys(rules).filter((k) => getArr(k).length > 0).length}</b>
                </div>
            </div>

            {/* 4 pr. række – wrap på smallere skærme */}
            <ul
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
                    gap: "8px",
                }}
                className="max-[1400px]:grid-cols-3 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1"
            >
                {list.map(({ code, name }) => {
                    const active = getArr(code).length > 0;
                    return (
                        <li
                            key={code}
                            className="rounded-xl p-3 flex flex-col justify-between"
                            style={{
                                background: "#211d1d",
                                border: "1px solid color-mix(in srgb, var(--tt-accent) 22%, transparent)",
                            }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "#E9CC6A" }}>
                      {code}
                    </span>
                                        <span className="truncate text-xs" style={{ color: "var(--tt-accent)" }}>
                      {name}
                    </span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {active ? (
                                        <span
                                            className="px-2 py-0.5 rounded-md text-[11px]"
                                            style={{ border: "1px solid var(--tt-accent)", color: "#76ed77" }}
                                        >
                      Aktiv
                    </span>
                                    ) : (
                                        <span
                                            className="px-2 py-0.5 rounded-md text-[11px]"
                                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                        >
                      Inaktiv
                    </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleActive(code)}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                >
                                    {active ? "Fjern" : "Aktivér"}
                                </button>

                                <button
                                    type="button"
                                    disabled={!active}
                                    onClick={() => toggleImp(code, 1)}
                                    className={`px-2 py-1 rounded text-xs disabled:opacity-50 ${has(code, 1) ? "" : "opacity-60"}`}
                                    style={{ background: "#ffd54f", color: "#211d1d" }}
                                >
                                    Lav *
                                </button>
                                <button
                                    type="button"
                                    disabled={!active}
                                    onClick={() => toggleImp(code, 2)}
                                    className={`px-2 py-1 rounded text-xs disabled:opacity-50 ${has(code, 2) ? "" : "opacity-60"}`}
                                    style={{ background: "#ffb74d", color: "#211d1d" }}
                                >
                                    Medium **
                                </button>
                                <button
                                    type="button"
                                    disabled={!active}
                                    onClick={() => toggleImp(code, 3)}
                                    className={`px-2 py-1 rounded text-xs disabled:opacity-50 ${has(code, 3) ? "" : "opacity-60"}`}
                                    style={{ background: "#ff8a80", color: "#211d1d" }}
                                >
                                    Høj ***
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const DEFAULT_TOKENS = [
    { key: "{minutes}", desc: "Antal minutter til event" },
    { key: "{country}", desc: "Land/valuta (fx USA, EUR)" },
    { key: "{market}", desc: "Markeds-kode (fx USD, EUR)" },
    { key: "{title}", desc: "Navn på eventet" },
    { key: "{expected}", desc: "Forventet værdi" },
    { key: "{previous}", desc: "Tidligere værdi" },
    { key: "{time}", desc: "Lokalt tidspunkt" },
];

/** >>> Opdateret: Emoji-knap + luk ved klik udenfor */
function TemplateEditor({
                            label,
                            value,
                            onChange,
                            placeholder,
                        }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const popRef = useRef<HTMLDivElement | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);

    useEffect(() => {
        if (!showEmoji) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (btnRef.current?.contains(t)) return;
            if (popRef.current?.contains(t)) return;
            setShowEmoji(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showEmoji]);

    function insert(text: string) {
        const el = ref.current;
        if (!el) return onChange((value || "") + text);
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + text + value.slice(end);
        onChange(next);
        setTimeout(() => {
            el.focus();
            const pos = start + text.length;
            el.setSelectionRange(pos, pos);
        }, 0);
    }

    return (
        <div>
            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                <span className="text-sm">{label}</span>
                <InfoIcon title="Skriv din besked. Klik på tokens for at indsætte dynamiske felter. Brug emoji-knappen for at tilføje emojis." />
            </div>
            <div className="flex items-start gap-2">
        <textarea
            ref={ref}
            rows={4}
            value={value || ""}
            onChange={(e) => {
                onChange(e.target.value);
                (window as any).ttSetDirty?.(true);
            }}
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2"
            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
        />
                <div className="relative">
                    <button
                        ref={btnRef}
                        type="button"
                        onClick={() => setShowEmoji((v) => !v)}
                        className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        aria-haspopup="dialog"
                        aria-expanded={showEmoji}
                    >
                        😀
                    </button>
                    {showEmoji && (
                        <div ref={popRef} className="absolute right-0 top-full mt-2 z-[1000]">
                            <EmojiPopover onPick={(e) => { insert(e); setShowEmoji(false); }} userId="news-tracker" />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                {DEFAULT_TOKENS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => insert(t.key)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        title={t.desc}
                    >
                        {t.key}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ===================== Hovedside ===================== */
export default function NewsTrackerPage() {
    const userId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || "demo-user";
    const [cfg, setCfg] = useState<Cfg>(() => getConfig(userId));
    const [selected, setSelected] = useState<SectionKey | null>("general");
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

    const news = cfg.news ?? {};
    const widgets = news.widgets ?? {};
    const warnings = news.warnings ?? {};
    const digest = news.digest ?? {};

    const showToast = (kind: "success" | "error", msg: string, ms = 2400) => {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), ms);
    };
    const markDirty = () => {
        setDirty(true);
        (window as any).ttSetDirty?.(true);
    };

    // beforeunload guard
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    // global save hook (topbar “Gem”)
    useEffect(() => {
        const hook = async () => {
            await doSave();
        };
        (window as any).ttSaveHooks = (window as any).ttSaveHooks || [];
        (window as any).ttSaveHooks.push(hook);
        return () => {
            (window as any).ttSaveHooks = ((window as any).ttSaveHooks || []).filter((fn: any) => fn !== hook);
        };
    }, [cfg]);

    async function doSave(closePanel?: boolean) {
        try {
            if (!cfg?.news?.timezone) {
                showToast("error", "Angiv en tidszone under Generelt før du gemmer.");
                return;
            }
            setSaving(true);
            saveConfig(userId, cfg);
            setDirty(false);
            (window as any).ttSetDirty?.(false);
            showToast("success", "News Tracker gemt");
            if (closePanel) setSelected(null);
        } finally {
            setSaving(false);
        }
    }

    // venstre liste badges
    const statusBadge = (key: SectionKey) => {
        if (key === "general") return "Aktiv";
        if (key === "widgets") return widgets.enabled ? "Aktiv" : "Inaktiv";
        if (key === "warnings") return warnings.enabled ? "Aktiv" : "Inaktiv";
        if (key === "digest") return digest.enabled ? "Aktiv" : "Inaktiv";
        return "—";
    };

    return (
        <div className="relative">
            {/* Top intro */}
            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-semibold mb-1" style={{ color: "#E9CC6A" }}>
                            News Tracker
                        </h3>
                        <div className="text-sm" style={{ color: "var(--tt-accent)" }}>
                            Opsæt tidszone, dashboard-widgets, Discord warnings og daily digest.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {dirty && (
                            <span className="px-2 py-0.5 rounded-md text-[11px]" style={{ background: "#fffacd", color: "#211d1d", border: "1px solid #D4AF37" }}>
                Ikke gemte ændringer
              </span>
                        )}
                        <button
                            onClick={() => doSave()}
                            disabled={!dirty || saving}
                            className="px-3 py-1.5 rounded-md text-sm"
                            style={{ backgroundColor: dirty && !saving ? "#76ed77" : "#333", color: dirty && !saving ? "#211d1d" : "#888" }}
                        >
                            Gem
                        </button>
                    </div>
                </div>
            </div>

            {/* Venstre liste + højre panel */}
            <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
                {/* Liste */}
                <aside className="rounded-2xl p-4" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium" style={{ color: "var(--tt-accent)" }}>
                            Sektioner (klik for detaljer)
                        </div>
                        <div className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
                            {SECTION_KEYS.length} i alt
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {SECTION_KEYS.map((key) => {
                            const isSel = selected === key;
                            const activeTxt = statusBadge(key);
                            const isActive = activeTxt === "Aktiv";
                            return (
                                <li key={key}>
                                    <button
                                        onClick={() => setSelected(key)}
                                        className={`w-full text-left rounded-xl px-3 py-3 transition ${isSel ? "border" : "hover:opacity-90"}`}
                                        style={{ backgroundColor: "#211d1d", borderColor: isSel ? "var(--tt-accent)" : "transparent" }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-medium" style={{ color: "#E9CC6A" }}>
                                                    {SECTION_TITLES[key]}
                                                </div>
                                                <div className="text-xs mt-0.5 truncate" style={{ color: "var(--tt-accent)" }}>
                                                    {SECTION_DESCS[key]}
                                                </div>
                                            </div>
                                            <div className="shrink-0 pt-1">
                        <span className="px-2 py-0.5 rounded-md text-[11px]" style={{ border: "1px solid var(--tt-accent)", color: isActive ? "#76ed77" : "var(--tt-accent)" }}>
                          {activeTxt}
                        </span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                {/* Panel */}
                <section
                    className="relative overflow-auto rounded-2xl"
                    style={{ border: "1px solid var(--tt-accent)", backgroundColor: "#1a1717", minHeight: 720 }}
                >
                    {!selected && (
                        <div className="h-full flex items-center justify-center p-10">
                            <div className="text-sm opacity-80 text-center" style={{ color: "var(--tt-accent)" }}>
                                Vælg en sektion i venstre liste for at redigere dens indstillinger.
                            </div>
                        </div>
                    )}

                    {selected && (
                        <div className="absolute inset-0 p-6" style={{ animation: "slideIn .18s ease" }}>
                            <style>{`@keyframes slideIn{from{transform:translateX(12px);opacity:.0}to{transform:translateX(0);opacity:1}}`}</style>

                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <h3 className="text-base font-semibold" style={{ color: "#E9CC6A" }}>
                                        {SECTION_TITLES[selected]}
                                    </h3>
                                    <div className="text-sm opacity-90" style={{ color: "var(--tt-accent)" }}>
                                        {SECTION_DESCS[selected]}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="px-3 py-1.5 rounded-md text-sm"
                                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                >
                                    Luk
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {/* GENERELT */}
                                {selected === "general" && (
                                    <div className="space-y-4">
                                        <TimezoneSelect
                                            value={news.timezone}
                                            onChange={(v) => {
                                                setCfg((p) => ({ ...p, news: { ...p.news, timezone: v } }));
                                                markDirty();
                                            }}
                                        />
                                    </div>
                                )}

                                {/* DASHBOARD WIDGETS */}
                                {selected === "widgets" && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <Toggle
                                                checked={!!widgets.enabled}
                                                onChange={(v) => {
                                                    setCfg((p) => ({ ...p, news: { ...p.news, widgets: { ...p.news?.widgets, enabled: v } } }));
                                                    markDirty();
                                                }}
                                                label="Aktivér"
                                            />
                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!widgets.allowMemberDisable}
                                                    onChange={(e) => {
                                                        setCfg((p) => ({
                                                            ...p,
                                                            news: { ...p.news, widgets: { ...p.news?.widgets, allowMemberDisable: e.target.checked } },
                                                        }));
                                                        markDirty();
                                                    }}
                                                />
                                                <span style={{ color: "var(--tt-accent)" }}>Tillad at brugere kan til-/fravælge widgets</span>
                                            </label>
                                        </div>

                                        <div>
                                            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                                                <span className="text-sm">Markeder & importance (for widgets)</span>
                                                <InfoIcon title="Aktivér et marked og vælg én eller flere importance-niveauer (Lav/Medium/Høj)." />
                                            </div>
                                            <MarketImportancePicker
                                                value={widgets.markets ?? {}}
                                                onChange={(v) => {
                                                    setCfg((p) => ({ ...p, news: { ...p.news, widgets: { ...p.news?.widgets, markets: v } } }));
                                                    markDirty();
                                                }}
                                            />
                                        </div>

                                        <div className="pt-2 flex items-center gap-2">
                                            <button
                                                onClick={() => doSave(true)}
                                                disabled={saving}
                                                className="px-3 py-2 rounded-lg text-sm font-medium"
                                                style={{ backgroundColor: saving ? "#333" : "#76ed77", color: saving ? "#888" : "#211d1d" }}
                                            >
                                                Gem ændringer
                                            </button>
                                            <Hint>Gem lukker panelet. Din globale “Gem” virker også.</Hint>
                                        </div>
                                    </div>
                                )}

                                {/* DISCORD WARNINGS */}
                                {selected === "warnings" && (
                                    <WarningsPanel
                                        value={warnings}
                                        onChange={(v) => {
                                            setCfg((p) => ({ ...p, news: { ...p.news, warnings: v } }));
                                            markDirty();
                                        }}
                                    />
                                )}

                                {/* DAILY DIGEST */}
                                {selected === "digest" && (
                                    <DigestPanel
                                        value={digest}
                                        onChange={(v) => {
                                            setCfg((p) => ({ ...p, news: { ...p.news, digest: v } }));
                                            markDirty();
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                    style={{ backgroundColor: toast.kind === "success" ? "#76ed77" : "#ff7676", color: "#211d1d" }}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

/* ===================== Panels ===================== */
function WarningsPanel({
                           value,
                           onChange,
                       }: {
    value: WarningsCfg;
    onChange: (v: WarningsCfg) => void;
}) {
    const rules = value.rules ?? [];
    const set = (patch: Partial<WarningsCfg>) => onChange({ ...value, ...patch });
    const add = () =>
        set({
            rules: [
                ...rules,
                {
                    id: crypto.randomUUID?.() ?? `wrn-${Date.now()}`,
                    preMinutes: 10,
                    markets: ["USD"],
                    importance: 2,
                    template: "⏳ {minutes} min før: {title} ({country}) — forventet {expected}, tidligere {previous}.",
                },
            ],
        });
    const remove = (id: string) => set({ rules: rules.filter((r) => r.id !== id) });
    const patch = (id: string, p: Partial<WarningsRule>) => set({ rules: rules.map((r) => (r.id === id ? { ...r, ...p } : r)) });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Toggle checked={!!value.enabled} onChange={(v) => set({ enabled: v })} label="Aktivér" />
            </div>

            {rules.length === 0 && (
                <div className="text-sm" style={{ color: "var(--tt-accent)" }}>
                    Ingen warnings endnu. Klik “Tilføj warning”.
                </div>
            )}

            {rules.map((r, i) => (
                <div key={r.id} className="rounded-xl p-4 space-y-4" style={{ background: "#211d1d", border: "1px solid var(--tt-accent)" }}>
                    <div className="flex items-center justify-between">
                        <div className="text-sm" style={{ color: "var(--tt-accent)" }}>
                            Warning #{i + 1}
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(r.id)}
                            className="px-2 py-1 rounded text-sm"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        >
                            Fjern
                        </button>
                    </div>

                    {/* Server / Kanal / Roller */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <ServerSelect
                            value={r.serverId}
                            onChange={(id) => patch(r.id, { serverId: id, channelId: undefined, roleIds: [] })}
                            label="Server"
                            hint="Vælg Discord-server for advarslen."
                            onlyInstalled
                        />
                        <ChannelSelect
                            guildId={r.serverId}
                            value={r.channelId}
                            onChange={(id) => patch(r.id, { channelId: id })}
                            label="Kanal"
                            hint="Søg på navn, kategori eller ID. Format: Navn (i Kategori, ID '123')"
                            searchable
                        />
                        <RoleMultiSelect
                            guildId={r.serverId}
                            values={r.roleIds ?? []}
                            onChange={(ids) => patch(r.id, { roleIds: ids })}
                            label="Tag roller"
                            hint="Søg med @ + bogstav, eller fritekst"
                            accentColor="#D4AF37"
                            searchable
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                                <span className="text-sm">Pre-warning (min)</span>
                                <InfoIcon title="Hvor mange minutter før eventet skal advarslen sendes?" />
                            </div>
                            <NumberField value={r.preMinutes} min={0} onChange={(num) => patch(r.id, { preMinutes: Math.max(0, num) })} />
                        </div>

                        <div>
                            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                                <span className="text-sm">Markeder (tjekliste)</span>
                                <InfoIcon title="Vælg hvilke markeder denne warning gælder for." />
                            </div>
                            <div className="rounded-lg p-2" style={{ border: "1px solid var(--tt-accent)" }}>
                                <div className="grid grid-cols-2 gap-1">
                                    {MARKETS.map((m) => {
                                        const on = (r.markets || []).includes(m.code);
                                        return (
                                            <label key={m.code} className="inline-flex items-center gap-2 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={on}
                                                    onChange={(e) => {
                                                        const s = new Set(r.markets || []);
                                                        e.target.checked ? s.add(m.code) : s.delete(m.code);
                                                        patch(r.id, { markets: Array.from(s) });
                                                    }}
                                                />
                                                <span style={{ color: "var(--tt-accent)" }}>{m.code}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                                <span className="text-sm">Importance</span>
                                <InfoIcon title="Lav* (gul), Medium** (orange), Høj*** (rød). Gælder for denne warning." />
                            </div>
                            <Select
                                value={r.importance}
                                onChange={(e) => patch(r.id, { importance: Number(e.target.value) as Importance })}
                            >
                                <option value={1}>Lav *</option>
                                <option value={2}>Medium **</option>
                                <option value={3}>Høj ***</option>
                            </Select>
                        </div>
                    </div>

                    <TemplateEditor
                        label="Tekstskabelon"
                        value={r.template}
                        onChange={(v) => patch(r.id, { template: v })}
                        placeholder="Fx: ⏳ {minutes} min før: {title} ({country}) — forventet {expected}, tidligere {previous}."
                    />

                    <div>
                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-md text-sm"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                            onClick={() => {
                                // TODO: kald backend når klar:
                                // fetch('/api/discord/test-warning',{method:'POST',body:JSON.stringify(r),headers:{'Content-Type':'application/json'}})
                                console.log("[TEST WARNING PAYLOAD]", r);
                            }}
                        >
                            Send test
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={add}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
            >
                Tilføj warning
            </button>

            <div className="pt-2 flex items-center gap-2">
                <button
                    onClick={() => (window as any).ttSaveHooks?.at(-1)?.()}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: "#76ed77", color: "#211d1d" }}
                >
                    Gem ændringer
                </button>
                <Hint>Gem lukker ikke panelet her – brug evt. den globale “Gem”.</Hint>
            </div>
        </div>
    );
}

function DigestPanel({
                         value,
                         onChange,
                     }: {
    value: DigestCfg;
    onChange: (v: DigestCfg) => void;
}) {
    const set = (patch: Partial<DigestCfg>) => onChange({ ...value, ...patch });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Toggle checked={!!value.enabled} onChange={(v) => set({ enabled: v })} label="Aktivér" />
            </div>

            <div className="rounded-xl p-4 space-y-4" style={{ background: "#211d1d", border: "1px solid var(--tt-accent)" }}>
                <div className="grid gap-3 md:grid-cols-3">
                    <ServerSelect value={value.serverId} onChange={(id) => set({ serverId: id, channelId: undefined, roleIds: [] })} label="Server" hint="Vælg server til den daglige oversigt." onlyInstalled />
                    <ChannelSelect guildId={value.serverId} value={value.channelId} onChange={(id) => set({ channelId: id })} label="Kanal" hint="Søg på navn/kategori/ID" searchable />
                    <RoleMultiSelect guildId={value.serverId} values={value.roleIds ?? []} onChange={(ids) => set({ roleIds: ids })} label="Tag roller" hint="Søg med @ + bogstav, eller fritekst" accentColor="#D4AF37" searchable />
                </div>

                {/* >>> NY: markeder i digest (samme UI som widgets) */}
                <div>
                    <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                        <span className="text-sm">Markeder & importance (til oversigten)</span>
                        <InfoIcon title="Vælg ét eller flere importance-niveauer pr. marked." />
                    </div>
                    <MarketImportancePicker
                        value={value.markets ?? {}}
                        onChange={(v) => set({ markets: v })}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-[160px_120px]">
                    <div>
                        <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                            <span className="text-sm">Sendetid (1–12)</span>
                            <InfoIcon title="Klokkeslæt for daglig oversigt. Brug sammen med AM/PM." />
                        </div>
                        <NumberField value={value.sendHour ?? 9} min={1} max={12} onChange={(n) => set({ sendHour: Math.max(1, Math.min(12, n)) })} />
                    </div>
                    <div>
                        <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                            <span className="text-sm">AM/PM</span>
                            <InfoIcon title="Vælg AM eller PM." />
                        </div>
                        <Select value={value.ampm ?? "AM"} onChange={(e) => set({ ampm: e.target.value as "AM" | "PM" })}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </Select>
                    </div>
                </div>

                <TemplateEditor
                    label="Tekstskabelon"
                    value={value.template ?? ""}
                    onChange={(v) => set({ template: v })}
                    placeholder="📰 Dagens vigtigste events: {time} – {title} ({market}), forventet {expected}, tidligere {previous}…"
                />

                <div>
                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        onClick={() => {
                            // TODO: kald backend når klar:
                            // fetch('/api/discord/test-digest',{method:'POST',body:JSON.stringify(value),headers:{'Content-Type':'application/json'}})
                            console.log("[TEST DIGEST PAYLOAD]", value);
                        }}
                    >
                        Send test
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={() => (window as any).ttSaveHooks?.at(-1)?.()}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: "#76ed77", color: "#211d1d" }}
                >
                    Gem ændringer
                </button>
            </div>
        </div>
    );
}
