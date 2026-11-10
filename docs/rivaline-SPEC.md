# SPEC: Rivaline (Chrome side panel extension + landing site)

Read `apps/rivaline/CLAUDE.md` and the root `CLAUDE.md` first. This file is the source of truth for Rivaline features and phases.

---

## 1. Product
- **What:** a free Chrome extension that opens in the side panel next to any site and shows its martech stack, the gaps in it, its ads in four ad libraries and its brand kit. One click turns all of it into a one-page competitor report PDF.
- **Audience:** performance marketers, agencies, sales teams preparing for a call, designers and content teams writing a brief. English first, Azerbaijani second.
- **Business goal:** lead magnet. Contact CTAs drive users to shamistanisayev.com. No paid plan, no account.
- **Name in the Chrome Web Store:** "Rivaline: Competitor Research".

## 2. Design reference (`design/rivaline/`)
Same format as Hitline's `design/` (see the root SPEC §2): `*.dc.html` artboards with `{{holes}}`, `<sc-for>`, `<sc-if>`, `<dc-import>` and a `DCLogic` class with demo data; `screens/*.png` rendered at 1x with the real fonts; `brand-icons/*.svg`; `canvas.json`.

The demo site "Kova" on `example.com`, "Glowbar" on `example.net` and "Mira Studio" on `example.org` are fictional.

| Artboard | What it is | Where it lives |
|---|---|---|
| Main | Side panel, Stack tab | `extension` side panel |
| StackDetail | Stack filtered by a category, one tool expanded, gaps card | side panel state |
| Ads | Ads tab | side panel tab |
| Brand | Brand tab | side panel tab |
| BrandExport | Export sheet over the Brand tab, copied toast | side panel overlay |
| Settings | Settings view | side panel route |
| Access | The user switched tabs, the page has not been granted yet | side panel state |
| Restricted | chrome:// pages, Chrome Web Store, other extensions | side panel state |
| Empty | The page has no marketing tools | side panel state |
| Report | Competitor report PDF (A4) | `packages/report` |
| Welcome | Page opened after install | extension page `welcome.html` |
| Uninstall | Page opened after uninstall | site route `/uninstalled` |
| Landing, LandingTablet, LandingMobile | Landing at 1440, 820, 390 | site route `/` |
| BrowserBar, PanelChrome, SitePage | Chrome UI and the fictional sites | mock only (SitePage is the model for the fixture, §11) |
| PanelHeader | Rivaline header with tabs and actions | side panel component |
| Mark | Platform badge with brand marks | `packages/ui` |
| Logo | Line family logo (shared with Hitline) | `packages/ui` |

## 3. Extension architecture (`apps/rivaline/extension`)
Entrypoints (WXT):
- `sidepanel/`: React app. Manifest `side_panel.default_path`.
- `background.ts` (service worker):
  - `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })`.
  - `chrome.action.onClicked`: call `chrome.sidePanel.open({ tabId })` first and synchronously (it must run inside the user gesture), then send `{ type: 'scan', tabId }` to the panel. If the panel is not open yet, the panel scans the active tab when it loads.
  - `commands`: `_execute_action` with `suggested_key` `Alt+Shift+R`. It fires `action.onClicked` and grants `activeTab` like a click.
  - `runtime.onInstalled` (reason `install`): open `welcome.html`, store `installedAt`.
  - `runtime.setUninstallURL(RIVALINE_SITE_URL + '/uninstalled?utm_source=rivaline&utm_medium=extension&utm_campaign=uninstall&v=' + version)`.
  - No other logic. No network.
- `welcome/`: static page from the Welcome artboard.
- Manifest: name "Rivaline", short description (§12), permissions `activeTab`, `scripting`, `storage`, `sidePanel`. No `host_permissions`. Icons 16, 32, 48, 128 from the Rivaline logo tile. `minimum_chrome_version` "116" (for `sidePanel.open`).

### 3.1 Reading a page
- The panel keeps `Map<tabId, ScanResult>` in memory. Nothing is persisted.
- **Scan** = three calls on the granted tab:
  1. `chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: collectSnapshot })`: returns the page snapshot (§4.1). `MAIN` world is needed to see page globals.
  2. `chrome.scripting.executeScript({ target: { tabId }, func: collectBrand })` in the isolated world: computed styles, fonts, logo rectangle and inline SVG (§6).
  3. `chrome.tabs.captureVisibleTab(windowId, { format: 'png' })`: allowed by `activeTab`. Used only to crop the logo inside the panel with `OffscreenCanvas`. The full screenshot is dropped right after cropping.
- **Tab changes:** listen to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` (status `complete`). On a change, show the cached result for that tab if it exists and the URL origin is the same; otherwise run a cheap probe (`executeScript` returning `location.origin`).
  - Probe works: scan.
  - Error says the page can't be scripted (chrome://, chrome-extension://, the Chrome Web Store, the PDF viewer): **Restricted** state.
  - Any other permission error: **Access** state ("Read this tab?").
- The header "Read the page again" button rescans the current tab while the grant is valid.
- Phase 0 must confirm each API assumption above on the current stable Chrome and write the result in `docs/rivaline/PLAN.md`. If one fails, stop and ask.

## 4. Stack detection (`packages/core/src/rivaline/stack`)
Every function is pure and unit-tested with fixtures in `packages/core/fixtures/rivaline/`.

### 4.1 Page snapshot (input)
`collectSnapshot` runs in the page and returns plain data only:
- `url`, `origin`, `title`, `lang`
- `scripts`: `src` of every `<script>` plus the first 300 characters of up to 50 inline scripts (for IDs like `fbq('init', '…')`)
- `resources`: `performance.getEntriesByType('resource')` names (max 400)
- `globals`: for every global path listed in the rules, `true` if defined (for example `fbq`, `ttq`, `dataLayer`, `Shopify`, `Intercom`, `_learnq`, `hj`)
- `values`: small whitelisted values that carry IDs (`Shopify.theme.name`, `google_tag_manager` keys, `ttq._i` keys, `hjSiteSettings.site_id`)
- `cookies`: cookie names only from `document.cookie` (never values)
- `meta`: `generator`, `og:site_name`, `application-name`
- `links`: hosts of `<link rel=preconnect|dns-prefetch>`
- `selectors`: booleans for the few DOM selectors listed in the rules (for example a Trustpilot widget)

### 4.2 Rules
- One file per category in `packages/core/src/rivaline/rules/`. A rule:
  `{ id, name, category, mark?, script?: RegExp[], resource?: RegExp[], global?: string[], cookie?: RegExp[], meta?: {name, pattern}[], selector?: string[], idFrom?: Extractor[] }`
- A tool is **found** when at least one pattern matches. Each match records its evidence: `Script`, `Request`, `Global`, `Cookie`, `Meta` or `Element`, with the matched value (shown in StackDetail, max 4 lines).
- IDs are extracted where the page exposes them (GTM-…, G-…, AW-…, Meta pixel id, TikTok pixel code, Pinterest tag id, Hotjar site id, Shopify theme name). No ID: show a short kind label (`chat`, `widget`, `theme`).
- Categories, in this display order, with the v1 minimum list (extend to about 120 tools in Phase 3):

| Category | Tools (v1 minimum) |
|---|---|
| Advertising | Meta Pixel, TikTok Pixel, Google Ads, Microsoft Advertising (UET), LinkedIn Insight Tag, Pinterest Tag, Snap Pixel, X Pixel, Reddit Pixel, Criteo, Taboola, Outbrain, Floodlight |
| Analytics | Google Analytics 4, Adobe Analytics, Mixpanel, Amplitude, Heap, Hotjar, Microsoft Clarity, Matomo, Plausible, PostHog, FullStory, Contentsquare, Yandex Metrica |
| Tag management | Google Tag Manager, Tealium, Adobe Launch, Segment, RudderStack |
| Consent | Cookiebot, OneTrust, Usercentrics, CookieYes, Didomi, Complianz, iubenda, Osano (reuse Hitline's CMP list) |
| CRM | HubSpot, Salesforce, Zoho, Pipedrive, ActiveCampaign, Marketo, Brevo |
| Email | Klaviyo, Mailchimp, Omnisend, Attentive, Privy |
| Chat | Intercom, Zendesk, Drift, Crisp, Tawk.to, LiveChat, Tidio, Gorgias |
| A/B testing | Optimizely, VWO, AB Tasty, Convert, Kameleoon |
| E-commerce | Shopify, WooCommerce, WordPress, Adobe Commerce, BigCommerce, Wix, Squarespace, Webflow, Tilda |
| Reviews | Trustpilot, Yotpo, Judge.me, Okendo, Reviews.io, Bazaarvoice |
| Payments | Stripe, PayPal, Klarna, Afterpay, Shop Pay |
| Affiliate | Impact, Awin, Rakuten Advertising, PartnerStack |

- Marks: the tools that have an SVG in `design/rivaline/brand-icons/` use it; all others use the category glyph from `packages/ui`.
- **Server-side signal:** reuse Hitline's sGTM host logic from `packages/core`: a GA4 `/g/collect` resource on a host that is not Google's means server-side tracking is present. Show it as a tool "Server-side GTM" in Tag management with evidence `Request`.

### 4.3 Summary line (hero card)
- `"<N> tools in <M> categories"`
- Second line, built from data: `"<Platform> store running <ad channels> ads"` when an e-commerce tool and at least one Advertising tool exist; `"<Platform> site"` with no ads; `"Running <ad channels> ads"` with no platform. Ad channel names: Meta, TikTok, Google, Microsoft, LinkedIn, Pinterest, Snap, X, Reddit. Join with commas and "and".
- Marks row: up to 7 marks (platform first, then tag manager, analytics, advertising), then `+N`.

### 4.4 Gaps
One list, shared by the panel (gap strip, Not found card) and the PDF.

| Id | Severity | Rule | Title (panel) | Line (panel) |
|---|---|---|---|---|
| GAP_SERVER_SIDE | High | at least one Advertising tool and no server-side signal | Server-side tracking | All <n> ad pixels send straight from the browser. |
| GAP_CONSENT | High | Advertising or Analytics found and no Consent tool and no `consent` command in dataLayer | Consent banner | No consent platform or consent update found. |
| GAP_CRM | Medium | Email, Chat or a form found and no CRM tool | CRM | No HubSpot, Salesforce or Zoho script on the page. |
| GAP_ANALYTICS | High | no Analytics tool | Analytics | No analytics tool found on this page. |

PDF titles and lines (Report artboard): "No server-side tracking. All <n> ad pixels send from the browser, so blocked requests never reach the ad platforms.", "No consent banner. Ad pixels load for every visitor before any choice is made.", "No CRM on the site. <Email tool> collects emails, but chat and quiz leads are not tied to one customer record." (fall back to "Leads from chat and forms are not tied to one customer record." when no email tool), "No analytics. Visits and sales from this site are not measured."

## 5. Ad libraries (`packages/core/src/rivaline/ads`)
- **Brand name** default: `og:site_name`, else `application-name`, else the first part of `<title>` split on ` | `, ` - `, ` : `. Trim, max 40 characters. Editable in the Ads tab (not saved).
- **Domain**: registrable domain of the tab (reuse Hitline's helper). Editable (not saved).
- **Country**: from Settings (`country`, default `ALL`). Editable per search (not saved).
- URL builders (pure functions, unit-tested). Verify each format in Phase 0 and keep them in one file so they are easy to fix:

| Library | Searches | URL |
|---|---|---|
| Meta Ad Library | brand | `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC or ALL>&search_type=keyword_unordered&q=<brand>` |
| Google Ads Transparency Center | domain | `https://adstransparency.google.com/?region=<CC or anywhere>&domain=<domain>` |
| TikTok Ad Library | brand | `https://library.tiktok.com/ads?region=<CC or all>&adv_name=<brand>` |
| LinkedIn Ad Library | brand | `https://www.linkedin.com/ad-library/search?accountOwner=<brand>` |

- Status pill per library, from the stack: Meta Pixel, Google Ads tag, TikTok Pixel, LinkedIn Insight Tag. Found: green "<Tool> on site". Not found: neutral "No <Tool>".
- "Open all 4 in new tabs": `chrome.tabs.create` four times (the first active). "Copy links": the four URLs, one per line.
- The landing page's Ad library finder (§9) uses the same builders, bundled into the site.

## 6. Brand kit (`packages/core/src/rivaline/brand`)
`collectBrand` (isolated world) returns raw data; pure functions in core turn it into the kit.
- **Logo:** first visible match of `header a[href="/"] img, header a[href="/"] svg, header [class*=logo] img, header [class*=logo] svg, [class*=logo] img` inside the first viewport. Return its bounding rect, `devicePixelRatio` and, for an inline `<svg>`, its `outerHTML` (max 50 KB).
  - The panel crops the logo from `captureVisibleTab` with `OffscreenCanvas` and offers "Copy PNG" and "Download PNG". Inline SVG adds "Copy SVG".
  - Logo outside the viewport or not found: show "Scroll to the top of the page and press Read the page again" in the Logo card.
- **Colors:** sample computed `background-color` and `color` from visible elements in the first two viewports, weighted by painted area, plus `:root` custom properties that hold colors. Merge colors closer than ΔE 6. Assign roles:
  - Background: largest background area
  - Text: most used text color on that background
  - Primary: background of the main button (below), else the most used link color
  - Accent: the most used remaining saturated color
  - Surface: second largest background
  Show up to 5, in that order. Click copies the HEX and shows the toast.
- **Fonts:** first family of computed `font-family` for `h1` (fallback `h2`) as Headings and for `body` as Body, with weight and size. Source: "Google Fonts" when a stylesheet from `fonts.googleapis.com` is present, "Adobe Fonts" for `use.typekit.net`, "Self-hosted" when an `@font-face` with that family name exists, else "System". Names only.
- **Main button:** the largest visible `a` or `button` with a non-transparent background in the first viewport. Report background, text color, border radius, height, horizontal padding, font family, weight and size. The panel draws a preview with those values and the page's own label (max 24 characters).
- **Export** (BrandExport): CSS variables (`--<brand-slug>-primary`, `-text`, `-background`, `-accent`, `-surface`, `-font-heading`, `-font-body`, `-button-radius`), JSON (same keys, nested), PNG palette (1200 x 400, swatches with role and HEX, made with `OffscreenCanvas`). Copy to clipboard or download through a blob URL and `<a download>` (no `downloads` permission). File names: `<brand-slug>.css`, `<brand-slug>-brand.json`, `<brand-slug>-palette.png`.

## 7. Screens
Build every screen to match its artboard and copy.
- **Side panel frame:** Chrome draws its own header (PanelChrome is only a mock). Rivaline starts at PanelHeader.
- **PanelHeader:** Logo; "Read the page again" icon button; Settings icon button; "Report PDF" primary button (disabled in Access and Restricted). Tabs Stack, Ads, Brand with counts (Stack: tools, Ads: 4, Brand: colors). Counts hidden in Access and Restricted.
- **Stack (Main):** hero card (§4.3), gap strip ("<n> gaps: …", links to the Not found card), category chips with counts (All first, horizontal scroll with a fade), grouped list (category eyebrow with count, rows with Mark 28, name, ID in mono, chevron).
- **StackDetail:** a chip selected filters the list. Clicking a row expands it in place: "How Rivaline found it" with evidence rows (kind pill + mono value), "Copy ID", and for Advertising tools "Open in <library>" which jumps to the Ads tab with that library highlighted. Below the list: the Not found card with the gaps and the lime CTA "Want these in place on your own site?" with "Get in touch".
- **Ads:** "Search for" card (Brand name, Domain, Country), four library rows (Mark, name, what it covers, search pill, status pill, open button), "Open all 4 in new tabs", "Copy links", the note under them.
- **Brand:** Logo card, Colors (5 swatches with role and HEX), Fonts (role, name, weight and size, source pill), Main button (preview and its values), Export row (CSS variables, PNG palette, JSON).
- **BrandExport:** bottom sheet with a segmented control (CSS variables, JSON, PNG palette), code preview or palette preview, "Copy" (turns into "Copied" with a check for 2 seconds) and "Download <file>", the note "Font names only. Rivaline never downloads font files.", and the dark toast "<Format> copied to clipboard".
- **Access:** "Read this tab?", the host, the two ways (icon, shortcut), the activeTab note. The shortcut shown is the real one from `chrome.commands.getAll()`.
- **Restricted:** "Rivaline can't read this page", Works on and Doesn't work on lists.
- **Empty:** "No marketing tools found" card with the host, "What Rivaline checked" tags, "The Ads and Brand tabs still work for this site.", lime CTA "Starting from zero?" with "Get in touch".
- **Settings:** Default country (select, ISO list, "All countries" first), Keyboard shortcut (shows the current keys; "Change" opens `chrome://extensions/shortcuts` with `chrome.tabs.create`), Language (English, Azərbaycan), Your data ("Clear all settings" and the privacy note), More free tools (Hitline, Serpline, Foldline, Markline), footer with version, Privacy, Contact.
- **Welcome:** 3 steps, chips, "Built by Shamistan Isayev", contact link.
- **Toasts:** dark pill, 2.5 seconds, `role="status"`.

## 8. Competitor report PDF (`packages/report`)
- **Refactor first (Phase 2):** turn Hitline's builder into a generic `buildLineReport(config)` with the shared layout: logo and date, eyebrow, host, subline, 4 stat tiles (each with a tone), one key/value section, one severity list, optional extra sections, the dark CTA box, footer with "Made with <Tool>. No data left the browser." and page numbers. Hitline's PDF must stay identical (snapshot test on the text layer and positions).
- **Rivaline content:**
  - eyebrow "Competitor report", host, "Page read: <page>. Brand name used for ad searches: <brand>"
  - tiles: tools, categories, ad pixels (neutral), gaps (Warning tone with a warning icon)
  - "Stack" table: category to tool names (IDs in brackets)
  - "Gaps and opportunities" with High and Medium pills (§4.4)
  - "Brand kit" (swatches with HEX, one line for fonts and the main button) and "Ad libraries" (four rows with real links) side by side
  - dark CTA "Need help closing gaps like these?", "Shamistan Isayev, analytics and server-side tracking", lime button to shamistanisayev.com (`utm_campaign=pdf_footer`)
- Multi-page when the stack table is long. File name: `rivaline-report-<host>-<yyyy-mm-dd>.pdf`.

## 9. Landing site (`apps/rivaline/site`, Astro)
- **Routes:**
  - `/`: landing from `design/rivaline/Landing.dc.html`, responsive as in LandingTablet and LandingMobile. Keep all animations and hover effects (CSS only), the tab showcase (radio-input tabs, keyboard accessible), the marquee pause on hover, `prefers-reduced-motion`.
  - **Ad library finder** (`#finder`): a tiny vanilla script (no framework) that runs the shared URL builders on input. Results update while typing. Links open in a new tab with `rel="noopener"`. Nothing is sent anywhere; the site loads no analytics unless `PUBLIC_GTM_ID` is set (same rule as Hitline).
  - `/privacy`: what is stored (settings only, locally), what is never collected, the four permissions and why, that inspected pages are read only after a click, contact.
  - `/uninstalled`: Uninstall artboard. Form with 4 reasons, optional text, hidden `v`. Posts to `/api/feedback`.
  - `/404`
- **Shared site code:** move Hitline's feedback Pages Function (Resend, honeypot, rate limit), the consent banner and the SEO head into a shared package (`packages/site-kit`) and use it from both sites. Hitline's site must keep working; deploy it once after the move.
- **Colors and logo:** Rivaline teal accent #0E7490 and bright #67E8F9; the other tools and the Logo rules as in `apps/rivaline/CLAUDE.md` (Markline uses ink text on its yellow). Status colors only for statuses, always with an icon and a label.
- **Header:** dark and sticky: background `rgba(18,13,36,.94)`, `backdrop-filter: blur(14px)`, bottom border `rgba(255,255,255,.08)`, `position: sticky; top: 0`. Logo in the dark theme. Links `#D0CBE6`, white on hover, lime underline. No ancestor of the header may use `overflow: hidden`; use `overflow-x: clip` (a Playwright test scrolls the page and asserts the header top stays 0).
- **Hero:** background `#120D24` with grid lines `rgba(255,255,255,.05)` (48px), a soft accent glow top right and a lime glow bottom left; no animated line. Headline white, lead `#D0CBE6`, highlighted words in `#67E8F9` with a thin lime bar under them. Pill "Free Chrome extension": height 32px, padding `0 14px 0 12px`, gap 8px, 13px/600, background `rgba(255,255,255,.08)`, border `rgba(255,255,255,.16)`, 8px green dot `#12B76A` with a green pulse. Main button accent with white text; second button "Try the ad library finder" transparent (`rgba(255,255,255,.06)`, border `rgba(255,255,255,.28)`, white text) scrolling to `#finder`. Callouts without background or border: 20px lime circle with a `#1A2E05` check, 14px/600 `#D0CBE6`, 24px gap, the icon grows and rotates a little on hover. White cards inside the hero (product mock, Brand kit card, Not found toast) keep dark text.
- **Hero marquee:** title `#B9B4D0`; cards `rgba(255,255,255,.06)` with inset border `rgba(255,255,255,.13)`, `backdrop-filter: blur(8px)`, text `#EDEAF8`; marks stay on their light tint with a `0 0 0 1px rgba(255,255,255,.08)` ring; hover background `rgba(255,255,255,.1)`, border `rgba(255,255,255,.26)`, shadow `0 12px 20px -14px rgba(0,0,0,.7)`, 3px lift. 52px cards, 40s loop, pause on hover, 10% edge fades.
- **Buttons:** only the arrow icon (`class="arr"`) slides right on hover; the Chrome and download icons stay put. Button text keeps its color in every state (`:link`, `:visited`, `:hover`, `:focus`, `:active`): white on the accent, `#1A2E05` on lime.
- **CTA section:** "Book an audit" lime button with the signature "From <u>Shamistan Isayev</u>" in white, 14px.
- **SEO:** title, description, Open Graph image 1200x630 from the hero, canonical, sitemap, robots, JSON-LD `SoftwareApplication` (price 0, operatingSystem Chrome, applicationCategory BusinessApplication, author Person Shamistan Isayev with url shamistanisayev.com).
- **Performance:** Lighthouse mobile at least 95 on all four categories. Self-hosted fonts (Plus Jakarta Sans, Inter, JetBrains Mono; Fraunces and DM Sans only for the Kova mock, subset to the characters used).
- "Add to Chrome" buttons point to the Web Store listing URL (config value until the listing exists).
- Cloudflare Pages project `rivaline`, custom domain from `RIVALINE_SITE_URL`.

## 10. Links and UTM
`utm_source` is always `rivaline`.

| Place | URL | utm_medium | utm_campaign |
|---|---|---|---|
| Panel CTAs (Not found card, Empty) | shamistanisayev.com | extension | panel_cta |
| Report PDF CTA | shamistanisayev.com | extension | pdf_footer |
| Welcome contact link | shamistanisayev.com | extension | welcome |
| Settings "Contact" | shamistanisayev.com | extension | settings |
| Settings "More free tools" | getlineapps.com/<slug> | extension | more_tools |
| Settings "Privacy" | RIVALINE_SITE_URL/privacy | (none) | (none) |
| Uninstall URL | RIVALINE_SITE_URL/uninstalled | extension | uninstall |
| Uninstall page "Book an audit" | shamistanisayev.com | extension | uninstall |
| Landing "Book an audit" | shamistanisayev.com | landing | audit_cta |
| Landing FAQ "Ask me directly" | shamistanisayev.com | landing | faq |
| Landing footer "Built by" | shamistanisayev.com | landing | footer |
| Landing "More free tools" cards | tool domains | landing | more_tools |
| Ad library links (panel, PDF, finder) | library URLs (§5) | none | none |

Other tools' domains are config values; their sites may not exist yet.

## 11. Test fixture (`apps/rivaline/fixture`)
- Three local sites from `SitePage.dc.html`: **Kova** (`kova.localhost`), **Glowbar** (`glow.localhost`), **Mira Studio** (`mira.localhost`).
- Kova loads stub scripts at the real vendor URLs (fulfilled by Playwright `page.route` with small local files, so no traffic leaves the machine) that define the globals and cookies of: Meta Pixel, TikTok Pixel, Google Ads, Pinterest Tag, GA4, Hotjar, GTM, Mailchimp, Intercom, Shopify (`window.Shopify` with theme "Dawn"), Trustpilot widget, Klarna and PayPal messaging. No consent tool, no CRM, GA4 sent to `www.google-analytics.com` (no server-side).
- Mira Studio has no marketing tools. Glowbar is only used for the tab switch test.
- E2E tests (test build with localhost host permission):
  - side panel shows 13 tools in 8 categories, the 3 gaps and the IDs from the design
  - Ads URLs equal the builders' output
  - Brand finds the 5 Kova colors, Fraunces and DM Sans, the button values and crops the logo
  - switching to Glowbar shows Access; `chrome://extensions` shows Restricted; Mira shows Empty
  - the PDF is generated and contains the gaps
  - a unit test asserts the production manifest has no `host_permissions`

## 12. Chrome Web Store
- Name: "Rivaline: Competitor Research"
- Short description (max 132): "See any site's martech stack, open its ads in 4 ad libraries and copy its brand colors and fonts. Free, no account."
- Category: Tools (or Developer Tools if Tools is not offered). Single purpose: "Show the marketing tools, ad library links and brand style of the site in the current tab."
- Permission justifications: activeTab (read the current tab only after the user clicks), scripting (run the reading function in that tab), storage (settings), sidePanel (the UI).
- Privacy answers: no data collected, no sale, no remote code. Privacy policy URL: RIVALINE_SITE_URL/privacy.

## 13. Phases
Each phase ends with the checks from `apps/rivaline/CLAUDE.md` "Working style", a commit and a short Azerbaijani report. Hitline tests must stay green.

### Phase 0: Setup and plan
- Pull, install, run the whole test suite to confirm Hitline is green.
- Set the family domains: Hitline's `SITE_URL` default becomes `https://getlineapps.com/hitline` (root `CLAUDE.md`, root SPEC, config, tests); the other tools are `getlineapps.com/serpline`, `getlineapps.com/foldline`, `getlineapps.com/markline`. Redeploy Hitline's site on its new custom domain only when the owner says the domain is ready.
- Add a short "Line family" section to the root `CLAUDE.md` that points to `apps/rivaline/CLAUDE.md` and `docs/rivaline/SPEC.md`.
- In a scratch extension, confirm on stable Chrome: `sidePanel.open` from `action.onClicked` and from `_execute_action`; `activeTab` grant then `executeScript` from the side panel page; `captureVisibleTab` with `activeTab` only; the error messages for chrome:// and for an ungranted tab; the four ad library URL formats open the right search.
- Write `docs/rivaline/PLAN.md`: artboards to components, shared package changes, API check results, open questions.
- **Done when:** PLAN.md exists and every API check is marked pass or has a question for the owner.

### Phase 1: Scaffold
- `apps/rivaline/extension` (WXT, React, TS), `apps/rivaline/site` (Astro), `apps/rivaline/fixture`; add them to the pnpm workspace and CI.
- Icon click opens an empty side panel; `Alt+Shift+R` does the same.
- **Done when:** CI is green for both tools and the unpacked Rivaline opens its side panel.

### Phase 2: Shared packages
- `packages/ui`: accent theme by brand (CSS variables), Rivaline tokens, Mark with all marks from `design/rivaline/brand-icons/` plus category glyphs, extension icons for Rivaline, preview page updated.
- `packages/report`: the generic builder (§8) with Hitline's snapshot test.
- `packages/site-kit`: shared site pieces (§9). Redeploy Hitline's site and check `/uninstalled` still sends feedback.
- **Done when:** Hitline output is unchanged and the preview page shows both themes.

### Phase 3: Core logic and fixture
- §4 snapshot matcher, rules (at least the v1 list), IDs, evidence, summary, gaps; §5 builders; §6 pure brand functions. Unit tests for each rule family, builders and color roles.
- The fixture sites from §11.
- **Done when:** running Kova's snapshot through core gives exactly the stack, IDs and gaps in the design.

### Phase 4: Side panel, part 1
- Scan pipeline (§3.1), PanelHeader, Stack, StackDetail, Access, Restricted, Empty.
- **Done when:** on the fixture the panel matches `Main.png`, `StackDetail.png`, `Access.png`, `Restricted.png` and `Empty.png`.

### Phase 5: Side panel, part 2
- Ads, Brand, BrandExport (logo crop, copy, downloads).
- **Done when:** they match their PNGs on Kova and the exported files open correctly.

### Phase 6: Settings and i18n
- Settings view, country default, shortcut row, language switch, "Clear all settings".
- EN and AZ dictionaries, `docs/rivaline/AZ-REVIEW.md` for the owner.
- **Done when:** Settings matches `Settings.png` and the language switch changes every panel string.

### Phase 7: Report PDF, welcome, uninstall hook
- Rivaline report through the shared builder, the welcome page, `setUninstallURL`.
- **Done when:** the Kova PDF matches `Report.png` in content and layout and the welcome page opens on install.

### Phase 8: Landing site and deploy
- All routes from §9 with the finder, SEO, Cloudflare Pages project `rivaline`, custom domain, Resend through `packages/site-kit`.
- **Done when:** the live domain serves `/`, `/privacy` and `/uninstalled` over HTTPS, a test feedback reaches the owner, the finder works, and screenshots at 1440, 820 and 390 match the Landing PNGs.

### Phase 9: Chrome Web Store package
- Production zip, 5 screenshots at 1280x800 from the fixture (Stack, Ads, Brand, Export, Report), promo tile 440x280 and marquee 1400x560, `docs/rivaline/STORE-LISTING.md` from §12, a GitHub release.
- **Done when:** everything the owner uploads is in `store/rivaline/` with the listing doc.

### Phase 10: QA and handover
- Test on 3 real public sites the owner names plus the fixture. Fix false positives and wrong color roles.
- Lighthouse and axe on the site.
- Add a Rivaline chapter to `docs/OWNER-GUIDE.md` (Azerbaijani): releasing, changing the domain, adding a detection rule, reading feedback.
- **Done when:** no false positives on the test sites, site scores are at least 95, and the guide is updated.

## 14. Owner inputs still needed (keep as config placeholders)
- Web Store listing URL (after the first upload)
- 3 public sites for QA
