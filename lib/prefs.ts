// lib/prefs.ts

export type UserPrefs = {
    locale: string;            // fx "da-DK" | "en-GB" | "en-US"
    timezone: string;          // fx "Europe/Copenhagen" | "UTC" | "Auto/Europe/Copenhagen"
    date_format: "DD-MM-YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
    number_format: "1.234,56 (EU)" | "1,234.56 (US)";
    currency: "DKK" | "EUR" | "USD" | "SEK" | "NOK";
    week_start: "monday" | "sunday";
};

export const DEFAULT_PREFS: UserPrefs = {
    locale: "da-DK",
    timezone: "Auto/Europe/Copenhagen",
    date_format: "DD-MM-YYYY",
    number_format: "1.234,56 (EU)",
    currency: "DKK",
    week_start: "monday",
};

/** Hvis timezone starter med "Auto/", brug browserens zone – ellers brug værdien som er. */
export function resolveTimeZone(tz: string | null | undefined): string {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    if (!tz) return fallback;
    if (tz.startsWith("Auto/")) return tz.slice("Auto/".length) || fallback;
    return tz;
}

/** Saml effektive præferencer med defaults, givet en (delvis) profil fra DB. */
export function getEffectivePrefs(profile?: Partial<UserPrefs> | null): UserPrefs {
    return {
        locale: profile?.locale ?? DEFAULT_PREFS.locale,
        timezone: profile?.timezone ?? DEFAULT_PREFS.timezone,
        date_format: (profile?.date_format as UserPrefs["date_format"]) ?? DEFAULT_PREFS.date_format,
        number_format: (profile?.number_format as UserPrefs["number_format"]) ?? DEFAULT_PREFS.number_format,
        currency: (profile?.currency as UserPrefs["currency"]) ?? DEFAULT_PREFS.currency,
        week_start: (profile?.week_start as UserPrefs["week_start"]) ?? DEFAULT_PREFS.week_start,
    };
}

/** Hjælpere */
export const isMondayFirst = (prefs: UserPrefs) => prefs.week_start === "monday";
export const effectiveTimeZone = (prefs: UserPrefs) => resolveTimeZone(prefs.timezone);
