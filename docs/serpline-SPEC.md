# SPEC: Serpline (Chrome extension + landing site)

Read `apps/serpline/CLAUDE.md` first. This file is the source of truth for Serpline features and phases.

> **Domains:** the family site is `https://getlineapps.com` with Serpline at `/serpline` (see the Extensions project doc `claude/line-family-domains.md`). Wherever this SPEC says `SITE_URL`, read `LINE_SITE_URL + '/serpline'`; the landing is a route in the shared `apps/site`, not a separate `apps/serpline-site` project.

---

## 1. Product
- **What:** a free Chrome extension that checks the page you are on, in a side panel: SEO basics with a score, a Google preview, the heading outline, links with status, raw HTML vs rendered page, and AI crawler access from `robots.txt`. One click gives an audit PDF.
- **Audience:** SEO specialists, marketers, developers, agencies. English first, Azerbaijani second.
- **Business goal:** lead magnet for technical SEO work. Contact CTAs go to shamistanisayev.com. No paid plan, no account.
- **Scope:** one page at a time. Serpline never crawls a site.

## 2. Design reference (`design/serpline/`)
Same format as Hitline's `design/` (`.dc.html` artboards with `{{...}}` holes, `<sc-for>`, `<sc-if>`, `<dc-import>`, demo logic in `class Component extends DCLogic`). `screens/*.png` are 1x renders of every artboard (fonts are the real ones). The demo shop "Lumo" and `example.com` are fictional. `brand-icons/` holds the AI company marks (Simple Icons 15.22.0, CC0 package, trademarks of their owners).

| Artboard | What it is | Where it lives |
|---|---|---|
| Main | Side panel, Summary tab | `apps/serpline` side panel |
| Headings | Side panel, Headings tab, highlight overlay on the page | panel tab + overlay |
| Links | Side panel, Links tab after the internal link check | panel tab |
| Render | Side panel, Render tab | panel tab |
| Ai | Side panel, AI tab | panel tab |
| Settings | Side panel settings view | panel route |
| Stale | Panel after the user opened another page | panel state |
| Report | Audit PDF (A4) | `packages/report` Serpline template |
| Welcome | Page opened after install | extension page `welcome.html` |
| Uninstall | Page opened after uninstall | site route `/uninstalled` |
| Landing, LandingTablet, LandingMobile | Landing at 1440, 820, 390 | `apps/serpline-site` route `/` |
| BrowserBar, SitePage | Chrome chrome and the fake shop | mock only, SitePage is the model for the fixture (§10) |
| PanelHeader | Chrome's side panel title row plus Serpline's page row and tabs | panel component |
| Mark | Crawler and standard badge used in the landing marquee | `packages/ui` |
| Logo | Line family logo (same as Hitline's) | `packages/ui` |

The top 40px row of PanelHeader (icon, "Serpline", pin, close) is drawn by Chrome itself. Do not build it; it is in the mock for realism.

## 3. Extension architecture (`apps/serpline`)
Entrypoints (WXT):
- `sidepanel/`: React app. Manifest `side_panel.default_path`.
- `background.ts` (service worker):
  - `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })`.
  - `action.onClicked(tab)`: call `chrome.sidePanel.open({ tabId: tab.id })` inside the click handler (user gesture), then tell the panel to check that tab. The click also grants `activeTab` for the tab.
  - `commands`: `_execute_action` with suggested key `Alt+Shift+S` (fires the same `onClicked`).
  - `runtime.onInstalled` (reason `install`) opens `welcome.html`.
  - `runtime.setUninstallURL(SITE_URL + '/uninstalled?utm_source=serpline&utm_medium=extension&utm_campaign=uninstall&v=' + version)`.
  - No other logic. No network.
- `welcome/`: static page from the Welcome artboard.
- Manifest: name "Serpline", short description (§11), permissions `activeTab`, `scripting`, `sidePanel`, `storage`, `optional_host_permissions` `["https://*/*", "http://*/*"]`. No `host_permissions`. Icons 16, 32, 48, 128 from the Serpline logo tile.

### 3.1 Data capture (all inside the inspected page)
When the user clicks the icon or presses the shortcut, the panel runs one `chrome.scripting.executeScript` on that tab (world `ISOLATED`). The injected function returns a plain JSON snapshot:
- **Rendered DOM:** `document.title`, all `<meta>` (name, property, content), `<link rel>` (canonical, alternate hreflang), `<html lang>`, headings H1 to H6 in order (level, text, a CSS path), images (src, alt present or empty, size, CSS path), anchors (href resolved, text, rel, CSS path), JSON-LD blocks (raw text), word count of `document.body.innerText`.
- **Raw HTML:** `fetch(location.href, { cache: 'no-store', credentials: 'include' })` then `text()`. Content script requests use the page's origin, so this is same-origin and needs no host permission. Cap at 5 MB.
- **robots.txt** and **llms.txt:** `fetch(location.origin + '/robots.txt')` and `'/llms.txt'`, status and text (cap 500 KB).
- **Link status** (only when the user presses "Check links" in the Links tab, or automatically if the setting is on): internal links only (same origin), unique URLs, max 100, 4 at a time, 8 s timeout each. `fetch(url, { method: 'HEAD', redirect: 'follow' })`, fall back to `GET` when HEAD returns 405. Record `status`, `redirected`, final `url`.
- The panel parses the raw HTML with `DOMParser` and runs the same extractors on it as on the live DOM (functions live in `packages/seo-core`, and the injected function only collects raw data).
- On `chrome://`, Web Store and PDF pages show "Serpline can't read this page" with one line on why.
- Results live in panel memory only, keyed by tab id. Nothing is persisted.

### 3.2 When the page changes (Stale artboard)
- The panel listens to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` **without** the `tabs` permission (URL is not needed; only `status === 'complete'` and the tab id). When the active tab or its document changes after a check, show the Stale state: "You opened a new page", the "Check this page" button, the shortcut hint, the previous result card and the "What Serpline checks" chips.
- "Check this page": first try `executeScript`. If it fails for lack of access, call `chrome.permissions.request({ origins: [origin + '/*'] })` from the click (Chrome shows its own prompt for that one site), then retry. If the user declines, keep the Stale state and point to the icon and shortcut.
- Phase 1 includes a spike that confirms this flow on Chrome stable and documents the result in `docs/serpline/PLAN.md`.

## 4. Detection logic (`packages/seo-core`)
Pure functions with Vitest fixtures in `packages/seo-core/fixtures/`.

### 4.1 Extractors (run on both the live snapshot and the raw HTML)
- title, meta description, canonical (absolute), robots meta and `googlebot` meta, `lang`, viewport, hreflang list, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`), Twitter card
- headings in order with levels; images with alt state (`missing`, `empty`, `present`); anchors classified `internal` (same registrable domain), `external`, plus `nofollow`, `sponsored`, `ugc`, empty anchor text
- JSON-LD: parse each block, collect `@type` values (also inside `@graph`), report parse errors
- word count (whitespace split of visible text; for raw HTML strip `script`, `style`, `noscript`, `template`)

### 4.2 Render diff
Compare raw vs rendered for: title, description, canonical, robots meta, H1 count and text, word count, link count, JSON-LD types. Output per signal: `same`, `raw_missing`, `changed`. "Needs JavaScript" share = `1 - rawWords / renderedWords` (0 when rendered is 0). List elements that exist only after JavaScript: H1 to H3 by text, JSON-LD types, sections with more than 50 words (by nearest `id` or tag), link count by section.

### 4.3 SERP preview
- Pixel width with Arial advance widths (table for ASCII 32 to 126 in `serp.ts`, 556/1000 em for other characters). Title measured at 20px, description at 14px.
- Limits: title 600 px; description 920 px desktop, 680 px mobile.
- Truncation: cut to the longest prefix whose width plus `" ..."` fits, back off to the last space when it is past 60% of the cut, strip trailing punctuation, append `" ..."`. Return shown text and the number of characters kept.
- URL line: `https://host › seg › seg`. Site name: first label of the host, capitalized.
- The landing mini tool imports these same functions.

### 4.4 robots.txt and AI crawlers
- Parser per RFC 9309: groups by `User-agent`, `Allow` / `Disallow` with `*` and `$`, longest match wins, `Allow` wins a tie, a bot without its own group falls back to `*`. Collect `Sitemap:` lines.
- Status for the current page path: `allowed` (own group allows), `allowed_default` (no own group, `*` allows; UI "Allowed by *"), `blocked` (with the matching line for the UI). 404 robots.txt means all allowed.
- Bot list (config file, easy to extend), grouped:

| Group | User-agent | Shown as | Owner badge |
|---|---|---|---|
| Search and answers | OAI-SearchBot | ChatGPT search | OpenAI |
| Search and answers | ChatGPT-User | ChatGPT browsing | OpenAI |
| Search and answers | Claude-SearchBot | Claude search | Anthropic |
| Search and answers | Claude-User | Claude browsing | Anthropic |
| Search and answers | PerplexityBot | Perplexity answers | Perplexity |
| Search and answers | Perplexity-User | Perplexity browsing | Perplexity |
| Model training | GPTBot | OpenAI | OpenAI |
| Model training | ClaudeBot | Anthropic | Anthropic |
| Model training | Google-Extended | Gemini | Google |
| Model training | Applebot-Extended | Apple | Apple |
| Model training | CCBot | Common Crawl | CC letters |
| Model training | Bytespider | ByteDance | ByteDance |
| Model training | Meta-ExternalAgent | Meta | Meta |

  The design shows 11 of them in the counts ("8/11 allowed"); the final list is this table. The hero count is allowed (including by `*`) over total.
- `llms.txt`: `found` (200 and text/plain or markdown), `not_found`. It is informational, never a scored issue.

### 4.5 Issue rules (one list for panel, PDF and score)
| Id | Severity | Tab | Rule | Title in UI |
|---|---|---|---|---|
| RAW_H1 | High | Render | H1 present after render, none in raw HTML | The H1 appears only after JavaScript |
| RAW_TEXT | High | Render | needs-JavaScript share at least 50% | 91% of the text needs JavaScript |
| NO_TITLE | High | Summary | title missing or empty | The page has no title |
| NOINDEX | High | Summary | robots meta or `X-Robots-Tag` in raw response has `noindex` | The page asks not to be indexed |
| CANONICAL_OTHER | Medium | Summary | canonical points to another URL | Canonical points to another page |
| SCHEMA_JS | Medium | Render | a JSON-LD type exists only after render | Product schema is added by JavaScript |
| DESC_LONG | Medium | Summary | description cut at the desktop limit | The description is cut off in Google |
| DESC_MISSING | Medium | Summary | no meta description | No meta description |
| IMG_ALT | Medium | Headings | images with `alt` missing (empty alt is fine) | 3 images have no alt text |
| OG_DESC | Medium | Summary | `og:description` missing | og:description is missing |
| BROKEN_LINK | Medium | Links | internal link status 4xx or 5xx | A link on this page leads to a 404 |
| AI_SEARCH_BLOCKED | Medium | AI | any "Search and answers" bot blocked | PerplexityBot is blocked |
| H1_MULTI | Low | Headings | more than one H1 | The page has 2 H1s |
| HEADING_SKIP | Low | Headings | a heading level jumps by more than 1 | An H4 follows an H2 |
| REDIRECT_LINKS | Low | Links | internal links that redirect | 2 links point to redirects |
| TITLE_LONG | Low | Summary | title cut at 600 px | The title is cut off in Google |

- Training bots blocked is shown in the AI tab but is never an issue (it is a business choice).
- Each issue carries a one-line explanation, a one-line fix and the evidence (element path, robots line or URL).
- **Score:** `100 - 8 x High - 4 x Medium - 2 x Low`, minimum 0. Link issues count only after the link check ran. Labels: 90 and up "good", 50 to 89 "needs work", below 50 "poor". The design scenario gives 56 with 2 high, 6 medium, 2 low.
- Tab badges show the number of issues on that tab (red badge). Summary has no badge.

## 5. Screens
Build every screen to match its artboard and copy. Side panel layout: page row (host bold, path muted, truncated), "Check again", "Audit PDF", Settings; tabs Summary, Headings, Links, Render, AI; scrollable content on `#EFEDF5`; dark footer "Need help fixing these? Get in touch" on Summary, Headings and Links; lime CTA card on Render and AI instead.
- **Summary:** blue hero card (host, check time, score ring, label, issue counts); "On-page checks" list (Title, Meta description, Canonical, Robots meta, H1, Image alt text, Structured data, Open Graph, hreflang) with icon pills; Google preview card with Mobile / Desktop toggle (default from Settings) and the two measurement rows. Desktop preview renders at 600px and scales to the panel width.
- **Headings:** count tiles H1 to H4 (H1 tile in Problem colors with an icon when RAW_H1 or H1_MULTI), "Highlight on page" switch, outline tree with level chips and indent, "Images" card listing images without alt (file name, "No alt").
- **Highlight overlay** (on the page, only while the switch is on): injected style and labels inside a shadow root; dashed blue (`#2563EB`) outline plus "H1 added by JavaScript" or "H2" label on headings, red outline plus "No alt" label on images, and a dark pill at the bottom "Serpline highlights: N headings, N images" with "Hide". Removing it leaves no trace. No links in the overlay.
- **Links:** tiles (links, internal, external, nofollow), check bar with the stacked OK (`#12B76A`) / redirect (`#F79009`) / broken (`#D92D20`) bar, its text legend and the note, filter chips (All, Issues, Internal, External), list rows (anchor text, path, status pill: `404`, `301` with the target in the path line), issue card with fix. Before the check, the bar shows "Check 52 internal links" as a button.
- **Render:** blue hero card with the needs-JavaScript share and the word bar, comparison table (Signal, Raw HTML, Rendered), "Added by JavaScript" code card and one-line fix, lime CTA "Want server-side rendering set up for SEO?".
- **AI:** blue hero card with the allowed count and the main finding, bots card grouped (Search and answers, Model training) with badges, status pills and the matching robots line under a blocked bot, "N more bots" expander, lime CTA "Want your site to show up in AI answers?", "Files for crawlers" (robots.txt, sitemap from robots.txt, llms.txt).
- **Settings:** Google preview default device, "Check internal links on open" switch (off by default) with note, Language, "Clear all settings" with privacy note, "More free tools" (Hitline, Rivaline, Foldline, Markline), footer with version, Privacy, Contact.
- **Stale:** see §3.2.
- **Welcome:** 3 steps, "Built by Shamistan Isayev", contact link.

## 6. Audit PDF (`packages/report`)
Same builder as Hitline, Serpline template. A4, embedded fonts, selectable text.
- logo and date/time; "SEO and AI search audit", host, page path
- 4 tiles: score, high, medium, low
- "Page" table: Title, Description, Canonical and robots, Raw HTML vs rendered, Links, AI bots
- "Issues and fixes" with severity pills (High, Medium, Low)
- dark CTA box "Need help fixing these issues?" with a lime button to shamistanisayev.com (`utm_campaign=pdf_footer`)
- footer "Made with Serpline. The page was read in your browser and nothing was sent anywhere." and page numbers
- File name `serpline-audit-<host>-<yyyy-mm-dd>.pdf`, downloaded via blob URL and `<a download>`.

## 7. Settings and storage
`chrome.storage.local` keys: `lang: 'en' | 'az'`, `previewDevice: 'mobile' | 'desktop'` (default mobile), `autoCheckLinks: boolean` (default false), `installedAt: number`. Nothing else. "Clear all settings" wipes them. Granted optional site permissions are Chrome's own and are not listed or stored by Serpline.

## 8. i18n
`en.ts` and `az.ts` with typed keys. EN is the copy from the design. Write the AZ translation and add it to `docs/serpline/AZ-REVIEW.md` for owner review. Never translate tool names, bot names, HTML tags or file names.

## 9. Links and UTM
| Place | URL | utm_medium | utm_campaign |
|---|---|---|---|
| Panel footer and lime CTAs, Stale footer | shamistanisayev.com | extension | panel_cta |
| Audit PDF CTA | shamistanisayev.com | extension | pdf_footer |
| Welcome contact link | shamistanisayev.com | extension | welcome |
| Settings "Contact" | shamistanisayev.com | extension | settings |
| Settings "More free tools" | getlineapps.com/hitline, /rivaline, /foldline, /markline | extension | more_tools |
| Settings "Privacy" | SITE_URL/privacy | (none) | (none) |
| Uninstall URL | SITE_URL/uninstalled | extension | uninstall |
| Uninstall "Book an SEO audit" | shamistanisayev.com | extension | uninstall |
| Uninstall "Reinstall Serpline" | SITE_URL | extension | uninstall |
| Landing "Book an SEO audit" | shamistanisayev.com | landing | audit_cta |
| Landing FAQ "Ask me directly" | shamistanisayev.com | landing | faq |
| Landing footer "Built by" | shamistanisayev.com | landing | footer |
| Landing "More free tools" cards | getlineapps.com/<slug> (in the design: each tool's design artifact, from `toolLinks`) | none | none |

`utm_source` is always `serpline`. Other tools' domains are config values.

## 10. Test fixture (`apps/fixture`)
Add a Serpline scenario to the existing Lumo fixture (do not break Hitline's):
- `/seo/products/wireless-headphones-pro-x` built from SitePage: the server HTML has the header, breadcrumb, image and price but **no H1, no product details and no Product JSON-LD**; a script adds the H1, the "Product details" and "Reviews" sections (374 words, 46 links) and the Product JSON-LD. BreadcrumbList JSON-LD is in the server HTML.
- Meta description of 191 characters (the design text), title "Wireless Headphones Pro X | Lumo", self canonical, `index, follow`, no `og:description`, no hreflang.
- 9 images, 3 without `alt` (`pro-x-side.jpg`, `pro-x-folded.jpg`, `pro-x-case.jpg`); an H4 "Bluetooth 5.3" right after the H2 "Specifications".
- Links: `/products/earbuds-mini-old` returns 404, `/headphones` 301 to `/electronics/headphones`, `/returns` 301 to `/help/returns`; 9 external links (3 nofollow).
- `/robots.txt` disallows PerplexityBot, CCBot and Bytespider, lists `/sitemap.xml`; no `/llms.txt`.
- `/seo/electronics/headphones` category page for the Stale state.
- E2E: the panel shows score 56, the same issues and counts as the design; Render shows 38 vs 412 words; AI shows 8/11; the PDF is generated; no request leaves `localhost`.

## 11. Landing site (`apps/serpline-site`, Astro)
- **Routes:** `/` (Landing, LandingTablet, LandingMobile; CSS animations and hovers, radio-input tabs, `details` FAQ, `prefers-reduced-motion`), `/privacy`, `/uninstalled` (reason radios, optional text, hidden `v`, posts to a Pages Function `/api/feedback` that e-mails the owner through Resend, honeypot and rate limit; reuse Hitline's function code from a shared package if it exists), `/404`.
- **Hero (dark):** background `#120D24`, grid lines `rgba(255,255,255,.05)`, soft glow in `#2563EB` top right and in lime `#C6F36B` bottom left. Heading white, lead `#D0CBE6`, the highlighted words in `#93C5FD` with a thin lime underline. Main button blue `#2563EB` with white text; second button transparent (`rgba(255,255,255,.06)` fill, `rgba(255,255,255,.28)` border, white text). Callouts without background: 20px lime circle with a `#1A2E05` check, 14px/600 `#D0CBE6`, 24px apart. "Free Chrome extension" pill: 32px high, padding `0 14px 0 12px`, 8px between dot and text, 13px/600, fill `rgba(255,255,255,.08)`, border `rgba(255,255,255,.16)`, 8px `#12B76A` dot with a green pulse. The product mock and floating cards stay white with dark text.
- **Hero marquee on dark:** cards `rgba(255,255,255,.06)` with an inset `rgba(255,255,255,.13)` ring, `backdrop-filter: blur(8px)`, text `#EDEAF8`; icons keep their light tint squares with a `rgba(255,255,255,.08)` ring; hover `rgba(255,255,255,.1)` fill, `rgba(255,255,255,.26)` ring, shadow `0 12px 20px -14px rgba(0,0,0,.7)`, 3px lift; caption `#B9B4D0`.
- **Header:** sticky (`position: sticky; top: 0`), `rgba(18,13,36,.94)` with `backdrop-filter: blur(14px)`, bottom border `rgba(255,255,255,.08)`, Logo dark theme, links `#D0CBE6`, white on hover with a lime underline. No ancestor may have `overflow: hidden` (it breaks sticky): use `overflow-x: clip` on the page wrapper and `overflow: clip` only on sections that do not contain the header.
- **Buttons:** on hover only the arrow (`class="arr"`) slides 4px; the Chrome icon and other icons stay. Text color is fixed in every state (blue button white, lime button `#1A2E05`, outline button white) with selectors stronger than a global `a:hover`.
- **Colors and logo:** blue accent `#2563EB`, bright `#93C5FD`; the other tools and the logo rule (own glyph per tool, never a letter; Markline yellow with ink glyph and the marker under "line") are in `apps/serpline/CLAUDE.md`. Status colors only for statuses, always with an icon and a label; the brand color is never a status.
- **Hero marquee** (same style as Rivaline's, built from `.marq` and `.tag` in `design/serpline/Landing.dc.html`):
  - Place: inside the hero section, below the buttons and the mock, `margin-top: 110px`, centered.
  - Caption "Checks what search engines and AI crawlers see": 13px, weight 600, `#667085`, 18px above the strip.
  - Item: white card, height 52px, radius 14px, border `box-shadow: 0 0 0 1px #DCD9E6`, padding `0 20px 0 12px`, 14px gap. Inside: a 30px Mark (radius 27% of size, glyph 62%, on its own tint) and the name (15px, 600). File and attribute names (`robots.txt`, `llms.txt`, `rel=canonical`, `hreflang`) use JetBrains Mono.
  - Motion: the list is rendered twice (second copy `aria-hidden`), `translateX(-50%)` over 40s linear, infinite; paused on hover; 10% `mask-image` fade on both edges; hover lifts the card 3px with `0 0 0 1px #D0D5DD, 0 12px 20px -14px rgba(16,24,40,.35)`.
  - Below 640px: height 44px, 14px text. `prefers-reduced-motion`: no animation.
  - Items, in order, only things Serpline really checks: Google preview (Google), GPTBot, OAI-SearchBot, ChatGPT-User (OpenAI), ClaudeBot, Claude-SearchBot (Anthropic), PerplexityBot (Perplexity), Google-Extended (Google), Applebot-Extended (Apple), Bytespider (ByteDance), Meta-ExternalAgent (Meta), CCBot (neutral bot icon), robots.txt, llms.txt (file icon), rel=canonical (link icon), Meta robots (eye icon), hreflang (globe icon), JSON-LD (braces icon), Open Graph (share icon).
  - Brand marks come only from `design/serpline/brand-icons/` (Simple Icons, unaltered). Everything without a Simple Icons mark uses the neutral stroke icons from `Mark.dc.html` on the blue tint `#EFF6FF`. Never draw a brand logo by hand.
- **SERP preview tool** (`#preview`): a small vanilla TypeScript island using `packages/seo-core` §4.3. Inputs: title, description, URL; meters with px and characters; Desktop / Mobile toggle; status "Fits" or "Cut after N characters". Nothing is sent or stored. Default values are the Lumo example from the design.
- **SEO:** title, description, canonical, Open Graph image 1200x630 from the hero, sitemap, robots (allow all AI bots), `llms.txt`, JSON-LD `SoftwareApplication` (price 0, Chrome, DeveloperApplication, author Person Shamistan Isayev, url shamistanisayev.com) and `FAQPage`.
- **Site analytics (optional):** same as Hitline: only if `PUBLIC_GTM_ID` is set, with Consent Mode v2 defaults denied.
- **Performance:** Lighthouse mobile 95+ on all four categories; self-hosted fonts; no framework JS beyond the island.
- "Add to Chrome" points to the Web Store listing URL (config value until it exists).
- Deploy as Cloudflare Pages project `serpline` with the custom domain.

## 12. Phases
Each phase ends with the checks from `apps/serpline/CLAUDE.md`, a commit and a short Azerbaijani report.

### Phase 0: Setup and plan
- Check the monorepo state: which Hitline phases are done, which shared packages exist (`ui`, `report`, fixture, feedback function). If Hitline's Phase 2 (design system) is not done, stop and tell the owner.
- Read `design/serpline/` and list every screen, state and component.
- Write `docs/serpline/PLAN.md`: artboards to components, what is reused from Hitline, gaps and questions.
- **Done when:** PLAN.md exists.

### Phase 1: Scaffold and permission spike
- `apps/serpline` (WXT, React, TS), `apps/serpline-site` (Astro), `packages/seo-core`, CI jobs for them.
- Side panel opens from the icon and from `Alt+Shift+S`; a test button runs `executeScript` and fetches the raw HTML and `robots.txt` of the tab.
- Spike: confirm §3.1 and §3.2 on Chrome stable (activeTab after `action.onClicked`, same-origin fetch from the injected function, `permissions.request` from the panel). Write the result in PLAN.md.
- **Done when:** CI is green and the spike works on the fixture and on one real public site.

### Phase 2: Design system additions
- Serpline theme tokens, side panel shell (page row, tabs with badges, footer CTA), level chips, AI crawler badges with brand marks, Google result component, switch, segmented control.
- Extension icons 16, 32, 48, 128 from the Serpline tile.
- Add them to the `packages/ui` preview page.
- **Done when:** the preview matches the design and contrast is checked.

### Phase 3: seo-core and fixture
- Everything in §4 with unit tests (extractors on raw and rendered fixtures, render diff, SERP truncation, robots.txt parser with RFC 9309 cases, bot status, issue rules, score).
- The fixture pages from §10.
- **Done when:** running the fixture snapshot through seo-core gives exactly the design's issues and score 56.

### Phase 4: Side panel, part 1
- Summary, Headings (with the highlight overlay) and Links with the internal link check.
- **Done when:** on the fixture they match `Main.png`, `Headings.png` and `Links.png`.

### Phase 5: Side panel, part 2
- Render, AI, the Stale state and the "can't read this page" state.
- **Done when:** they match `Render.png`, `Ai.png` and `Stale.png`, and "Check this page" works after navigation.

### Phase 6: Settings and i18n
- Settings view, EN and AZ dictionaries, `docs/serpline/AZ-REVIEW.md`.
- **Done when:** it matches `Settings.png` and switching language changes every panel text.

### Phase 7: Audit PDF, welcome, uninstall hook
- Serpline report template, the welcome page, `setUninstallURL`.
- **Done when:** the fixture PDF matches `Report.png` in content and layout, and the welcome page opens on install.

### Phase 8: Landing site and deploy
- All routes from §11, the SERP preview island, the feedback function, SEO files.
- Deploy to Cloudflare Pages, custom domain, Resend for the serpline domain if it differs from Hitline's.
- **Done when:** `/`, `/privacy` and `/uninstalled` are live over HTTPS, a test feedback reaches the owner, and 1440 / 820 / 390 screenshots match the Landing PNGs.

### Phase 9: Chrome Web Store package
- `wxt zip`, 5 screenshots 1280x800 from the fixture (Summary, Headings with highlights, Render, AI, Audit PDF), promo tile 440x280, marquee 1400x560.
- `docs/serpline/STORE-LISTING.md`: name "Serpline: SEO & AI Search Audit", short description (§1, max 132 characters): "Technical SEO, JavaScript render and AI crawler checks for the page you're on. Free, no data collected.", long description, category Developer Tools, single purpose, a justification for each permission (including why `optional_host_permissions` is only requested per site), privacy answers (no data collected, no sale, no remote code), privacy policy URL.
- Everything in `store/serpline/`, plus a GitHub release.
- **Done when:** the owner only has to upload and paste.

### Phase 10: QA and handover
- Test on 3 real public sites the owner names (one JavaScript-heavy), plus the fixture. Fix false positives (robots.txt edge cases, relative canonicals, JSON-LD `@graph`).
- Lighthouse and axe on the site.
- Update `docs/OWNER-GUIDE.md` with a Serpline section in Azerbaijani.
- **Done when:** no false positives on the test sites, site scores 95+, guide updated.

## 13. Owner inputs still needed (config placeholders)
- Web Store listing URL after the first upload
- Feedback recipient (same Resend key as Hitline if the domain is verified)
- 3 public sites for QA
