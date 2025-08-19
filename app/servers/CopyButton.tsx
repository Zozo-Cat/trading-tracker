"use client";
import React from "react";

export default function CopyButton({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = React.useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // ignorer
        }
    }

    const btnStyle: React.CSSProperties = {
        padding: "6px 10px",
        border: "1px solid #D4AF37",
        borderRadius: 8,
        background: "transparent",
        color: "#D4AF37",
        cursor: "pointer",
        whiteSpace: "nowrap",
    };

    return (
        <button style={btnStyle} onClick={onCopy}>
            {copied ? "Kopieret!" : label}
        </button>
    );
}
