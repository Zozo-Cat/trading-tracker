"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type SelectedCommunityCtx = {
    selectedCommunityId: string;
    setSelectedCommunityId: (id: string) => void;
};

const Ctx = createContext<SelectedCommunityCtx | undefined>(undefined);

export function SelectedCommunityProvider({ children }: { children: React.ReactNode }) {
    const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");

    // 1) init fra URL ?communityId= eller localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const sp = new URLSearchParams(window.location.search);
        const fromUrl = sp.get("communityId") || "";
        const fromLs = localStorage.getItem("tt_last_community_id") || "";
        const initial = fromUrl || fromLs || "";
        if (initial) setSelectedCommunityId(initial);
    }, []);

    // 2) persist til localStorage
    useEffect(() => {
        if (!selectedCommunityId) return;
        try { localStorage.setItem("tt_last_community_id", selectedCommunityId); } catch {}
    }, [selectedCommunityId]);

    const value = useMemo(() => ({ selectedCommunityId, setSelectedCommunityId }), [selectedCommunityId]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelectedCommunity() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useSelectedCommunity must be used within SelectedCommunityProvider");
    return ctx;
}
