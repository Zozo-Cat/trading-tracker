"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";

type Props = {
    showZoneLabel?: boolean;      // vis "Europe/Copenhagen" label
    className?: string;
    withSeconds?: boolean;
};

export default function LocalTime({ showZoneLabel = false, className, withSeconds = false }: Props) {
    const { prefs, timeZone } = usePrefs();
    const [now, setNow] = useState<Date>(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), withSeconds ? 1000 : 30000);
        return () => clearInterval(t);
    }, [withSeconds]);

    return (
        <div className={className}>
            <div className="font-medium">
                {formatDateTime(now, prefs, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: withSeconds ? "2-digit" : undefined,
                })}
            </div>
            {showZoneLabel && (
                <div className="text-xs text-yellow-200/70">{timeZone}</div>
            )}
        </div>
    );
}
