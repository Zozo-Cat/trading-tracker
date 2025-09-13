"use client";

import { useEffect, useMemo, useState } from "react";

export type PeriodValue = "day" | "week" | "month";

type Props = {
    instanceId: string;           // unik pr. widget instance (fra WidgetChrome)
    slug: string;                 // widget slug, fx "successRate"
    defaultValue?: PeriodValue;   // default "day"
    onChange?: (value: PeriodValue) => void;
    className?: string;
};

const STORAGE_PREFIX = "tt.dashboard.v2.widget";

export default function PeriodToggle({
                                         instanceId,
                                         slug,
                                         defaultValue = "day",
                                         onChange,
                                         className = "",
                                     }: Props) {
    const storageKey = useMemo(
        () => `${STORAGE_PREFIX}.${instanceId || slug}.range`,
        [instanceId, slug]
    );

    const [value, setValue] = useState<PeriodValue>(defaultValue);

    // Initial load (CSR only)
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw === "day" || raw === "week" || raw === "month") {
                setValue(raw);
                onChange?.(raw);
            } else {
                window.localStorage.setItem(storageKey, defaultValue);
                onChange?.(defaultValue);
            }
        } catch {
            onChange?.(defaultValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    const setPeriod = (next: PeriodValue) => {
        setValue(next);
        try {
            if (typeof window !== "undefined") {
                window.localStorage.setItem(storageKey, next);
            }
        } catch {
            // ignore LS errors
        }
        onChange?.(next);
    };

    const baseBtn =
        "px-3 py-1.5 rounded-md text-sm border transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const active =
        "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100";
    const inactive =
        "bg-transparent text-neutral-600 border-neutral-300 hover:bg-neutral-100 dark:text-neutral-300 dark:border-neutral-600 dark:hover:bg-neutral-800";

    return (
        <div
            className={`inline-flex items-center gap-2 select-none ${className}`}
            role="tablist"
            aria-label="Periode"
        >
            <button
                type="button"
                role="tab"
                aria-selected={value === "day"}
                aria-controls={`${instanceId || slug}-panel`}
                className={`${baseBtn} ${value === "day" ? active : inactive}`}
                onClick={() => setPeriod("day")}
            >
                I dag
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={value === "week"}
                aria-controls={`${instanceId || slug}-panel`}
                className={`${baseBtn} ${value === "week" ? active : inactive}`}
                onClick={() => setPeriod("week")}
            >
                Uge
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={value === "month"}
                aria-controls={`${instanceId || slug}-panel`}
                className={`${baseBtn} ${value === "month" ? active : inactive}`}
                onClick={() => setPeriod("month")}
            >
                Måned
            </button>
        </div>
    );
}
