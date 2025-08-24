import LegalPage from "@/app/_components/LegalPage";

export default function PrivatlivPage() {
    return (
        <LegalPage title="Privatlivspolitik">
            <section className="space-y-6">
                <p>
                    Vi passer på dine data. Her beskriver vi hvilke oplysninger vi behandler,
                    hvorfor og dine rettigheder.
                </p>

                <h2 className="text-xl font-semibold">1. Dataansvarlig</h2>
                <p>Trading Tracker (kontaktoplysninger indsættes her).</p>

                <h2 className="text-xl font-semibold">2. Hvilke data vi indsamler</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Kontooplysninger (e-mail, adgangskode/2FA).</li>
                    <li>Profileringsdata (navn, team, rolle – hvis du angiver det).</li>
                    <li>Brugsdata (logning, enhedsinfo, IP, cookies).</li>
                    <li>Integrationsdata (fx MT4/MT5 synk – kun det nødvendige).</li>
                </ul>

                <h2 className="text-xl font-semibold">3. Formål og hjemmel</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Levere Tjenesten (kontrakt).</li>
                    <li>Sikkerhed, misbrugsforebyggelse (legitim interesse).</li>
                    <li>Marketing/nyheder (samtykke – kan tilbagetrækkes).</li>
                </ul>

                <h2 className="text-xl font-semibold">4. Opbevaring</h2>
                <p>
                    Data opbevares kun så længe det er nødvendigt til formålet. Du kan til
                    enhver tid slette din konto.
                </p>

                <h2 className="text-xl font-semibold">5. Dine rettigheder</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Indsigt, berigtigelse, sletning, begrænsning.</li>
                    <li>Dataportabilitet og indsigelse.</li>
                    <li>Tilbagetræk samtykke når som helst.</li>
                </ul>

                <h2 className="text-xl font-semibold">6. Deling</h2>
                <p>
                    Vi deler kun med betroede databehandlere (hosting, e-mail, analyse) efter
                    databehandleraftale. Ingen salg af persondata.
                </p>

                <h2 className="text-xl font-semibold">7. Kontakt & klage</h2>
                <p>
                    Kontakt os for spørgsmål. Du kan klage til Datatilsynet, hvis du mener din
                    ret ikke er overholdt.
                </p>
            </section>

            <p className="mt-8 text-xs text-gray-400">
                Denne politik er en skabelon og ikke juridisk rådgivning.
            </p>
        </LegalPage>
    );
}
