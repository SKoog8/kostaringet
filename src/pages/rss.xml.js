import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getPosts, postPath } from '../lib/posts';
import { site } from '../site.config';

export async function GET(context) {
  const posts = await getPosts();
  const offers = await getCollection('erbjudanden', (o) => !o.data.draft && o.data.status === 'aktiv');

  const items = [
    ...posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.published,
      link: postPath(p),
    })),
    ...offers.map((o) => ({
      title: o.data.title,
      description: o.data.description,
      pubDate: o.data.published,
      link: `/gratis/${o.id}/`,
    })),
  ]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 60);

  return rss({
    title: `${site.domain} – dagens gratisfynd`,
    description: site.description,
    site: context.site,
    items,
    customData: '<language>sv-se</language>',
  });
}
