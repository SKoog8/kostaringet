// Gratisbevakarens veckobrev. Körs av Vercel Cron varje torsdag (se vercel.json).
// Skapar ett UTKAST i Resend med veckans nya erbjudanden och mejlar Martin att det är klart att granska.
// Utkastet skickas inte automatiskt: det skickas från Resend (Broadcasts) när det är granskat.
// Sätt WEEKLY_AUTOSEND=true i Vercel för att skicka direkt i stället.
import { SITE, env, sender, resend, escapeHtml as h } from './_mail.js';

const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
const date = (iso) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

function item(o) {
  return `<tr><td style="padding:14px 0;border-bottom:1px solid #dcdff0">
    <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2f45d9">${h(o.brand)} · ${h(o.type)}</div>
    <a href="${h(o.url)}" style="display:block;margin:4px 0;font-size:18px;font-weight:800;color:#0e1330;text-decoration:none">${h(o.title)}</a>
    <div style="font-size:15px;color:#3a4060">${h(o.description)}${o.expires ? ` <strong>Gäller till ${date(o.expires)}.</strong>` : ''}</div>
  </td></tr>`;
}

function section(title, items) {
  if (!items.length) return '';
  return `<h2 style="margin:28px 0 4px;font-size:20px;color:#0e1330">${h(title)}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(item).join('')}</table>`;
}

export function buildEmail(d) {
  const n = d.fresh.length;
  const subject = n
    ? `${n} nya gratissaker den här veckan${d.fresh[0] ? ` – bland annat ${d.fresh[0].brand}` : ''}`
    : 'Veckans gratissaker från kostaringet.se';
  const html = `<!doctype html><html lang="sv"><body style="margin:0;background:#f3f4fb;font-family:Helvetica,Arial,sans-serif;color:#0e1330">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;padding:28px">
<tr><td>
  <div style="font-size:20px;font-weight:800;letter-spacing:-.03em">kostaringet<span style="color:#6b7090">.se</span></div>
  <h1 style="margin:18px 0 8px;font-size:26px;letter-spacing:-.02em">Gratisbevakaren</h1>
  <p style="margin:0;font-size:16px;color:#3a4060">${n ? `Här är ${n === 1 ? 'veckans nya gratissak' : `veckans ${n} nya gratissaker`}.` : 'Här är det som är gratis just nu.'} Allt är kontrollerat hos företagen. Just nu finns ${d.activeCount} aktiva erbjudanden på sajten.</p>
  ${section('Nytt den här veckan', d.fresh)}
  ${section('Snart slut', d.endingSoon)}
  ${n < 3 ? section('Fortfarande gratis', d.popular) : ''}
  ${d.guide ? `<h2 style="margin:28px 0 4px;font-size:20px">Veckans guide</h2><p style="margin:0 0 6px;font-size:15px;color:#3a4060">${h(d.guide.description)}</p><a href="${h(d.guide.url)}" style="font-weight:700;color:#2f45d9">${h(d.guide.title)}</a>` : ''}
  <p style="margin:28px 0 0"><a href="${SITE}/gratis/" style="display:inline-block;background:#2f45d9;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Se alla gratiserbjudanden</a></p>
  <p style="margin:28px 0 0;font-size:13px;color:#6b7090">Du får det här mejlet för att du har anmält dig till Gratisbevakaren på kostaringet.se. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b7090">Avsluta Gratisbevakaren</a>.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}

export default async function handler(req, res) {
  // Vercel Cron skickar CRON_SECRET som Bearer-token när den är satt.
  const secret = env('CRON_SECRET');
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });

  const audience = env('RESEND_AUDIENCE_ID');
  const from = sender();
  if (!env('RESEND_API_KEY') || !audience || !from) return res.status(503).json({ error: 'Gratisbevakaren är inte konfigurerad.' });

  const data = await fetch(`${SITE}/veckobrev.json`).then((r) => r.json()).catch(() => null);
  if (!data) return res.status(502).json({ error: 'Kunde inte läsa veckobrev.json' });
  if (!data.fresh.length && !data.endingSoon.length) return res.status(200).json({ skipped: 'Inget nytt den här veckan.' });

  const { subject, html } = buildEmail(data);
  const name = `Gratisbevakaren ${new Date().toISOString().slice(0, 10)}`;
  const created = await resend('/broadcasts', { audience_id: audience, from, subject, html, name });
  if (!created.ok) {
    console.error('Gratisbevakaren: utkastet kunde inte skapas', created.status, created.json?.name, created.json?.message);
    return res.status(502).json({ error: 'Utkastet kunde inte skapas', code: created.status });
  }
  const id = created.json?.id;

  if (env('WEEKLY_AUTOSEND') === 'true') {
    const sent = await resend(`/broadcasts/${id}/send`, {});
    return res.status(sent.ok ? 200 : 502).json({ sent: sent.ok, id });
  }

  const to = env('CONTACT_TO');
  if (to) {
    await resend('/emails', {
      from,
      to: [to],
      subject: `Veckobrevet är klart att granska: ${subject}`,
      text: `Veckans Gratisbevakaren ligger som utkast i Resend under Broadcasts (${name}).\n\nGranska och klicka Send när det ser bra ut:\nhttps://resend.com/broadcasts\n\n${data.fresh.length} nya erbjudanden, ${data.endingSoon.length} som snart tar slut.`,
    });
  }
  return res.status(200).json({ draft: id, subject });
}
