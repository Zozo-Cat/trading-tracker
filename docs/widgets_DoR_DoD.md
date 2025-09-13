
# Widgets: Definition of Ready (DoR) & Definition of Done (DoD)

Dette dokument beskriver DoR/DoD for de widgets vi har bygget i Trading Tracker User Dashboard v2.

Status-model:  
- **Dev Done** → Widget kører korrekt på dummy-data i frontend.  
- **UX Done** → Layout testet i grid (3–4 cols), intet overlap, læseligt.  
- **Done Done** → Backend-data koblet på og valideret mod trading-konto.  

---

## 1. Success Rate

**DoR**
- Input: Trades med udfald (W/L), afledt af `rMultiple` eller `plCurrency`.
- Besluttet farvelogik for donut (grøn/guld/rød).
- Edge-case: 0 trades → empty state.

**DoD**
- Donut viser korrekt fordeling wins/losses.
- KPI viser win% (xx%).
- Tooltip viser antal trades.
- Farvelogik virker: grøn >55%, guld 45–55%, rød <45%.
- Empty state vises korrekt.

---

## 2. Profit / Loss

**DoR**
- Input: Sum af P/L i display currency (fallback USD).
- Baseline: historisk gennemsnit (30D eller valgt periode).

**DoD**
- KPI viser P/L med korrekt valutaformat.
- Badge viser ▲/▼ mod baseline.
- Empty state hvis ingen trades.

---

## 3. Trades Count

**DoR**
- Input: Count af trades i valgt periode.
- Baseline: historisk gennemsnit.

**DoD**
- KPI viser antal trades.
- Badge viser sammenligning mod baseline.
- Empty state hvis ingen trades.

---

## 4. Risk/Reward (R/R)

**DoR**
- Input: Liste af R-multipler pr. trade.
- Default mål: 1.0R.

**DoD**
- KPI viser gennemsnitlig R.
- Termometer viser progress mod mål.
- Badges: Median R og ≥1R andel.
- Empty state hvis <5 trades.

---

## 5. Expectancy (EV)

**DoR**
- Input: Trades med `rMultiple` og `riskCurrency`.
- Beregning: EV(R) = pWin*avgWin − pLoss*avgLoss.
- EV(currency) = EV(R) × median(riskCurrency).

**DoD**
- KPI viser EV i display currency (fallback USD).
- Sparkline viser EV trend (12 perioder).
- Tooltip viser dato + EV i valuta.
- Empty state hvis ingen trades.

---

## 6. Drawdown (Equity Drawdown)

**DoR**
- Input: Equity-serie (timestamp + equity i display currency).
- Definition: Peak-to-trough fald.

**DoD**
- KPI badges: Max Drawdown og Current Drawdown.
- Farvekoder: Grøn >−10%, Guld −10% til −20%, Rød ≤−20%.
- Graf viser equity-kurve med tooltips (Equity + DD%).
- Empty state hvis ingen equity-punkter.

---

## 7. Streaks

**DoR**
- Input: Trades med udfald (W/L).
- Sorteret efter `closedAt` ASC.

**DoD**
- KPI badges: Current Win/Lose Streak, Best Win/Lose Streak.
- Layout fungerer i 3–4 cols (grid 2×2 badges).
- Empty state ved <2 trades.

---

## 8. Account Growth %

**DoR**
- Input: Equity-serie (timestamp + equity i display currency).
- Baseline: første værdi i valgt periode.

**DoD**
- KPI viser %Δ mellem første og sidste værdi.
- Graf viser relativ equity (0% baseline).
- Tooltip viser dato + %Δ.
- Empty state ved ugyldig baseline eller <2 punkter.

---

## 9. Session Performance

**DoR**
- Input: Trades med `closedAt` (UTC) + `plCurrency`.
- Session windows: Asia 00–08, London 08–16, New York 16–24 (lokal tid).

**DoD**
- Bars pr. session viser P/L i valuta.
- Tooltip viser P/L, antal trades og win%.
- Label (Asia/London/NY) vises inde i søjlen (hvid tekst).
- Hele kolonnen er hover-zone (stabil tooltip).
- Empty state hvis ingen trades.

---

## 10. Sharpe / Sortino

***DoR***
- Input: Serie af afkast pr. trade/interval (retPct).
- Valg af risikofri rente afklaret (starter med 0%).
- Beslutte tidsenhed (daglige pct-afkast).

***DoD***
- KPI: Sharpe og Sortino beregnes korrekt.
- Tooltip forklarer formler (Sharpe = mean/stdDev, Sortino = mean/downsideDev).
- Mini-text under KPI viser std. vol og downside-vol.
- Edge cases: få datapunkter (<2), stdDev=0, kun positive returns → vis “—”.

## 11. Setup-distribution

***DoR***
- Liste over gyldige setup-tags defineret (fx “Breakout”, “Reversal”…).
- Afklaret om vi viser antal trades eller P/L pr. setup (starter med count).
- Definition af bucket “Øvrige” (fx alt uden for top 5).

***DoD***
- Horisontal bar chart viser fordeling pr. setup.
- Top 5 setups + “Øvrige”-bucket vises korrekt.
- Tooltip/label viser navn + antal.
- Empty state når ingen trades i perioden.

## 12. News vs. no-news

***DoR***

- Event-feed tilgængeligt (tid i ISO/ms og impact-niveau).
- Fastlagt impact-tærskel (default ≥2) og event-vindue (default ±60 min).
- Reference-tidspunkt for trade defineret (default openedAt).
- Afklaret periode-toggle (Dag/Uge/Måned) og metric-toggle (P/L vs. Win%).
- Politik for overlappende events besluttet (en trade tælles kun én gang som “News”).

***DoD***
- Side-om-side visning af “News” og “No-news”.
- Trades klassificeres korrekt ift. event-vindue og impact-tærskel.
- Toggle skifter mellem P/L (sum) og Win% (wins/total*100); n vises i label/tooltip.
- Periode-toggle afgrænser data til Dag/Uge/Måned.
- Empty state når ingen trades i valgt periode.
- Footer viser parametre (±X min, impact≥Y) samt link til relevant underside.
- Testcases dækker: ingen events, events under tærskel, overlappende events, grænse (±X min), 0 trades. 

## 13. Volatility

***DoR***
- Kilde til returns defineret (fx pr. lukket handel eller daglige pct.-afkast) og reference-tidspunkt fastlagt.
- Beregningsmetode: standardafvigelse af returns i % (sample std. dev.).
- Periodevalg afklaret (I dag / Uge / Måned) og hvordan returns samles pr. periode.
- Niveautærskler fastlagt: Lav ≤ 2%, Moderat ≤ 5%, Høj > 5%.
- Farveskala besluttet: grøn → gul → rød (kontinuert), samt MAX_EXPECTED_VOL = 10% til meter-skalering (clamp).
- UI bekræftet: KPI + badge + volatility-meter + sparkline, HelpTip-tekst, samt loader / empty / error states.

***DoD***
- KPI viser korrekt std. dev. (%) for valgt periode.
- Badge viser Lav/Moderat/Høj og farve matcher niveau (grøn/gul/rød).
- Volatility-meter:
- Længde ∝ vol% / MAX_EXPECTED_VOL (clampet 2–100%).
- Farve følger samme grøn→gul→rød-skala.
- Testforklaring “Højere farve og længere bar = større udsving” vises.
- HelpTip forklarer enkelt: “Volatility = hvor meget dine resultater svinger (std.dev. af afkast). Grøn = stabilt, rød = store udsving.”
- Empty state ved < 2 returns; loader under fetch; error ved fejl – alle uden konsolfejl/SSR-issues.
- Testcases dækker: 0/1 return, lav (=1%), moderat (~3%), høj (≥8–12% → clamp mod 10%), samt periode-skift.

##14. Trade Duration

***DoR***
- Datakilde har entry- og exit-timestamps (ISO/ms) for lukkede trades.
- Periodefilter afklaret (I dag / Uge / Måned) og hvilken timestamp der bruges (entry/exit – exit anvendes til varighed).
- Beregningsmetode fastlagt: duration = exit − entry (i timer med decimaler).
- Standard buckets defineret: <1t, 1–4t, 4–24t, >1d.
- Custom buckets-kontrakt besluttet: array af { key, label, minHrs?, maxHrs? } (min inkl., max ekskl.).
- Regler for grænser dokumenteret (fx 1.00t hører til 1–4t).
- Åbne trades ekskluderes; strategi for tom/fejlende data fastlagt (loader/empty/error).
- UI bekræftet: KPI (gennemsnit) + histogram (horisontale barer) + min/max i label/tooltip.

***DoD***
- KPI viser korrekt gennemsnitlig varighed i timer (1 decimal).
- Histogram viser korrekt fordeling pr. bucket (proportionel bredde + antal ved siden af).
- Min og Max duration vises (label/tooltip) og stemmer med datasættet.
- Periode-toggle filtrerer input korrekt til valgt interval.
- Custom buckets virker: korrekte grænseinklusioner/eksklusioner; ingen overlap i beregning.
- Empty state når ingen lukkede trades i perioden; loader under fetch; error ved fejl – uden konsolfejl.
- Testcases dækker:
- Kun åbne trades → empty.
- Grænseværdier (præcis 1.00t, 4.00t, 24.00t) lander i korrekt bucket.
- Custom preset (fx scalper: <15m, 15–60m, 1–2t, 2–4t, >4t).
- Blandet datasæt med alle buckets.
- Widget passer visuelt til dashboardet (spacing/typografi), ingen eksterne deps, SSR-sikker.

##15. Performance vs. Expectancy

***DoR***
- Enhed for expectancy er afklaret (kr eller R), og samme enhed bruges for realiseret P/L.
- Beregning fastlagt:
- Win% = wins / (wins + losses [+ BE?]) – beslutning om BE tælles som 0-resultat eller ekskluderes.
- AvgWin = gennemsnit af P/L for vundne trades (absolut kr/R).
- AvgLoss = gennemsnit af |P/L| for tabende trades.
- Expectancy = Win% × AvgWin − Loss% × AvgLoss.
- Periodefilter afklaret (I dag / Uge / Måned) og hvilke trades indgår (kun lukkede).
- Visuel form bekræftet: to side-by-side barer (Expectancy vs. Realiseret) + tekstlig diff (over/under/lig).
- Regler for afrunding/format (to decimaler) og håndtering af tomt datasæt/fejl.

***DoD***
- Widget viser korrekt Expectancy og Realiseret P/L for valgt periode i valgt enhed.
- Forskellen beregnes og tydeliggøres: “outperformer/underperformer med X” med grøn/rød tekst.
- Edge cases håndteres uden fejl:
- 0 trades i perioden → empty state.
- Kun wins / kun losses → Win%/Loss% og AvgWin/AvgLoss beregnes korrekt.
- Kun break-even (hvis medregnes) → expectancy korrekt (typisk 0) og bars/labels vises konsistent.
- Periode-toggle filtrerer data korrekt.
- Ingen konsolfejl/SSR-issues; stil matcher øvrige widgets.##

## Risk per Trade

***DoR***
- Datamodel dækker: entry, initialStop, stop (seneste), size, balance.
- Enig om standard‐mode: initial (entry→første SL). Alternativ: current (entry→seneste SL/BE).
- Formel fastlagt: risk% = |entry − refStop| × size / balance × 100.
- Guideline fastlagt: 1–2% (kan overrides via prop).
- Buckets besluttet: <1%, 1–2%, 2–5%, >5%.
- Periodefilter (Dag/Uge/Måned) og hvilke trades medregnes er afklaret.

***DoD***
- KPI viser korrekt gennemsnitlig risk% efter valgt riskMode.
- Badge indikerer korrekt indenfor/udenfor guideline.
- Histogram viser korrekt fordeling pr. bucket (proportionel bredde + antal).
- Missing‐stop trades tælles og vises som særskilt note; de indgår ikke i beregning.
- Edgecases testet: BE (current≈0%), manglende initialStop → fallback til stop i “initial”, ingen gyldige SL → empty state.
- Ingen konsolfejl/SSR‐issues; stil matcher øvrige widgets.

## 16. Konsistens

***DoR***
- Definition af aktiv dag: ≥ 1 trade.
- Tidsreference fastlagt: brug openedAt (ikke closedAt) til at tælle aktive dage.
- Tidszone og døgnskel defineret (brugers lokale TZ; dag = 00:00–23:59).
- Periodevalg bekræftet:
- Dag → 1 celle (i dag),
- Uge → seneste 7 dage,
- Måned → seneste n uger (default 5×7 = 35 dage), kan konfigureres.
- Visualprincip: mikro-heatmap med intensitet ved counts (0, 1, 2, 3+), tooltip viser dato + antal.
- Datakilde: kun faktiske trades (ikke aflyste/filled-partial ordrer), aggregation pr. dag.

***DoD***
- KPI beregnes korrekt: Handelsdage / Total dage × 100% (afrundet til heltal).
- Periode-toggle ændrer korrekt vindue (1 / 7 / 35 dage som default).
- Heatmap render:
- Dag = 1 celle, Uge = 7 celler, Måned = 5×7 celler (kompakt layout).
- Celler farvekodes efter intensitet (0 transparent, 1..3+ stigende grøn). 
- Tooltip på hver celle viser YYYY-MM-DD · N trades.
- Dage uden trades vises som tom/transparent (0-intensitet).
- 0-trades i perioden → KPI 0%, alle celler i 0-intensitet; ingen fejl.
- Ingen konsolfejl/SSR-issues; komponent passer visuelt i 3–4 kolonne grid (kompakt højde)


# Shared Helpers

- `getPeriodWindow(now, period)` → {startMs, endMs}
- `formatCurrencySigned(value, currency)`
- `formatPct(value)`
- `mapToSession(date, userSettings)` → sessionKey
- `calcDrawdowns(equity[])` → {maxPct, currentPct, perPointPct[]}
- `calcExpectancyR(rValues[])` → {pWin, avgWinR, avgLossR, expectancyR}
