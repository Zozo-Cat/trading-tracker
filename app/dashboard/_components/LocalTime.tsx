"use client";

import { useEffect, useState } from "react";

export default function LocalTime({
                                      iso,
                                      dateStyle = "dd.MM",
                                      timeStyle = "HH.mm",
                                  }: {
    iso: string;
    dateStyle?: "dd.MM" | "dd/MM";
    timeStyle?: "HH.mm" | "HH:mm";
}) {
    const [text, setText] = useState<string>("");

    useEffect(() => {
        const d = new Date(iso); // <- altid bruger eventets minutter!
        const date = new Intl.DateTimeFormat("da-DK", {
            day: "2-digit",
            month: "2-digit",
        }).format(d);

        const time = new Intl.DateTimeFormat("da-DK", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);

        // dd.MM + HH.mm (matcher dit screenshot)
        const dateOut = dateStyle === "dd.MM" ? date.replace("/", ".") : date;
        const timeOut = timeStyle === "HH.mm" ? time.replace(":", ".") : time;

        setText(`${dateOut}, ${timeOut}`);
    }, [iso, dateStyle, timeStyle]);

    // Klientside render → ingen hydration-mismatch
    return <span suppressHydrationWarning>{text || "…"}</span>;
}
