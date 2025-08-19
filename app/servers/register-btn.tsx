"use client";

import React from "react";

export default function RegisterBtn({ guildId, name }: { guildId: string; name: string }) {
    const [status, setStatus] = React.useState<null | string>(null);

    async function handleClick() {
        setStatus("Arbejder…");
        try {
            const res = await fetch("/api/servers/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guildId, name }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setStatus(`Fejl: ${data.error || "ukendt fejl"}`);
                return;
            }
            if (data.alreadyExists) {
                setStatus(`Allerede oprettet — SERVER_ID: ${data.serverId}, Kode: ${data.joinCode}`);
            } else {
                setStatus(`Oprettet! SERVER_ID: ${data.serverId}, Kode: ${data.joinCode}`);
            }
        } catch (e: any) {
            setStatus(`Fejl: ${e.message}`);
        }
    }

    const btnStyle: React.CSSProperties = {
        padding: "8px 12px",
        border: "1px solid #D4AF37",
        borderRadius: 8,
        background: "transparent",
        color: "#D4AF37",
        cursor: "pointer",
        whiteSpace: "nowrap",
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={btnStyle} onClick={handleClick}>Tilknyt</button>
            {status && <span style={{ fontSize: 12, opacity: 0.9 }}>{status}</span>}
        </div>
    );
}
