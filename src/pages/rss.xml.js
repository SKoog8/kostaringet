import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../site.config';

export async function GET(context) {
  const offers = await getCollection('erbjudanden', (o) => !o.data.draft && o.data.status === 'aktiv');
  const items = offers
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .slice(0, 50)
    .map((o) => ({
      title: o.data.title,
      description: o.data.description,
      pubDate: o.data.published,
      link: `/gratis/${o.id}/`,
    }));

  return rss({
    title: `${site.domain} – nya gratiserbjudanden`,
    description: site.description,
    site: context.site,
    items,
    customData: '<language>sv-se</language>',
  });
}
