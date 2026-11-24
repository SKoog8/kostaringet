# Gratisbevakaren – veckomejl med nya gratissaker

## Hur det fungerar

1. Besökaren skriver sin e-post i en Gratisbevakaren-ruta (startsidan, erbjudandesidor, guider, listsidor och `/gratisbevakaren/`).
2. `api/subscribe.js` skickar ett mejl med en bekräftelselänk via Resend. Ingen adress sparas än.
3. Länken leder till `/gratisbevakaren/bekrafta/`. Knappen där skickar till `api/confirm.js`, som lägger in adressen i listan (Resend Audience). Knappen behövs för att e-postprogram som förhandsgranskar länkar inte ska anmäla någon av misstag.
4. Varje torsdag kl. 08.07 (svensk vintertid) kör Vercel Cron `api/weekly.js`. Den läser `/veckobrev.json` (byggs vid varje publicering), skapar ett **utkast** i Resend (Broadcasts) och mejlar Martin att det är klart att granska. Martin klickar Send i Resend. Sätt `WEEKLY_AUTOSEND=true` i Vercel när utkasten brukar se bra ut, så skickas de direkt.
5. Avanmälan sköts av Resend via länken längst ner i varje veckobrev.

## Det här behöver göras en gång (Martin)

1. **Verifiera domänen kostaringet.se i Resend** (Domains → Add domain, lägg in DNS-posterna hos domänleverantören). Utan verifierad domän kan Resend bara skicka till kontoägaren.
2. **Skapa en Audience** i Resend som heter Gratisbevakaren. Kopiera dess ID.
3. **Lägg in i Vercel** (Settings → Environment Variables), sedan Redeploy:
   - `RESEND_AUDIENCE_ID` = ID:t från steg 2
   - `NEWSLETTER_FROM` = t.ex. `Gratisbevakaren <bevakaren@kostaringet.se>` (en adress på den verifierade domänen)
   - `CRON_SECRET` = en lång slumpmässig sträng (skyddar veckobrevsfunktionen)
   - valfritt: `NEWSLETTER_SECRET` = en egen nyckel för bekräftelselänkarna (annars används RESEND_API_KEY)
4. **Säg till Claude** att slå på `newsletter.enabled` i `src/site.config.ts`. Då visas anmälningsrutorna och `/gratisbevakaren/` kommer med i sitemapen.

## Regler

- Bara dubbel opt-in. Köp eller importera aldrig adresser.
- Bara sådant som är kontrollerat på företagets egen sida, som på sajten.
- Sälj eller dela aldrig listan. Annonser och samarbeten märks tydligt ("Annons" / "I samarbete med").
- Ett mejl i veckan. Extra utskick bara för stora, tidsbegränsade erbjudanden, högst ett extra i veckan.
