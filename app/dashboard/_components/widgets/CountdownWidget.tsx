"use client";
import { useEffect, useMemo, useState } from "react";
import DashboardCard from "../DashboardCard";

function nextTime(hour = 9, minute = 0) {
    const now = new Date();
    const t = new Date();
    t.setHours(hour, minute, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t;
}

export default function CountdownWidget() {
    const target = useMemo(() => nextTime(9, 0), []);
    const [left, setLeft] = useState<number>(target.getTime() - Date.now());

    useEffect(() => {
        const id = setInterval(() => setLeft(target.getTime() - Date.now()), 1000);
        return () => clearInterval(id);
    }, [target]);

    const h = Math.max(0, Math.floor(left / 3_600_000));
    const m = Math.max(0, Math.floor((left % 3_600_000) / 60_000));
    const s = Math.max(0, Math.floor((left % 60_000) / 1000));

    return (
        <DashboardCard title="Nedtælling" subtitle={<span className="text-[11px] text-neutral-400">Til næste event (fx London Open)</span>}>
            <div className="h-full flex items-center gap-3">
                <div className="text-3xl font-semibold text-white tabular-nums">{h.toString().padStart(2,"0")}:{m.toString().padStart(2,"0")}:{s.toString().padStart(2,"0")}</div>
                <div className="text-sm text-neutral-300">hh:mm:ss</div>
            </div>
        </DashboardCard>
    );
}
