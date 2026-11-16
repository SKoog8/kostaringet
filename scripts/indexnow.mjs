// Tells Bing and other IndexNow search engines about new or changed pages, right after a deploy.
// Usage: npm run indexnow            (pages whose <lastmod> is today, read from dist/ after npm run build)
//        npm run indexnow -- --all   (every page in the sitemap)
//        npm run indexnow -- /gratis/x/ /guide/y/   (specific paths)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const KEY = 'a258de3b48853174c358a722610e2ad4'; // also served as public/a258de3b48853174c358a722610e2ad4.txt
const HOST = 'kostaringet.se';
const args = process.argv.slice(2);

let urls;
if (args.some((a) => a.startsWith('/'))) {
  urls = args.filter((a) => a.startsWith('/')).map((p) => `https://${HOST}${p}`);
} else {
  const xml = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  urls = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
    .filter(([, , lastmod]) => args.includes('--all') || (lastmod ?? '').startsWith(today))
    .map(([, loc]) => loc);
}
if (!urls.length) {
  console.log('indexnow: inga ändrade sidor i dag');
  process.exit(0);
}
// curl instead of fetch, so the request follows the environment's HTTPS proxy settings.
const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls });
const status = Number(
  execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', '-H', 'Content-Type: application/json; charset=utf-8', '--data-binary', body, 'https://api.indexnow.org/indexnow']).toString(),
);
console.log(`indexnow: skickade ${urls.length} adresser, svar ${status}`);
if (status >= 400) process.exit(1);
