// Gratisbevakaren: lägger till en e-postadress i gruppen Gratisbevakaren hos MailerLite.
// Dubbel opt-in sköts av MailerLite (inställningen "Double opt-in for API and integrations"): adressen får ett
// bekräftelsemejl och får utskick först när den har bekräftats. API-nyckeln finns bara i Vercel.
import { EMAIL, env } from './_mail.js';

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

  const apiKey = env('MAILERLITE_API_KEY');
  const group = env('MAILERLITE_GROUP_ID');
  if (!apiKey || !group) {
    return res.status(503).json({ error: 'Gratisbevakaren startar snart. Försök igen om några dagar.' });
  }

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email,
      groups: [group],
      // Den som själv anmäler sig igen efter att ha avslutat ska kunna komma tillbaka (får ett nytt bekräftelsemejl).
      resubscribe: true,
      ...(ip && { ip_address: ip }),
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  if (!r?.ok) {
    const detail = r ? await r.json().catch(() => ({})) : {};
    console.error('Gratisbevakaren: MailerLite svarade', r?.status, detail?.message);
    if (r?.status === 422) return res.status(400).json({ error: 'Adressen kunde inte läggas till. Kontrollera att den är rätt stavad.' });
    return res.status(502).json({ error: 'Något gick fel. Försök igen om en stund.' });
  }
  return res.status(200).json({ ok: true });
}
