export default function Features() {
    const items = [
        { title: "Track din trading", text: "Tag kontrol – følg hver eneste trade i realtid." },
        { title: "Opret teams", text: "Byg dit dream team og jag resultater sammen." },
        { title: "Se dine statistikker", text: "Omdan data til din hemmelige trading-fordel." },
        { title: "Stig til næste niveau", text: "Bryd grænserne – bliv en bedre trader hver dag." },
    ];

    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {items.map((it) => (
                    <article
                        key={it.title}
                        className="rounded-xl border border-gray-700 p-5 bg-[#1a1818] transform transition duration-300 hover:scale-105 hover:shadow-xl hover:border-yellow-400"
                    >
                        <h3
                            className="font-bold text-lg bg-gradient-to-r from-yellow-400 to-yellow-200 text-transparent bg-clip-text drop-shadow-[2px_2px_4px_rgba(0,0,0,0.6)]"
                        >
                            {it.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-300">{it.text}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
