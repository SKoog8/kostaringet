// Quick health check of every active offer's own page, without Firecrawl.
// Flags pages that are gone, that redirect to a start page, or that say the campaign is over.
// Run at the start of the morning run: npm run check
// Flagged offers are checked by hand (Firecrawl) first, before the usual oldest-first cleanup.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'src/content/erbjudanden');
const today = new Date().toISOString().slice(0, 10);
const field = (src, k) => (src.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) || [])[1] ?? '';

const ENDED =
  /(tagit slut|är slut nu|har tagit slut|kampanjen är (avslutad|slut)|erbjudandet (är|har) (avslutat|slut|upphört)|(erbjudandet|kampanjen) har avslutats|inte längre (tillgänglig|aktiv|möjligt|giltig)|ej längre|kupongerna (är|har) slut|sidan kunde inte hittas|felsida|oops!|no longer available|campaign (has )?ended|sold out)/i;

const offers = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ id: f.slice(0, -3), src: fs.readFileSync(path.join(dir, f), 'utf8') }))
  .filter(({ src }) => field(src, 'status') !== 'avslutad' && field(src, 'draft') !== 'true')
  .filter(({ src }) => !field(src, 'expires') || field(src, 'expires') >= today)
  .map(({ id, src }) => ({ id, url: field(src, 'url'), checked: field(src, 'checked') }));

const results = [];
for (const o of offers) {
  let status = 0, final = o.url, text = '';
  try {
    const out = execFileSync(
      'curl',
      ['-sL', '--max-time', '25', '-A', 'Mozilla/5.0 (kostaringet.se check)', '-w', '\n@@%{http_code} %{url_effective}', o.url],
      { maxBuffer: 20 * 1024 * 1024 },
    ).toString();
    const i = out.lastIndexOf('\n@@');
    const [code, eff] = out.slice(i + 3).split(' ');
    status = Number(code);
    final = eff;
    text = out
      .slice(0, i)
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  } catch {
    status = 0;
  }
  const flags = [];
  if (!status) flags.push('svarar inte');
  else if (status >= 400 && status !== 403 && status !== 429) flags.push(`HTTP ${status}`);
  if (status === 403 || status === 429) flags.push(`HTTP ${status} (blockerar skript – kontrollera med Firecrawl)`);
  const from = new URL(o.url), to = new URL(final || o.url);
  if (from.pathname.length > 1 && to.pathname === '/' && from.host.replace(/^www\./, '') === to.host.replace(/^www\./, ''))
    flags.push('skickas vidare till startsidan');
  else if (from.host.replace(/^www\./, '') !== to.host.replace(/^www\./, '')) flags.push(`skickas vidare till ${to.host}`);
  const m = text.match(ENDED);
  if (m) flags.push(`texten säger "${m[0]}"`);
  if (status === 200 && text.length < 600) flags.push('lite text (sidan byggs med JavaScript – kontrollera med Firecrawl)');
  results.push({ ...o, status, flags });
}

const flagged = results.filter((r) => r.flags.length);
console.log(`Kontrollerade ${results.length} aktiva erbjudanden. ${flagged.length} behöver kontrolleras för hand:\n`);
for (const r of flagged) console.log(`- ${r.id} (senast kontrollerad ${r.checked || 'aldrig'}): ${r.flags.join('; ')}\n  ${r.url}`);
if (!flagged.length) console.log('Inga varningar.');
