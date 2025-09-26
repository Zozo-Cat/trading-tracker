"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
    { href: "/settings/personal", label: "Personlige oplysninger" },
    { href: "/settings/security", label: "Sikkerhed" },
    { href: "/settings/plan", label: "Plan" },
    { href: "/settings/community", label: "Community" },
    { href: "/settings/notifications", label: "Notifikationer" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="mx-auto max-w-[1600px] px-6 py-8">
            <h1 className="text-2xl font-semibold mb-6">Mine indstillinger</h1>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT MENU med baggrund + aktiv markering */}
                <aside className="col-span-12 lg:col-span-2">
                    <nav
                        className="sticky top-4 space-y-1 rounded-2xl border border-yellow-700/40 bg-[#151313] p-2"
                        aria-label="Indstillinger"
                    >
                        {NAV.map((item) => {
                            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        "block rounded-lg px-3 py-2 transition-colors",
                                        active
                                            ? "bg-yellow-600/15 border border-yellow-600/40 text-yellow-200"
                                            : "hover:bg-yellow-600/10 border border-transparent"
                                    ].join(" ")}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* CONTENT */}
                <main className="col-span-12 lg:col-span-10">
                    <div className="rounded-3xl border border-yellow-700/50 bg-[#151313] p-6 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
