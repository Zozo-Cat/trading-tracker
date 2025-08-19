export async function fetchEconomicCalendar({
                                                countries = ["all"],       // "all" = alle lande
                                                importance = [2, 3],       // medium + high som standard
                                                daysAhead = 7,             // udvid vindue = i dag + 7 dage
                                            }: {
    countries?: string[];      // fx ["united states","germany"]
    importance?: (1|2|3)[];
    daysAhead?: number;
}) {
    const apiKey = process.env.NEXT_PUBLIC_TE_API_KEY;
    if (!apiKey) throw new Error("No Trading Economics API key found");

    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + daysAhead);

    const d1 = today.toISOString().split("T")[0];
    const d2 = end.toISOString().split("T")[0];

    const url = new URL("https://api.tradingeconomics.com/calendar");
    url.searchParams.set("c", apiKey);                  // din key
    url.searchParams.set("format", "json");
    url.searchParams.set("d1", d1);
    url.searchParams.set("d2", d2);
    url.searchParams.set("importance", importance.join(",")); // "2,3"
    url.searchParams.set("country", countries.join(","));     // "all" eller liste

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TradingEconomics API error: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}
