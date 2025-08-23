"use client";
import Link from "next/link";

export default function LegalPage({
                                      title,
                                      updated = "Opdateret: " + new Date().toLocaleDateString("da-DK"),
                                      children,
                                  }: {
    title: string;
    updated?: string;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-[70vh] bg-[#211d1d] text-[#D4AF37] px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <p className="text-gray-300 mb-8">{updated}</p>

                <article className="rounded-xl border border-[#3b3838] bg-[#1a1818] p-6 leading-relaxed text-gray-100">
                    {children}
                </article>

                <div className="mt-8 text-sm text-gray-300">
                    <p>
                        Har du spørgsmål? Skriv til os via{" "}
                        <Link href="/nyheder" className="underline text-[#76ED77]">
                            Nyheder/Kontakt
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </main>
    );
}
