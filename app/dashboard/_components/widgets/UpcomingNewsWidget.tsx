"use client";

import { useEffect, useMemo, useState } from "react";

type ApiItem = {
    id: string;
    country: string;
    event: string;
    category: string;
    importance: number;
    date: string;  // ISO
    when: string;  // lokaliseret fra API
    url?: string;
};

type ApiRes = { ok: true; items: ApiItem[] } | { ok: false; error: string };

export default function UpcomingNewsWidget({ instanceId }: { instanceId: string }) {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [items, setItems] = useState<ApiItem[]>([]);

    const tz = useMemo(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        []
    );

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // High-impact events, cap = 5 (så vi undgår intern scroll)
                const url = `/api/calendar/next?limit=5&minImpact=3&hours=168&tz=${encodeURIComponent(
                    tz
                )}`;
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) {
                    setErr(`HTTP ${res.status}`);
                    setItems([]);
                    return;
                }
                const data: ApiRes = await res.json();
                if (!data.ok) {
                    setErr(data.error || "Ukendt fejl");
                    setItems([]);
                    return;
                }
                if (alive) setItems((data.items || []).slice(0, 5));
            } catch (e: any) {
                if (alive) {
                    setErr(e?.message || "Kunne ikke hente nyheder");
                    setItems([]);
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [tz]);

    const localTime = useMemo(() => {
        try {
            return new Intl.DateTimeFormat("da-DK", {
                timeZone: tz, hour: "2-digit", minute: "2-digit",
            }).format(new Date());
        } catch {
            return "";
        }
    }, [tz]);

    return (
        <div className="h-full flex flex-col min-h-0" id={`${instanceId}-upcoming`}>
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">High Volatility News</div>
                <div className="text-xs text-neutral-400">Lokal tid: {localTime}</div>
            </div>

            {/* Indhold — ingen intern scroll */}
            {loading ? (
                <ListSkeleton rows={5} />
            ) : err ? (
                <div className="text-sm text-red-300">{err || "Kunne ikke hente nyheder."}</div>
            ) : !items.length ? (
                <div className="text-sm text-neutral-400">Ingen kommende events fundet.</div>
            ) : (
                <ul className="space-y-3">
                    {items.map((it) => (
                        <li key={it.id}>
                            <Row item={it} tz={tz} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* -------------------- UI helpers -------------------- */

function Row({ item, tz }: { item: ApiItem; tz: string }) {
    const dt = new Date(item.date);
    const dateStr = fmtLocal(dt, tz);

    const content = (
        <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 hover:bg-neutral-900/60 transition">
            <ImportanceBadge n={item.importance} />
            <div className="min-w-0">
                <div className="truncate">
                    <span className="font-medium">{item.event}</span>
                    <span className="text-neutral-300"> — {item.country}</span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">{dateStr}</div>
            </div>
        </div>
    );

    return item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="block focus:outline-none focus:ring-1 focus:ring-neutral-600 rounded-md" title="Åbn hos TradingEconomics">
            {content}
        </a>
    ) : content;
}

function ImportanceBadge({ n }: { n: number }) {
    const cfg =
        n >= 3
            ? { bg: "bg-red-600/20", dot: "bg-red-500", label: "Høj" }
            : n === 2
                ? { bg: "bg-amber-500/20", dot: "bg-amber-400", label: "Medium" }
                : { bg: "bg-emerald-600/20", dot: "bg-emerald-500", label: "Lav" };

    return (
        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${cfg.bg}`}>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-neutral-200">{cfg.label}</span>
        </div>
    );
}

function fmtLocal(d: Date, tz: string) {
    try {
        const date = new Intl.DateTimeFormat("da-DK", {
            timeZone: tz, day: "2-digit", month: "2-digit",
        }).format(d);
        const time = new Intl.DateTimeFormat("da-DK", {
            timeZone: tz, hour: "2-digit", minute: "2-digit",
        }).format(d);
        return `${date}, ${time}`;
    } catch {
        return d.toISOString();
    }
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <ul className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <li key={i} className="h-11 rounded-lg border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            ))}
        </ul>
    );
}
