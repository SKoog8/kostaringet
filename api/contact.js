// Vercel-funktion för kontaktformuläret. Mejlet skickas via Resend (resend.com).
// Mottagaradressen (CONTACT_TO) är en inställning i Vercel och når aldrig webbläsaren.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = { kontakt: 'meddelande', tips: 'tips på erbjudande' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Använd formuläret på sajten.' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const name = String(body.name ?? '').trim().slice(0, 100);
  const email = String(body.email ?? '').trim().slice(0, 200);
  const message = String(body.message ?? '').trim();
  const topic = TOPICS[body.topic] ? body.topic : 'kontakt';

  // Fältet "website" är dolt för människor. Fylls det i är det en bot – låtsas att allt gick bra.
  if (body.website) return res.status(200).json({ ok: true });

  if (!EMAIL.test(email)) {
    return res.status(400).json({ error: 'Ange en giltig e-postadress så att vi kan svara.' });
  }
  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Meddelandet ska vara mellan 10 och 5 000 tecken.' });
  }

  // Tålig mot vanliga misstag i Vercel: mellanslag och citattecken runt värdet.
  const env = (k) => String(process.env[k] ?? '').trim().replace(/^["']|["']$/g, '').trim();
  const apiKey = env('RESEND_API_KEY');
  const to = env('CONTACT_TO');
  // Ett avsändarnamn med punkt (t.ex. kostaringet.se) måste stå inom citattecken, annars nekar Resend med 422.
  const quoteName = (v) => {
    const m = v.match(/^\s*([^"<]+?)\s*<([^>]+)>\s*$/);
    return m ? `"${m[1]}" <${m[2]}>` : v;
  };
  // Är CONTACT_FROM ingen giltig adress används Resends standardavsändare i stället.
  const fromEnv = env('CONTACT_FROM');
  const fromAddr = (fromEnv.match(/<([^>]+)>/)?.[1] ?? fromEnv).trim();
  const from = EMAIL.test(fromAddr) ? quoteName(fromEnv) : 'Kostar ingenting <onboarding@resend.dev>';
  if (!apiKey || !to) {
    return res.status(503).json({ error: 'Kontaktformuläret är inte igång just nu. Försök igen senare.' });
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `kostaringet.se: ${TOPICS[topic]} från ${name || email}`,
      text: `Namn: ${name || '(inget angivet)'}\nE-post: ${email}\nTyp: ${TOPICS[topic]}\n\n${message}`,
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  if (!r?.ok) {
    const detail = r ? await r.json().catch(() => ({})) : {};
    console.error('Resend misslyckades:', r?.status, detail);
    // Resends statuskod och feltyp (inte felmeddelandet, som kan innehålla e-postadresser) hjälper vid felsökning.
    return res
      .status(502)
      .json({ error: 'Meddelandet kunde inte skickas. Försök igen om en stund.', code: r?.status ?? 'timeout',
        reason: detail.name,
        // Förklaringen från Resend, med e-postadresser bortmaskade.
        detail: String(detail.message ?? '').replace(/[^\s<>@"'`]+@[^\s<>@"'`]+/g, '…@…').slice(0, 300),
      });
  }
  return res.status(200).json({ ok: true });
}
