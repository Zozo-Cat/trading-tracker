"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useSelectedCommunity } from "@/app/_providers/SelectedCommunityProvider";

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

type CommunityLite = { id: string; name: string; logo_url: string | null };

export default function CommunityPicker() {
    const search = useSearchParams();
    const { selectedCommunityId, setSelectedCommunityId } = useSelectedCommunity();

    const [items, setItems] = useState<CommunityLite[]>([]);
    const [loading, setLoading] = useState(true);

    // Hent communities
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data, error } = await sb()
                    .from("communities_with_stats")
                    .select("id,name,logo_url")
                    .order("name", { ascending: true });
                if (error) throw error;
                setItems((data || []) as CommunityLite[]);
            } catch {
                // no-op
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Sync dropdown-værdien med URL hvis nogen anden navigation sætter communityId
    useEffect(() => {
        const urlId = search.get("communityId");
        if (urlId && urlId !== selectedCommunityId) {
            setSelectedCommunityId(urlId);
            try {
                localStorage.setItem("tt_last_community_id", urlId);
            } catch {}
        }
    }, [search, selectedCommunityId, setSelectedCommunityId]);

    function persistAndBroadcast(id: string) {
        try {
            localStorage.setItem("tt_last_community_id", id);
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new CustomEvent("tt:community:changed", { detail: { id } }));
        } catch {}
    }

    function onPick(id: string) {
        if (!id || id === selectedCommunityId) return;
        setSelectedCommunityId(id);
        persistAndBroadcast(id);

        // Byg ny URL med communityId (bevar øvrige query params)
        const url = new URL(window.location.href);
        url.searchParams.set("communityId", id);

        // 🔒 HARD RELOAD = alt opdateres (server + client komponenter)
        window.location.assign(url.toString());
    }

    function goCreateCommunity() {
        window.location.assign("/config/org-bot/create");
    }
    function goCreateTeam() {
        const id = selectedCommunityId;
        window.location.assign(id ? `/config/org-bot/create?attachCommunity=${id}` : "/config/org-bot/create");
    }

    const value = selectedCommunityId || "";

    return (
        <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--tt-accent)" }}>
                Vælg community:
            </label>
            <select
                value={value}
                onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__create_comm__") return goCreateCommunity();
                    if (v === "__create_team__") return goCreateTeam();
                    onPick(v);
                }}
                className="text-sm px-2 py-1 rounded-md"
                style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "#fff" }}
                title="Vælg aktivt community (opdaterer hele siden)"
            >
                <option value="">{loading ? "Henter…" : items.length ? "— vælg —" : "Ingen communities"}</option>
                {items.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
                <option disabled>────────────</option>
                <option value="__create_comm__">+ Opret community</option>
                <option value="__create_team__">+ Opret team</option>
            </select>
        </div>
    );
}
