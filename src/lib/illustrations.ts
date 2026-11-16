// Names of the drawings in src/illustrations/. Category slugs map to a drawing with the same name.
export const illustrationNames = [
  'foraldrar',
  'skonhet',
  'mat-dryck',
  'halsa',
  'hem',
  'djur',
  'tjanster',
  'ovrigt',
  'kalender',
  'vinter',
  'bok',
  'jul',
  'hero',
  'timglas',
  'ljudbok',
  'tidning',
  'babybox',
  'nalle',
  'vaska',
  'nappflaska',
  'valp',
  'katt',
] as const;
export type IllustrationName = (typeof illustrationNames)[number];

export function illustrationFor(category?: string): IllustrationName {
  return (illustrationNames as readonly string[]).includes(category ?? '') ? (category as IllustrationName) : 'ovrigt';
}

/** Drawing for an offer: its own choice, a default for trials and starter packs, else its category. */
export function offerIllustrationName(data: { illustration?: IllustrationName; type: string; category: string }): IllustrationName {
  if (data.illustration) return data.illustration;
  if (data.type === 'provperiod') return 'timglas';
  if (data.type === 'startpaket') return data.category === 'djur' ? 'valp' : 'babybox';
  return illustrationFor(data.category);
}
