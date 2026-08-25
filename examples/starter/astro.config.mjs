import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { sitemapConfig } from '@justinguese/astro-kit/lib/sitemap';

export default defineConfig({
  site: 'https://example.de',
  integrations: [sitemap(sitemapConfig({ priorities: { '/': 1.0 } }))],
  vite: { plugins: [tailwindcss()] },
});
