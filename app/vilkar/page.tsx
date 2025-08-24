import LegalPage from "@/app/_components/LegalPage";
import Link from "next/link";

export default function VilkarPage() {
    return (
        <LegalPage title="Vilkår og betingelser">
            <section className="space-y-6">
                <p>
                    Disse vilkår gælder for brugen af Trading Tracker (“Tjenesten”). Ved at
                    oprette en konto eller bruge Tjenesten accepterer du vilkårene.
                </p>

                <h2 className="text-xl font-semibold">1. Konto</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Du er ansvarlig for dine loginoplysninger og aktivitet på kontoen.</li>
                    <li>Du skal være mindst 18 år.</li>
                    <li>Misbrug kan medføre suspendering eller lukning.</li>
                </ul>

                <h2 className="text-xl font-semibold">2. Abonnement og betaling</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Betalte funktioner faktureres pr. periode (fx måned).</li>
                    <li>Opsigelse stopper fremtidige betalinger, men refunderer ikke bagud.</li>
                </ul>

                <h2 className="text-xl font-semibold">3. Brug af Tjenesten</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Ingen ulovligt indhold eller krænkelser af andres rettigheder.</li>
                    <li>Respekter API- og rate-limits ved integrationer.</li>
                </ul>

                <h2 className="text-xl font-semibold">4. Ansvarsfraskrivelse</h2>
                <p>
                    Tjenesten leveres “som den er” uden garanti. Trading indebærer risiko. Vi
                    giver ikke finansielle råd.
                </p>

                <h2 className="text-xl font-semibold">5. Ansvarsbegrænsning</h2>
                <p>
                    Vi er ikke ansvarlige for indirekte tab, datatab eller følgeskader. Vores
                    samlede ansvar er maksimeret til det beløb, du har betalt de seneste 3
                    måneder.
                </p>

                <h2 className="text-xl font-semibold">6. Ændringer</h2>
                <p>
                    Vi kan opdatere vilkår og funktioner. Ved væsentlige ændringer giver vi
                    besked via Tjenesten eller e-mail.
                </p>

                <h2 className="text-xl font-semibold">7. Kontakt</h2>
                <p>
                    Spørgsmål til vilkår: se vores{" "}
                    <Link href="/privatliv" className="underline text-[#76ED77]">
                        privatlivspolitik
                    </Link>{" "}
                    eller kontakt os.
                </p>
            </section>

            <p className="mt-8 text-xs text-gray-400">
                Denne tekst er en standard-skabelon og udgør ikke juridisk rådgivning.
            </p>
        </LegalPage>
    );
}
