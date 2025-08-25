"use client";
import { useState } from "react";
import DashboardCard from "../DashboardCard";

export default function NoteWidget() {
    const [text, setText] = useState("Dagens fokus:\n• Vent på A‑setup\n• Ingen revenge\n• Journal efter luk");
    return (
        <DashboardCard title="Note">
      <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full resize-none rounded-lg bg-neutral-950 border border-neutral-800 p-2 text-sm text-neutral-200"
      />
        </DashboardCard>
    );
}
