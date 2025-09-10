// app/config/(sections)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type React from "react";
import { useSession, useSupabaseClient } from "@/app/_components/Providers";

function useAccentSync() {
    const [accent, setAccent] = useState<string>("#D4AF37");
    useEffect(() => {
        const read = () => {
            try {
                const userId =
                    (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || "demo-user";
                const raw = localStorage.getItem(`tt_config_${userId}`);
                if (!raw) return;
                const cfg = JSON.parse(raw);
                const c = cfg?.branding?.themeColor;
                if (typeof c === "string" && c.length >= 4) setAccent(c);
            } catch {}
        };
        read();
        const onStorage = () => read();
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    useEffect(() => {
        document.documentElement.style.setProperty("--tt-accent", accent);
    }, [accent]);
}

function useGlobalDirtyGuard() {
    useEffect(() => {
        (window as any).ttSetDirty = (v: boolean) =>
            ((window as any).__tt_dirty__ = !!v);

        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if ((window as any).__tt_dirty__) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);
}

function NavLink({
                     href,
                     children,
                     className,
                     style,
                 }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
        if ((window as any).__tt_dirty__) {
            const ok = confirm("Du har ændringer der ikke er gemt. Vil du forlade siden?");
            if (!ok) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
    return (
        <Link href={href} onClick={onClick} className={className} style={style}>
            {children}
        </Link>
    );
}

const mainSections = [
    { href: "/config/org-bot", label: "Organisation" },
    { href: "/config/channels-routing?view=servers", label: "Signaler & Advarsler" },
    { href: "/config/routing", label: "Routing" },
    { href: "/config/news-tracker", label: "News Tracker" },
];

const orgSubsections = [
    { view: "branding", label: "Branding" },
    { href: "/config/org-bot/create", label: "Opret (Community & Team)" },
    { href: "/config/org-bot/invites", label: "Invitationer & Teams" },
    { view: "dashboard", label: "Dashboard defaults" },
    { view: "permissions", label: "Tilladelser" },
    { view: "notifications", label: "Notifikationer" },
];

const signalsSubsections = [
    { view: "servers", label: "Tilknyttede servers" },
    { view: "standards", label: "Standarder" },
    { view: "channels", label: "Kanaler" },
    { view: "tradetypes", label: "Tradetyper → Kanaler" },
    { view: "traders", label: "Traders" },
    { view: "strategies", label: "Strategier" },
    { view: "defaults", label: "Defaults" },
];

export default function ConfigSectionsLayout({ children }: { children: React.ReactNode }) {
    useAccentSync();
    useGlobalDirtyGuard();

    const pathname = usePathname();
    const search = useSearchParams();

    // === Supabase session (erstatter next-auth) ===
    const sbSession = useSession();
    const user = sbSession?.user;
    const supabase = useSupabaseClient();

    const onOrg = pathname === "/config/org-bot" || pathname.startsWith("/config/org-bot/");
    const onSignals = pathname.startsWith("/config/channels-routing");
    const onRouting = pathname.startsWith("/config/routing");
    const onNews = pathname.startsWith("/config/news-tracker");

    const currentView =
        search.get("view") ?? (onOrg ? "branding" : onSignals ? "servers" : "");

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#211d1d" }}>
            <header
                className="sticky top-0 z-30 border-b bg-[#211d1d]/95 backdrop-blur"
                style={{ borderColor: "rgba(212,175,55,0.25)" }}
            >
                <div className="px-10 py-5 flex items-center justify-between">
                    <h1 className="text-xl font-semibold tracking-[0.01em]" style={{ color: "#E9CC6A" }}>
                        ⚙️ Trading Tracker – Indstillinger
                    </h1>

                    {/* HØJRE SIDE: avatar + status + log ind/ud (Supabase) */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <div
                                    className="w-8 h-8 rounded-full overflow-hidden border"
                                    style={{ borderColor: "var(--tt-accent)" }}
                                    title={(user.user_metadata?.full_name as string) ?? "Profil"}
                                >
                                    <img
                                        src={
                                            (user.user_metadata?.avatar_url as string) ||
                                            (user.user_metadata?.picture as string) ||
                                            "/images/default-avatar.png"
                                        }
                                        alt="Profil"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: "#76ed77" }}
                                    title="Online"
                                />
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        location.reload();
                                    }}
                                    className="px-3 py-2 rounded-lg text-black font-medium"
                                    style={{ backgroundColor: "#f0e68c" }}
                                >
                                    Log ud
                                </button>
                            </>
                        ) : (
                            <>
                <span className="text-sm" style={{ color: "var(--tt-accent)" }}>
                  Ikke forbundet
                </span>
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: "#e67e22" }}
                                />
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signInWithOAuth({
                                            provider: "discord",
                                            options: {
                                                redirectTo:
                                                    typeof window !== "undefined"
                                                        ? `${window.location.origin}/age-check`
                                                        : undefined,
                                            },
                                        });
                                    }}
                                    className="px-3 py-2 rounded-lg text-black font-medium"
                                    style={{ backgroundColor: "#5dade2" }}
                                >
                                    Forbind Discord
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-10 mt-10 flex gap-10">
                {/* Venstre menu */}
                <aside className="w-72 shrink-0">
                    <div
                        className="sticky top-[100px] rounded-2xl border bg-[#1a1717] shadow-sm p-5"
                        style={{ borderColor: "color-mix(in srgb, var(--tt-accent) 30%, transparent)" }}
                    >
                        <nav className="flex flex-col gap-3">
                            {mainSections.map((s) => {
                                const isActiveMain =
                                    (s.href.startsWith("/config/channels-routing") && onSignals) ||
                                    (s.href === "/config/org-bot" && onOrg) ||
                                    (s.href === "/config/routing" && onRouting) ||
                                    (s.href === "/config/news-tracker" && onNews);

                                return (
                                    <div key={s.href}>
                                        <NavLink
                                            href={s.href}
                                            className={`px-3 py-2 rounded-lg font-medium transition ${
                                                isActiveMain ? "border" : "hover:opacity-80"
                                            }`}
                                            style={
                                                isActiveMain
                                                    ? {
                                                        backgroundColor: "#f0e68c",
                                                        color: "#211d1d",
                                                        borderColor: "var(--tt-accent)",
                                                    }
                                                    : { color: "var(--tt-accent)" }
                                            }
                                        >
                                            {s.label}
                                        </NavLink>

                                        {/* Undermenu: Organisation */}
                                        {onOrg && s.href === "/config/org-bot" && (
                                            <div className="mt-2 pl-3 flex flex-col gap-2">
                                                {orgSubsections.map((sub) => {
                                                    const href =
                                                        "href" in sub
                                                            ? (sub as any).href!
                                                            : `/config/org-bot?view=${(sub as any).view}`;
                                                    const active =
                                                        ("href" in sub && pathname === (sub as any).href) ||
                                                        ((sub as any).view &&
                                                            (search.get("view") ?? "branding") === (sub as any).view &&
                                                            pathname === "/config/org-bot");
                                                    return (
                                                        <NavLink
                                                            key={href}
                                                            href={href}
                                                            className={`block px-3 py-1.5 rounded-md text-sm transition ${
                                                                active ? "border" : "hover:opacity-80"
                                                            }`}
                                                            style={
                                                                active
                                                                    ? {
                                                                        backgroundColor: "#fffacd",
                                                                        color: "#211d1d",
                                                                        borderColor: "var(--tt-accent)",
                                                                    }
                                                                    : { color: "var(--tt-accent)" }
                                                            }
                                                        >
                                                            • {(sub as any).label}
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Undermenu: Signaler & Advarsler */}
                                        {onSignals && s.label === "Signaler & Advarsler" && (
                                            <div className="mt-2 pl-3 flex flex-col gap-2">
                                                {signalsSubsections.map((sub) => {
                                                    const active = currentView === sub.view;
                                                    return (
                                                        <NavLink
                                                            key={sub.view}
                                                            href={`/config/channels-routing?view=${sub.view}`}
                                                            className={`block px-3 py-1.5 rounded-md text-sm transition ${
                                                                active ? "border" : "hover:opacity-80"
                                                            }`}
                                                            style={
                                                                active
                                                                    ? {
                                                                        backgroundColor: "#fffacd",
                                                                        color: "#211d1d",
                                                                        borderColor: "var(--tt-accent)",
                                                                    }
                                                                    : { color: "var(--tt-accent)" }
                                                            }
                                                        >
                                                            • {sub.label}
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Indhold */}
                <main className="flex-1">
                    <div className="space-y-12 p-8 rounded-2xl" style={{ backgroundColor: "#1a1717" }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
