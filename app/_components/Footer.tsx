// app/_components/Footer.tsx
export default function Footer() {
    return (
        <footer className="mt-16 border-t border-gray-700" style={{ backgroundColor: "#1a1818" }}>
            <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-300 grid gap-8 md:grid-cols-4">
                {/* Brand */}
                <div className="md:col-span-2">
                    <div className="text-xl font-semibold" style={{ color: "#D4AF37" }}>
                        Trading Tracker
                    </div>
                    <p className="mt-2 leading-relaxed">
                        Track dine trades, opret teams og få overblik over din udvikling. Designet til at hjælpe dig
                        med at bygge gode vaner – hver dag.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <div className="font-medium mb-3" style={{ color: "#D4AF37" }}>Links</div>
                    <ul className="space-y-2">
                        <li><a href="/funktioner" className="hover:underline">Funktioner</a></li>
                        <li><a href="/gratis" className="hover:underline">Gratis adgang</a></li>
                        <li><a href="/køb" className="hover:underline">Køb adgang</a></li>
                        <li><a href="/signup" className="hover:underline">Log ind / Opret</a></li>
                    </ul>
                </div>

                {/* Kontakt */}
                <div>
                    <div className="font-medium mb-3" style={{ color: "#D4AF37" }}>Kontakt</div>
                    <ul className="space-y-2">
                        <li>E-mail: <a href="mailto:support@tradingtracker.app" className="hover:underline">support@tradingtracker.app</a></li>
                        <li>Discord: <a href="/discord" className="hover:underline">Join her</a></li>
                        <li>CVR: 12345678</li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-700">
                <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between">
                    <div>© {new Date().getFullYear()} Trading Tracker. Alle rettigheder forbeholdes.</div>
                    <div className="mt-2 sm:mt-0 space-x-4">
                        <a href="/vilkår" className="hover:underline">Vilkår</a>
                        <a href="/privatliv" className="hover:underline">Privatliv</a>
                        <a href="/cookies" className="hover:underline">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
