"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";

type ApiItem = {
    id: string;
    country: string;
    event: string;
    category: string;
    importance: number; // 1..3
    date: string;       // ISO
    when: string;       // allerede lokaliseret fra API (men vi viser også egen)
    url?: string;
};

type Props = { instanceId: string };

function fallbackItems(): ApiItem[] {
    return [
        {
            id: "1",
            country: "US",
            event: "Fed Chair Speech",
            category: "Central Bank",
            importance: 3,
            date: new Date().toISOString(),
            when: "now",
            url: "#",
        },
    ];
}
function importanceColor(n: number) {
    return n >= 3 ? "bg-rose-500/30 text-rose-300 border-rose-500/40"
        : n === 2 ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
}
function ImportanceBadge({ n }: { n: number }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${importanceColor(n)}`}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            <span>Imp. {n}</span>
        </span>
    );
}
function CountryDot({ code }: { code: string }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" />
            {code}
        </span>
    );
}

export default function NewsListWidget({ instanceId }: Props) {
    const [items, setItems] = useState<ApiItem[] | null>(null);

    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                // TODO: byt ud med rigtig API når klar
                const data = fallbackItems();
                if (!cancel) setItems(data);
            } catch {
                if (!cancel) setItems(fallbackItems());
            }
        })();
        return () => { cancel = true; };
    }, [instanceId]);

    if (!items) {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
                <div className="h-24 rounded-md border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">Nyheder</h3>
                </div>
            </div>

            <ul className="space-y-2">
                {items.map((it) => (
                    <Row key={it.id} item={it} tz={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"} />
                ))}
            </ul>
        </div>
    );
}

function Row({ item, tz }: { item: ApiItem; tz: string }) {
    const dt = new Date(item.date);
    const { prefs } = usePrefs();
    const dateStr = formatDateTime(dt, prefs, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    const content = (
        <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 hover:bg-neutral-900/60 transition">
            <ImportanceBadge n={item.importance} />
            <div className="min-w-0">
                <div className="text-sm text-neutral-100 truncate">{item.event}</div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                    <CountryDot code={item.country} />
                    <span>•</span>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{dateStr}</span>
                </div>
            </div>
        </div>
    );

    return <li>{item.url ? <a href={item.url} className="block">{content}</a> : content}</li>;
}

// (tidligere fmtLocal beholdes evt. ubenyttet; alt andet uændret)
