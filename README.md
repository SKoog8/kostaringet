# kostaringet.se

Gratisprover, babypaket och prova på-erbjudanden i Sverige, samlade på ett ställe. Statisk sajt byggd med [Astro](https://astro.build), med en bot som letar efter nya erbjudanden varje dag.

## Kom igång

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # bygger till dist/
```

## Struktur

| Sökväg | Innehåll |
| --- | --- |
| `src/site.config.ts` | Namn, kategorier, meny och annonsinställningar |
| `src/content/erbjudanden/*.md` | Ett erbjudande per fil |
| `src/content/blogg/*.md` | Guider (SEO-artiklar) |
| `src/pages/` | Sidor: start, `/gratis/`, `/nyblivna-foraldrar/`, `/kategori/…`, `/blogg/` |
| `bot/` | Boten som hittar nya erbjudanden |
| `.github/workflows/` | Bot, veckokontroll och nattlig ombyggnad |

### Ett erbjudande

```markdown
---
title: Gratis hudvårdsprov från Märket
description: 120–160 tecken som visas i Google.
brand: Märket
category: skonhet        # foraldrar, skonhet, mat-dryck, halsa, hem, djur, tjanster, ovrigt
type: gratisprov         # gratisprov, startpaket, provperiod, medlemsgava, gratis
url: https://market.se/prov
requirements:
  - Kräver medlemskap
shipping: 0              # kronor, eller "tillkommer"
published: 2026-10-09
expires: 2026-12-31      # valfritt – visas som avslutat efter datumet
status: aktiv            # eller avslutad
draft: false
---

Brödtext med "## Så beställer du" och "## Bra att veta".
```

Avslutade erbjudanden ligger kvar (som "Avslutat") i stället för att raderas. Sidorna har redan rankning i Google och visar besökaren vad som brukar komma tillbaka.

## Boten

`bot/run.mjs` körs varje morgon via GitHub Actions:

1. **Samlar** tips från Google News-sökningar, RSS-flöden och bevakade sidor (`bot/sources.yml`).
2. **Filtrerar** bort tävlingar, rabatter, "gratis frakt" och sådant som redan finns.
3. **Verifierar** med Claude (om `ANTHROPIC_API_KEY` är satt): Claude letar upp erbjudandet hos företaget, läser villkoren och skriver en egen svensk text. Claude gör också egna webbsökningar efter nya erbjudanden.
4. **Skriver utkast** (`draft: true`) och öppnar en pull request. Du granskar, tar bort `draft: true` och mergar. Då publiceras erbjudandet.

Utan API-nyckel fungerar boten ändå, men utkasten får bara rubrik och utdrag och behöver skrivas om för hand.

`bot/expire.mjs` körs varje måndag. Den markerar erbjudanden som avslutade när slutdatumet passerat eller när sidan svarar 404 två veckor i rad.

```bash
npm run bot:dry      # visa vad boten skulle göra, utan att ändra något
npm run bot          # kör på riktigt lokalt
npm run bot:expire
```

Modellen kan bytas med repo-variabeln `BOT_MODEL` (standard `claude-opus-5-5`).

## Publicering (Vercel + Loopia)

Vercel bygger och publicerar sajten automatiskt vid varje push. Inställningarna finns i `vercel.json`.

1. **Vercel → Add New → Project →** importera `SKoog8/kostaringet`. Vercel känner igen Astro, så standardinställningarna fungerar.
2. **Settings → Domains:** lägg till `kostaringet.se` och `www.kostaringet.se`. Välj att `www` ska omdirigeras till `kostaringet.se`.
3. **Loopia Kundzon → Domäner → kostaringet.se → DNS-editor:**
   - Ta bort Loopias standardposter för `@`, `www` och `*` (A och AAAA som pekar på Loopias parkeringssida).
   - Lägg till den `A`-post för `@` och den `CNAME`-post för `www` som Vercel visar under Domains.
   - Ändringen syns oftast inom en timme. Vercel ordnar HTTPS automatiskt.
4. **Valfritt:** skapa en Deploy Hook i Vercel (Settings → Git → Deploy Hooks) och spara URL:en som GitHub-hemligheten `VERCEL_DEPLOY_HOOK`. Då bygger `rebuild.yml` om sajten varje natt, så att utgångna erbjudanden markeras som avslutade.

## SEO

- Statisk HTML, snabba sidor, inga cookies.
- Egna titlar och metabeskrivningar per sida, canonical-länkar, Open Graph-bild.
- Strukturerad data: `Organization`, `WebSite`, `BreadcrumbList`, `ItemList` på listor, `Product`/`Offer` (pris 0 kr) på erbjudanden, `FAQPage` på föräldrasidan och `Article` på guider.
- `sitemap-index.xml`, `robots.txt` och RSS-flöde (`/rss.xml`).
- Lägg till sajten i [Google Search Console](https://search.google.com/search-console) och skicka in `https://kostaringet.se/sitemap-index.xml`.
- Skriv fler guider i `src/content/blogg/`. Långa, uppdaterade guider ("Gratis saker till bebis 2026", "Alla gratis provperioder") är det som drar mest trafik.

## Annonslänkar (affiliate)

Gå med i ett affiliatenätverk, till exempel Adtraction, Awin eller Adrecord, och ansök om de program som passar erbjudandena. Exempel på sådana program är ljudbokstjänster, babyklubbar och linsbutiker.

När du har en spårningslänk lägger du den i erbjudandets fil:

```yaml
url: https://www.bookbeat.com/se          # företagets vanliga sida, ändra inte
affiliate: https://…spårningslänk…        # din affiliatelänk
```

Då händer följande automatiskt:

- Knappen "Till erbjudandet" går via affiliatelänken och får `rel="sponsored"`, som Google kräver.
- Erbjudandesidan märks med "Annonslänk" och en kort förklaring.
- Blogginlägg som tar upp erbjudandet märks med "Innehåller annonslänkar".

Den dagliga rutinen rör aldrig fältet `affiliate`.

## Annonser

Annonsplatser finns redan i listor, på erbjudandesidor och i guider, men är avstängda. Så slår du på dem:

1. Ansök om Google AdSense när sajten har innehåll och trafik.
2. Sätt `ads.enabled = true`, `ads.client` och slot-id:n i `src/site.config.ts`.
3. Lägg `public/ads.txt` med raden som AdSense ger dig.
4. **Krav i EU:** du behöver en samtyckesbanner (en Google-certifierad CMP, t.ex. AdSense egen "Privacy & messaging") innan annonser med cookies visas. Uppdatera även `/integritetspolicy/`.
