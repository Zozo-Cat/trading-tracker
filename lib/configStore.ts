// lib/configStore.ts
import { CommunityConfig, defaultConfig } from "@/types/config";

/**
 * Simpel client-side storage nu (localStorage per bruger).
 * Kan senere skiftes til API/Supabase uden at ændre UI.
 */

const NS = (userId: string) => `tt_config_${userId}`;

export function getConfig(userId: string): CommunityConfig {
    if (typeof window === "undefined") {
        // fallback til default på server
        return structuredClone(defaultConfig);
    }
    try {
        const raw = localStorage.getItem(NS(userId));
        if (!raw) return structuredClone(defaultConfig);

        const parsed = JSON.parse(raw) as CommunityConfig;

        // ——— Migration/patches ———
        // 1) Sørg for integrations.discord eksisterer
        if (!parsed.integrations) parsed.integrations = { discord: { connectedGuildIds: [] } };
        if (!parsed.integrations.discord) parsed.integrations.discord = { connectedGuildIds: [] };
        if (!Array.isArray(parsed.integrations.discord.connectedGuildIds)) {
            parsed.integrations.discord.connectedGuildIds = [];
        }

        return parsed;
    } catch {
        return structuredClone(defaultConfig);
    }
}

export function saveConfig(userId: string, cfg: CommunityConfig) {
    if (typeof window === "undefined") return;
    const toSave = JSON.stringify(cfg);
    localStorage.setItem(NS(userId), toSave);
}

export function resetConfig(userId: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(NS(userId));
}

/** Hjælp: overskriv config helt til defaults (bruges i nogle flows) */
export function overwriteWithDefaults(userId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(NS(userId), JSON.stringify(defaultConfig));
}
