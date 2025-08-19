// app/_components/discord/RoleMultiSelect.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getGuildRoles } from "@/lib/discord";

type Role = { id: string; name: string; color?: number };

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

export default function RoleMultiSelect({
                                            guildId,
                                            values,
                                            onChange,
                                            label = "Tag roller",
                                            hint = "Søg efter roller (skriv @ for at fokusere på navn). Hold Ctrl/Cmd for at vælge flere.",
                                            disabled,
                                        }: {
    guildId?: string;
    values?: string[];
    onChange: (ids: string[]) => void;
    label?: string;
    hint?: string;
    disabled?: boolean;
}) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!guildId) {
                setRoles([]);
                return;
            }
            try {
                setLoading(true);
                setErr(null);
                const list = await getGuildRoles(guildId);
                if (cancelled) return;
                // sort by name (case-insensitive)
                const sorted = list.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                setRoles(sorted);
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Kunne ikke hente roller.");
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
        const term = (q || "").toLowerCase();
        if (!term) return roles;
        // Hvis bruger skriver "@", prioriter navnesøgning; ellers søg i både id og navn
        const pure = term.replace(/^@+/, "");
        const nameFirst = q.startsWith("@");
        return roles.filter((r) => {
            const n = (r.name || "").toLowerCase();
            const id = (r.id || "").toLowerCase();
            return nameFirst ? n.includes(pure) : n.includes(pure) || id.includes(pure);
        });
    }, [roles, q]);

    const isDisabled = disabled || loading || !guildId;

    return (
        <div>
            <label className="block text-sm mb-1 inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                {label}
                <InfoIcon title={hint} />
            </label>

            <input
                type="text"
                placeholder="Søg: @rolle, id…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 mb-2 bg-transparent"
                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                disabled={!guildId || disabled}
            />

            <select
                multiple
                value={values ?? []}
                onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
                disabled={isDisabled}
                className="w-full rounded-lg border px-3 py-2 bg-transparent"
                style={{ borderColor: "#D4AF37", color: "#D4AF37", minHeight: 140 }}
            >
                {filtered.map((r) => (
                    <option key={r.id} value={r.id} style={{ color: "#211d1d" }}>
                        {/* guld-tekst i dropdown-listen er svær at læse – vi farver kun label ovenfor */}
                        {r.name} (ID '{r.id}')
                    </option>
                ))}
            </select>

            {loading && guildId && (
                <div className="text-xs mt-1 opacity-80" style={{ color: "#D4AF37" }}>
                    Henter roller…
                </div>
            )}
            {err && (
                <div className="text-xs mt-1" style={{ color: "#ffb3b3" }}>
                    {err}
                </div>
            )}
        </div>
    );
}
