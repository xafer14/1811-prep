// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  // Shiki injects inline styles that the hash CSP blocks; no code highlighting is needed.
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: true,
  },
});
