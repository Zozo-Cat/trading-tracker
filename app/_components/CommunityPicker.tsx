"use client";

import React, { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useSelectedCommunity } from "@/app/_providers/SelectedCommunityProvider";

/** Supabase (browser) */
function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

type CommunityLite = { id: string; name: string; logo_url: string | null };

/** Public wrapper som sikrer Suspense omkring useSearchParams */
export default function CommunityPicker() {
    return (
        <Suspense fallback={<PickerSkeleton />}>
            <CommunityPickerInner />
        </Suspense>
    );
}

/** Skeleton mens searchParams er klar */
function PickerSkeleton() {
    return (
        <div
            className="inline-flex items-center gap-2 text-sm rounded-lg px-3 py-2"
            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
        >
            Indlæser…
        </div>
    );
}

/** Den egentlige komponent der bruger useSearchParams */
function CommunityPickerInner() {
    const search = useSearchParams();
    const { selectedCommunityId, setSelectedCommunityId } = useSelectedCommunity();

    const [items, setItems] = useState<CommunityLite[]>([]);
    const [loading, setLoading] = useState(false);

    // Hent communities fra Supabase
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const { data, error } = await sb()
                    .from("communities")
                    .select("id,name,logo_url")
                    .order("created_at", { ascending: false });
                if (!alive) return;
                if (error) throw error;
                setItems((data as any as CommunityLite[]) ?? []);
            } catch {
                setItems([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Init valgt community fra URL (?communityId=...) — og gem i localStorage
    useEffect(() => {
        const urlId = search.get("communityId");
        if (urlId && urlId !== selectedCommunityId) {
            setSelectedCommunityId(urlId);
            persistAndBroadcast(urlId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function persistAndBroadcast(id: string) {
        try {
            localStorage.setItem("tt_last_community_id", id);
            // brugere af window storage event kan lytte
            window.dispatchEvent(new Event("storage"));
            // og en custom event hvis vi har lyttere
            // @ts-expect-error CustomEvent i browser
            window.dispatchEvent(new CustomEvent("tt:community-changed", { detail: id }));
        } catch {
            /* ignore */
        }
    }

    function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;

        if (val === "__create_comm__") {
            window.location.href = "/config/org-bot/create?tab=community";
            return;
        }
        if (val === "__create_team__") {
            window.location.href = "/config/org-bot/create?tab=team";
            return;
        }

        setSelectedCommunityId(val || "");
        if (val) persistAndBroadcast(val);
    }

    return (
        <div className="inline-flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--tt-accent)" }}>
                Community:
            </label>

            <select
                value={selectedCommunityId ?? ""}
                onChange={onChange}
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                    border: "1px solid var(--tt-accent)",
                    background: "#211d1d",
                    color: "var(--tt-accent)",
                    minWidth: 220,
                }}
                aria-label="Vælg community"
            >
                <option value="">
                    {loading ? "Henter…" : items.length ? "— vælg —" : "Ingen communities"}
                </option>

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
