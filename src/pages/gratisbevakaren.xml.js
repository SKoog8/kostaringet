// RSS-flöde för Gratisbevakaren. MailerLites RSS-kampanj läser flödet och mejlar de nya erbjudandena automatiskt.
import rss from '@astrojs/rss';
import { getOffers, isActive, offerPath, formatDate } from '../lib/offers';
import { offerTypes, site } from '../site.config';

export async function GET(context) {
  const offers = (await getOffers())
    .filter((o) => isActive(o))
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .slice(0, 30);
  return rss({
    title: 'Gratisbevakaren – nya gratissaker från kostaringet.se',
    description: 'Nya gratisprover, startpaket och provperioder i Sverige, kontrollerade hos företagen.',
    site: context.site,
    items: offers.map((o) => {
      const notes = [
        offerTypes[o.data.type],
        o.data.shipping === 'tillkommer' ? 'frakt tillkommer' : o.data.shipping > 0 ? `frakt ${o.data.shipping} kr` : null,
        ...o.data.requirements,
        o.data.expires ? `gäller till ${formatDate(o.data.expires)}` : null,
      ].filter(Boolean);
      return {
        title: o.data.seoTitle ?? o.data.title,
        link: offerPath(o),
        pubDate: o.data.published,
        description: `${o.data.description} (${notes.join(' · ')})`,
        categories: [o.data.brand],
      };
    }),
    customData: '<language>sv-se</language>',
  });
}
