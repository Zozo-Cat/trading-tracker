"use client";

import Link from "next/link";

const sections = [
    {
        href: "/config/org-bot",
        label: "Organisation & Bot",
        desc: "Opsætning af organisationens navn, logo, bot token/webhooks og feature toggles."
    },
    {
        href: "/config/channels-routing",
        label: "Kanaler & Routing",
        desc: "Opret og rediger kanaler, samt tilknyt signaltyper til de rigtige kanaler."
    },
    {
        href: "/config/traders-strategies",
        label: "Traders & Strategier",
        desc: "Tilføj og rediger traders og strategier, samt vælg standardindstillinger."
    },
    {
        href: "/config/disclaimers-emoji",
        label: "Disclaimers & Emoji pynt",
        desc: "Vælg disclaimer-tekst og om emoji skal bruges i signaler."
    }
];

export default function ConfigOverviewPage() {
    return (
        <div className="px-10 mt-10">
            <div className="grid sm:grid-cols-2 gap-8">
                {sections.map((s) => (
                    <div
                        key={s.href}
                        className="rounded-2xl border shadow-sm p-8 flex flex-col justify-between"
                        style={{ backgroundColor: "#1a1717", borderColor: "#D4AF37" }}
                    >
                        <div>
                            <h2
                                className="text-xl font-semibold mb-2"
                                style={{ color: "#D4AF37" }}
                            >
                                {s.label}
                            </h2>
                            <p className="text-sm leading-6" style={{ color: "#D4AF37" }}>
                                {s.desc}
                            </p>
                        </div>
                        <div className="mt-6">
                            <Link
                                href={s.href}
                                className="px-4 py-2 rounded-lg text-black font-medium shadow hover:shadow-md transition"
                                style={{ backgroundColor: "#5dade2" }}
                            >
                                Rediger
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
