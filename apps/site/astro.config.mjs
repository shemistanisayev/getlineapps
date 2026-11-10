// getlineapps.com: one static Astro site for the whole Line family (docs/line-family-domains.md).
import { defineConfig, passthroughImageService } from 'astro/config';

export default defineConfig({
  site: 'https://getlineapps.com',
  output: 'static',
  // /privacy/hitline is served from privacy/hitline.html, with no trailing slash redirect on Cloudflare Pages.
  build: { format: 'file', inlineStylesheets: 'always' },
  trailingSlash: 'never',
  // Cloudflare Pages also redirects these at the edge (public/_redirects). These pages are the fallback.
  redirects: {
    '/privacy': '/privacy/hitline',
    '/az/privacy': '/az/privacy/hitline',
  },
  image: { service: passthroughImageService() },
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
