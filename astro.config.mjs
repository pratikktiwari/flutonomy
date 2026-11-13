import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// SITE / BASE_PATH are set by the GitHub Pages workflow
// (https://pratikktiwari.github.io + /flutonomy). Locally they default to the root.
export default defineConfig({
  site: process.env.SITE ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  integrations: [mdx()],
});
