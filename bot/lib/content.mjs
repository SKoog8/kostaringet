// Reads and writes offer markdown files in src/content/erbjudanden.

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { slugify } from './heuristics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../..');
export const OFFERS_DIR = path.join(ROOT, 'src/content/erbjudanden');
export const STATE_DIR = path.join(ROOT, 'bot/state');

export function parseMarkdown(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: YAML.parse(m[1]) ?? {}, body: m[2] };
}

export function stringifyMarkdown(data, body) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  return `---\n${YAML.stringify(clean, { lineWidth: 0 }).trim()}\n---\n\n${body.trim()}\n`;
}

export async function readOffers() {
  if (!existsSync(OFFERS_DIR)) return [];
  const files = (await readdir(OFFERS_DIR)).filter((f) => f.endsWith('.md'));
  return Promise.all(
    files.map(async (file) => {
      const full = path.join(OFFERS_DIR, file);
      const { data, body } = parseMarkdown(await readFile(full, 'utf8'));
      return { file: full, slug: file.replace(/\.md$/, ''), data, body };
    }),
  );
}

export async function writeOffer(file, data, body) {
  await writeFile(file, stringifyMarkdown(data, body));
}

/** Picks a free filename based on the title. */
export function uniqueSlug(title, taken) {
  const base = slugify(title) || 'erbjudande';
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

export async function loadState() {
  const file = path.join(STATE_DIR, 'state.json');
  if (!existsSync(file)) return { seen: {}, pages: {} };
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  // Forget seen links after 120 days so the file does not grow forever.
  const cutoff = Date.now() - 120 * 86400000;
  for (const [key, when] of Object.entries(state.seen)) {
    if (new Date(when).getTime() < cutoff) delete state.seen[key];
  }
  const sorted = { ...state, seen: Object.fromEntries(Object.entries(state.seen).sort()) };
  await writeFile(path.join(STATE_DIR, 'state.json'), `${JSON.stringify(sorted, null, 2)}\n`);
}

export async function writeReport(markdown) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(path.join(STATE_DIR, 'last-run.md'), markdown);
}
