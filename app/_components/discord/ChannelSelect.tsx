// app/_components/discord/ChannelSelect.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getGuildChannels } from "@/lib/discord";

type Channel = {
    id: string;
    name: string;
    type?: number;
    parent_id?: string | null;
    parentName?: string | null;
};

function formatLabel(c: Channel) {
    // LABEL: KANALNAVN (i KATEGORI, ID '123')
    const cat = c.parentName || null;
    const base = c.name || c.id;
    const parts = [base];
    const meta: string[] = [];
    if (cat) meta.push(`i ${cat}`);
    meta.push(`ID '${c.id}'`);
    return `${parts.join(" ")} (${meta.join(", ")})`;
}

export default function ChannelSelect({
                                          guildId,
                                          value,
                                          onChange,
                                          label = "Vælg kanal",
                                          hint = "Søg efter kanalnavn, kategori eller ID.",
                                          disabled,
                                      }: {
    guildId?: string;
    value?: string;
    onChange: (channelId: string) => void;
    label?: string;
    hint?: string;
    disabled?: boolean;
}) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!guildId) {
                setChannels([]);
                return;
            }
            try {
                setLoading(true);
                setErr(null);
                const list = await getGuildChannels(guildId);
                if (cancelled) return;
                // sort: category (parentName) then name
                const sorted = list
                    .slice()
                    .sort((a, b) =>
                        `${a.parentName || ""}/${a.name}`.localeCompare(`${b.parentName || ""}/${b.name}`)
                    );
                setChannels(sorted);
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Kunne ikke hente kanaler.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => {
            cancelled = true;
        };
    }, [guildId]);

    const filtered = useMemo(() => {
        const z = (s: string) => (s || "").toLowerCase();
        const term = z(q);
        if (!term) return channels;
        return channels.filter((c) => {
            return (
                z(c.name).includes(term) ||
                z(c.parentName || "").includes(term) ||
                z(c.id).includes(term)
            );
        });
    }, [channels, q]);

    const isDisabled = disabled || loading || !guildId || filtered.length === 0;

    return (
        <div>
            <label className="block text-sm mb-1 inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                {label}
                <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] border"
                    style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                    title={hint}
                >
          ?
        </span>
            </label>

            <input
                type="text"
                placeholder="Søg: navn, kategori, ID…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mb-2 bg-transparent"
                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                disabled={!guildId || disabled}
            />

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
                {filtered.map((c) => (
                    <option key={c.id} value={c.id} style={{ color: "#211d1d" }}>
                        {formatLabel(c)}
                    </option>
                ))}
            </select>

            {loading && guildId && (
                <div className="text-xs mt-1 opacity-80" style={{ color: "#D4AF37" }}>
                    Henter kanaler…
                </div>
            )}
            {err && (
                <div className="text-xs mt-1" style={{ color: "#ffb3b3" }}>
                    {err}
                </div>
            )}
            {!loading && !err && guildId && filtered.length === 0 && (
                <div className="text-xs mt-1 opacity-80" style={{ color: "#D4AF37" }}>
                    Ingen kanaler matcher din søgning.
                </div>
            )}
        </div>
    );
}
