"use client";
export default function LockNotice({
                                       label = "Kræver Pro",
                                       href = "/pricing",
                                   }: { label?: string; href?: string }) {
    return (
        <div className="mt-2 rounded-lg border border-neutral-700 bg-neutral-900/70 p-2 flex items-center justify-between">
            <div className="text-sm text-neutral-300">🔒 {label}</div>
            <a
                href={href}
                className="text-xs px-2 py-1 rounded-md bg-[#D4AF37] text-black font-medium hover:opacity-90"
            >
                Opgrader
            </a>
        </div>
    );
}
