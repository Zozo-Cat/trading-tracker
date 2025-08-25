"use client";
import { useState } from "react";
import DashboardCard from "../DashboardCard";

type Item = { id: string; label: string; done: boolean };
const seed: Item[] = [
    { id: "1", label: "Markeder valgt", done: false },
    { id: "2", label: "Ingen news-trades", done: false },
    { id: "3", label: "Risk ≤ 1%", done: false },
];

export default function ChecklistWidget() {
    const [items, setItems] = useState<Item[]>(seed);

    const toggle = (id: string) =>
        setItems((arr) => arr.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

    return (
        <DashboardCard title="Tjekliste (mini)">
            <ul className="space-y-2">
                {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
                        <span className={`text-sm ${it.done ? "line-through text-neutral-500" : "text-neutral-200"}`}>{it.label}</span>
                    </li>
                ))}
            </ul>
        </DashboardCard>
    );
}
