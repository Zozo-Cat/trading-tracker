"use client";

import * as React from "react";
import { getConfig, saveConfig } from "@/lib/configStore";
import { useSearchParams } from "next/navigation";
import OfficialBrandingSection from "./branding/OfficialBrandingSection";
import DashboardDefaultsSection from "./dashboard/DashboardDefaultsSection"; // ⬅️ NY

function FieldLabel({ label, help }: { label: string; help: string }) {
    return (
        <div className="flex items-center gap-2">
            <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                {label}
            </label>
            <InfoIcon title={help} />
        </div>
    );
}
function SmallHint({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
            {children}
        </p>
    );
}
function InfoIcon({ title }: { title: string }) {
    return (
        <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs"
            style={{ borderColor: "var(--tt-accent)", color: "var(--tt-accent)" }}
            title={title}
            role="img"
            aria-label="Hjælp"
        >
      ?
    </span>
    );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full rounded-lg px-3 py-2"
            style={{ border: "1px solid var(--tt-accent)", backgroundColor: "#1a1717", color: "var(--tt-accent)" }}
        />
    );
}

export default function OrgBotPage() {
    const userId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || "demo-user";
    const search = useSearchParams();

    const [cfg, setCfg] = React.useState<any>(() => getConfig(userId));
    const [dirty, setDirty] = React.useState(false);
    const markDirty = () => {
        setDirty(true);
        (window as any).ttSetDirty?.(true);
    };

    // 🔧 Sørg for at ttSaveHooks eksisterer + wrap ttSetDirty så lokal `dirty` følger med
    React.useEffect(() => {
        // init hook-container
        (window as any).ttSaveHooks = (window as any).ttSaveHooks || [];
        // wrap ttSetDirty
        const prev = (window as any).ttSetDirty;
        (window as any).ttSetDirty = (v: boolean) => {
            try { prev?.(v); } catch {}
            setDirty(Boolean(v));
        };
        return () => {
            (window as any).ttSetDirty = prev;
        };
    }, []);

    const [activeCommunityId, setActiveCommunityId] = React.useState<string>("");
    React.useEffect(() => {
        const urlId = search.get("communityId");
        if (urlId) {
            setActiveCommunityId(urlId);
            try { localStorage.setItem("tt_last_community_id", urlId); } catch {}
        } else {
            try {
                const last = localStorage.getItem("tt_last_community_id") || "";
                if (last) setActiveCommunityId(last);
            } catch {}
        }
    }, [search]);

    React.useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "tt_last_community_id" && typeof e.newValue === "string") {
                setActiveCommunityId(e.newValue);
            }
        };
        const onCustom = (e: any) => {
            const id = e?.detail?.id;
            if (id) setActiveCommunityId(id);
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("tt:community:changed", onCustom as EventListener);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("tt:community:changed", onCustom as EventListener);
        };
    }, []);

    const doSave = async () => {
        try {
            // 1) Kør alle undersektioners save-hooks (OfficialBrandingSection, DashboardDefaultsSection, m.fl.)
            const hooks: any[] = (window as any).ttSaveHooks || [];
            await Promise.all(hooks.map((fn) => (typeof fn === "function" ? fn() : null)));

            // 2) Gem lokal (ikke-Supabase) config
            saveConfig(userId, cfg);

            // 3) Nulstil dirty
            setDirty(false);
            (window as any).ttSetDirty?.(false);
            alert("Gemt ✅");
        } catch (e) {
            console.error(e);
            alert("Kunne ikke gemme. Prøv igen.");
        }
    };

    React.useEffect(() => {
        setCfg((p: any) => {
            const b = p?.branding ?? {};
            return {
                ...p,
                branding: {
                    name: b.name ?? "",
                    themeColor: b.themeColor ?? "#D4AF37",
                    logoUrl: b.logoUrl ?? "",
                    botName: b.botName ?? "Trading Tracker",
                    commandPrefix: b.commandPrefix ?? "!",
                },
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        const color = cfg?.branding?.themeColor ?? "#D4AF37";
        document.documentElement.style.setProperty("--tt-accent", color);
        try {
            const raw = localStorage.getItem(`tt_config_${userId}`);
            const curr = raw ? JSON.parse(raw) : {};
            curr.branding = curr.branding || {};
            curr.branding.themeColor = color;
            localStorage.setItem(`tt_config_${userId}`, JSON.stringify(curr));
            window.dispatchEvent(new Event("storage"));
        } catch {}
    }, [cfg?.branding?.themeColor, userId]);

    function setThemeColor(hex: string) {
        setCfg((p: any) => ({ ...p, branding: { ...p.branding, themeColor: hex } }));
        markDirty();
    }
    function onHexChange(v: string) {
        const val = v.startsWith("#") ? v : `#${v}`;
        setThemeColor(val);
    }

    const currentView = search.get("view") || "branding";

    // Tom-state for hele sektionen hvis intet community valgt
    const EmptyCTA = (
        <section
            className="rounded-2xl p-8 flex flex-col items-start gap-4"
            style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}
        >
            <h2 className="text-lg font-semibold" style={{ color: "#E9CC6A" }}>
                {currentView === "dashboard" ? "Dashboard defaults" : "Official community branding"}
            </h2>
            <p className="text-sm" style={{ color: "var(--tt-accent)" }}>
                Du har endnu ikke oprettet eller valgt et community. Vælg i headeren – eller opret et nyt.
            </p>
            <div className="flex items-center gap-3">
                <a
                    href="/config/org-bot/create"
                    className="inline-block rounded-lg px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#76ed77", color: "#211d1d" }}
                >
                    🚀 Opret community
                </a>
                <a
                    href="/config/org-bot/create"
                    className="inline-block rounded-lg px-4 py-2 text-sm font-medium"
                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                >
                    + Opret team
                </a>
            </div>
        </section>
    );

    return (
        <main className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold" style={{ color: "#E9CC6A" }}>
                    Organisation
                </h1>
                <div className="flex items-center gap-2">
                    {dirty && (
                        <span
                            className="text-xs rounded-md px-2 py-1"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                            title="Du har ændringer der ikke er gemt."
                        >
              Ugemte ændringer
            </span>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg px-3 py-1.5 text-sm"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                    >
                        Opdater
                    </button>
                    <button
                        onClick={doSave}
                        disabled={!dirty}
                        className="rounded-lg px-3 py-1.5 text-sm"
                        style={
                            dirty
                                ? { backgroundColor: "#76ed77", color: "#211d1d", border: "1px solid #1b5e20" }
                                : { border: "1px solid var(--tt-accent)", color: "var(--tt-accent)", opacity: 0.8 }
                        }
                    >
                        Gem
                    </button>
                </div>
            </div>

            {/* SWITCH: Branding vs Dashboard defaults */}
            {currentView === "dashboard" ? (
                activeCommunityId ? (
                    <DashboardDefaultsSection communityId={activeCommunityId} />
                ) : (
                    EmptyCTA
                )
            ) : (
                <>
                    {!activeCommunityId ? (
                        EmptyCTA
                    ) : (
                        <>
                            {/* STANDARD BRANDING (som før) */}
                            <section
                                className="rounded-2xl p-6"
                                style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}
                            >
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <FieldLabel
                                            label="Community-/brandnavn"
                                            help="Navnet vises i appen og på invites. Du kan ændre det når som helst."
                                        />
                                        <Input
                                            value={cfg?.branding?.name ?? ""}
                                            onChange={(e) => {
                                                setCfg((p: any) => ({ ...p, branding: { ...p.branding, name: e.target.value } }));
                                                (window as any).ttSetDirty?.(true);
                                            }}
                                            placeholder="Fx One Journey Denmark"
                                        />
                                        <SmallHint>Tip: Kort og genkendeligt navn fungerer bedst.</SmallHint>

                                        <FieldLabel
                                            label="Logo (URL)"
                                            help="Direkte link til billede (PNG/JPG/SVG). Mindst ~128×128 px for skarp visning."
                                        />
                                        <Input
                                            value={cfg?.branding?.logoUrl ?? ""}
                                            onChange={(e) => {
                                                setCfg((p: any) => ({ ...p, branding: { ...p.branding, logoUrl: e.target.value } }));
                                                (window as any).ttSetDirty?.(true);
                                            }}
                                            placeholder="https://…"
                                        />
                                        {!!cfg?.branding?.logoUrl && (
                                            <div className="mt-2 inline-flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={cfg.branding.logoUrl}
                                                    alt="Logo"
                                                    className="w-14 h-14 rounded-lg border"
                                                    style={{ borderColor: "var(--tt-accent)" }}
                                                />
                                                <span className="text-xs" style={{ color: "var(--tt-accent)" }}>
                          Forhåndsvisning
                        </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <FieldLabel label="Tema-farve" help="Vælg en primær farve. Den bruges til knapper, kanter og highlights." />
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={(cfg?.branding?.themeColor ?? "#D4AF37") as string}
                                                onChange={(e) => {
                                                    setThemeColor(e.target.value);
                                                    (window as any).ttSetDirty?.(true);
                                                }}
                                                className="h-10 w-14 rounded-md border"
                                                title="Vælg farve"
                                                style={{ borderColor: "var(--tt-accent)", background: "#1a1717" }}
                                            />
                                            <Input
                                                value={cfg?.branding?.themeColor ?? "#D4AF37"}
                                                onChange={(e) => onHexChange(e.target.value)}
                                                placeholder="#D4AF37"
                                                aria-label="HEX-farve"
                                            />
                                        </div>
                                        <SmallHint>Eksempel: #D4AF37 (guld). HEX kan kopieres fra andre værktøjer.</SmallHint>

                                        <FieldLabel label="Bot-navn" help="Navnet der vises i beskeder og i integrationer." />
                                        <Input
                                            value={cfg?.branding?.botName ?? "Trading Tracker"}
                                            onChange={(e) => {
                                                setCfg((p: any) => ({ ...p, branding: { ...p.branding, botName: e.target.value } }));
                                                (window as any).ttSetDirty?.(true);
                                            }}
                                            placeholder="Trading Tracker"
                                        />

                                        <FieldLabel label="Command prefix" help='Tegnet før bot-kommandoer (fx "!help").' />
                                        <Input
                                            value={cfg?.branding?.commandPrefix ?? "!"}
                                            onChange={(e) => {
                                                setCfg((p: any) => ({ ...p, branding: { ...p.branding, commandPrefix: e.target.value } }));
                                                (window as any).ttSetDirty?.(true);
                                            }}
                                            placeholder="!"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* OFFICIAL BRANDING */}
                            <OfficialBrandingSection communityId={activeCommunityId} />
                        </>
                    )}
                </>
            )}
        </main>
    );
}
