#!/usr/bin/env node
// Finds new free offers and writes them as drafts (draft: true) in
// src/content/erbjudanden. Drafts are reviewed in a pull request and published
// by setting draft: false (or deleting the line).
//
//   node bot/run.mjs            normal run
//   node bot/run.mjs --dry-run  print what would be written, change nothing

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { collectNews, collectFeeds, collectPages } from './lib/collect.mjs';
import { aiEnabled, discover, verify } from './lib/ai.mjs';
import { guessCategory, scoreText, titleKey, urlKey } from './lib/heuristics.mjs';
import {
  OFFERS_DIR,
  ROOT,
  loadState,
  readOffers,
  saveState,
  uniqueSlug,
  writeOffer,
  writeReport,
} from './lib/content.mjs';

const dryRun = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);

const sourcesFile = process.env.BOT_SOURCES || path.join(ROOT, 'bot/sources.yml');
const config = YAML.parse(await readFile(sourcesFile, 'utf8'));
const limits = { verify: 12, drafts: 10, max_age_days: 21, ...config.limits };

const state = await loadState();
const offers = await readOffers();
const knownUrls = new Set(offers.map((o) => urlKey(o.data.url ?? '')));
const knownTitles = new Set(offers.map((o) => titleKey(o.data.title ?? '')));
const offerByUrl = new Map(offers.map((o) => [urlKey(o.data.url ?? ''), o]));
const takenSlugs = new Set(offers.map((o) => o.slug));

console.log(`kostaringet-bot ${today}${dryRun ? ' (dry run)' : ''} – AI ${aiEnabled() ? 'på' : 'av'}`);

// 1. Collect
console.log('Samlar kandidater…');
let candidates = [
  ...(await collectNews(config.news ?? [], limits.max_age_days)),
  ...(await collectFeeds(config.feeds ?? [], limits.max_age_days)),
  ...(await collectPages(config.pages ?? [], state)),
];

if (aiEnabled() && config.ai_discovery?.enabled) {
  for (const topic of config.ai_discovery.topics ?? []) {
    try {
      const found = await discover(topic, [...knownUrls], today);
      console.log(`  AI-sökning "${topic}": ${found.length} träffar`);
      for (const f of found) {
        candidates.push({
          title: f.title,
          link: f.url,
          snippet: f.summary,
          source: `AI-sökning: ${topic}`,
          publisher: f.brand,
          date: new Date(),
          category: guessCategory(`${f.title} ${f.summary}`),
          score: Math.max(scoreText(`${f.title} ${f.summary}`), 2),
        });
      }
    } catch (err) {
      console.warn(`  ! AI-sökning misslyckades: ${err.message}`);
    }
  }
}
console.log(`  ${candidates.length} råa kandidater`);

// 2. Filter: keyword score, already seen, already published
const changedExisting = [];
const fresh = [];
const batchKeys = new Set();
for (const c of candidates) {
  if (!c.link || !c.title) continue;
  const key = urlKey(c.link);
  if (c.changedPage && offerByUrl.has(key)) {
    changedExisting.push({ candidate: c, offer: offerByUrl.get(key) });
    continue;
  }
  if (c.score < 2) continue;
  if (state.seen[key] || knownUrls.has(key) || batchKeys.has(key)) continue;
  if (knownTitles.has(titleKey(c.title))) continue;
  batchKeys.add(key);
  fresh.push(c);
}
fresh.sort((a, b) => b.score - a.score || (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
console.log(`  ${fresh.length} nya efter filtrering`);

// 3. Verify (AI) or keep heuristically, then write drafts
const written = [];
const rejected = [];
const toCheck = fresh.slice(0, aiEnabled() ? limits.verify : limits.drafts);

for (const c of toCheck) {
  if (written.length >= limits.drafts) break;
  state.seen[urlKey(c.link)] = today;

  let data;
  let body;
  if (aiEnabled()) {
    let result = null;
    try {
      result = await verify(c, today);
    } catch (err) {
      console.warn(`  ! verifiering misslyckades för "${c.title}": ${err.message}`);
      delete state.seen[urlKey(c.link)]; // try again next run
      continue;
    }
    if (!result || !result.is_free_offer || result.confidence === 'låg') {
      rejected.push({ c, reason: result?.reject_reason || 'Kunde inte verifieras' });
      continue;
    }
    const offerKey = urlKey(result.offer_url);
    if (knownUrls.has(offerKey) || knownTitles.has(titleKey(result.title))) {
      rejected.push({ c, reason: 'Finns redan på sajten' });
      continue;
    }
    knownUrls.add(offerKey);
    knownTitles.add(titleKey(result.title));
    state.seen[offerKey] = today;
    data = {
      title: result.title,
      description: result.description,
      brand: result.brand,
      category: result.category,
      type: result.type,
      url: result.offer_url,
      requirements: result.requirements.length ? result.requirements : undefined,
      shipping: result.shipping_sek === -1 ? 'tillkommer' : result.shipping_sek || undefined,
      published: today,
      checked: today,
      expires: /^\d{4}-\d{2}-\d{2}$/.test(result.expires) ? result.expires : undefined,
      draft: true,
      source: `${c.source} – ${c.link}`,
    };
    body = result.body_markdown;
  } else {
    data = {
      title: c.title.slice(0, 90),
      description: (c.snippet || c.title).slice(0, 160),
      brand: c.publisher || 'OKÄNT – fyll i',
      category: c.category,
      type: 'gratisprov',
      url: c.link,
      published: today,
      draft: true,
      source: `${c.source} – ${c.link}`,
    };
    body = `> Utkast från boten (utan AI). Kontrollera erbjudandet, byt länk till företagets egen sida och skriv om texten innan publicering.\n\n${c.snippet || ''}\n\n## Så beställer du\n\n1. …\n\n## Bra att veta\n\n- …`;
  }

  const slug = uniqueSlug(data.title, takenSlugs);
  const file = path.join(OFFERS_DIR, `${slug}.md`);
  written.push({ slug, data });
  if (dryRun) {
    console.log(`  + [dry] ${slug}  (${data.category}) ${data.url}`);
  } else {
    await writeOffer(file, data, body);
    console.log(`  + ${slug}`);
  }
}

// 4. Report (used as pull request body by the GitHub Action)
const lines = [`## Botkörning ${today}`, ''];
lines.push(`AI-verifiering: ${aiEnabled() ? 'på' : 'av'} · ${candidates.length} kandidater · ${fresh.length} nya · ${written.length} utkast`, '');
if (written.length) {
  lines.push('### Nya utkast', '', 'Granska texten, kontrollera länken och ta bort `draft: true` för att publicera.', '');
  for (const w of written) lines.push(`- [ ] **${w.data.title}** – \`${w.slug}.md\` · ${w.data.category} · ${w.data.url}`);
  lines.push('');
}
if (changedExisting.length) {
  lines.push('### Bevakade sidor som ändrats', '', 'Kontrollera att erbjudandena fortfarande stämmer:', '');
  for (const { offer } of changedExisting) lines.push(`- ${offer.data.title} – ${offer.data.url} (\`${offer.slug}.md\`)`);
  lines.push('');
}
if (rejected.length) {
  lines.push('<details><summary>Avvisade tips</summary>', '');
  for (const r of rejected) lines.push(`- ${r.c.title} – ${r.reason} (${r.c.link})`);
  lines.push('', '</details>', '');
}
const report = lines.join('\n');

if (dryRun) {
  console.log(`\n${report}`);
} else {
  await saveState(state);
  await writeReport(report);
}
console.log(`Klart: ${written.length} utkast.`);
