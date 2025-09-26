// app/_components/UserMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLoadProfile } from "@/lib/profileClient";
import { useProfileStore } from "@/lib/profileStore";

export default function UserMenu() {
    useLoadProfile();
    const profile = useProfileStore((s) => s.profile);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const avatarUrl =
        profile?.avatar_url ??
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile?.full_name ?? "U")}`;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="h-9 w-9 rounded-full overflow-hidden border border-yellow-600/50 shadow"
                aria-label="Open user menu"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 min-w-56 rounded-xl border border-yellow-700/50 bg-[#151313] p-1 shadow-xl z-50"
                    role="menu"
                >
                    <Link
                        href="/settings"
                        className="block px-3 py-2 rounded-lg hover:bg-yellow-600/10"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                        Mine indstillinger
                    </Link>
                    <Link
                        href="/trading/settings"
                        className="block px-3 py-2 rounded-lg hover:bg-yellow-600/10"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                        Trading indstillinger
                    </Link>
                </div>
            )}
        </div>
    );
}
