#!/usr/bin/env node
// Housekeeping for published offers:
//  - marks offers as "avslutad" when their end date has passed
//  - marks offers as "avslutad" when the offer page returns 404/410 two runs in a row
//  - refreshes the "checked" date for offers whose page still answers
//
//   node bot/expire.mjs [--dry-run]

import { checkStatus, sleep } from './lib/http.mjs';
import { loadState, readOffers, saveState, writeOffer, writeReport } from './lib/content.mjs';

const dryRun = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);
const state = await loadState();
state.gone ??= {};

const offers = await readOffers();
const ended = [];
const broken = [];
let refreshed = 0;

for (const offer of offers) {
  const { data } = offer;
  if (data.draft || data.status === 'avslutad' || !data.url) continue;

  const expires = data.expires ? new Date(data.expires) : null;
  if (expires && expires.toISOString().slice(0, 10) < today) {
    ended.push({ offer, reason: `slutdatum ${data.expires}` });
    continue;
  }

  const status = await checkStatus(data.url);
  await sleep(500);
  if (status === 404 || status === 410) {
    if (state.gone[offer.slug]) {
      ended.push({ offer, reason: `sidan svarar ${status}` });
      delete state.gone[offer.slug];
    } else {
      state.gone[offer.slug] = today;
      broken.push({ offer, status });
    }
    continue;
  }
  delete state.gone[offer.slug];
  if (status === 0 || status >= 400) {
    broken.push({ offer, status });
    continue;
  }

  // Page answers. Refresh "checked" weekly to avoid a commit every day.
  const last = data.checked ? new Date(data.checked).getTime() : 0;
  if (Date.now() - last > 7 * 86400000) {
    refreshed++;
    if (!dryRun) await writeOffer(offer.file, { ...data, checked: today }, offer.body);
  }
}

for (const { offer } of ended) {
  if (!dryRun) await writeOffer(offer.file, { ...offer.data, status: 'avslutad', updated: today }, offer.body);
}

const lines = [`## Kontroll av erbjudanden ${today}`, ''];
if (ended.length) {
  lines.push('### Markerade som avslutade', '');
  for (const e of ended) lines.push(`- ${e.offer.data.title} – ${e.reason}`);
  lines.push('');
}
if (broken.length) {
  lines.push('### Länkar som inte svarar som de ska', '');
  for (const b of broken) lines.push(`- ${b.offer.data.title} – status ${b.status || 'ingen kontakt'} – ${b.offer.data.url}`);
  lines.push('');
}
lines.push(`${refreshed} erbjudanden fick nytt kontrolldatum.`);
const report = lines.join('\n');
console.log(report);

if (!dryRun) {
  await saveState(state);
  await writeReport(report);
}
