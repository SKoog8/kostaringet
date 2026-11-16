# Länkar till kostaringet.se – plan och mallar

Google rankar sidor högre när andra sajter länkar till dem. Kostaringet.se är ny och har nästan inga länkar ännu, så det här är det som ger mest effekt på sikt. Det här är saker Martin gör själv. Köp aldrig länkar och byt inte länkar i stor skala: det kan ge straff i Google.

## 1. Egna kanaler (gör först)

- Skapa Facebook-sida och Instagram-konto för kostaringet.se. Lägg in adresserna i `socialLinks` i `src/site.config.ts`, så kopplas de ihop med sajten i Googles data.
- Dela de tidlösa sidorna, inte bara dagens fynd: `/nyblivna-foraldrar/`, `/gratis-pa-fodelsedagen/`, `/guide/sag-upp-provperiod/`, `/guide/gratis-ljudbocker/`.
- Delningsbilderna skapas automatiskt, så länkarna ser bra ut när de delas.

## 2. Där folk frågar om gratis saker

- Föräldragrupper på Facebook, Familjeliv och Reddit (r/sweden, r/PrivatEkonomi). Svara på frågor om babyboxar, provperioder och födelsedagsgåvor, och länka bara när sidan faktiskt svarar på frågan. Var öppen med att det är din sajt.
- Det ger sällan länkar som räknas direkt i Google, men det ger besökare som delar vidare.

## 3. Företag och organisationer vi skriver om

Många vill gärna visa att de nämns. Mejla när en sida om dem är publicerad.

Mall:

> Hej!
>
> Jag driver kostaringet.se, en sajt som samlar gratisprover och startpaket i Sverige. Vi har skrivit om [erbjudandet] här: [länk]. Allt på sajten kontrolleras på företagens egna sidor, och vi uppdaterar sidan om något ändras.
>
> Om ni har en sida där ni samlar press eller tips om erbjudandet får ni gärna länka till oss. Säg också till om något i texten är fel, så rättar vi direkt.
>
> Vänliga hälsningar
> Martin, kostaringet.se

Bra att börja med: BabyBox, BabyBag, ValpBag, One Million Babies, Goboken, Bokstart (Göteborg och Region Örebro län), Fritidsbanken, Länstrafiken Örebro.

## 4. Kommuner, bibliotek och föreningar

- Bibliotek och familjecentraler har ofta länksidor för nyblivna föräldrar. Mejla och tipsa om `/nyblivna-foraldrar/` och guiden om gratis böcker till barn.
- Fritidsbanken-orter och kommuner med reflexkampanjer: tipsa om `/guide/gratis-reflexer/` och `/guide/gratis-infor-vintern/`.

## 5. Kataloger och listor

- Lägg in sajten i svenska länkkataloger för sparande, ekonomi och föräldraskap som har riktiga besökare. Undvik kataloger som bara finns för länkar.
- Lägg till sajten i Bing Webmaster Tools och Google Search Console (se nedan).

## 6. Search Console och Bing

- Google Search Console: skicka in `https://kostaringet.se/sitemap-index.xml`. Exportera rapporten "Resultat" (sökfrågor och sidor) varannan vecka och ge den till Claude, så byggs sidorna ut efter vad folk faktiskt söker.
- Bing Webmaster Tools: lägg till sajten (det går att importera från Search Console). Sajten skickar redan nya sidor till Bing via IndexNow (`npm run indexnow`).
