// Cheap keyword heuristics used before (or instead of) the AI step.

const FREE_TERMS = [
  'gratis',
  'gratisprov',
  'varuprov',
  'kostnadsfri',
  'kostnadsfritt',
  'prova på',
  'prova gratis',
  'provperiod',
  'startpaket',
  'babybox',
  'välkomstpaket',
  'välkomstgåva',
  'beställ ditt prov',
  'free sample',
];

// Things that use the word "gratis" but are not freebies for readers.
const NEGATIVE_TERMS = [
  'fri frakt',
  'gratis frakt',
  'tävling',
  'tävla',
  'vinn ',
  'lotteri',
  'gratis parkering',
  'gratis kollektivtrafik',
  'gratis entré',
  'gratis wifi',
  'gratis att använda',
  'konsert',
  'kommunen',
  'region ',
  'skola',
];

const CATEGORY_TERMS = {
  foraldrar: ['bebis', 'baby', 'gravid', 'blöj', 'förälder', 'föräldrar', 'mamma', 'pappa', 'spädbarn', 'nyfödd', 'barnvagn', 'napp', 'babybox', 'bb '],
  skonhet: ['hudvård', 'smink', 'parfym', 'doft', 'serum', 'kräm', 'schampo', 'mascara', 'skönhet', 'hår', 'deodorant', 'tandkräm'],
  'mat-dryck': ['kaffe', 'te ', 'matkasse', 'mat ', 'dryck', 'choklad', 'snacks', 'smakprov', 'recept', 'godis', 'öl', 'måltid'],
  halsa: ['vitamin', 'kosttillskott', 'apotek', 'hälsa', 'test', 'protein', 'probiotika', 'linser', 'kontaktlinser', 'hörsel'],
  hem: ['tvättmedel', 'disk', 'rengöring', 'hushåll', 'städ', 'tapet', 'färgprov', 'katalog', 'trädgård'],
  djur: ['hund', 'katt', 'foder', 'valp', 'kattunge', 'husdjur', 'djur'],
  tjanster: ['provperiod', 'streaming', 'ljudbok', 'e-bok', 'tidning', 'prenumeration', 'app', 'gym', 'träning', 'abonnemang', 'spotify', 'storytel', 'netflix', 'viaplay'],
};

export function scoreText(text) {
  const t = ` ${text.toLowerCase()} `;
  let score = 0;
  for (const term of FREE_TERMS) if (t.includes(term)) score += term === 'gratis' ? 1 : 2;
  for (const term of NEGATIVE_TERMS) if (t.includes(term)) score -= 3;
  return score;
}

export function guessCategory(text) {
  const t = ` ${text.toLowerCase()} `;
  let best = 'ovrigt';
  let bestHits = 0;
  for (const [cat, terms] of Object.entries(CATEGORY_TERMS)) {
    const hits = terms.filter((term) => t.includes(term)).length;
    if (hits > bestHits) {
      best = cat;
      bestHits = hits;
    }
  }
  return best;
}

export function slugify(input) {
  return input
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é|è/g, 'e')
    .replace(/ü/g, 'u')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

/** Normalized key for de-duplication: host + path without tracking params. */
export function urlKey(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function titleKey(title) {
  return slugify(title).split('-').filter((w) => w.length > 3).sort().join('-');
}
