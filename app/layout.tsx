// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import Providers from "@/app/_components/Providers";
import { SelectedCommunityProvider } from "@/app/_providers/SelectedCommunityProvider";
import CookieConsent from "@/app/_components/CookieConsent";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: {
        default: "Trading Tracker",
        template: "%s • Trading Tracker",
    },
    description:
        "Track dine trades, opret teams og få overblik over din udvikling som trader.",
    openGraph: {
        type: "website",
        siteName: "Trading Tracker",
        title: "Trading Tracker",
        description:
            "Track dine trades, opret teams og få overblik over din udvikling som trader.",
        images: [
            { url: "/hero/slide-sync-desktop.webp", width: 1200, height: 630, alt: "Trading Tracker" },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Trading Tracker",
        description:
            "Track dine trades, opret teams og få overblik over din udvikling som trader.",
        images: ["/hero/slide-sync-desktop.webp"],
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="da">
        <body style={{ background: "#211d1d", color: "#D4AF37" }}>
        {/* Global provider så valgt community virker over hele sitet */}
        <SelectedCommunityProvider>
            <Providers>
                <Header />
                <main>{children}</main>
                <Footer />
            </Providers>
        </SelectedCommunityProvider>

        {/* Simpelt cookie-banner (kan lukkes) */}
        <CookieConsent />
        </body>
        </html>
    );
}
