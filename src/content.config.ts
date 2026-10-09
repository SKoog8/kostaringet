import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categorySlugs = [
  'foraldrar',
  'skonhet',
  'mat-dryck',
  'halsa',
  'hem',
  'djur',
  'tjanster',
  'ovrigt',
] as const;

const offerTypes = ['gratisprov', 'startpaket', 'provperiod', 'medlemsgava', 'gratis'] as const;

const erbjudanden = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/erbjudanden' }),
  schema: z.object({
    title: z.string(),
    /** Meta description, ideally 120–160 characters. */
    description: z.string(),
    brand: z.string(),
    category: z.enum(categorySlugs),
    type: z.enum(offerTypes).default('gratisprov'),
    /** The official page where the reader claims the offer. */
    url: z.string().url(),
    /** Short notes on what is required, e.g. "Kräver medlemskap". */
    requirements: z.array(z.string()).default([]),
    /** Shipping cost in SEK. 0 means truly free, 'tillkommer' when the amount is unknown. */
    shipping: z.union([z.number(), z.literal('tillkommer')]).default(0),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Last date someone (or the bot) confirmed the offer still works. */
    checked: z.coerce.date().optional(),
    expires: z.coerce.date().optional(),
    status: z.enum(['aktiv', 'avslutad']).default('aktiv'),
    featured: z.boolean().default(false),
    /** Bot-found offers start as drafts and are published when reviewed. */
    draft: z.boolean().default(false),
    /** Where the bot found the tip. Not shown publicly. */
    source: z.string().optional(),
  }),
});

const blogg = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blogg' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(categorySlugs).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { erbjudanden, blogg };
