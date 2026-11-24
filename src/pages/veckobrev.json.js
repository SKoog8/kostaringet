// Underlag till Gratisbevakarens veckobrev. Byggs om vid varje publicering och läses av api/weekly.js.
import { getOffers, isActive, offerPath, latest } from '../lib/offers';
import { getPosts, postPath } from '../lib/posts';
import { offerTypes, site } from '../site.config';

export async function GET() {
  const now = Date.now();
  const day = 864e5;
  const active = (await getOffers()).filter((o) => isActive(o));
  const toItem = (o) => ({
    brand: o.data.brand,
    title: o.data.title,
    description: o.data.description,
    type: offerTypes[o.data.type],
    url: new URL(offerPath(o), site.url).href,
    expires: o.data.expires ? o.data.expires.toISOString().slice(0, 10) : null,
  });
  const fresh = active
    .filter((o) => now - o.data.published.getTime() < 8 * day)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  const endingSoon = active
    .filter((o) => o.data.expires && o.data.expires.getTime() - now < 10 * day && !fresh.includes(o))
    .sort((a, b) => a.data.expires.getTime() - b.data.expires.getTime());
  const popular = active
    .filter((o) => !fresh.includes(o) && !endingSoon.includes(o))
    .sort((a, b) => latest(b).getTime() - latest(a).getTime())
    .slice(0, 3);
  const guide = (await getPosts('guide'))[0];
  const body = {
    generated: new Date().toISOString(),
    activeCount: active.length,
    fresh: fresh.map(toItem),
    endingSoon: endingSoon.map(toItem),
    popular: popular.map(toItem),
    guide: guide
      ? { title: guide.data.title, description: guide.data.description, url: new URL(postPath(guide), site.url).href }
      : null,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
