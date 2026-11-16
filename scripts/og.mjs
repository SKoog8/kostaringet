// Generates one Open Graph image (1200×630) per offer and blog post into public/og/<slug>.png.
// Existing images are kept; pass --force to redraw all. Run: npm run og
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // preinstalled globally, not a dependency
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'public/og');
const force = process.argv.includes('--force');
fs.mkdirSync(out, { recursive: true });

const field = (src, name) => {
  const m = src.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const TYPES = { gratisprov: 'Gratisprov', startpaket: 'Startpaket', provperiod: 'Gratis provperiod', 'prova-pa': 'Prova på', medlemsgava: 'Medlemsgåva' };

const items = [];
for (const [dir, kind] of [['erbjudanden', 'offer'], ['blogg', 'post']]) {
  const base = path.join(root, 'src/content', dir);
  for (const f of fs.readdirSync(base).filter((f) => f.endsWith('.md'))) {
    const src = fs.readFileSync(path.join(base, f), 'utf8');
    const slug = f.replace(/\.md$/, '');
    if (!force && fs.existsSync(path.join(out, `${slug}.png`))) continue;
    const eyebrow =
      kind === 'offer'
        ? [field(src, 'brand'), TYPES[field(src, 'type')] ?? 'Gratis'].filter(Boolean).join(' · ')
        : field(src, 'kind') === 'guide' ? 'Guide' : 'Dagens gratisfynd';
    const pill = field(src, 'type') === 'provperiod' ? 'Gratis att prova' : 'Kostar ingenting';
    items.push({ slug, title: field(src, 'title'), eyebrow, pill });
  }
}
if (!items.length) {
  console.log('og: inga nya bilder att skapa');
  process.exit(0);
}

const font = (p) => `file://${path.join(root, 'node_modules/@fontsource-variable', p)}`;
const html = ({ title, eyebrow, pill }) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:H;src:url('${font('hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2')}');font-weight:100 900}
@font-face{font-family:N;src:url('${font('newsreader/files/newsreader-latin-wght-normal.woff2')}');font-weight:200 800}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f6f4ee;font-family:H,sans-serif;color:#1a1915}
.c{position:absolute;inset:0;padding:72px 80px;display:flex;flex-direction:column}
.e{font-size:26px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1d5c48}
h1{font-family:N,serif;font-weight:500;line-height:1.08;letter-spacing:-.01em;margin:28px 0 0;font-size:${title.length > 70 ? 60 : title.length > 45 ? 70 : 82}px}
.f{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:28px;font-weight:700}
.p{background:#1d5c48;color:#fff;border-radius:999px;padding:12px 26px;font-size:24px}
.b{position:absolute;left:0;top:0;bottom:0;width:16px;background:#1d5c48}
</style></head><body><div class="b"></div><div class="c"><div class="e">${esc(eyebrow)}</div><h1>${esc(title)}</h1>
<div class="f"><span>kostaringet.se</span><span class="p">${pill}</span></div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Load from a file:// URL so the local font files are allowed.
const tmp = path.join(fs.mkdtempSync(path.join((await import('node:os')).tmpdir(), 'og-')), 'og.html');
for (const it of items) {
  fs.writeFileSync(tmp, html(it));
  await page.goto(`file://${tmp}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, `${it.slug}.png`), type: 'png' });
}
await browser.close();
console.log(`og: skapade ${items.length} bilder`);
