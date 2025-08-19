// app/_components/discord/ServerSelect.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getConfig } from "@/lib/configStore";
import { getUserGuilds, getBotMemberships } from "@/lib/discord";

type Guild = { id: string; name: string; icon?: string | null };

function InfoIcon({ title }: { title: string }) {
    return (
        <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] border"
            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
            title={title}
            aria-label={title}
            role="img"
        >
      ?
    </span>
    );
}

export default function ServerSelect({
                                         value,
                                         onChange,
                                         label = "Vælg Discord-server",
                                         hint = "Listen viser som udgangspunkt kun servers hvor botten er installeret og som er forbundet i din konfiguration.",
                                         onlyInstalled = true,   // vis kun guilds hvor botten er installeret
                                         connectedOnly = true,   // filtrér også på connectedGuildIds fra config
                                         filterIds,              // valgfri ekstra whitelist (Set eller string[])
                                         disabled,
                                     }: {
    value?: string;
    onChange: (guildId: string) => void;
    label?: string;
    hint?: string;
    onlyInstalled?: boolean;
    connectedOnly?: boolean;
    filterIds?: Set<string> | string[];
    disabled?: boolean;
}) {
    // === Konfiguration (connectedGuildIds) ===
    const userId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || "demo-user";
    const cfg = getConfig(userId);

    const connectedIds = useMemo(() => {
        const arr: string[] = cfg?.integrations?.discord?.connectedGuildIds ?? [];
        return new Set(arr);
    }, [cfg]);

    const extraWhitelist = useMemo(() => {
        if (!filterIds) return undefined;
        return filterIds instanceof Set ? filterIds : new Set(filterIds as string[]);
    }, [filterIds]);

    // === Data & state ===
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [installedSet, setInstalledSet] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // === Hent brugerens guilds + bot memberships via lib/discord.ts ===
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // 1) brugerens guilds
                const list = await getUserGuilds();
                if (cancelled) return;
                setGuilds(Array.isArray(list) ? list : []);

                // 2) hvilke har botten?
                if (list?.length) {
                    const ids = list.map(g => g.id);
                    const { present } = await getBotMemberships(ids);
                    if (cancelled) return;
                    setInstalledSet(new Set(present || []));
                } else {
                    setInstalledSet(new Set());
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Uventet fejl under hentning af Discord-servere.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // === Filtreret liste ===
    const options = useMemo(() => {
        let list = guilds.slice();

        if (onlyInstalled) {
            list = list.filter(g => installedSet.has(g.id));
        }
        if (connectedOnly) {
            list = list.filter(g => connectedIds.has(g.id));
        }
        if (extraWhitelist && extraWhitelist.size) {
            list = list.filter(g => extraWhitelist.has(g.id));
        }

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [guilds, installedSet, connectedIds, onlyInstalled, connectedOnly, extraWhitelist]);

    const isDisabled = disabled || loading || options.length === 0;

    return (
        <div>
            <label className="block text-sm mb-1 inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                {label}
                <InfoIcon title={hint} />
            </label>

            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
                className="w-full rounded-lg border px-3 py-2 bg-transparent"
                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
            >
                <option value="" style={{ color: "#211d1d" }}>
                    — vælg —
                </option>
                {options.map((g) => (
                    <option key={g.id} value={g.id} style={{ color: "#211d1d" }}>
                        {g.name}
                    </option>
                ))}
            </select>

            {loading && (
                <div className="text-xs mt-1 opacity-80" style={{ color: "#D4AF37" }}>
                    Henter servere…
                </div>
            )}
            {err && (
                <div className="text-xs mt-1" style={{ color: "#ffb3b3" }}>
                    {err}
                </div>
            )}
            {!loading && !err && options.length === 0 && (
                <div className="text-xs mt-1 opacity-80" style={{ color: "#D4AF37" }}>
                    Ingen servers at vælge (tjek at botten er installeret og markeret som tilknyttet).
                </div>
            )}
        </div>
    );
}
