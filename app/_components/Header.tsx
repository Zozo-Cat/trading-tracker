"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import CommunityPicker from "@/app/_components/CommunityPicker";

// Supabase hooks/klient + router til logout-redirect
import { useSession, useSupabaseClient } from "@/app/_components/Providers";
import { useRouter } from "next/navigation";

type Notif = {
    id: string;
    title: string;
    href?: string;
    createdAt: string;
    read: boolean;
};
function isNotifArray(val: any): val is Notif[] {
    return Array.isArray(val) && val.every(n => n && typeof n.id === "string" && typeof n.title === "string");
}

export default function Header() {
    const router = useRouter();
    const session = useSession();                 // Supabase session (null hvis ikke logget ind)
    const supabase = useSupabaseClient();         // Supabase client via Provider
    const user = (session?.user as any) || null;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const bellBtnRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const placeDropdown = () => {
        const el = bellBtnRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dropdownWidth = 320;
        const gap = 8;
        const left = Math.max(8, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8));
        const top = rect.bottom + gap;
        setPos({ top, left, width: dropdownWidth });
    };
    useEffect(() => {
        if (!open) return;
        placeDropdown();
        const onScroll = () => placeDropdown();
        const onResize = () => placeDropdown();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);

    const LS_KEY = useMemo(() => (user ? `tt_notifs_${user.id}` : null), [user?.id]);

    const seedForUser = (): Notif[] => {
        const now = new Date();
        const ago = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
        if (!user) return [];
        return [{ id: "s1", title: "Velkommen til Trading Tracker 🚀", href: "/", createdAt: ago(1), read: false }];
    };

    const [notifs, setNotifs] = useState<Notif[]>([]);
    const loadFromStorage = () => {
        if (!LS_KEY) return;
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) {
                const seeded = seedForUser();
                setNotifs(seeded);
                localStorage.setItem(LS_KEY, JSON.stringify(seeded));
            } else {
                const parsed = JSON.parse(raw);
                if (isNotifArray(parsed)) setNotifs(parsed);
            }
        } catch {
            const seeded = seedForUser();
            setNotifs(seeded);
            try {
                localStorage.setItem(LS_KEY!, JSON.stringify(seeded));
            } catch {}
        }
    };
    useEffect(() => {
        if (mounted && LS_KEY) loadFromStorage();
    }, [mounted, LS_KEY]);

    const unreadCount = isNotifArray(notifs) ? notifs.reduce((acc, n) => acc + (n.read ? 0 : 1), 0) : 0;
    const markAllRead = () => setNotifs(arr => arr.map(n => ({ ...n, read: true })));
    const markOneRead = (id: string) => setNotifs(arr => arr.map(n => (n.id === id ? { ...n, read: true } : n)));

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const avatar =
        (user?.user_metadata?.avatar_url as string | undefined) ??
        (user?.image as string | undefined) ??
        "/images/default-avatar.png";

    return (
        <header className="sticky top-0 z-50 border-b border-gray-700" style={{ backgroundColor: "#211d1d" }}>
            <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/images/trading.png" alt="Trading Tracker logo" width={150} height={150} priority className="-mt-1" />
                </Link>

                <nav className="flex items-center gap-2 sm:gap-3 flex-wrap overflow-x-hidden">
                    {!mounted ? (
                        <span className="px-3 py-2 rounded-md border border-transparent text-gray-500">…</span>
                    ) : !user ? (
                        <>
                            <Link href="/nyheder" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Nyheder
                            </Link>
                            <Link href="/partnere" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Partnere
                            </Link>
                            <Link href="/planer" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Planer og Priser
                            </Link>
                            <Link href="/saadan-virker-det" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Sådan virker det
                            </Link>
                            <Link href="/login" className="px-3 py-2 rounded-md text-black font-medium text-sm" style={{ backgroundColor: "#76ed77" }}>
                                Log ind
                            </Link>
                            <Link href="/signup" className="px-3 py-2 rounded-md text-black font-medium text-sm" style={{ backgroundColor: "#5dade2" }}>
                                Registrer dig
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/trades" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Mine trades
                            </Link>
                            <Link href="/teams" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Mine teams
                            </Link>
                            <Link href="/statistik" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Statistik
                            </Link>
                            <Link href="/opgrader" className="px-3 py-2 rounded-md border text-sm" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                Opgrader
                            </Link>

                            <div className="ml-1 mr-1">
                                <CommunityPicker />
                            </div>

                            <div className="relative">
                                <button
                                    ref={bellBtnRef}
                                    onClick={() => {
                                        setOpen(o => !o);
                                        requestAnimationFrame(placeDropdown);
                                    }}
                                    className="relative rounded-full p-2 hover:bg-white/5"
                                    aria-label="Notifikationer"
                                    aria-expanded={open}
                                    type="button"
                                >
                                    <Bell size={20} color="#D4AF37" />
                                    {unreadCount > 0 && (
                                        <span
                                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] text-black font-bold"
                                            style={{ backgroundColor: "#76ed77" }}
                                        >
                      {unreadCount}
                    </span>
                                    )}
                                </button>
                            </div>

                            <Link href="/min-side" className="flex items-center">
                                <img src={avatar} alt="Profil" width={36} height={36} className="rounded-full border border-gray-500" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 rounded-md text-white font-medium text-sm"
                                style={{ backgroundColor: "#ff5757" }}
                            >
                                Log ud
                            </button>
                        </>
                    )}
                </nav>
            </div>

            {/* Dropdown (notifikationer) */}
            {mounted && user && open && (
                <div
                    ref={dropdownRef}
                    role="menu"
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        backgroundColor: "#2a2727",
                        border: "1px solid #3b3838",
                        borderRadius: 12,
                        zIndex: 2000,
                        boxShadow: "0 10px 30px rgba(0,0,0,.4)",
                    }}
                >
                    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#3b3838" }}>
            <span className="text-sm" style={{ color: "#D4AF37" }}>
              Notifikationer
            </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-xs px-2 py-1 rounded border"
                                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                            >
                                Markér alle som læst
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {(!isNotifArray(notifs) || notifs.length === 0) ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-300">Ingen notifikationer</div>
                        ) : (
                            <ul className="divide-y" style={{ borderColor: "#3b3838" }}>
                                {notifs.slice(0, 8).map(n => {
                                    const body = (
                                        <div
                                            className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer"
                                            onClick={e => {
                                                e.stopPropagation();
                                                markOneRead(n.id);
                                                setOpen(false);
                                            }}
                                        >
                                            {!n.read ? (
                                                <span className="mt-1 inline-block w-2 h-2 rounded-full" style={{ background: "#D4AF37" }} />
                                            ) : (
                                                <span className="mt-1 inline-block w-2 h-2 rounded-full opacity-0" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-100">{n.title}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    );
                                    return <li key={n.id}>{n.href ? <Link href={n.href} className="block">{body}</Link> : body}</li>;
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
