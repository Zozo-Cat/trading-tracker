// app/_data/emojis.ts
// Udvidet emoji-katalog med DK+EN søgeord, trading-sektion og fallback-topliste.
// "Hurtig adgang" (de 2-3 øverste rækker i UI) laves dynamisk per bruger via usage-tracking i UI'et.

export type EmojiItem = { e: string; k: string[] };

// En kurateret "baseline" topliste (fallback) hvis en ny bruger ikke har brugshistorik endnu.
// 24 stk = præcis 3 rækker á 8 i vores grid.
export const TOP_DEFAULT_EMOJIS: EmojiItem[] = [
    { e: "😀", k: ["glad","smil","happy","smile"] },
    { e: "🙂", k: ["smil","ok","tilfreds","calm","smile"] },
    { e: "😎", k: ["cool","solbriller","sunglasses"] },
    { e: "🥳", k: ["fest","fejre","party","celebrate"] },
    { e: "🔥", k: ["ild","helt vildt","hot","fire","spicy"] },
    { e: "💪", k: ["styrke","power","strong","motivation"] },
    { e: "✅", k: ["ok","færdig","check","done","complete"] },
    { e: "❌", k: ["fejl","stop","forkert","wrong","error"] },

    { e: "🎯", k: ["mål","target","tp","goal"] },
    { e: "📈", k: ["op","bullish","vækst","growth","chart up"] },
    { e: "📉", k: ["ned","bearish","fald","fall","chart down"] },
    { e: "🪙", k: ["mønt","coin","profit","penge","money"] },
    { e: "💰", k: ["penge","money bag","profit","gevinst"] },
    { e: "🔔", k: ["alarm","notifikation","notification","bell"] },
    { e: "📝", k: ["note","skriv","journal","write"] },
    { e: "📌", k: ["pin","fastgør","pinned"] },

    { e: "☀️", k: ["sol","sun","sunny","klart","clear"] },
    { e: "🌙", k: ["måne","moon","nat","night"] },
    { e: "🌧️", k: ["regn","rain","byger","shower"] },
    { e: "⚠️", k: ["advarsel","warning","obs","caution"] },
    { e: "⏳", k: ["vent","tid","hourglass","loading"] },
    { e: "⏱️", k: ["stopur","tempo","speed","timer"] },
    { e: "💡", k: ["idé","idea","lightbulb","inspiration"] },
    { e: "🚀", k: ["raket","rocket","to the moon","launch"] },
];

// Trading-sektion (masser af relevante ikoner, DK+EN keywords).
export const TRADING_EMOJIS: EmojiItem[] = [
    // Bullish / op
    { e: "📈", k: ["op","bullish","vækst","growth","chart up","long","køb","buy"] },
    { e: "🚀", k: ["raket","rocket","to the moon","bull","breakout"] },
    { e: "💹", k: ["kursgraf","yen","chart","finance","op","ned"] },
    { e: "💵", k: ["dollar","usd","penge","money","cash"] },
    { e: "💰", k: ["profit","gevinst","pengetaske","money bag"] },
    { e: "🪙", k: ["mønt","coin","crypto","krypto","btc","eth"] },
    { e: "🏦", k: ["bank","centralbank","interest","rente"] },
    { e: "💳", k: ["kort","kreditkort","credit card","funding"] },

    // Bearish / ned / risiko
    { e: "📉", k: ["ned","bearish","fald","fall","chart down","short","sælg","sell"] },
    { e: "📊", k: ["diagram","analyse","bars","bars chart"] },
    { e: "🛑", k: ["stop","stop loss","sl","rødt","afslut"] },
    { e: "⛔", k: ["forbudt","ingen handel","no trade","avoid"] },
    { e: "⚠️", k: ["advarsel","warning","volatilitet","risk"] },

    // Targets / plan / kommunikation
    { e: "🎯", k: ["mål","target","tp","take profit","goal","rr"] },
    { e: "📌", k: ["pin","fastgør","pinned","favorit"] },
    { e: "📝", k: ["note","skriv","journal","tradingjournal"] },
    { e: "📒", k: ["notesbog","journal","bog"] },
    { e: "📢", k: ["signal","annoncer","megafon","announce"] },
    { e: "📣", k: ["megafon","signal","shout","announce"] },
    { e: "🔔", k: ["alert","alarm","notifikation","notification","bell"] },

    // Tid / events
    { e: "⏳", k: ["vent","pending order","tid","hourglass"] },
    { e: "⏱️", k: ["stopur","scalp","tempo","timer"] },
    { e: "🗓️", k: ["kalender","events","economic calendar"] },

    // Diverse trading-relevante
    { e: "🧭", k: ["retning","direction","kompas","navigate"] },
    { e: "🛠️", k: ["værktøj","tools","fix","byg"] },
    { e: "🧪", k: ["test","eksperiment","backtest","experiment"] },
    { e: "🔒", k: ["lås","lock","sikkerhed","security"] },
    { e: "🔓", k: ["unlock","åben","åbn","open"] },
    { e: "❓", k: ["spørgsmål","question","hjælp","hvad"] },
];

// General-sektion – humør, vejr, m.m. (uddrag – tilføj frit flere efter behov).
export const GENERAL_EMOJIS: EmojiItem[] = [
    // Humør / reaktioner
    { e: "😀", k: ["glad","smil","happy","smile"] },
    { e: "😄", k: ["smil","grin","laugh","happy"] },
    { e: "😁", k: ["smil","tænder","beaming","happy"] },
    { e: "😂", k: ["griner","lol","laugh","tears","sjov"] },
    { e: "😉", k: ["blink","wink","flirt","hint"] },
    { e: "😊", k: ["genert","smil","blush","pleased","happy"] },
    { e: "🙃", k: ["på hovedet","silly","upside down"] },
    { e: "😴", k: ["søvn","træt","sleep","zzz"] },
    { e: "😡", k: ["vred","sur","angry","mad"] },
    { e: "😭", k: ["græder","cry","sad","tårer","tears"] },
    { e: "🤯", k: ["mind blown","wow","chokeret","blown"] },
    { e: "😬", k: ["akavet","grimace","awkward"] },
    { e: "🤝", k: ["håndtryk","aftale","deal","handshake","team"] },
    { e: "🙌", k: ["jubel","yay","high five","celebrate"] },
    { e: "👏", k: ["applaus","clap","godt gået","bravo"] },
    { e: "🙏", k: ["tak","please","pray","thank you"] },
    { e: "💪", k: ["styrke","power","strong","motivation"] },
    { e: "🔥", k: ["ild","helt vildt","hot","fire","spicy"] },
    { e: "✨", k: ["glimmer","sparkle","shine","magic"] },
    { e: "⭐", k: ["stjerne","favorit","star","favorite"] },
    { e: "💡", k: ["idé","idea","lightbulb","inspiration"] },

    // Vejr / natur
    { e: "☀️", k: ["sol","sun","sunny","klart","clear"] },
    { e: "🌤️", k: ["sol med skyer","sun behind cloud","partly sunny"] },
    { e: "⛅",  k: ["let skyet","partly cloudy","cloud","sol"] },
    { e: "☁️", k: ["sky","overskyet","cloud","cloudy"] },
    { e: "🌧️", k: ["regn","rain","byger","shower"] },
    { e: "⛈️", k: ["torden","lyn","thunder","storm"] },
    { e: "🌨️", k: ["sne","snow","snowy"] },
    { e: "🌪️", k: ["tornado","storm","orkan","twister"] },
    { e: "🌫️", k: ["tåge","fog","dis","mist"] },
    { e: "🌈", k: ["regnbue","rainbow","farver","colors"] },
    { e: "🌙", k: ["måne","moon","nat","night"] },
    { e: "🌕", k: ["fuldmåne","full moon","måne"] },
    { e: "🌑", k: ["nymåne","new moon","måne"] },
    { e: "🌡️", k: ["temperatur","varmt","koldt","thermometer"] },
    { e: "💨", k: ["blæst","vind","wind","gust"] },
    { e: "💧", k: ["dråbe","vand","water","drop"] },
];

// Hjælpere
const dedupe = (arr: EmojiItem[]): EmojiItem[] => {
    const seen = new Set<string>();
    const out: EmojiItem[] = [];
    for (const it of arr) {
        if (seen.has(it.e)) continue;
        seen.add(it.e);
        out.push(it);
    }
    return out;
};

// Pool til søgning
export const SEARCH_POOL: EmojiItem[] = dedupe([
    ...TOP_DEFAULT_EMOJIS,
    ...TRADING_EMOJIS,
    ...GENERAL_EMOJIS,
]);
