"use client";
import { useMemo } from "react";
import DashboardCard from "../DashboardCard";

type Trade = {
    id: string;
    sym: string;
    dir: "long" | "short";
    r: number;              // R-resultat (kan være 0 hvis åben)
    status: "OPEN" | "CLOSED";
    openedAt: string;       // ISO
    closedAt?: string;      // ISO, hvis lukket
};

function fmt(t?: string) {
    if (!t) return "";
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TradesTodayWidget() {
    // Demo-data — senere hentes fra konto/DB
    const data: Trade[] = useMemo(
        () => [
            { id: "t1", sym: "EURUSD", dir: "long",  r: +1.4, status: "CLOSED", openedAt: iso(-120), closedAt: iso(-40) },
            { id: "t2", sym: "USDJPY", dir: "long",  r:  0.0, status: "OPEN",   openedAt: iso(-30)  },
            { id: "t3", sym: "GBPUSD", dir: "short", r: -0.3, status: "CLOSED", openedAt: iso(-160), closedAt: iso(-90) },
            { id: "t4", sym: "XAUUSD", dir: "short", r: +0.5, status: "CLOSED", openedAt: iso(-60),  closedAt: iso(-15) },
            { id: "t5", sym: "NAS100", dir: "short", r:  0.0, status: "OPEN",   openedAt: iso(-10)  },
        ],
        []
    );

    // Sortering: ÅBNE først, herefter nyeste (openedAt DESC)
    const rows = useMemo(() => {
        return [...data]
            .sort((a, b) => {
                const openDiff = (b.status === "OPEN" ? 1 : 0) - (a.status === "OPEN" ? 1 : 0);
                if (openDiff !== 0) return openDiff;
                return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
            })
            .slice(0, 3);
    }, [data]);

    return (
        <DashboardCard title="Dagens trades" right={<div className="text-[11px] text-neutral-400">Åbne først • Seneste øverst</div>}>
            <div className="space-y-1">
                {rows.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-neutral-900/60 border border-neutral-800">
                        <div className="text-white text-sm">{r.sym}</div>

                        <div className="text-[11px] text-neutral-400">
                            {r.status === "OPEN" ? (
                                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">ÅBEN</span>
                            ) : (
                                <>
                                    <span>{fmt(r.openedAt)} → {fmt(r.closedAt)}</span>
                                </>
                            )}
                        </div>

                        <div className={`text-[12px] ${r.dir === "long" ? "text-green-400" : "text-red-400"}`}>
                            {r.dir === "long" ? "▲" : "▼"} {r.r > 0 ? "+" : ""}{r.r}R
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-right">
                <a href="/trades" className="text-[12px] text-neutral-300 hover:text-white underline">Se alle</a>
            </div>
        </DashboardCard>
    );
}

function iso(deltaMinutes: number) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + deltaMinutes);
    return d.toISOString();
}
