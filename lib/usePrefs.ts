// lib/usePrefs.ts
"use client";

import { useMemo } from "react";
import { useProfileStore } from "@/lib/profileStore";
import { getEffectivePrefs, effectiveTimeZone, isMondayFirst, type UserPrefs } from "./prefs";

export function usePrefs() {
    const profile = useProfileStore((s) => s.profile);

    const prefs = useMemo<UserPrefs>(() => getEffectivePrefs(profile as any), [profile]);
    const timeZone = useMemo(() => effectiveTimeZone(prefs), [prefs]);
    const mondayFirst = useMemo(() => isMondayFirst(prefs), [prefs]);

    return { prefs, timeZone, mondayFirst };
}
