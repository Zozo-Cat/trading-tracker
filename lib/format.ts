// lib/format.ts
import { type UserPrefs, effectiveTimeZone } from "./prefs";

/** Formater tal (uden valuta) efter brugerens formatvalg. */
export function formatNumber(value: number, prefs: UserPrefs, options?: Intl.NumberFormatOptions) {
    const locale = prefs.locale;
    const style = prefs.number_format === "1.234,56 (EU)" ? "de-DE" : "en-US";
    // Vi bruger locale for sprog (navne etc.), men tvinger talmønster via "styleLocale"
    return new Intl.NumberFormat(options?.locale || style, {
        ...options,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value);
}

/** Formater valuta efter brugerens valg. */
export function formatCurrency(value: number, prefs: UserPrefs, options?: Intl.NumberFormatOptions) {
    const currency = prefs.currency;
    const styleLocale = prefs.number_format === "1.234,56 (EU)" ? "de-DE" : "en-US";
    return new Intl.NumberFormat(styleLocale, {
        style: "currency",
        currency,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        ...options,
    }).format(value);
}

/**
 * Formater dato efter brugerens date_format og timezone.
 * Understøtter: "DD-MM-YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY"
 */
export function formatDate(date: Date | string | number, prefs: UserPrefs) {
    const d = new Date(date);
    const tz = effectiveTimeZone(prefs);

    // Hent dele i korrekt timezone
    const parts = new Intl.DateTimeFormat(prefs.locale, {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
        .formatToParts(d)
        .reduce<Record<string, string>>((acc, p) => {
            if (p.type === "year" || p.type === "month" || p.type === "day") acc[p.type] = p.value;
            return acc;
        }, {});

    const DD = parts.day ?? "01";
    const MM = parts.month ?? "01";
    const YYYY = parts.year ?? "1970";

    switch (prefs.date_format) {
        case "YYYY-MM-DD":
            return `${YYYY}-${MM}-${DD}`;
        case "MM/DD/YYYY":
            return `${MM}/${DD}/${YYYY}`;
        case "DD-MM-YYYY":
        default:
            return `${DD}-${MM}-${YYYY}`;
    }
}

/** Helper til at vise dato+tid i locale + timezone */
export function formatDateTime(date: Date | string | number, prefs: UserPrefs, opts?: Intl.DateTimeFormatOptions) {
    const d = new Date(date);
    const tz = effectiveTimeZone(prefs);
    return new Intl.DateTimeFormat(prefs.locale, {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        ...opts,
    }).format(d);
}
