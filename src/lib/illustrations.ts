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
] as const;
export type IllustrationName = (typeof illustrationNames)[number];

export function illustrationFor(category?: string): IllustrationName {
  return (illustrationNames as readonly string[]).includes(category ?? '') ? (category as IllustrationName) : 'ovrigt';
}
