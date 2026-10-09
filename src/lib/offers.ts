import { getCollection, type CollectionEntry } from 'astro:content';
import type { CategorySlug } from '../site.config';

export type Offer = CollectionEntry<'erbjudanden'>;

/** An offer is active unless it is marked as ended or its end date has passed. */
export function isActive(offer: Offer, now = new Date()): boolean {
  if (offer.data.status === 'avslutad') return false;
  if (offer.data.expires && offer.data.expires < now) return false;
  return true;
}

/** All published offers, active first and newest first within each group. */
export async function getOffers(category?: CategorySlug): Promise<Offer[]> {
  const all = await getCollection(
    'erbjudanden',
    (o) => !o.data.draft && (!category || o.data.category === category),
  );
  return all.sort((a, b) => {
    const activeDiff = Number(isActive(b)) - Number(isActive(a));
    if (activeDiff !== 0) return activeDiff;
    return latest(b).getTime() - latest(a).getTime();
  });
}

export function latest(offer: Offer): Date {
  return offer.data.updated ?? offer.data.published;
}

export function offerPath(offer: Offer): string {
  return `/gratis/${offer.id}/`;
}

const dateFmt = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShort = (d: Date) => shortFmt.format(d).replace('.', '');
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
