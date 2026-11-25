# Gratisbevakaren – nyhetsbrev via MailerLite

## Hur det fungerar

1. Besökaren skriver sin e-post i en Gratisbevakaren-ruta (startsidan, erbjudandesidor, guider, listsidor och `/gratisbevakaren/`).
2. `api/subscribe.js` lägger in adressen i gruppen Gratisbevakaren hos MailerLite. API-nyckeln finns bara i Vercel.
3. MailerLite skickar ett bekräftelsemejl (dubbel opt-in). Först när adressen är bekräftad får den utskick. Efter bekräftelsen skickas besökaren till `/gratisbevakaren/tack/`.
4. Utskicken görs av en **RSS-kampanj i MailerLite** som läser `https://kostaringet.se/gratisbevakaren.xml` (alla aktiva erbjudanden, nyast först). MailerLite skickar automatiskt, t.ex. varje torsdag, och tar bara med erbjudanden som tillkommit sedan förra utskicket. Finns inget nytt skickas inget.
5. Avanmälan sköts av MailerLite via länken längst ner i varje utskick.

## Det här behöver göras en gång (Martin)

1. **Skapa ett konto på mailerlite.com** (Free-planen: upp till 250 prenumeranter och 2 500 mejl i månaden). Klart.
2. **Verifiera avsändardomänen** kostaringet.se (Sites/Domains → Authenticate domain, lägg in DNS-posterna). Avsändare t.ex. `bevakaren@kostaringet.se`.
3. **Slå på dubbel opt-in för API:** Account settings → Subscribe settings → "Double opt-in for API and integrations". Sätt sidan efter bekräftelsen till `https://kostaringet.se/gratisbevakaren/tack/`. Skriv bekräftelsemejlet på svenska.
4. **Skapa gruppen** Gratisbevakaren (Subscribers → Groups). Klart 2026-11-25, gruppens ID är `205088895630574649`.
5. **Skapa en API-nyckel** (Integrations → API). Klart.
6. **Lägg in i Vercel** (Settings → Environment Variables) och publicera om:
   - `MAILERLITE_API_KEY`
   - `MAILERLITE_GROUP_ID`
7. **Skapa RSS-kampanjen:** Campaigns → Create → RSS campaign. Flöde: `https://kostaringet.se/gratisbevakaren.xml`. Mottagare: gruppen Gratisbevakaren. Schema: varje vecka, torsdag 08:00. Mall: rubrik, en kort inledning, en lista med erbjudandena (titel som länk + beskrivning) och en knapp till `https://kostaringet.se/gratis/`.
8. **Säg till Claude** att slå på `newsletter.enabled` i `src/site.config.ts`. Då visas anmälningsrutorna och `/gratisbevakaren/` kommer med i sitemapen. Claude gör en testanmälan.

## Regler

- Bara dubbel opt-in. Köp eller importera aldrig adresser.
- Bara sådant som är kontrollerat på företagets egen sida, som på sajten (flödet innehåller bara aktiva erbjudanden från sajten).
- Sälj eller dela aldrig listan. Annonser och samarbeten märks tydligt ("Annons" / "I samarbete med").
- Ett mejl i veckan. Extra utskick (vanlig kampanj i MailerLite) bara för stora, tidsbegränsade erbjudanden, högst ett extra i veckan.
