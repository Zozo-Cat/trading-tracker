"use client";

import { useEffect, useState } from "react";

export type PeriodValue = "day" | "week" | "month";

type Props = {
    instanceId: string;
    slug: string;
    defaultValue?: PeriodValue;
    onChange?: (p: PeriodValue) => void;
};

export default function PeriodToggle({ instanceId, slug, defaultValue = "day", onChange }: Props) {
    const key = `tt.period.${instanceId}.${slug}`;
    const [v, setV] = useState<PeriodValue>(defaultValue);

    useEffect(() => {
        try {
            const s = localStorage.getItem(key) as PeriodValue | null;
            if (s === "day" || s === "week" || s === "month") setV(s);
        } catch {}
    }, [key]);

    useEffect(() => {
        try {
            localStorage.setItem(key, v);
        } catch {}
        onChange?.(v);
    }, [v, key, onChange]);

    const Btn = ({
                     value,
                     children,
                 }: {
        value: PeriodValue;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={() => setV(value)}
            className={`tt-period-btn inline-flex items-center justify-center rounded-md border transition
        ${v === value
                ? "bg-black/70 border-neutral-500 text-neutral-100"
                : "bg-transparent border-neutral-700 text-neutral-400 hover:text-neutral-200"
            }`}
            style={{
                height: 24,
                minWidth: 44,
                padding: "0 8px",
                fontSize: 11,
                lineHeight: 1,
                letterSpacing: 0.15,
                whiteSpace: "nowrap",
            }}
            aria-pressed={v === value}
        >
            {children}
        </button>
    );

    return (
        <div className="tt-period-toggle flex items-center gap-2">
            <Btn value="day">I dag</Btn>
            <Btn value="week">Uge</Btn>
            <Btn value="month">Måned</Btn>
        </div>
    );
}
