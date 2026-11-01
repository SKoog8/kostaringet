import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blogg'>;

export const kindLabel = { dagens: 'Dagens fynd', guide: 'Guide' } as const;

/** Published posts, newest first. */
export async function getPosts(kind?: Post['data']['kind']): Promise<Post[]> {
  const posts = await getCollection('blogg', (p) => !p.data.draft && (!kind || p.data.kind === kind));
  return posts.sort((a, b) => b.data.published.getTime() - a.data.published.getTime() || a.id.localeCompare(b.id));
}

export const postPath = (post: Post) => `/blogg/${post.id}/`;
