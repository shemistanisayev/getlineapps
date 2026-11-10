# apps/site: getlineapps.com

One static Astro site for the whole Line family (`docs/line-family-domains.md`). Cloudflare Pages project `getlineapps`, deployed by CI on every push to `main` after all checks pass.

## Routes

| Path                                    | Source                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `/`, `/az`                              | `src/components/HubPage.astro` (design `design/hub/Main.dc.html`)                  |
| `/privacy/<slug>`, `/az/privacy/<slug>` | `src/components/PrivacyPage.astro` (design `design/hub/Privacy.dc.html`)           |
| `/privacy`, `/az/privacy`               | 301 to the Hitline tab (`public/_redirects`, plus Astro `redirects` as a fallback) |
| `/404`                                  | `src/pages/404.astro` (EN and AZ on one page)                                      |
| `/sitemap.xml`, `/robots.txt`           | `src/pages/*.ts`                                                                   |
| `POST /api/feedback`                    | `functions/api/feedback.ts` (re-exports `@line/site-kit/feedback`)                 |

## Content

All text lives in `src/content/` (EN + AZ JSON, Zod schemas in `src/content/schemas.ts`). Components only read these files. A broken edit fails the build.

- `tools.json`: `slug`, `status` (`live` | `soon`), `storeUrl`. "Add to Chrome" shows only for `live` tools.
- A tool landing (`/<slug>`) appears in links once `src/content/<slug>/en.json` exists (Faza 3 to 7). Until then the hub links nowhere that would 404.

## Commands

```bash
pnpm --filter @line/site dev        # http://localhost:4321
pnpm --filter @line/site build
pnpm --filter @line/site preview    # serves dist, used by e2e
pnpm --filter @line/site screens    # 1440/820/390 screenshots to test-results/site-screens
pnpm lighthouse                     # Lighthouse mobile on the running preview
pnpm --filter @line/site gen:og     # share image and favicons
```

## Secrets (never in the repo)

```bash
npx wrangler pages secret put RESEND_API_KEY --project-name getlineapps
npx wrangler pages secret put FEEDBACK_TO --project-name getlineapps
```

CI deploy needs the GitHub secret `CLOUDFLARE_API_TOKEN` and the variable `CLOUDFLARE_ACCOUNT_ID`. Optional variable `PUBLIC_GTM_ID` turns on site analytics, loaded only after consent.
