// Gratisbevakaren steg 2: knappen på sidan /gratisbevakaren/bekrafta/ (länken i mejlet). Lägger till adressen i listan hos Resend.
import { env, readToken, resend } from './_mail.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Location', '/gratisbevakaren/');
    return res.status(303).end();
  }
  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const email = readToken(body.t);
  if (!email) {
    res.setHeader('Location', '/gratisbevakaren/fel/');
    return res.status(303).end();
  }
  const r = await resend(`/audiences/${env('RESEND_AUDIENCE_ID')}/contacts`, { email, unsubscribed: false });
  // 409 betyder att adressen redan finns. Då ser vi till att den inte står som avanmäld.
  if (!r.ok && r.status !== 409 && r.status !== 422) {
    console.error('Gratisbevakaren: kunde inte spara kontakten', r.status, r.json?.name);
    res.setHeader('Location', '/gratisbevakaren/fel/');
    return res.status(303).end();
  }
  if (!r.ok) {
    await resend(`/audiences/${env('RESEND_AUDIENCE_ID')}/contacts/${encodeURIComponent(email)}`, { unsubscribed: false }, 'PATCH');
  }
  res.setHeader('Location', '/gratisbevakaren/tack/');
  return res.status(303).end();
}
