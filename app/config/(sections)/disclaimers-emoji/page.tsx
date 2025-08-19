"use client";

export default function DisclaimersEmojiPage() {
    return (
        <div
            className="rounded-2xl border shadow-sm p-6"
            style={{ backgroundColor: "#1a1717", borderColor: "#D4AF37" }}
        >
            <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#D4AF37" }}
            >
                Disclaimers & Emoji pynt
            </h2>
            <p style={{ color: "#D4AF37" }} className="text-sm mb-4">
                Her kan du vælge disclaimer-tekst og styre om emoji skal bruges i signaler.
            </p>
            <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "#211d1d", borderColor: "#D4AF37" }}
            >
                <div className="text-sm font-medium mb-1" style={{ color: "#D4AF37" }}>
                    Placeholder
                </div>
                <div className="text-xs" style={{ color: "#D4AF37" }}>
                    Felter til Disclaimers & Emoji pynt konfiguration kommer her.
                </div>
            </div>
        </div>
    );
}
