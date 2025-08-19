"use client";

import { signIn, signOut } from "next-auth/react";
import React from "react";

export default function AuthButtons({ signedIn }: { signedIn: boolean }) {
    const btnStyle: React.CSSProperties = {
        padding: "10px 16px",
        border: "1px solid #D4AF37",
        borderRadius: 8,
        background: "transparent",
        color: "#D4AF37",
        cursor: "pointer",
    };

    if (!signedIn) {
        return (
            <button style={btnStyle} onClick={() => signIn("discord")}>
                Log ind med Discord
            </button>
        );
    }

    return (
        <button style={btnStyle} onClick={() => signOut()}>
            Log ud
        </button>
    );
}
