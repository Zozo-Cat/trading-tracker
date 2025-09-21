"use client";

import { useEffect, useMemo, useState } from "react";
import { seededRng } from "./seededRandom";

/**
 * TeamToggle
 * - Viser en <select> med teams.
 * - Hvis du ikke giver 'teams' prop, laver den deterministiske demo-teams.
 * - Hydration-safe (ingen Math.random/Date.now).
 */
export default function TeamToggle({
                                       instanceId,
                                       value,
                                       onChange,
                                       teams,
                                       label = "Team:",
                                   }: {
    instanceId: string;
    value?: string;
    onChange?: (team: string) => void;
    teams?: string[];
    label?: string;
}) {
    const rng = useMemo(() => seededRng(`${instanceId}::team-toggle`), [instanceId]);

    // Demo-teams hvis ikke givet udefra
    const options = useMemo(() => {
        if (teams && teams.length) return teams;
        const pool = ["Main Team", "Community Alpha", "Scalpers", "Funded Squad", "FX Crew"];
        // deterministisk shuffle
        const shuffled = pool
            .map((n) => ({ n, r: rng() }))
            .sort((a, b) => a.r - b.r)
            .slice(0, 3)
            .map((x) => x.n);
        return shuffled;
    }, [teams, rng]);

    // Default valgt team
    const [selected, setSelected] = useState<string>(value ?? options[0]);

    useEffect(() => {
        if (value && value !== selected) setSelected(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handle = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        setSelected(v);
        onChange?.(v);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">{label}</span>
            <select
                value={selected}
                onChange={handle}
                className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-100"
            >
                {options.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>
        </div>
    );
}
