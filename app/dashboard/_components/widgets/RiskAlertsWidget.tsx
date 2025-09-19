"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * Risk Alerts
 * - Toggle: Seneste (default) / Aktive
 * - Liste med severities og tidspunkter (lokal TZ)
 * - Hydration-safe demo-data
 */

type Props = { instanceId: string };

type Severity = "Critical" | "Warning" | "Info";
type Status = "Aktiv" | "Lukket";
type Alert = {
    id: string;
    atMs: number;
    severity: Severity;
    status: Status;
    msg: string;
};

function localTz() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Copenhagen";
    } catch {
        return "Europe/Copenhagen";
    }
}
function fmt(ms: number, tz = localTz()) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

export default function RiskAlertsWidget({ instanceId }: Props) {
    const [mode, setMode] = useState<"recent" | "active">("recent");

    const rowsAll = useMemo<Alert[]>(() => {
        const base = Date.UTC(2024, 5, 1, 8, 0, 0);
        const rng = seededRng(`${instanceId}::riskalerts`);
        const CANDIDATES = [
            "Dagligt tab nærmer sig limit",
            "Positionsstørrelse overstiger 2% risiko",
            "Flere tab i træk — overvej pause",
            "Høj volatilitet registreret i aktiv session",
            "SL tæt på — undgå tilt",
            "Korrelation høj på samtidige handler",
            "Weekend/nyhedsrisko — reducer eksponering",
        ];

        return Array.from({ length: 10 }).map((_, i) => {
            const sev: Severity = rng() < 0.25 ? "Critical" : rng() < 0.6 ? "Warning" : "Info";
            const status: Status = rng() < 0.35 ? "Aktiv" : "Lukket";
            const msg = CANDIDATES[Math.floor(rng() * CANDIDATES.length)];
            const atMs = base + Math.floor((i + 1) * 11 * 3600 * 1000 * (0.5 + rng() * 0.8));
            return { id: `${i}-${sev}`, atMs, severity: sev, status, msg };
        }).sort((a, b) => b.atMs - a.atMs);
    }, [instanceId]);

    const rows = useMemo(() => {
        return (mode === "active" ? rowsAll.filter((r) => r.status === "Aktiv") : rowsAll).slice(0, 6);
    }, [rowsAll, mode]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Risk Alerts</div>
                    <HelpTip text="Advarsler om risiko: størrelser, tab, tilt, korrelation m.m. Toggle mellem seneste og aktive." />
                </div>
                <div className="rounded-md bg-neutral-800/70 p-0.5 border border-neutral-700">
                    <button
                        type="button"
                        onClick={() => setMode("recent")}
                        className={`px-2 py-1 text-xs rounded ${mode === "recent" ? "bg-neutral-700 text-neutral-100" : "text-neutral-300 hover:text-neutral-100"}`}
                        title="Seneste"
                    >
                        Seneste
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("active")}
                        className={`px-2 py-1 text-xs rounded ${mode === "active" ? "bg-neutral-700 text-neutral-100" : "text-neutral-300 hover:text-neutral-100"}`}
                        title="Aktive"
                    >
                        Aktive
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="h-20 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen {mode === "active" ? "aktive" : "seneste"} alerts.
                </div>
            ) : (
                <ul className="divide-y divide-neutral-800">
                    {rows.map((a) => (
                        <li key={a.id} className="py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <SeverityDot severity={a.severity} />
                                <div className="truncate">
                                    <div className="text-sm text-neutral-200 truncate">{a.msg}</div>
                                    <div className="text-xs text-neutral-400">{fmt(a.atMs)}</div>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full border text-xs shrink-0 ${
                                a.status === "Aktiv"
                                    ? "border-amber-600/50 text-amber-200 bg-amber-600/20"
                                    : "border-neutral-600/50 text-neutral-300 bg-neutral-700/20"
                            }`}>
                {a.status}
              </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SeverityDot({ severity }: { severity: Severity }) {
    const cls =
        severity === "Critical"
            ? "bg-rose-500"
            : severity === "Warning"
                ? "bg-amber-400"
                : "bg-neutral-400";
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} aria-label={severity} />;
}
