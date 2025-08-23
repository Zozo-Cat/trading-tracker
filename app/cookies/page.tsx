import LegalPage from "@/app/_components/LegalPage";
import Link from "next/link";

export default function CookiesPage() {
    return (
        <LegalPage title="Cookiepolitik">
            <section className="space-y-6">
                <p>
                    Vi bruger cookies til at få Tjenesten til at fungere, forbedre
                    ydeevnen og (med samtykke) til analyse/marketing.
                </p>

                <h2 className="text-xl font-semibold">1. Hvad er cookies?</h2>
                <p>
                    Små tekstfiler, der gemmes på din enhed for at huske indstillinger
                    og sessioner.
                </p>

                <h2 className="text-xl font-semibold">2. Typer af cookies</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li><b>Nødvendige</b> (login, sessions, sikkerhed).</li>
                    <li><b>Præference</b> (sprog, UI-valg).</li>
                    <li><b>Statistik</b> (anonym brugsmåling – kun hvis godkendt).</li>
                    <li><b>Marketing</b> (kun med samtykke).</li>
                </ul>

                <h2 className="text-xl font-semibold">3. Styring af cookies</h2>
                <p>
                    Du kan til enhver tid ændre eller trække samtykke tilbage i vores
                    cookie-indstillinger (kommer senere), eller via din browser.
                </p>

                <h2 className="text-xl font-semibold">4. Yderligere info</h2>
                <p>
                    Se også vores{" "}
                    <Link href="/privatliv" className="underline text-[#76ED77]">
                        privatlivspolitik
                    </Link>{" "}
                    for hvordan vi behandler persondata.
                </p>
            </section>

            <p className="mt-8 text-xs text-gray-400">
                Denne side er en skabelon. Tilføj jeres konkrete cookie-liste senere.
            </p>
        </LegalPage>
    );
}
