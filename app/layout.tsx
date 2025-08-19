// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import Providers from "@/app/_components/Providers";
import { SelectedCommunityProvider } from "@/app/_providers/SelectedCommunityProvider";

export const metadata: Metadata = {
    title: "Trading Tracker",
    description: "Track dine trades, opret teams og få overblik over din udvikling som trader.",
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
        </body>
        </html>
    );
}
