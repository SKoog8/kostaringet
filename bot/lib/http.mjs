// Polite HTTP helpers: identifies itself, respects robots.txt, times out.

import * as cheerio from 'cheerio';

export const USER_AGENT = 'KostaringetBot/1.0 (+https://kostaringet.se/om/)';
const robotsCache = new Map();

async function fetchWithTimeout(url, { timeout = 15000, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      redirect: 'follow',
      ...init,
      headers: { 'user-agent': USER_AGENT, 'accept-language': 'sv-SE,sv;q=0.9', ...init.headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Minimal robots.txt check for the "*" and our own user agent groups. */
export async function allowedByRobots(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let rules = [];
    try {
      const res = await fetchWithTimeout(`${u.origin}/robots.txt`, { timeout: 8000 });
      if (res.ok) rules = parseRobots(await res.text());
    } catch {
      // Unreachable robots.txt is treated as allow-all.
    }
    robotsCache.set(u.origin, rules);
  }
  const path = u.pathname + u.search;
  let verdict = { allow: true, length: -1 };
  for (const rule of robotsCache.get(u.origin)) {
    if (rule.path && path.startsWith(rule.path) && rule.path.length > verdict.length) {
      verdict = { allow: rule.allow, length: rule.path.length };
    }
  }
  return verdict.allow;
}

function parseRobots(text) {
  const rules = [];
  let applies = false;
  let lastWasAgent = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, key, value] = m;
    const k = key.toLowerCase();
    if (k === 'user-agent') {
      const agent = value.toLowerCase();
      const match = agent === '*' || agent.includes('kostaringetbot');
      applies = lastWasAgent ? applies || match : match;
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!applies) continue;
    if (k === 'disallow' && value) rules.push({ allow: false, path: value.replace(/\*.*$/, '') });
    if (k === 'allow' && value) rules.push({ allow: true, path: value.replace(/\*.*$/, '') });
  }
  return rules;
}

export async function fetchText(url, opts = {}) {
  const res = await fetchWithTimeout(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Fetches a page and returns its readable text, trimmed to maxChars. */
export async function fetchPageText(url, maxChars = 12000) {
  if (!(await allowedByRobots(url))) throw new Error(`robots.txt disallows ${url}`);
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, nav, footer, header, form').remove();
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const text = $('main').text() || $('body').text();
  return {
    title,
    description,
    text: text.replace(/\s+/g, ' ').trim().slice(0, maxChars),
  };
}

/** HEAD-then-GET status check used by the expiry job. */
export async function checkStatus(url) {
  try {
    let res = await fetchWithTimeout(url, { method: 'HEAD', timeout: 12000 });
    if (res.status === 405 || res.status === 403) res = await fetchWithTimeout(url, { timeout: 12000 });
    return res.status;
  } catch {
    return 0;
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
