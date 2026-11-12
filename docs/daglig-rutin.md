# Daglig rutin: dagens gratisfynd

Den här rutinen körs en gång om dagen av Claude. Målet är ett bra, sant inlägg per dag om saker som går att få gratis i Sverige. Kvalitet går före kvantitet: hellre ett kort inlägg med två kontrollerade erbjudanden än ett långt med gissningar.

## 1. Förbered

1. `git fetch origin main && git checkout main && git pull`
2. `npm ci`
3. Läs igenom vad som redan finns, så att du inte skriver om samma sak:
   - `src/content/erbjudanden/*.md` (titel, varumärke och `url`)
   - de tio senaste inläggen i `src/content/blogg/`

## 2. Leta

Sök på webben efter nya gratiserbjudanden i Sverige. Bra startpunkter:

- sökningar som "gratisprov", "gratis varuprov", "beställ gratis", "prova gratis", "gratis babybox", "gratis startpaket", "gratis provperiod", "gratis foderprov", "gratis doftprov"
- svenska gratissajter som samlar tips (gratisguiden.se, gratisprinsessan.se, bastgratis.se). Använd dem bara för att hitta tips, aldrig som källa.
- varumärkens egna kampanjsidor

Sikta på 3–5 nya erbjudanden. Sprid gärna över kategorierna, och prioritera föräldrar, skönhet, mat & dryck och husdjur.

## 3. Kontrollera varje erbjudande

Ett erbjudande får bara publiceras om du har läst det **på företagets egen sida** i dag (läs sidan färskt, inte en sparad version – med Firecrawl: `maxAge: 0`) och kan svara ja på:

- Kan en privatperson i Sverige få det utan att betala för själva produkten?
- Är det aktuellt just nu, och inte redan slut?

Skriv alltid ut frakt, krav på medlemskap, att provperioder blir betalda och slutdatum om det finns.

**Annonslänkar:** fältet `affiliate` läggs in för hand av sajtägaren. Sätt det aldrig själv, ändra det aldrig och ta aldrig bort det. Lägg aldrig in spårnings- eller affiliatelänkar i texten eller i `url`, som alltid ska vara företagets vanliga sida.

**Ta inte med:** tävlingar och utlottningar, rabatter och "köp 2 betala för 1", "köp och få pengarna tillbaka", gratis frakt, sådant som kräver ett köp, erbjudanden till företag, erbjudanden utanför Sverige, och sådant du bara har sett på en annan gratissajt eller i sociala medier.

Hittar du färre än två kontrollerade erbjudanden: skriv en guide i stället (se steg 5).

## 4. Skriv erbjudandena

En fil per erbjudande i `src/content/erbjudanden/<slug>.md`. Följ formatet i de befintliga filerna och schemat i `src/content.config.ts`:

```markdown
---
title: Gratis … från Varumärke          # max ca 70 tecken, börjar gärna med "Gratis"
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
---

En inledande mening om vad man får.

## Så beställer du

1. …

## Bra att veta

- …
```

**Tips:** innehåller en rubrik eller beskrivning ett kolon följt av mellanslag, sätt hela värdet inom citattecken. Annars går bygget sönder.

## 5. Skriv dagens inlägg

En fil: `src/content/blogg/ÅÅÅÅ-MM-DD-<kort-slug>.md`

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

Om det inte finns tillräckligt med nytt: skriv en guide med `kind: guide` om ett ämne som inte redan finns, till exempel gratis babyboxar året runt, gratis provperioder på streaming, gratis till skolbarn, gratis hudvårdsprover, säsongens gratisprover eller hur man säger upp provperioder. Länka till befintliga erbjudanden.

### Skrivregler

- Enkel, korrekt svenska med egna ord. Kopiera aldrig text från källan.
- Saklig ton, som en kunnig vän. Inga utropstecken, inga emojis, inga säljiga ord som "fantastisk", "missa inte" eller "passa på".
- Skriv aldrig något du inte har sett på företagets sida. Är du osäker på en detalj, utelämna den.
- Titlar ska vara konkreta och sökbara: vad, från vem, och att det är gratis.

## 6. Städa bland gamla erbjudanden

Kontrollera de fem aktiva erbjudanden som har äldst `checked`-datum:

- Finns erbjudandet kvar: sätt `checked` till dagens datum.
- Är det slut: sätt `status: avslutad` och `updated` till dagens datum. Radera aldrig filen.
- Var säker innan du avslutar. En startsida som leder till en gammal kampanj betyder inte att allt är slut. Kolla företagets kampanj- eller erbjudandesida och sök efter aktuella kampanjer först.

## 7. Bygg, committa och pusha

1. `npm run build` måste gå igenom utan fel. Rätta det som är fel innan du går vidare.
2. Committa med meddelandet `Dagens fynd ÅÅÅÅ-MM-DD` (eller `Guide ÅÅÅÅ-MM-DD`).
3. `git push origin main`. Vercel publicerar automatiskt (andra grenar blir bara förhandsversioner).
4. Skapa ingen pull request.

## 8. Rapportera

Avsluta med en kort sammanfattning: inläggets rubrik, vilka erbjudanden som lades till, vilka som markerades som avslutade och vilka tips du valde bort och varför.
