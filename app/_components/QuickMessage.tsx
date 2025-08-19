// app/_components/QuickMessage.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useDummySession } from "@/lib/dummyAuth";
import { EmojiPopover } from "@/app/_components/emoji";

const gold = "#D4AF37";

export default function QuickMessage() {
    const { user } = useDummySession();
    const [channel, setChannel] = useState<"team" | "mentees" | "community">("team");
    const [text, setText] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    const send = () => {
        if (!text.trim() || !user) return;
        const key = `tt_notifs_${user.id}`;
        try {
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            const a = Array.isArray(arr) ? arr : [];
            const newNotif = {
                id: `msg-${Date.now()}`,
                title: `Besked (${channel}): ${text.trim()}`,
                href: "/notifications",
                createdAt: new Date().toISOString(),
                read: false,
            };
            localStorage.setItem(key, JSON.stringify([newNotif, ...a].slice(0, 50)));
            window.dispatchEvent(new Event("tt:notifs:updated"));
            setText("");
        } catch {}
    };

    // Klik udenfor → luk popover
    useEffect(() => {
        if (!showEmoji) return;
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (inputRef.current?.contains(t)) return;
            if (btnRef.current?.contains(t)) return;
            const pop = document.getElementById("qm-emoji-pop");
            if (pop && pop.contains(t)) return;
            setShowEmoji(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [showEmoji]);

    const insertAtCursor = (emoji: string) => {
        const el = inputRef.current;
        if (!el) {
            setText((d) => d + emoji);
            return;
        }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const before = text.slice(0, start);
        const after = text.slice(end);
        const next = before + emoji + after;
        setText(next);
        requestAnimationFrame(() => {
            el.focus();
            const caret = start + emoji.length;
            el.setSelectionRange(caret, caret);
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
                <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="rounded-md px-3 py-2 text-sm outline-none border"
                    style={{ background: "#211d1d", color: "#f0f0f0", borderColor: "#3b3838" }}
                >
                    <option value="team">Send til mit team</option>
                    <option value="mentees">Send til mentees</option>
                    <option value="community">Send til community</option>
                </select>

                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Kort besked…"
                        className="w-full rounded-md px-3 py-2 text-sm outline-none border pr-20"
                        style={{ background: "#211d1d", color: "#f0f0f0", borderColor: "#3b3838" }}
                    />

                    <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                        <div className="relative">
                            <button
                                ref={btnRef}
                                type="button"
                                onClick={() => setShowEmoji((v) => !v)}
                                className="px-2 py-1 rounded border text-xs hover:bg-white/5"
                                style={{ borderColor: gold, color: gold }}
                                aria-haspopup="dialog"
                                aria-expanded={showEmoji}
                            >
                                😀
                            </button>

                            {showEmoji && (
                                <div id="qm-emoji-pop">
                                    <EmojiPopover
                                        userId={user?.id || "anon"}
                                        onPick={(e) => {
                                            insertAtCursor(e);
                                            setShowEmoji(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={send}
                            className="px-3 py-1.5 rounded-md text-sm font-medium"
                            style={{ background: gold, color: "#000" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-400">
                Tip: Hurtige tekst-beskeder. Brug “Send trade” til strukturerede signaler.
            </div>
        </div>
    );
}
