// Collects raw candidates from news searches, RSS feeds and watched pages.

import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { fetchPageText, fetchText, sleep } from './http.mjs';
import { guessCategory, scoreText } from './heuristics.mjs';

const parser = new Parser();

// Fetch with our own client (timeouts, user agent) and only use rss-parser for parsing.
async function parseFeed(url) {
  return parser.parseString(await fetchText(url));
}

/**
 * @typedef {object} Candidate
 * @property {string} title
 * @property {string} link
 * @property {string} snippet
 * @property {string} source       human readable origin, e.g. "Google News: gratisprov"
 * @property {string} [publisher]
 * @property {Date}   [date]
 * @property {string} category     guessed category slug
 * @property {number} score        keyword score
 */

const stripHtml = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function toCandidate(item, source, fallbackCategory) {
  const title = stripHtml(item.title ?? '');
  const snippet = stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? '').slice(0, 500);
  const text = `${title} ${snippet}`;
  return {
    title,
    link: item.link,
    snippet,
    source,
    publisher: item.source?.title ?? item.creator ?? undefined,
    date: item.isoDate ? new Date(item.isoDate) : undefined,
    category: fallbackCategory ?? guessCategory(text),
    score: scoreText(text),
  };
}

export async function collectNews(queries, maxAgeDays) {
  const out = [];
  const cutoff = Date.now() - maxAgeDays * 86400000;
  for (const q of queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=sv&gl=SE&ceid=SE:sv`;
    try {
      const feed = await parseFeed(url);
      for (const item of feed.items ?? []) {
        const c = toCandidate(item, `Google News: ${q}`);
        if (c.date && c.date.getTime() < cutoff) continue;
        out.push(c);
      }
    } catch (err) {
      console.warn(`  ! news "${q}": ${err.message}`);
    }
    await sleep(800);
  }
  return out;
}

export async function collectFeeds(feeds, maxAgeDays) {
  const out = [];
  const cutoff = Date.now() - maxAgeDays * 86400000;
  for (const f of feeds) {
    try {
      const feed = await parseFeed(f.url);
      for (const item of feed.items ?? []) {
        const c = toCandidate(item, `RSS: ${f.name}`, f.category);
        if (c.date && c.date.getTime() < cutoff) continue;
        out.push(c);
      }
    } catch (err) {
      console.warn(`  ! feed ${f.name}: ${err.message}`);
    }
  }
  return out;
}

/**
 * Re-reads watched pages. A page becomes a candidate when its text hash
 * differs from the previous run. The first run only records a baseline.
 */
export async function collectPages(pages, state) {
  const out = [];
  state.pages ??= {};
  for (const p of pages) {
    try {
      const page = await fetchPageText(p.url, 20000);
      const hash = createHash('sha256').update(page.text).digest('hex').slice(0, 16);
      const prev = state.pages[p.url];
      state.pages[p.url] = { hash, checked: new Date().toISOString() };
      if (!prev || prev.hash === hash) continue;
      const score = scoreText(`${page.title} ${page.description} ${page.text}`);
      out.push({
        title: page.title || p.name,
        link: p.url,
        snippet: page.description || page.text.slice(0, 400),
        source: `Bevakad sida: ${p.name}`,
        publisher: p.name,
        date: new Date(),
        category: p.category ?? guessCategory(page.text),
        score: Math.max(score, 2),
        changedPage: true,
      });
    } catch (err) {
      console.warn(`  ! page ${p.name}: ${err.message}`);
    }
    await sleep(800);
  }
  return out;
}
