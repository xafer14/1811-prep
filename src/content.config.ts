import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { bodyCompositionSchema, organizationSchema, standardSchema } from './lib/standards/schema';

const json = (folder: string) => glob({ pattern: '*.json', base: `./src/content/${folder}` });

export const collections = {
  organizations: defineCollection({ loader: json('organizations'), schema: organizationSchema }),
  standards: defineCollection({ loader: json('standards'), schema: standardSchema }),
  bodyComposition: defineCollection({
    loader: json('body-composition'),
    schema: bodyCompositionSchema,
  }),
};
