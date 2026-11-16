// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Read front matter from the content folders so the sitemap can leave out empty
// categories and give every URL a <lastmod>.
const field = (src, key) => src.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)`, 'm'))?.[1]?.trim();
const read = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ id: f.replace(/\.md$/, ''), src: readFileSync(`${dir}/${f}`, 'utf8') }))
    .filter(({ src }) => field(src, 'draft') !== 'true');
const newest = (...dates) => dates.filter(Boolean).map((d) => new Date(d)).sort((a, b) => +b - +a)[0];
const today = new Date(new Date().toISOString().slice(0, 10));

const offers = read('./src/content/erbjudanden').map(({ id, src }) => {
  const expires = field(src, 'expires');
  return {
    id,
    category: field(src, 'category'),
    active: field(src, 'status') !== 'avslutad' && (!expires || new Date(expires) >= today),
    lastmod: newest(field(src, 'published'), field(src, 'updated'), field(src, 'checked')),
  };
});
const posts = read('./src/content/blogg').map(({ id, src }) => ({
  // Same rule as postPath() in src/lib/posts.ts.
  path:
    field(src, 'kind') === 'dagens'
      ? `/blogg/${id}/`
      : `/guide/${field(src, 'urlSlug') ?? id.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`,
  guide: field(src, 'kind') !== 'dagens',
  lastmod: newest(field(src, 'published'), field(src, 'updated')),
}));

const lastmod = new Map();
for (const o of offers) lastmod.set(`/gratis/${o.id}/`, o.lastmod);
for (const p of posts) lastmod.set(p.path, p.lastmod);
const latestOffer = newest(...offers.map((o) => o.lastmod));
const latestPost = newest(...posts.map((p) => p.lastmod));
lastmod.set('/', newest(latestOffer, latestPost));
lastmod.set('/gratis/', latestOffer);
lastmod.set('/blogg/', newest(...posts.filter((p) => !p.guide).map((p) => p.lastmod)));
lastmod.set('/guide/', newest(...posts.filter((p) => p.guide).map((p) => p.lastmod)));
lastmod.set('/nyblivna-foraldrar/', newest(...offers.filter((o) => o.category === 'foraldrar').map((o) => o.lastmod)));
const categorySlugs = [...new Set(offers.map((o) => o.category))];
for (const c of categorySlugs) lastmod.set(`/kategori/${c}/`, newest(...offers.filter((o) => o.category === c).map((o) => o.lastmod)));
const emptyCategories = ['skonhet', 'mat-dryck', 'halsa', 'hem', 'djur', 'tjanster', 'ovrigt'].filter(
  (c) => !offers.some((o) => o.category === c && o.active),
);

export default defineConfig({
  site: 'https://kostaringet.se',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'sv', locales: { sv: 'sv-SE' } },
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.includes('/404')) return false;
        // Empty categories are noindex until they have active offers again.
        return !emptyCategories.some((c) => path === `/kategori/${c}/`);
      },
      serialize: (item) => {
        const date = lastmod.get(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date.toISOString() } : item;
      },
    }),
  ],
});
