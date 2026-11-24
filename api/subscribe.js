// Gratisbevakaren steg 1: tar emot en e-postadress och skickar ett mejl med en bekräftelselänk (dubbel opt-in).
// Ingen adress sparas förrän personen klickar på länken (se api/confirm.js).
import { EMAIL, SITE, env, sender, makeToken, resend } from './_mail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Använd formuläret på sajten.' });
  }
  const body = typeof req.body === 'object' && req.body ? req.body : {};
  // Dolt fält som bara botar fyller i.
  if (body.website) return res.status(200).json({ ok: true });

  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Ange en giltig e-postadress.' });

  const from = sender();
  if (!env('RESEND_API_KEY') || !env('RESEND_AUDIENCE_ID') || !from) {
    return res.status(503).json({ error: 'Gratisbevakaren startar snart. Försök igen om några dagar.' });
  }

  // Länken går till en sida med en knapp, så att e-postprogram som förhandsgranskar länkar inte anmäler någon av misstag.
  const link = `${SITE}/gratisbevakaren/bekrafta/?t=${encodeURIComponent(makeToken(email))}`;
  const r = await resend('/emails', {
    from,
    to: [email],
    subject: 'Bekräfta Gratisbevakaren från kostaringet.se',
    text: `Hej!\n\nKlicka på länken för att börja få Gratisbevakaren, ett mejl i veckan med nya saker du kan få gratis:\n\n${link}\n\nLänken gäller i 7 dagar. Har du inte anmält dig kan du strunta i det här mejlet, då händer ingenting.\n\nkostaringet.se`,
    html: `<p>Hej!</p><p>Klicka på knappen för att börja få Gratisbevakaren, ett mejl i veckan med nya saker du kan få gratis.</p><p><a href="${link}" style="display:inline-block;background:#2f45d9;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Ja, jag vill ha Gratisbevakaren</a></p><p style="color:#6b7090;font-size:14px">Länken gäller i 7 dagar. Har du inte anmält dig kan du strunta i det här mejlet, då händer ingenting.</p><p>kostaringet.se</p>`,
  });
  if (!r.ok) {
    console.error('Gratisbevakaren: bekräftelsemejlet kunde inte skickas', r.status, r.json?.name);
    return res.status(502).json({ error: 'Mejlet kunde inte skickas just nu. Försök igen om en stund.' });
  }
  return res.status(200).json({ ok: true });
}
