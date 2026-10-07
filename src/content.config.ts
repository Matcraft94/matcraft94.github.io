import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    category: z.enum(['quantitative-finance', 'scientific-ml', 'ml-engineering', 'psychometrics']),
    tags: z.array(z.string()),
    repo: z.string().url().optional(),
    pubDate: z.coerce.date(),
    featured: z.boolean().default(false),
    status: z.enum(['published', 'draft']).default('draft'),
    metrics: z
      .array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() }))
      .optional(),
    stack: z.array(z.string()).optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    year: z.number(),
    authors: z.string(),
    link: z.string().url().optional(),
    pubDate: z.coerce.date(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { caseStudies, publications, blog };
