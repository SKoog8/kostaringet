# Daglig rutin: dagens gratisfynd

Den här rutinen körs av Claude **tre gånger om dagen**: morgon (cirka 06:52), lunch (cirka 12:52) och kväll (cirka 18:52), svensk tid. Målet är sanna, kontrollerade tips om saker som går att få gratis i Sverige. Kvalitet går före kvantitet: hellre ett kort inlägg med två kontrollerade erbjudanden än ett långt med gissningar.

## 0. Tre körningar om dagen – inga dubbletter

- **Ta reda på vilken körning det är** utifrån klockan i svensk tid: före 10 = morgon, 10–16 = lunch, efter 16 = kväll.
- **Kolla först vad som redan publicerats i dag:** erbjudanden med `published` = dagens datum, dagens inlägg i `src/content/blogg/` (filnamn som börjar med dagens datum) och `git log --since=midnight` på `main`.
- **Lägg bara till nytt.** Ett erbjudande som redan finns, även som avslutat, ska inte läggas till igen. Jämför varumärke och `url`, inte bara titeln. Är en gammal kampanj tillbaka: uppdatera den befintliga filen (`status: aktiv`, nya datum) i stället för att skapa en ny.
- **Finns inget nytt: ändra ingenting.** Ingen commit och ingen push. Rapportera bara vad du letade efter och varför inget gick att publicera.
- **Ett inlägg per dag.** Första körningen som hittar nya erbjudanden skapar dagens inlägg. Senare körningar samma dag lägger till sina erbjudanden i samma inlägg (ny `##`-rubrik, ny slug under `offers`, och rubrik och beskrivning justeras om det behövs). Skapa inte ett andra inlägg samma dag.
- **Guide bara på kvällen.** Har dagen inte fått något inlägg när kvällskörningen är klar, skriver kvällskörningen en guide (se steg 5). Morgon och lunch skriver inga guider.
- **Städning bara på morgonen.** Steg 6 görs bara i morgonkörningen.

## 1. Förbered

1. `git fetch origin main && git checkout main && git pull`
2. `npm ci`
3. Läs igenom vad som redan finns, så att du inte skriver om samma sak:
   - `src/content/erbjudanden/*.md` (titel, varumärke och `url`)
   - de tio senaste inläggen i `src/content/blogg/`

## 2. Leta

Sök brett efter nya gratiserbjudanden i Sverige. Gå igenom de här källorna:

- **Företagens egna kampanj- och provsidor**, till exempel sidor som heter "gratisprov", "varuprover", "prova gratis" eller "kampanj".
- **Kedjornas erbjudanden och appar:** Apotea, Apotek Hjärtat, Kronans Apotek, Lyko, KICKS, ICA, Coop, Willys, Pressbyrån, 7-Eleven, Circle K och snabbmatskedjor (McDonald's, Max, Burger King med flera). Leta efter sådant som är helt gratis, till exempel en gratis produkt i appen eller ett prov vid beställning utan köpkrav.
- **Provperioder:** streaming, ljudböcker, matkassar, appar och tidningar.
- **Födelsedagserbjudanden och medlemsklubbar:** gratis gåvor eller produkter som man får som medlem eller på sin födelsedag.
- **Kommuner, bibliotek och Fritidsbanken:** gratis reflexer, gratis böcker (till exempel Bokstart), lån av utrustning och liknande.
- **Startpaket och boxar för gravida och föräldrar.**
- **Metas annonsbibliotek** (facebook.com/ads/library, land Sverige) för kampanjer med gratisprover. Sök på ord som "gratisprov", "gratis prov", "beställ gratis" och "prova gratis".
- **Andra gratissajter** (gratisguiden.se, gratisprinsessan.se, bastgratis.se med flera), men **bara som tips**. Kontrollera allt på företagets egen sida och kopiera aldrig deras text.
- Sökningar som "gratisprov", "gratis varuprov", "beställ gratis", "prova gratis", "gratis babybox", "gratis startpaket", "gratis provperiod", "gratis foderprov" och "gratis doftprov".

**Prioritera kategorier med få aktiva erbjudanden.** Räkna aktiva erbjudanden per kategori innan du letar (till exempel med `grep -l "^category: <slug>"` och utan `status: avslutad`), och lägg mest tid på de kategorier som har minst. Sikta på 1–3 nya erbjudanden per körning.

Annonser i sociala medier och tips från andra sajter räknas aldrig som källa. Går erbjudandet bara att beställa direkt i en annons, utan någon sida hos företaget, tas det inte med.

## 3. Kontrollera varje erbjudande

Ett erbjudande får bara publiceras om du har läst det **på företagets egen sida** i dag (läs sidan färskt, inte en sparad version – med Firecrawl: `maxAge: 0`) och kan svara ja på:

- Kan en privatperson i Sverige få det utan att betala för själva produkten?
- Är det aktuellt just nu, och inte redan slut?

Skriv alltid ut frakt, krav på medlemskap, att provperioder blir betalda och slutdatum om det finns.

**Annonslänkar:** fältet `affiliate` läggs in för hand av sajtägaren. Sätt det aldrig själv, ändra det aldrig och ta aldrig bort det. Lägg aldrig in spårnings- eller affiliatelänkar i texten eller i `url`, som alltid ska vara företagets vanliga sida.

**Ta inte med:** tävlingar och utlottningar, rabatter och "köp 2 betala för 1", "köp och få pengarna tillbaka", gratis frakt, sådant som kräver ett köp, erbjudanden till företag, erbjudanden utanför Sverige, och sådant du bara har sett på en annan gratissajt eller i sociala medier.

Hittar du inget kontrollerat erbjudande: ändra ingenting i den här körningen (se steg 0). Bara kvällskörningen skriver en guide, och bara om dagen inte redan har ett inlägg.

## 4. Skriv erbjudandena

En fil per erbjudande i `src/content/erbjudanden/<slug>.md`. Följ formatet i de befintliga filerna och schemat i `src/content.config.ts`:

```markdown
---
title: Gratis … från Varumärke          # max ca 70 tecken, börjar gärna med "Gratis"
seoTitle: "Varumärke: gratis …"          # högst 55 tecken, varumärket först (folk söker "varumärke gratis prov")
description: 120–160 tecken som visas i Google.
brand: Varumärke
category: foraldrar | skonhet | mat-dryck | halsa | hem | djur | tjanster | ovrigt
type: gratisprov | startpaket | provperiod | medlemsgava | gratis
url: https://företagets-egen-sida.se/…
requirements:
  - Kort krav, t.ex. "En per hushåll"
shipping: 0                              # kronor, eller tillkommer
published: ÅÅÅÅ-MM-DD
checked: ÅÅÅÅ-MM-DD
expires: ÅÅÅÅ-MM-DD                      # bara om det finns ett slutdatum
themes:                                  # bara om det passar en temasida, se steg 5b
  - fodelsedag
---

En inledande mening om vad man får.

## Så beställer du

1. …

## Bra att veta

- …
```

**Tips:** innehåller en rubrik eller beskrivning ett kolon följt av mellanslag, sätt hela värdet inom citattecken. Annars går bygget sönder.

## 5. Skriv dagens inlägg

En fil per dag: `src/content/blogg/ÅÅÅÅ-MM-DD-<kort-slug>.md`. Finns dagens fil redan, lägg till de nya erbjudandena i den i stället för att skapa en ny (se steg 0).

```markdown
---
title: Rubrik som säger vad som är nytt i dag
description: 120–160 tecken.
published: ÅÅÅÅ-MM-DD
kind: dagens
category: <den kategori som dominerar, valfritt>
offers:
  - slug-pa-erbjudande-1
  - slug-pa-erbjudande-2
---
```

Innehåll, 250–500 ord:

- En kort inledning om vad som är nytt i dag.
- Ett stycke per erbjudande (`##`-rubrik per erbjudande) med vad man får, vad det kostar och vad man ska tänka på. Länka till erbjudandets sida på sajten, `/gratis/<slug>/`.
- Avsluta gärna med ett praktiskt tips som hör ihop med dagens fynd.

Har dagen inte fått något inlägg när kvällskörningen är klar: skriv eller uppdatera en guide (`kind: guide`).

**Guider är tidlösa och ska inte konkurrera med varandra.**

- Guider ligger på `/guide/<urlSlug>/`. Ge varje ny guide `urlSlug:` (kort, utan årtal och datum, t.ex. `gratis-hudvardsprover`). Filnamnet kan fortfarande börja med datum.
- **Kolla först om det redan finns en guide eller sida om ämnet** (`/guide/`, `/nyblivna-foraldrar/`, `/jul/`, `/gratis-pa-fodelsedagen/`, kategorisidorna). Finns det: uppdatera den befintliga texten och sätt `updated:` till dagens datum i stället för att skriva en ny. Två sidor om samma sak gör att ingen av dem rankar.
- Babyboxar och startpaket hör hemma på `/nyblivna-foraldrar/`. Skriv ingen separat guide om det.
- Huvudsidorna för de stora sökorden är `/gratisprover/` (gratisprover, varuprover, gratisprover hemskickade) och `/gratis/` (gratis saker på nätet, gratis på nätet). Skriv inga egna guider om de sökorden. Förbättra texten på huvudsidorna i stället, och länka till dem med orden "gratisprover" och "gratis saker" från dagens inlägg och guider när det passar.
- Ämnen som saknas: gratis hudvårdsprover, gratis parfymprover, gratis för studenter, gratis för pensionärer, gratis till skolbarn.
- Länka till befintliga erbjudanden och till närliggande guider och temasidor. Dagens inlägg ska också länka till en guide eller temasida när det passar.

### 5b. Temasidor (en gång i veckan, söndagens kvällskörning)

Temasidor samlar erbjudanden kring något folk söker på, till exempel `/gratis-pa-fodelsedagen/` (byggd från `src/pages/gratis-pa-fodelsedagen.astro`). Erbjudanden hamnar på en temasida via fältet `themes`.

- Söndagens kvällskörning kontrollerar en temasida: finns det nya erbjudanden att tagga, gamla som ska bort, eller fakta som ändrats?
- Saknas en temasida som säsongen kräver, bygg den efter samma mönster som födelsedagssidan (ny `themes`-nyckel i `src/content.config.ts`, egen sida, minst 600 ord, vanliga frågor). Adressen ska vara utan årtal, årtalet står i titeln.
- Säsongskalender: **jul** (finns, uppdatera i november), **halloween** (bygg i början av oktober), **sommarlov** (bygg i början av juni), **skolstart** (bygg i början av augusti). **Födelsedag** gäller året runt.
- Publicera aldrig ett erbjudande på en temasida som inte är kontrollerat på företagets egen sida. Rabatter och erbjudanden som kräver köp hör inte hemma där.

### Skrivregler

- Enkel, korrekt svenska med egna ord. Kopiera aldrig text från källan.
- Saklig ton, som en kunnig vän. Inga utropstecken, inga emojis, inga säljiga ord som "fantastisk", "missa inte" eller "passa på".
- Skriv aldrig något du inte har sett på företagets sida. Är du osäker på en detalj, utelämna den.
- Titlar ska vara konkreta och sökbara: vad, från vem, och att det är gratis.
- Google visar ungefär 60 tecken av en titel. Blir `title` längre än 55 tecken: lägg till `seoTitle` med en kortare variant (högst 55 tecken) i både erbjudanden och inlägg.
- Inlägg får automatiskt kategorins illustration. Passar en annan bättre i en guide, sätt `illustration:` till en av `kalender`, `vinter`, `bok` eller `jul` (alla finns i `src/illustrations/`). Använd aldrig företagens logotyper eller produktbilder.
- Erbjudanden får illustration automatiskt: provperioder ett timglas, startpaket en babybox (husdjur: valp), övriga kategorins bild. Passar ett annat motiv bättre, sätt `illustration:` till exempel `ljudbok`, `tidning`, `nalle`, `vaska`, `nappflaska`, `katt` eller `bok`.

## 6. Städa bland gamla erbjudanden (bara morgonkörningen)

1. **Kör `npm run check`.** Skriptet läser varje aktivt erbjudandes egen sida (utan Firecrawl) och flaggar sidor som inte finns längre, som skickas vidare till startsidan eller till en annan sajt, och sidor där det står att kampanjen är slut. Sidor som byggs med JavaScript eller blockerar skript flaggas också, eftersom de måste läsas med Firecrawl.
2. **Kontrollera först alla flaggade erbjudanden** med Firecrawl (`maxAge: 0`).
3. **Kontrollera sedan de tio aktiva erbjudanden som har äldst `checked`-datum.** Då blir varje erbjudande kontrollerat ungefär var fjärde dag.

**Så kontrollerar du ett erbjudande (gäller också nya):**

- Företagets egen webbplats eller kampanjsida räknas som kontroll. Det gör också företagets egna officiella konton i sociala medier, alltså inlägg som företaget själv har publicerat (till exempel Pressbyråns julmust, november 2026). Annonser, tipssajter och andras inlägg räknas aldrig.

- Det räcker inte att sidan finns eller att sidans beskrivning säger "gratis prov". Själva beställningen måste finnas kvar: ett formulär, en knapp, en kupong eller en tydlig instruktion om hur man får erbjudandet. Läs sidans text, inte bara rubriken eller beskrivningen.
- Finns beställningen kvar: sätt `checked` till dagens datum. Har villkor eller innehåll ändrats: uppdatera texten och sätt `updated`.
- Har sidan flyttat men erbjudandet finns kvar: byt `url` till den nya adressen.
- Är beställningen borta, eller står det att erbjudandet är slut: sätt `status: avslutad` och `updated` till dagens datum. Ta bort erbjudandet ur guider och temasidor som länkar till det, och skriv en kort notis i guiden om att det är slut. Radera aldrig filen.
- Går det inte att avgöra (sidan laddar inte, eller beställningen syns bara efter inloggning): skriv det i sammanfattningen och kontrollera igen nästa morgon. Två morgnar i rad utan bekräftelse: markera som avslutat.
- Ber ett företag oss att ta bort ett erbjudande: sätt `status: avslutad` och `draft: true`, ta bort det ur guiderna och lägg in en omdirigering i `vercel.json` från erbjudandets adress till närmaste guide eller kategori (se TENA, november 2026).
- Var säker innan du avslutar. En startsida som leder till en gammal kampanj betyder inte att allt är slut. Kolla företagets kampanj- eller erbjudandesida och sök efter aktuella kampanjer först.
- Rapporter från besökare kommer via kontaktformuläret ("Fungerar inte erbjudandet? Säg till" på erbjudandesidorna). Martin vidarebefordrar dem. De kontrolleras först nästa körning.

## 7. Bygg, committa och pusha

1. Kör `npm run og`. Den skapar en delningsbild (`public/og/<slug>.png`) för varje nytt erbjudande och inlägg. Befintliga bilder lämnas orörda. Committa de nya bilderna.
2. `npm run build` måste gå igenom utan fel. Rätta det som är fel innan du går vidare.
3. Committa med meddelandet `Dagens fynd ÅÅÅÅ-MM-DD (morgon|lunch|kväll)` (eller `Guide ÅÅÅÅ-MM-DD (kväll)`). Finns inget nytt: committa inte.
4. `git push origin main`. Vercel publicerar automatiskt (andra grenar blir bara förhandsversioner).
5. Vänta tills sidan är ute (någon minut), kör sedan `npm run indexnow`. Det talar om för Bing att dagens nya och ändrade sidor finns. Misslyckas det, nämn det i sammanfattningen men gör inget mer.
6. Skapa ingen pull request.

## 8. Rapportera

Avsluta med en kort sammanfattning på svenska som börjar med vilken körning det var (morgon, lunch eller kväll). Ta med inläggets rubrik, vilka erbjudanden som lades till, vilka som markerades som avslutade och vilka tips du valde bort och varför. Ändrades ingenting, säg det och förklara kort varför.
