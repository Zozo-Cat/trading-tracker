export default function PartnerePage() {
    return (
        <main className="min-h-[60vh] bg-[#211d1d] text-[#D4AF37] px-4 py-12">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold mb-2">Partnere</h1>
                <p className="text-gray-200 mb-8">
                    Vores officielle samarbejder. (Placeholder — kontakt os hvis du vil være partner)
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                    <article className="rounded-xl border border-[#3b3838] bg-[#1a1818] p-6">
                        <h2 className="text-xl font-semibold mb-2">Partner A</h2>
                        <p className="text-gray-300 mb-4">
                            Kort beskrivelse (100–150 ord senere). CTA kan føre til “Læs mere” eller ekstern side.
                        </p>
                        <a
                            href="#"
                            className="inline-block px-4 py-2 rounded-lg text-black font-medium"
                            style={{ backgroundColor: "#76ED77" }}
                        >
                            Besøg partner
                        </a>
                    </article>

                    <article className="rounded-xl border border-[#3b3838] bg-[#1a1818] p-6">
                        <h2 className="text-xl font-semibold mb-2">Partner B</h2>
                        <p className="text-gray-300 mb-4">…</p>
                        <a
                            href="#"
                            className="inline-block px-4 py-2 rounded-lg text-black font-medium"
                            style={{ backgroundColor: "#76ED77" }}
                        >
                            Besøg partner
                        </a>
                    </article>
                </div>
            </div>
        </main>
    );
}
