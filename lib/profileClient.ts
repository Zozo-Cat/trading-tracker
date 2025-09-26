"use client";

import { useEffect } from "react";
import { useSession, useSupabaseClient } from "@/app/_components/Providers";
import { useProfileStore } from "./profileStore";
import type { Profile } from "./types";

export function useLoadProfile() {
    const supabase = useSupabaseClient();
    const session = useSession();
    const setProfile = useProfileStore((s) => s.setProfile);

    useEffect(() => {
        let sub: ReturnType<typeof supabase.channel> | null = null;
        let cancelled = false;

        async function run() {
            if (!session?.user) {
                setProfile(null);
                return;
            }
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle<Profile>();
            if (error) {
                console.error("Load profile error", error);
                return;
            }
            if (!cancelled) setProfile(data ?? null);

            sub = supabase
                .channel(`profiles:${session.user.id}`)
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
                    (payload) => setProfile(payload.new as Profile)
                )
                .subscribe();
        }
        run();
        return () => { cancelled = true; sub?.unsubscribe(); };
    }, [supabase, session, setProfile]);
}
