// Delade hjälpfunktioner för Gratisbevakaren (nyhetsbrevet). Filer som börjar med _ blir inga egna adresser hos Vercel.
import crypto from 'node:crypto';

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SITE = 'https://kostaringet.se';

// Tålig mot vanliga misstag i Vercel: mellanslag och citattecken runt värdet.
export const env = (k) => String(process.env[k] ?? '').trim().replace(/^["']|["']$/g, '').trim();

// Avsändare för nyhetsbrevet: NEWSLETTER_FROM, annars CONTACT_FROM. Namn med punkt måste stå inom citattecken.
export function sender() {
  const raw = env('NEWSLETTER_FROM') || env('CONTACT_FROM');
  const addr = (raw.match(/<([^>]+)>/)?.[1] ?? raw).trim();
  if (!EMAIL.test(addr)) return null;
  const m = raw.match(/^\s*([^"<]+?)\s*<([^>]+)>\s*$/);
  return m ? `"${m[1]}" <${m[2]}>` : raw;
}

// Bekräftelselänken signeras, så att ingen kan anmäla någon annan utan att personen klickar i sitt eget mejl.
const secret = () => env('NEWSLETTER_SECRET') || env('RESEND_API_KEY');
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

export function makeToken(email) {
  const data = b64(JSON.stringify({ e: email.toLowerCase(), t: Date.now() }));
  return `${data}.${sign(data)}`;
}

export function readToken(token, maxAgeDays = 7) {
  const [data, sig] = String(token ?? '').split('.');
  if (!data || !sig || !secret()) return null;
  const expected = sign(data);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { e, t } = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!EMAIL.test(e) || Date.now() - t > maxAgeDays * 864e5) return null;
    return e;
  } catch {
    return null;
  }
}

export async function resend(path, body, method = 'POST') {
  const r = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  const json = r ? await r.json().catch(() => ({})) : {};
  return { ok: !!r?.ok, status: r?.status ?? 0, json };
}

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
