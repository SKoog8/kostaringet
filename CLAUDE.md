# kostaringet.se

Svensk sajt (Astro, statisk) som listar gratisprover, startpaket och provperioder, plus ett dagligt blogginlägg. Publiceras på Vercel från grenen `main`. Pusha alltid direkt till `main`; andra grenar blir bara förhandsversioner.

- Erbjudanden: `src/content/erbjudanden/*.md`, schema i `src/content.config.ts`.
- Blogginlägg och guider: `src/content/blogg/*.md` (`kind: dagens` eller `kind: guide`).
- Kategorier, meny och annonsinställningar: `src/site.config.ts`.
- Bygg och kontrollera med `npm run build`.

Den dagliga rutinen för att hitta erbjudanden och skriva dagens inlägg beskrivs i `docs/daglig-rutin.md`. Följ den när du ombeds skriva dagens inlägg.

Allt innehåll skrivs på svenska. Publicera aldrig ett erbjudande som inte är kontrollerat på företagets egen sida.
