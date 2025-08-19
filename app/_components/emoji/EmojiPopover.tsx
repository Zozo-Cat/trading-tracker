"use client";

import { useMemo, useState } from "react";
import {
    TOP_DEFAULT_EMOJIS,
    TRADING_EMOJIS,
    GENERAL_EMOJIS,
    SEARCH_POOL,
    type EmojiItem,
} from "@/app/_data/emojis";

type UsageMap = Record<string, { c: number; t: number }>;
const usageKey = (uid: string) => `tt_emoji_usage_${uid}`;

function loadUsage(uid: string): UsageMap {
    try {
        const raw = localStorage.getItem(usageKey(uid));
        const v = raw ? JSON.parse(raw) : {};
        return typeof v === "object" && v ? v : {};
    } catch {
        return {};
    }
}
function saveUsage(uid: string, map: UsageMap) {
    try {
        localStorage.setItem(usageKey(uid), JSON.stringify(map));
    } catch {}
}
function recordUse(uid: string, emoji: string) {
    const map = loadUsage(uid);
    const now = Date.now();
    if (!map[emoji]) map[emoji] = { c: 0, t: 0 };
    map[emoji].c += 1;
    map[emoji].t = now;
    saveUsage(uid, map);
}
function topUsed(uid: string, limit = 24): string[] {
    const map = loadUsage(uid);
    const entries = Object.entries(map);
    entries.sort((a, b) => {
        const ua = a[1];
        const ub = b[1];
        if (ub.c !== ua.c) return ub.c - ua.c;
        return ub.t - ua.t;
    });
    return entries.slice(0, limit).map(([e]) => e);
}

export default function EmojiPopover({
                                         onPick,
                                         userId,
                                     }: {
    onPick: (emoji: string) => void;
    userId: string;
}) {
    const [q, setQ] = useState("");
    const ql = q.trim().toLowerCase();

    const quick: EmojiItem[] = useMemo(() => {
        const top = topUsed(userId, 24);
        if (top.length === 0) return TOP_DEFAULT_EMOJIS;
        const map = new Map<string, EmojiItem>();
        for (const it of SEARCH_POOL) map.set(it.e, it);
        return top.map((e) => map.get(e) ?? ({ e, k: [] } as EmojiItem));
    }, [userId]);

    const filtered = useMemo(() => {
        if (!ql) return null;
        return SEARCH_POOL.filter(
            (it) => it.e.includes(ql) || it.k.some((kw) => kw.toLowerCase().includes(ql))
        );
    }, [ql]);

    const Btn = ({ it }: { it: EmojiItem }) => (
        <button
            type="button"
            onClick={() => {
                recordUse(userId, it.e);
                onPick(it.e);
            }}
            className="flex items-center justify-center rounded hover:bg-white/10"
            style={{ width: 36, height: 36, fontSize: 22, lineHeight: 1 }}
            title={it.k.join(", ")}
        >
            {it.e}
        </button>
    );

    return (
        <div
            className="absolute right-0 top-full mt-2 z-[1000] rounded-2xl border shadow-xl p-3"
            style={{ background: "#2a2727", borderColor: "#3b3838", width: 360 }}
        >
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Søg emoji… (fx stjerne/rocket/sol/rain)"
                className="w-full mb-3 rounded-md px-3 py-2 text-sm outline-none border"
                style={{ background: "#211d1d", color: "#f0f0f0", borderColor: "#3b3838" }}
                autoFocus
            />

            {filtered ? (
                <>
                    <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">Søgning</div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                        {filtered.map((it) => (
                            <Btn key={it.e + (it.k[0] || "")} it={it} />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-8 text-center text-xs text-gray-400 py-2">Ingen match</div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">Hurtig adgang</div>
                    <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                        {quick.map((it) => (
                            <Btn key={`q-${it.e}`} it={it} />
                        ))}
                    </div>

                    <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">Trading</div>
                    <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                        {TRADING_EMOJIS.map((it) => (
                            <Btn key={`t-${it.e}`} it={it} />
                        ))}
                    </div>

                    <div className="text-[11px] uppercase tracking-wide mb-1 text-gray-400">General</div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                        {GENERAL_EMOJIS.map((it) => (
                            <Btn key={`g-${it.e}`} it={it} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
