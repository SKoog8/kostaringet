// Optional AI step. With ANTHROPIC_API_KEY set, Claude searches the web for new
// offers, verifies each candidate on the official page and writes the draft text.
// Without a key the bot falls back to keyword heuristics only.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const MODEL = process.env.BOT_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.BOT_EFFORT || 'medium';
// Server-side fallback: if the model declines a request, the API retries on a
// suitable fallback model inside the same call.
const BETAS = ['server-side-fallback-2026-07-01'];

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client;
const getClient = () => (client ??= new Anthropic());

const CATEGORIES = ['foraldrar', 'skonhet', 'mat-dryck', 'halsa', 'hem', 'djur', 'tjanster', 'ovrigt'];
const TYPES = ['gratisprov', 'startpaket', 'provperiod', 'medlemsgava', 'gratis'];

const EDITORIAL = `Du är redaktör för kostaringet.se, en svensk sajt som listar saker privatpersoner i Sverige kan få, prova eller beställa helt gratis: gratisprover, varuprover, babyboxar, startpaket, välkomstgåvor och gratis provperioder.

Det som räknas:
- Något en privatperson i Sverige kan beställa, hämta eller prova utan att betala för själva produkten.
- Frakt, krav på medlemskap eller en provperiod som övergår i betalning är okej, men ska alltid stå med.

Det som inte räknas:
- Tävlingar, utlottningar, rabatter, "köp 2 betala för 1", gratis frakt, gratis entré till evenemang, kommunala tjänster, erbjudanden till företag, erbjudanden utanför Sverige och sådant som redan har gått ut.

Skrivregler för texterna:
- Skriv på enkel, korrekt svenska med egna ord. Kopiera inte text från källan.
- Saklig ton, som en kunnig vän. Inga utropstecken, inga emojis, inga överdrifter som "fantastisk" eller "missa inte".
- Skriv aldrig något du inte har sett på källan. Är du osäker på en detalj, utelämna den.`;

const offerTool = {
  name: 'report_offer',
  description:
    'Rapportera ditt slutgiltiga omdöme om erbjudandet. Anropa exakt en gång när du är klar med researchen.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'is_free_offer',
      'confidence',
      'reject_reason',
      'brand',
      'title',
      'description',
      'category',
      'type',
      'offer_url',
      'requirements',
      'shipping_sek',
      'expires',
      'body_markdown',
    ],
    properties: {
      is_free_offer: { type: 'boolean', description: 'true om det är ett aktuellt gratiserbjudande enligt reglerna.' },
      confidence: { type: 'string', enum: ['hög', 'medel', 'låg'] },
      reject_reason: { type: 'string', description: 'Kort förklaring om is_free_offer är false, annars tom sträng.' },
      brand: { type: 'string', description: 'Företaget eller varumärket som ger bort produkten.' },
      title: {
        type: 'string',
        description: 'Rubrik på svenska, max 70 tecken. Ska innehålla "gratis" och vad man får, t.ex. "Gratis hudvårdsprov från X".',
      },
      description: { type: 'string', description: 'Metabeskrivning på svenska, 120–160 tecken.' },
      category: { type: 'string', enum: CATEGORIES },
      type: { type: 'string', enum: TYPES },
      offer_url: { type: 'string', description: 'Direktlänk till erbjudandet hos företaget själv, inte till en nyhetsartikel.' },
      requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Korta krav/villkor, t.ex. "Kräver medlemskap", "Säg upp innan 30 dagar". Tom lista om inga.',
      },
      shipping_sek: {
        type: 'integer',
        description: 'Fraktkostnad i kronor. 0 om helt gratis, -1 om frakt tillkommer men beloppet är okänt.',
      },
      expires: { type: 'string', description: 'Sista dag i formatet ÅÅÅÅ-MM-DD, eller tom sträng om okänt.' },
      body_markdown: {
        type: 'string',
        description:
          'Brödtext i Markdown, 120–300 ord: en inledande mening om vad man får, sedan "## Så beställer du" (numrerad lista) och "## Bra att veta" (punktlista med villkor). Ingen H1.',
      },
    },
  },
};

const OfferSchema = z.object({
  is_free_offer: z.boolean(),
  confidence: z.enum(['hög', 'medel', 'låg']),
  reject_reason: z.string(),
  brand: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(CATEGORIES),
  type: z.enum(TYPES),
  offer_url: z.string(),
  requirements: z.array(z.string()),
  shipping_sek: z.number().int(),
  expires: z.string(),
  body_markdown: z.string(),
});

const candidatesTool = {
  name: 'report_candidates',
  description: 'Rapportera de gratiserbjudanden du hittade. Anropa exakt en gång när du är klar.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['candidates'],
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'url', 'brand', 'summary'],
          properties: {
            title: { type: 'string' },
            url: { type: 'string', description: 'Länk till erbjudandet hos företaget.' },
            brand: { type: 'string' },
            summary: { type: 'string', description: 'En mening om vad man får och eventuella krav.' },
          },
        },
      },
    },
  },
};

const CandidatesSchema = z.object({
  candidates: z.array(z.object({ title: z.string(), url: z.string(), brand: z.string(), summary: z.string() })),
});

const webTools = (maxSearches) => [
  { type: 'web_search_20260209', name: 'web_search', max_uses: maxSearches, user_location: { type: 'approximate', country: 'SE' } },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 6 },
];

/**
 * Runs one research conversation and returns the validated input of the
 * final reporting tool, or null if the model never called it.
 */
async function research({ prompt, tool, schema, maxSearches }) {
  const messages = [{ role: 'user', content: prompt }];
  let nudged = false;

  for (let turn = 0; turn < 8; turn++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: BETAS,
      fallbacks: 'default',
      output_config: { effort: EFFORT },
      system: EDITORIAL,
      tools: [...webTools(maxSearches), tool],
      tool_choice: { type: 'auto' },
      messages,
    });

    if (response.stop_reason === 'refusal') {
      console.warn(`  ! AI declined (${response.stop_details?.category ?? 'okänd kategori'})`);
      return null;
    }

    const call = response.content.find((b) => b.type === 'tool_use' && b.name === tool.name);
    if (call) {
      const parsed = schema.safeParse(call.input);
      if (!parsed.success) {
        console.warn(`  ! AI returned invalid ${tool.name}: ${parsed.error.message}`);
        return null;
      }
      return parsed.data;
    }

    // Keep the full content (including server tool blocks) so the model can continue.
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'pause_turn') continue;
    if (nudged || response.stop_reason === 'max_tokens') return null;
    messages.push({ role: 'user', content: `Avsluta nu genom att anropa ${tool.name}.` });
    nudged = true;
  }
  return null;
}

/** Asks Claude to search the web for new offers on a topic. */
export async function discover(topic, knownUrls, today) {
  const known = knownUrls.slice(0, 80).join('\n');
  const result = await research({
    tool: candidatesTool,
    schema: CandidatesSchema,
    maxSearches: 5,
    prompt: `Dagens datum: ${today}.

Sök på webben efter: ${topic}.

Hitta upp till 6 erbjudanden som är aktuella just nu och som vi inte redan har. Vi har redan dessa länkar:
${known || '(inga ännu)'}

Ange länken till erbjudandet hos företaget självt. Rapportera med report_candidates. Hittar du inget nytt, rapportera en tom lista.`,
  });
  return result?.candidates ?? [];
}

/** Verifies one candidate and writes the draft text. */
export async function verify(candidate, today) {
  return research({
    tool: offerTool,
    schema: OfferSchema,
    maxSearches: 3,
    prompt: `Dagens datum: ${today}.

Vår bot hittade det här tipset:
Rubrik: ${candidate.title}
Länk: ${candidate.link}
Källa: ${candidate.source}${candidate.publisher ? ` (${candidate.publisher})` : ''}
Utdrag: ${candidate.snippet || '(inget)'}

Ta reda på om det här är ett aktuellt gratiserbjudande för privatpersoner i Sverige. Leta upp erbjudandet hos företaget självt och läs villkoren där. Rapportera sedan med report_offer.`,
  });
}
