import { getCollection, type CollectionEntry } from 'astro:content';
import { illustrationFor, type IllustrationName } from './illustrations';
import type { Offer } from './offers';

export type Post = CollectionEntry<'blogg'>;

export const kindLabel = { dagens: 'Dagens fynd', guide: 'Guide' } as const;

/** Published posts, newest first. */
export async function getPosts(kind?: Post['data']['kind']): Promise<Post[]> {
  const posts = await getCollection('blogg', (p) => !p.data.draft && (!kind || p.data.kind === kind));
  return posts.sort((a, b) => b.data.published.getTime() - a.data.published.getTime() || a.id.localeCompare(b.id));
}

/** Guides live at /guide/<slug>/ (no date in the address), daily posts at /blogg/<id>/. */
export const guideSlug = (post: Post) => post.data.urlSlug ?? post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
export const postPath = (post: Post) =>
  post.data.kind === 'guide' ? `/guide/${guideSlug(post)}/` : `/blogg/${post.id}/`;

/** Drawing and colour category for a post: its own choice, its category, or the first offer's category. */
export function postIllustration(post: Post, offers: Offer[]): { name: IllustrationName; cat: string } {
  const first = post.data.offers.map((slug) => offers.find((o) => o.id === slug)).find(Boolean);
  const cat = post.data.category ?? first?.data.category ?? 'ovrigt';
  return { name: post.data.illustration ?? illustrationFor(cat), cat };
}
