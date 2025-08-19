// app/planer/page.tsx
import type { Metadata } from "next";
import PlanerPageClient from "./PlanerPageClient";

export const metadata: Metadata = {
    title: "Planer & priser – Trading Tracker",
    description:
        "Sammenlign Basis (gratis), Premium og Pro. Få real‑time signaler, avancerede rapporter, communities og mentor‑features. 2 mdr. gratis med årsplan.",
    openGraph: {
        title: "Planer & priser – Trading Tracker",
        description:
            "Sammenlign Basis, Premium og Pro. Real‑time signaler, rapporter, communities, mentor og mere.",
        url: "/planer",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Planer & priser – Trading Tracker",
        description: "Basis (gratis), Premium og Pro. 2 mdr. gratis på årsplan.",
    },
};

export default function Page() {
    return <PlanerPageClient />;
}
