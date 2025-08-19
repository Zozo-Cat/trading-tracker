// app/planer/fuld-matrix/page.tsx
import type { Metadata } from "next";
import FullMatrixClient from "./FullMatrixClient";

export const metadata: Metadata = {
    title: "Fuld funktionsoversigt – Trading Tracker",
    description:
        "Komplet matrix for Basis, Premium og Pro – grupperet i sektioner. Sammenlign alt fra signaler, teams og communities til mentor og app-funktioner.",
    openGraph: {
        title: "Fuld funktionsoversigt – Trading Tracker",
        description:
            "Komplet matrix: funktioner i Basis, Premium og Pro. Grupperet, overskuelig og mobilvenlig.",
        url: "/planer/fuld-matrix",
        type: "article",
    },
    twitter: {
        card: "summary_large_image",
        title: "Fuld funktionsoversigt – Trading Tracker",
        description:
            "Sammenlign alle funktioner på tværs af planer. Kompakt mobilvisning og TOC.",
    },
};

export default function Page() {
    return <FullMatrixClient />;
}
