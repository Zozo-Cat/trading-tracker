"use client";

type Partner = {
    name: string;
    logo?: string; // fx "/partners/binance.png"
    url?: string;  // fx "https://…"
    blurb?: string; // 100–150 ord (placeholder nu)
    cta?: string;   // fx "Læs mere"
};

const defaultPartners: Partner[] = [
    {
        name: "Binance",
        logo: "/partners/binance.png",
        url: "#",
        cta: "Besøg partner",
        blurb:
            "Binance er en global handelsplatform for både nye og erfarne tradere. Som officiel partner arbejder vi på at gøre onboarding og daglig brug så friktionsfri som muligt: tydelige gebyrer, hurtige udbetalinger og værktøjer, der understøtter en disciplineret handelsrutine. Denne placeholder-tekst illustrerer, hvordan partnerne kan beskrive deres styrker, produkter og fordele ved samarbejdet. Målet er at give brugerne et trygt overblik og et klart næste skridt. Når partnerpanelet lanceres, kan partneren selv redigere denne tekst og CTA, så indholdet altid er aktuelt og værdiskabende for Trading Tracker-brugere.",
    },
    {
        name: "Bybit",
        logo: "/partners/bybit.png",
        url: "#",
        cta: "Læs mere",
        blurb:
            "Bybit fokuserer på hastighed, likviditet og stabile handelsoplevelser under høj volatilitet. I vores samarbejde prioriterer vi gennemsigtighed, enkel tilkobling af konto og adgang til nødvendige data, så tradere kan evaluere performance og risiko. Denne tekst er en midlertidig placeholder, der viser den plads partnerne får til at fortælle om kernefunktioner, sikkerhed og support. Når redigering åbnes, kan partneren selv opdatere indholdet og tilføje relevante links. Det vigtigste er en konsistent præsentation med klare budskaber og en tydelig call-to-action, som hjælper brugerne videre.",
    },
    {
        name: "TradingView",
        logo: "/partners/tradingview.png",
        url: "#",
        cta: "Udforsk integration",
        blurb:
            "TradingView er kendt for kraftfulde grafer, alarmer og et stærkt community. Sammen arbejder vi på at forbinde visuelle setups med trade-journalføring, så der er rød tråd fra tanke til handling. Denne placeholder-tekst viser omfanget af beskrivelsen: hvad der tilbydes, hvordan integrationen fungerer, og hvilke fordele brugerne får i hverdagen. Når partnerpanelet lanceres, kan teksten opdateres i et simpelt redaktørflow. Målet er at holde indholdet konkret, troværdigt og hjælpsomt, så tradere hurtigt kan vurdere nytten for egne workflows og resultater.",
    },
    {
        name: "Kraken",
        logo: "/partners/kraken.png",
        url: "#",
        cta: "Se fordele",
        blurb:
            "Kraken lægger vægt på sikkerhed, regulering og pålidelige processer. I partnerskabet fokuserer vi på nem konto-linking, synkronisering af handler og et troværdigt overblik over fees, funding og PnL. Denne tekst er en midlertidig placeholder; i produktion kan partneren selv levere en kort beskrivelse, så tonen matcher deres brand. Vi anbefaler at fokusere på unik værdi, konkrete eksempler og tydelige næste skridt. Når teksten er godkendt, vises den her i slideren sammen med logo, overskrift og en tydelig CTA, så besøgende kan gå direkte videre.",
    },
    {
        name: "OKX",
        logo: "/partners/okx.png",
        url: "#",
        cta: "Læs mere",
        blurb:
            "OKX tilbyder et bredt udvalg af markeder og produkter, hvor effektiv eksekvering og fleksible værktøjer er i centrum. Vores samarbejde handler om at gøre dataadgang og konto-linking enkel, samtidig med fokus på brugerens kontrol og sikkerhed. Denne placeholder beskriver præsentationen: logo øverst, navn som overskrift, en kort introduktion og en CTA, der leder til mere info. Når partnerstyringen er klar, kan OKX selv opdatere tekst og knap, så indholdet er aktuelt og værdiskabende for både nye og erfarne tradere.",
    },
];

export default function PartnerSlider({ partners = defaultPartners }: { partners?: Partner[] }) {
    // Dupliker listen for uendelig loop (samme stil som før)
    const items = [...partners, ...partners];

    return (
        <section className="mx-auto max-w-7xl px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Official partners</h2>


            {/* Samme stil: horisontal auto-scroll + fade i siderne; ingen baggrund på selve sektionen */}
            <div className="relative overflow-hidden rounded-2xl group">
                {/* Fade edges (matcher baggrundsfarven på siden) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#211d1d] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#211d1d] to-transparent" />

                {/* Rækken der scroller (samme mønster som tidligere) */}
                <div
                    className="flex gap-6 py-4 animate-[scroll_45s_linear_infinite] group-hover:[animation-play-state:paused]"
                    style={{ minWidth: "200%" }}
                >
                    {items.map((p, i) => (
                        <a
                            key={`${p.name}-${i}`}
                            href={p.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 w-[320px] sm:w-[360px] md:w-[420px]"
                            title={p.name}
                        >
                            {/* Kort: subtil baggrund og kant (som før), så det ikke virker som en hård sektion-boks */}
                            <div className="h-full rounded-xl border border-gray-700 bg-[#1a1818] hover:bg-white/5 transition p-5 flex flex-col">
                                {/* Logo */}
                                <div className="flex justify-center mb-3">
                                    {p.logo ? (
                                        <img
                                            src={p.logo}
                                            alt={p.name}
                                            className="h-10 object-contain"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                        />
                                    ) : null}
                                </div>

                                {/* Overskrift = partnernavn */}
                                <h3 className="text-lg font-semibold text-center mb-2">{p.name}</h3>

                                {/* Blurb (klampet til ~5-7 linjer for ens højde) */}
                                <p
                                    className="text-xs sm:text-sm text-gray-200 leading-relaxed overflow-hidden"
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 7,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {p.blurb ||
                                        "Partnerbeskrivelse (placeholder). Her kan partneren skrive 100–150 ord om produkt, sikkerhed, fees, integration og fordele for Trading Tracker-brugere. Teksten redigeres senere via partnerpanelet."}
                                </p>

                                {/* CTA */}
                                <div className="mt-4 flex justify-center">
                  <span
                      className="px-3 py-2 rounded-lg text-black font-medium"
                      style={{ backgroundColor: "#5dade2" }}
                  >
                    {p.cta || "Læs mere"}
                  </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Keyframes til den uendelige scroll (samme princip som før) */}
                <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
            </div>
        </section>
    );
}
