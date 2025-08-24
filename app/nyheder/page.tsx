export default function NyhederPage() {
    return (
        <main className="min-h-[60vh] bg-[#211d1d] text-[#D4AF37] px-4 py-12">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold mb-2">Nyheder</h1>
                <p className="text-gray-200 mb-8">
                    Produktopdateringer, partnere og guides. (Placeholder — indhold kommer snart)
                </p>

                <div className="rounded-xl border border-[#3b3838] bg-[#1a1818] p-6">
                    <h2 className="text-xl font-semibold mb-2">Seneste</h2>
                    <p className="text-gray-300">
                        Intet at vise endnu. Følg med — vi opdaterer løbende.
                    </p>
                </div>
            </div>
        </main>
    );
}
