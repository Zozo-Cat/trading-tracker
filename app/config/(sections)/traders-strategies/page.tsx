"use client";

export default function TradersStrategiesPage() {
    return (
        <div
            className="rounded-2xl border shadow-sm p-6"
            style={{ backgroundColor: "#1a1717", borderColor: "#D4AF37" }}
        >
            <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#D4AF37" }}
            >
                Traders & Strategier
            </h2>
            <p style={{ color: "#D4AF37" }} className="text-sm mb-4">
                Her kan du tilføje og redigere traders, strategier og markere standardvalg.
            </p>
            <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "#211d1d", borderColor: "#D4AF37" }}
            >
                <div className="text-sm font-medium mb-1" style={{ color: "#D4AF37" }}>
                    Placeholder
                </div>
                <div className="text-xs" style={{ color: "#D4AF37" }}>
                    Felter til Traders & Strategier konfiguration kommer her.
                </div>
            </div>
        </div>
    );
}
