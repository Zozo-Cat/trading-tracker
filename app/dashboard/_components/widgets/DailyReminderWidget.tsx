// app/dashboard/_components/widgets/DailyReminderWidget.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

export default function DailyReminderWidget({ instanceId }: Props) {
    // Fast pool (statisk)
    const pool = useMemo(
        () => [
            "Tjek kalenderen før åbning—undgå at blive fanget i røde nyheder.",
            "Hold dig til A-setups. Skær alt middelmådigt fra.",
            "“Ingen trade” er også en beslutning. Bevar tålmodigheden.",
            "Log én konkret læring efter hver trade.",
            "Risiko først. Trim størrelsen hvis du er i tvivl.",
        ],
        []
    );

    // Vi vil have en ny reminder ved hvert besøg (hver mount).
    // Løsning: brug en visit-counter i sessionStorage → deterministisk men ændrer sig pr. besøg.
    const [text, setText] = useState<string>("");

    useEffect(() => {
        try {
            const key = `${instanceId}::reminder::visitCounter`;
            const cur = parseInt(sessionStorage.getItem(key) || "0", 10) || 0;
            const next = cur + 1;
            sessionStorage.setItem(key, String(next));

            const rng = seededRng(`${instanceId}::reminder::visit::${next}`);
            const idx = Math.floor(rng() * pool.length);
            setText(pool[idx]);
        } catch {
            // Fallback: bare pick random (client only)
            const idx = Math.floor(Math.random() * pool.length);
            setText(pool[idx]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceId, pool.length]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Daily Reminder</div>
                    <HelpTip text="Skifter ved hvert besøg. Ingen 'markér som set' – bare en frisk påmindelse." />
                </div>
            </div>

            <div className="text-neutral-100 min-h-[24px]">
                {text || <span className="text-neutral-400">Indlæser…</span>}
            </div>
        </div>
    );
}
