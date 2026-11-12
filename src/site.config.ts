// Central configuration for kostaringet.se.
// Categories, navigation and ad settings live here so they can be changed in one place.

export const site = {
  name: 'Kostar ingenting',
  domain: 'kostaringet.se',
  url: 'https://kostaringet.se',
  tagline: 'Gratisprover och prova på-erbjudanden, samlade på ett ställe.',
  description:
    'Kostaringet.se samlar gratisprover, gratis babypaket, prova på-erbjudanden och saker du kan beställa helt gratis i Sverige. Uppdateras löpande.',
  locale: 'sv_SE',
  email: 'hej@kostaringet.se',
};

export type CategorySlug =
  | 'foraldrar'
  | 'skonhet'
  | 'mat-dryck'
  | 'halsa'
  | 'hem'
  | 'djur'
  | 'tjanster'
  | 'ovrigt';

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Short label used in cards and filters. */
  short: string;
  /** Public path. Föräldrar has its own top level page for SEO. */
  path: string;
  /** Used as <h1> and <title> on the category page. */
  heading: string;
  intro: string;
}

export const categories: Category[] = [
  {
    slug: 'foraldrar',
    name: 'Nyblivna föräldrar',
    short: 'Föräldrar',
    path: '/nyblivna-foraldrar/',
    heading: 'Gratis till gravida och nyblivna föräldrar',
    intro:
      'Babyboxar, startpaket, blöjprover och välkomstgåvor. Få grupper erbjuds så mycket gratis som blivande och nyblivna föräldrar – här är det som går att beställa just nu.',
  },
  {
    slug: 'skonhet',
    name: 'Skönhet & hygien',
    short: 'Skönhet',
    path: '/kategori/skonhet/',
    heading: 'Gratisprover på skönhet och hygien',
    intro: 'Hudvård, smink, parfym och hygienprodukter som går att prova utan att betala.',
  },
  {
    slug: 'mat-dryck',
    name: 'Mat & dryck',
    short: 'Mat & dryck',
    path: '/kategori/mat-dryck/',
    heading: 'Gratis mat och dryck att prova',
    intro: 'Smakprov, gratis matkassar, kaffeprover och andra erbjudanden att äta och dricka.',
  },
  {
    slug: 'halsa',
    name: 'Hälsa',
    short: 'Hälsa',
    path: '/kategori/halsa/',
    heading: 'Gratisprover inom hälsa',
    intro: 'Kosttillskott, egenvård, tester och andra hälsoprodukter som skickas gratis.',
  },
  {
    slug: 'hem',
    name: 'Hem & hushåll',
    short: 'Hem',
    path: '/kategori/hem/',
    heading: 'Gratis till hemmet',
    intro: 'Tvättmedel, rengöring, katalogprover och annat till hushållet.',
  },
  {
    slug: 'djur',
    name: 'Husdjur',
    short: 'Husdjur',
    path: '/kategori/djur/',
    heading: 'Gratis till hund och katt',
    intro: 'Foderprover, välkomstpaket och klubbar för dig med husdjur.',
  },
  {
    slug: 'tjanster',
    name: 'Prova på-tjänster',
    short: 'Prova på',
    path: '/kategori/tjanster/',
    heading: 'Prova på gratis: provperioder och tjänster',
    intro:
      'Streaming, ljudböcker, tidningar och appar med gratis provperiod. Vi skriver alltid ut om du behöver säga upp själv.',
  },
  {
    slug: 'ovrigt',
    name: 'Övrigt',
    short: 'Övrigt',
    path: '/kategori/ovrigt/',
    heading: 'Övriga gratiserbjudanden',
    intro: 'Allt som inte passar in någon annanstans – men som fortfarande kostar ingenting.',
  },
];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<
  CategorySlug,
  Category
>;

export const offerTypes = {
  gratisprov: 'Gratisprov',
  startpaket: 'Startpaket',
  provperiod: 'Provperiod',
  medlemsgava: 'Medlemsgåva',
  gratis: 'Helt gratis',
} as const;
export type OfferType = keyof typeof offerTypes;

export const nav = [
  { href: '/gratis/', label: 'Alla erbjudanden' },
  { href: '/nyblivna-foraldrar/', label: 'Nyblivna föräldrar' },
  { href: '/kategori/tjanster/', label: 'Prova på' },
  { href: '/jul/', label: 'Jul' },
  { href: '/blogg/', label: 'Blogg' },
];

// Ads are off until an AdSense publisher id is set. When enabled, a consent
// banner (CMP) is required for visitors in the EU – see README.
export const ads = {
  enabled: false,
  provider: 'adsense' as const,
  client: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: {
    listing: '0000000000',
    article: '0000000000',
    sidebar: '0000000000',
  },
};

// Our own products (sold elsewhere, e.g. on Etsy). Shown in clearly labelled
// "Från oss" boxes, never mixed in with the free offers.
export interface Product {
  slug: string;
  title: string;
  tagline: string;
  price: string;
  url: string;
  image: string;
  imageAlt: string;
  format: string;
  includes: string[];
  /** Optional free sample (our own PDF) that leads to the full product. */
  freebie?: { title: string; file: string; page: string };
}

export const products: Product[] = [
  {
    slug: 'blojfri-pa-7-dagar',
    title: 'Blöjfri på 7 dagar',
    tagline:
      'En svensk steg-för-steg-guide som tar er från blöja till potta på en vecka – med tre intensiva dagar hemma och sedan ut i vardagen och förskolan.',
    price: '98,75 kr',
    url: 'https://www.etsy.com/se/listing/4603755049/pottraning-pa-7-dagar-svensk-pdf-guide-o',
    image: '/produkter/blojfri-pa-7-dagar.jpg',
    imageAlt: 'Blöjfri på 7 dagar – PDF-guide om potträning',
    format: 'PDF, 17 sidor A4 · laddas ner direkt',
    includes: [
      'Checklista: är ditt barn redo?',
      'En sida per dag med mål, steg och tips',
      'Logg för kiss, bajs och olyckor',
      'Klistermärkestavla och diplom att skriva ut',
    ],
    freebie: {
      title: 'Gratis smakprov: checklista och logg för dag 1',
      file: '/produkter/blojfri-pa-7-dagar-smakprov.pdf',
      page: '/pottraning-gratis-checklista/',
    },
  },
];

export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p])) as Record<string, Product>;
