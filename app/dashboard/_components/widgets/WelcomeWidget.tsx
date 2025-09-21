"use client";

import { useEffect, useState } from "react";

type Props = { instanceId: string };

export default function WelcomeWidget({ instanceId }: Props) {
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        const n = (typeof window !== "undefined" && localStorage.getItem("tt.firstName")) || "";
        setFirstName(n);
    }, []);

    const hour = new Date().getHours();
    const greeting =
        hour < 5 ? "Godnat" : hour < 10 ? "Godmorgen" : hour < 18 ? "Goddag" : "Godaften";

    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <div className="text-lg font-semibold">
                    {greeting}, {firstName || "Trader"} 👋
                </div>
                <p className="text-sm text-neutral-300 mt-1">
                    Små forbedringer hver dag slår store spring en gang imellem.
                </p>
            </div>

            <p className="text-xs text-neutral-500 mt-3">
                Tip: Skift dit navn under “Min side”, eller gem midlertidigt som
                <code className="mx-1 px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">tt.firstName</code>
                i localStorage.
            </p>
        </div>
    );
}
