// app/saadan-virker-det/page.tsx
import Link from "next/link";

export default function HowItWorksPage() {
    const steps = [
        { title: "Opret din gratis konto", text: "Kom i gang på få sekunder. Ingen kreditkort krævet – opret en profil og gem dine indstillinger." },
        { title: "Registrér dine trades", text: "Tilføj køb/salg, noter setups og tag læring med fra hver trade. Hold styr på entries, exits og risk." },
        { title: "Følg dine statistikker", text: "Se win-rate, RR, bedste setups og grafer over din udvikling. Find mønstrene der gør dig bedre." },
        { title: "Samarbejd i teams", text: "Opret eller join et team. Del erfaringer, hold hinanden ansvarlige og løft niveauet sammen." },
    ];

    return (
        <main className="pb-20">
            {/* Hero */}
            <section className="px-4 py-14" style={{ backgroundColor: "#211d1d" }}>
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#D4AF37" }}>
                        Sådan virker Trading Tracker
                    </h1>
                    <p className="mt-4 text-gray-300 md:text-lg">
                        Følg dine trades, få overblik over statistikker og byg stærke vaner – alt samlet ét sted.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-black font-semibold shadow hover:scale-105 transition-transform"
                            style={{ backgroundColor: "#89ff00" }}
                        >
                            Opret gratis konto
                        </Link>
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="px-4 py-12">
                <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2">
                    {steps.map((s, i) => (
                        <article key={s.title} className="rounded-xl border border-gray-700 bg-[#1a1818] p-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-black font-bold"
                                    style={{ backgroundColor: "#D4AF37" }}
                                    aria-hidden
                                >
                                    {i + 1}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: "#D4AF37" }}>{s.title}</h3>
                                    <p className="mt-2 text-sm text-gray-300">{s.text}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="px-4 pb-12">
                <div className="mx-auto max-w-4xl rounded-xl border border-gray-700 bg-[#1a1818] p-6">
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#D4AF37" }}>Ofte stillede spørgsmål</h2>
                    <div className="space-y-4 text-gray-300 text-sm">
                        <div><div className="font-semibold">Koster det noget at komme i gang?</div><p className="mt-1">Nej. Du kan starte gratis og opgradere senere, hvis du får brug for ekstra funktioner.</p></div>
                        <div><div className="font-semibold">Kan jeg bruge det uden et team?</div><p className="mt-1">Ja. Du kan tracke helt alene – teams er kun et ekstra værktøj.</p></div>
                        <div><div className="font-semibold">Skal jeg installere noget?</div><p className="mt-1">Nej, Trading Tracker kører i browseren. Log ind, og så er du i gang.</p></div>
                    </div>
                </div>
            </section>

            {/* CTA i bunden */}
            <section className="py-12 px-4 text-center" style={{ backgroundColor: "#1a1818", borderTop: "1px solid #333" }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#D4AF37" }}>
                        Klar til at prøve det i praksis?
                    </h2>
                    <p className="text-gray-300 mb-6">Opret en gratis konto – det tager under ét minut.</p>
                    <Link
                        href="/signup"
                        className="inline-block px-6 py-3 rounded-lg text-black font-semibold shadow hover:scale-105 transition-transform"
                        style={{ backgroundColor: "#89ff00" }}
                    >
                        Kom i gang gratis
                    </Link>
                </div>
            </section>
        </main>
    );
}
