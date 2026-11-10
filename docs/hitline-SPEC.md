# SPEC: Hitline (Chrome extension + landing site)

Read the root `CLAUDE.md` first. This file is the source of truth for Hitline features and phases.

> **Family rules override this file.** Written before the Line family decisions. Where it disagrees, follow the root `CLAUDE.md`, `docs/line-family-domains.md` and `docs/line-family-colors.md`:
> - Paths: the extension is `apps/hitline/extension`; the Lumo fixture is `apps/fixture` (shared with Serpline); there is no Hitline-only site, the landing is route `/hitline` in the shared `apps/site`.
> - Domain: `LINE_SITE_URL + '/hitline'` instead of `SITE_URL` / `hitline.co`; uninstall `/hitline/uninstalled`; privacy `/privacy/hitline`; "More free tools" use `toolUrl`.
> - Colors: the Line family colors in this file (§5, §11 and the logo) are outdated; use `docs/line-family-colors.md`.
> - Design files are in `design/hitline/`.


---

## 1. Product
- **What:** a free Chrome extension that shows, for any site, which tracking fires, where it goes, whether it respects consent and whether attribution survives the visit path. One click gives a summary, DevTools gives the full picture, and a one-click audit PDF turns findings into a report.
- **Audience:** performance marketers, web analysts, agencies, e-commerce teams. English first, Azerbaijani second.
- **Business goal:** lead magnet. Contact CTAs drive users to shamistanisayev.com. No paid plan, no account.
- **Platforms covered in v1:** GA4 (incl. Google Tag), Google Ads, Meta Pixel, TikTok Pixel, Hotjar, Google Tag Manager containers, server-side GTM, dataLayer.

## 2. Design reference (`design/`)
- `design/*.dc.html` are prototype artboards: HTML with inline styles.
  - `{{...}}` are template holes, `<sc-for>` and `<sc-if>` are loops and conditions.
  - `<dc-import name="X" prop="...">` embeds another artboard (component) with props.
  - The `class Component extends DCLogic` script holds demo data and logic.
  - Extract layout, copy and demo data from them. The demo shop "Lumo" and `example.com` are fictional.
- `design/screens/*.png` are rendered screenshots of every artboard at 1x. Use them to compare your build. (Fonts in the PNGs may fall back to system fonts. The real fonts are in CLAUDE.md.)
- `design/brand-icons/*.svg` are the platform marks (Simple Icons, CC0 package; trademarks of their owners).
- `design/canvas.json` lists all boards with titles.

| Artboard | What it is | Where it lives |
|---|---|---|
| Main | Popup with results | `apps/extension` popup |
| PopupEmpty | Popup, no tracking found | popup state |
| PopupSettings | Popup settings view | popup route |
| Empty | DevTools panel, first open | panel state |
| Events | DevTools: Events tab | panel tab |
| Gtm | DevTools: GTM and sGTM tab | panel tab |
| Consent | DevTools: Consent tab | panel tab |
| Attribution | DevTools: Attribution tab | panel tab |
| Plan | DevTools: Plan tab (plan loaded) | panel tab |
| PlanSetup | DevTools: Plan tab (no plan yet) | panel state |
| Report | Audit PDF (A4) | `packages/report` |
| Welcome | Page opened after install | extension page `welcome.html` |
| Uninstall | Page opened after uninstall | site route `/uninstalled` |
| Landing, LandingTablet, LandingMobile | Landing page at 1440, 820, 390 | site route `/` |
| BrowserBar, DevtoolsBar, SitePage | Chrome chrome and the fake shop | mock only, do not build (SitePage is the model for the test fixture, §10) |
| PanelHeader | Panel header with tabs and actions | panel component |
| Logo | Line family logo component | `packages/ui` |

## 3. Extension architecture (`apps/extension`)
Entrypoints (WXT):
- `popup/`: React app, 372px wide.
- `devtools/`: devtools page that calls `chrome.devtools.panels.create('Hitline', icon, 'devtools-panel.html')`.
- `devtools-panel/`: React app for the panel.
- `background.ts` (service worker):
  - `runtime.onInstalled` (reason `install`) opens `welcome.html`.
  - `runtime.setUninstallURL(SITE_URL + '/uninstalled?utm_source=hitline&utm_medium=extension&utm_campaign=uninstall&v=' + version)`.
  - No other logic. No network.
- `welcome/`: static page from the Welcome artboard.
- Manifest: name "Hitline", short description (§11), permissions `activeTab`, `scripting`, `storage`, `devtools_page`. No `host_permissions`. Icons 16, 32, 48, 128 generated from the Hitline logo tile.
- Shared logic comes from `packages/core`. The popup and panel both feed raw inputs (URLs, request bodies, headers, cookies, dataLayer snapshots) into the same pure functions.

### 3.1 Data capture
- **Panel (full):**
  - `chrome.devtools.network.onRequestFinished` for live requests. On panel open, read `getHAR()` to backfill what happened before the panel opened.
  - Read POST bodies (`request.postData.text`), including GA4 batched payloads (one line per hit).
  - Read response `set-cookie` headers for the FPID signal.
  - `chrome.devtools.network.onNavigated` marks page boundaries for the attribution path.
  - `chrome.devtools.inspectedWindow.eval` every 1s while recording, plus on navigation:
    - snapshot `window.dataLayer` (new entries only)
    - snapshot `google_tag_data` and GTM containers: `window.google_tag_manager` keys
    - snapshot `document.cookie` (only `_ga`, `_ga_*`, `_gcl_*`, `_fbp`, `_fbc`, `_ttp`, `FPID` names)
  - Recording is on by default. "Clear" empties the session. Nothing is persisted.
- **Popup (summary):**
  - On open, `chrome.scripting.executeScript` on the active tab (allowed by `activeTab`) returns:
    - `performance.getEntriesByType('resource')` names
    - dataLayer length and consent commands
    - GTM container IDs and the cookie names above
  - It classifies from URLs only (no bodies), so it shows platforms, event counts where the URL carries the event name, sGTM status and the top issues it can prove from URLs.
  - It says "Full analysis: press F12, open the Hitline tab".
  - On `chrome://` and Web Store pages show a short "Hitline can't read this page" state.

## 4. Detection logic (`packages/core`)
Every function is pure and unit-tested with fixtures in `packages/core/fixtures/`.

### 4.1 Request classifiers
| Platform | Match | Event name | Key params |
|---|---|---|---|
| GA4 | path ends `/g/collect` and `v=2` and `tid=G-…` (any host) | `en` | `dl`, `dr`, `cid`, `sid`, `gcs`, `gcd`, `ep.*`, `epn.*`, items `pr1…` |
| Google Ads | `googleadservices.com/pagead/conversion/*`, `google.com/pagead/1p-conversion/*`, `googleads.g.doubleclick.net/pagead/viewthroughconversion/*` | `conversion` (label from path) | `value`, `currency_code`, `gcs` |
| Meta Pixel | `facebook.com/tr` or `facebook.com/tr/` (GET or POST), plus custom first-party CAPI gateways if path ends `/tr` and has `id`+`ev` | `ev` | `id`, `cd[value]`, `cd[currency]`, `cd[content_ids]` |
| TikTok Pixel | `analytics.tiktok.com/api/v2/pixel*` | body `event` | `properties.value`, `properties.currency`, `context.page.url` |
| Hotjar | `static.hotjar.com/c/hotjar-*.js`, `*.hotjar.com`, `*.hotjar.io` | `script` | site id |
| GTM | `googletagmanager.com/gtm.js?id=GTM-…` or the same path on a first-party host | `container` | container id |
| dataLayer | from eval snapshots | `event` key | all keys |

- Route label: `sGTM` when a GA4/Meta/TikTok hit goes to a host that is not the vendor's (for example `data.example.com`), `Browser` for vendor hosts, `Page` for dataLayer entries.
- Decoders turn query strings and POST bodies into a flat parameter list (`items[0].item_id` style) for the details pane.

### 4.2 Server-side GTM signals
`sGTM detected` when at least 2 of 4 signals are true. Show each with its evidence:
1. **Own subdomain:** GA4 requests go to a subdomain of the inspected site.
2. **GA4 path format:** that host serves `/g/collect`.
3. **server_container_url:** found in gtag config in dataLayer or in `google_tag_data`.
4. **FPID cookie:** a `set-cookie: FPID=…; HttpOnly` from that host (panel only, from HAR).

Also list which platforms still send from the browser, which raises the warning card "Only GA4 goes server-side".

### 4.3 Consent Mode v2
- Read `consent` `default` and `update` commands from dataLayer: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`.
- Read `gcs` (`G1` + ad_storage + analytics_storage, `1` granted, `0` denied) and `gcd` from Google hits.
- **Banner:** "Found" when the page has a known CMP global (Cookiebot, OneTrust, Usercentrics, CookieYes, Didomi, Complianz, iubenda) or a consent update happens.
- **Choice moment:** the first `update` command. "Reject all" when it denies all four, "Accept all" when it grants all four, otherwise "Custom".
- Split the timeline into "Before the choice" and "After <choice>".
- Statuses:
  - Google hit with `gcs` G100 shows "Cookieless ping, G100" (ok).
  - Meta/TikTok/Hotjar hit while `ad_storage` is denied shows "Sent before any consent" or "Sent after rejection" (bad).
  - Hotjar not loaded while analytics is denied shows "Not loaded, correct" (ok).
- Fix text: "In GTM, add 'Additional consent checks' to <tag names> so they never fire without ad_storage."

### 4.4 Attribution path
- Pages are split by `onNavigated`. For each page record:
  - URL
  - UTM params and `gclid`/`fbclid`/`ttclid`
  - whether `_gl` was present
  - GA4 `cid` from the `_ga` cookie
  - `_gcl_aw` cookie
  - GA4 `dr` referrer
- The "own domains" list comes from Settings (default: the inspected site's registrable domain).
- Issues:
  - **Cross-domain break:** navigation from one own domain to another without `_gl` (when cross-domain is expected), or `cid` changes between own domains.
  - **Unwanted referral:** a GA4 hit whose `dr` is another domain (often a payment page) after a campaign landing. The fix names GA4 "List unwanted referrals" and cross-domain measurement.
- Table rows: UTM source/medium, gclid, GA4 client_id. Values: present, in session, in cookie, lost, referral, created, same, new.

### 4.5 Tracking plan
- **Input:** CSV with columns `event,platform,parameters`, where parameters is a comma list in quotes. JSON is an array of `{event, platform, parameters[]}`.
- **Validation:** show a clear error for bad files.
- **Statuses:**
  - Match: the event was seen with all parameters non-empty.
  - Missing: never seen this session.
  - Wrong parameters: seen, but a parameter is missing or empty. "What arrived" explains which.
- **"Create plan from this session":** exports a CSV draft of all events seen with their parameter names.
- **Sample CSV:** "Download sample CSV" gives the 3-row sample from the design.
- **Storage:** the plan is stored in `chrome.storage.local` (one plan per site domain, plus a "default" plan).

### 4.6 Issue rules (one list, shared by popup, panel and PDF)
| Id | Severity | Rule | Title in UI |
|---|---|---|---|
| CONSENT_BEFORE | High | marketing pixel hit before the first consent update while defaults deny ad_storage | Meta Pixel fires before consent |
| CONSENT_AFTER_REJECT | High | marketing pixel hit after ad_storage was denied | TikTok Pixel still fires after cookies are rejected |
| UNWANTED_REFERRAL | High | see §4.4 | Sales are credited to the payment site |
| XDOMAIN_BREAK | High | see §4.4 | Campaign parameters are lost on <domain> |
| VALUE_MISSING | Medium | Meta AddToCart/Purchase/InitiateCheckout, TikTok AddToCart/CompletePayment or GA4 ecommerce events without value or currency | Meta AddToCart is sent without a value |
| PLAN_MISSING | Medium | plan event never seen | generate_lead never arrives |
| PLAN_PARAMS | Medium | plan param missing or empty | sign_up has an empty method |
| BROWSER_ONLY | Info | sGTM detected but other pixels go from the browser | Only GA4 goes server-side |
| NO_TRACKING | Info | no platform found | No tracking on this page |

Each issue carries:
- a one-line explanation
- a one-line fix
- the evidence (request ids)

## 5. Screens
Build every screen to match its artboard and copy.

- **Panel header (PanelHeader):**
  - Logo
  - tabs with counts:
    - Events: number of events
    - GTM: number of tags
    - Consent, Attribution, Plan: number of issues
  - issue counts use a red badge when above 0
  - right side: "Recording" pill with a blinking dot, "Clear", "Audit PDF"
- **Events:**
  - filter chips per platform with counts, plus search over event names and parameters
  - table columns: Time, Platform, Event, Route, Status
  - details pane:
    - event name, platform badge, route pill, time
    - raw request line (method + URL, host highlighted)
    - parameter table
    - consent card for this hit
    - linked issue card, for example the same click firing Meta without value
- **GTM:**
  - container stats: id, tags, triggers, variables
    - tags and triggers come from `google_tag_manager[id]` data when exposed, otherwise from fired tags inferred from hits; label "estimated" in that case
  - tag table: Tag, Type, Trigger, Status (Fired, Missing value, No consent check, Waiting for consent, Not fired yet)
  - sGTM hero card with the 4 signals, the warning card and the lime CTA
- **Consent:**
  - Consent Mode v2 hero (banner found, visitor's choice)
  - signal table (default vs after choice)
  - Google correctness note
  - timeline split by the choice, "How to fix" card, CTA
- **Attribution:**
  - 5-step visit path with arrows (broken link in red)
  - parameter table across pages
  - issue card and CTA
- **Plan:** summary counts, segmented bar, table, "Change plan", local storage note.
- **PlanSetup:**
  - drop zone (CSV or JSON)
  - CSV format card with sample download
  - lime card "No plan yet?" with "Create plan from this session"
- **Empty (first open):** "Reload page to start recording" (calls `inspectedWindow.reload`), "Load tracking plan", the shortcut hint, and the "What Hitline watches" list.
- **Popup Main:**
  - header: logo and settings button
  - hero card: host, request count, sGTM verdict, or "No server-side GTM" with neutral styling
  - 2x2 platform tiles (only platforms found, max 4, then "+N more")
  - top issues (max 3)
  - "Download audit PDF" (summary PDF)
  - F12 hint
  - dark footer with "Need help fixing these? Get in touch"
- **PopupEmpty:** no tracking state with "What Hitline checked" chips and the lime CTA.
- **PopupSettings:**
  - your domains: add and remove
  - tracking plan: replace and remove
  - language: English and Azərbaycan
  - "Clear all settings"
  - privacy note
  - "More free tools" links
  - version, Privacy, Contact
- **Welcome:** 3 steps, "Built by Shamistan Isayev", contact link.

## 6. Audit PDF (`packages/report`)
- Built in the browser with pdf-lib or jsPDF. A4, embedded fonts (Inter, Plus Jakarta Sans), selectable text.
- **Content:**
  - logo and date/time
  - "Tracking audit", host, pages checked
  - 4 stat tiles: platforms, events, high priority, medium priority
  - Setup table: GTM, Server-side, Consent Mode v2, Tracking plan
  - "Issues and fixes" with severity pills
  - dark CTA box "Need help fixing these issues?" with a lime button to shamistanisayev.com (`utm_campaign=pdf_footer`)
  - footer: "Made with Hitline. No data left the browser." and page numbers
- Multi-page when there are many issues.
- File name: `hitline-audit-<host>-<yyyy-mm-dd>.pdf`. Download via a blob URL and an `<a download>` (no `downloads` permission).

## 7. Settings and storage
`chrome.storage.local` keys:
- `domains: string[]`
- `plans: Record<string, Plan>`
- `lang: 'en' | 'az'`
- `installedAt: number`

Nothing else. "Clear all settings" wipes them.

## 8. i18n
- One dictionary file per locale (`en.ts`, `az.ts`), with typed keys.
- EN is the source copy from the design. The AZ translation is written by you and marked for owner review in `docs/AZ-REVIEW.md`.
- Tool names, event names and parameter names are never translated.

## 9. Links and UTM
| Place | URL | utm_medium | utm_campaign |
|---|---|---|---|
| Panel CTAs, popup footer, popup empty CTA | shamistanisayev.com | extension | panel_cta |
| Audit PDF CTA | shamistanisayev.com | extension | pdf_footer |
| Welcome contact link | shamistanisayev.com | extension | welcome |
| Settings "Contact" | shamistanisayev.com | extension | settings |
| Settings "More free tools" | serpline/rivaline/foldline/markline + `.co` | extension | more_tools |
| Settings "Privacy" | SITE_URL/privacy | (none) | (none) |
| Uninstall URL | SITE_URL/uninstalled | extension | uninstall |
| Landing "Book a tracking audit" | shamistanisayev.com | landing | audit_cta |
| Landing FAQ "Ask me directly" | shamistanisayev.com | landing | faq |
| Landing footer "Built by" | shamistanisayev.com | landing | footer |
| Landing "More tools" cards | tool domains | landing | more_tools |
| Uninstall page "Book a tracking audit" | shamistanisayev.com | extension | uninstall |

`utm_source` is always `hitline`. The other tools' sites may not exist yet: keep the links, they are config values.

## 10. Test fixture (`apps/fixture`)
- A local static "Lumo" shop built from the SitePage artboard: product page, cart, payment page on a second local host (`pay.localhost`), and a confirmation page.
- It pushes dataLayer events and calls fake tracking endpoints that reproduce the design scenario:
  - GA4 via `data.localhost/g/collect` (sGTM)
  - Meta, TikTok and Google Ads with vendor URLs
  - Meta AddToCart without value
  - TikTok firing after "Reject all"
  - payment page breaking `_gl`
  - a consent banner with Accept all and Reject all
- In Playwright, use `page.route` to fulfil vendor URLs with 204 so no real traffic leaves the machine.
- E2E tests assert:
  - the panel and popup show the same counts and issues as the design
  - the PDF is generated

## 11. Landing site (`apps/site`, Astro)
- **Routes:**
  - `/`: landing from `design/Landing.dc.html`. Responsive exactly as in LandingTablet and LandingMobile. Keep all animations and hover effects (CSS only), the tab showcase (radio-input tabs, keyboard accessible), and `prefers-reduced-motion`.
  - `/privacy`: plain privacy policy:
    - what is stored: settings only, locally
    - what is never collected
    - the permissions and why
    - contact
  - `/uninstalled`: page from the Uninstall artboard.
    - Form: reason (4 radios), optional text, hidden `v` from the query.
    - Posts to a Cloudflare Pages Function `/api/feedback` that e-mails the owner through Resend.
    - Honeypot plus a basic rate limit.
    - No database.
  - `/404`
- **SEO:**
  - title and description
  - Open Graph image 1200x630, generated from the hero
  - canonical, sitemap and robots
  - JSON-LD `SoftwareApplication`: price 0, operatingSystem Chrome, applicationCategory DeveloperApplication, author Person Shamistan Isayev with url shamistanisayev.com
- **Site analytics (optional):** if `PUBLIC_GTM_ID` is set, load GTM with Consent Mode v2 defaults denied and a small consent banner. With no ID, nothing loads.
- **Performance:** Lighthouse mobile at least 95 on all four categories. Self-hosted fonts, no JS framework on the page except tiny scripts.
- "Add to Chrome" buttons point to the Web Store listing URL, a config value until the listing exists.
- Deploy with Cloudflare Pages (`wrangler pages deploy`) and attach the custom domain.

## 12. Phases
Each phase ends with the checks from CLAUDE.md "Working style", a commit and a short Azerbaijani report.

### Phase 0: Setup and plan
- **Tasks:**
  - Check Node LTS, pnpm, git, gh and wrangler. Install missing ones.
  - Read `design/` and list every screen, state and component.
  - Write `docs/PLAN.md` mapping artboards to components and noting gaps or questions.
- **Done when:** PLAN.md exists.

### Phase 1: Scaffold
- **Tasks:**
  - pnpm monorepo with `apps/extension` (WXT, React, TS), `apps/site` (Astro), `apps/fixture`, `packages/ui`, `packages/core`, `packages/report`.
  - ESLint, Prettier, Vitest, Playwright.
  - Public GitHub repo via `gh` with MIT license.
  - GitHub Actions CI running typecheck, lint, test and build.
  - Extension loads unpacked with an empty popup and a "Hitline" DevTools panel.
- **Done when:** CI is green and the unpacked extension shows the Hitline tab in DevTools.

### Phase 2: Design system
- **Tasks:**
  - Tokens as CSS variables and bundled fonts.
  - Logo (all 5 brands, light, dark, mono and white themes).
  - Button, Pill, PlatformBadge (with brand marks), Card, Table, CTA band.
  - Extension icons 16, 32, 48 and 128 from the logo tile.
  - A `packages/ui` preview page showing every component.
- **Done when:** the preview page matches the design and contrast is checked.

### Phase 3: Core detection and fixture
- **Tasks:**
  - Everything in §4, with unit tests covering each classifier, the sGTM signals, consent parsing, attribution and plan diff.
  - The fixture shop from §10.
- **Done when:** tests pass, and running the fixture scenario through core produces exactly the issues listed in the design.

### Phase 4: DevTools panel, part 1
- **Tasks:** header, Empty state, Events tab and GTM tab, with live capture from §3.1.
- **Done when:** on the fixture the panel matches `design/screens/Events.png`, `Gtm.png` and `Empty.png`.

### Phase 5: DevTools panel, part 2
- **Tasks:** Consent, Attribution, Plan and PlanSetup tabs.
- **Done when:** they match their PNGs on the fixture, and plan upload and draft export work.

### Phase 6: Popup, settings, i18n
- **Tasks:**
  - Popup Main, Empty and Settings.
  - The "can't read this page" state.
  - EN and AZ dictionaries, plus `docs/AZ-REVIEW.md`.
- **Done when:** the popup matches the PNGs, and switching language changes popup and panel text.

### Phase 7: Audit PDF, welcome, uninstall hook
- **Tasks:**
  - Report builder (full from the panel, summary from the popup).
  - The welcome page.
  - `setUninstallURL`.
- **Done when:** the PDF from the fixture matches `design/screens/Report.png` in content and layout, and the welcome page opens on install.

### Phase 8: Landing site and deploy
- **Tasks:**
  - All routes from §11, the Pages Function with Resend, and SEO.
  - Deploy to Cloudflare Pages.
  - Custom domain via wrangler or exact dashboard steps.
  - Resend domain verification records added in Cloudflare DNS.
- **Done when:**
  - the live domain serves `/`, `/privacy` and `/uninstalled` over HTTPS
  - a test feedback reaches the owner's inbox
  - screenshots at 1440, 820 and 390 match the Landing PNGs

### Phase 9: Chrome Web Store package
- **Tasks:**
  - Production zip (`wxt zip`).
  - 5 store screenshots at 1280x800 made from the fixture (Popup, Events, Consent, Attribution, Audit PDF).
  - Small promo tile 440x280 and marquee 1400x560.
  - `docs/STORE-LISTING.md`:
    - name and the short description (132 chars max)
    - long description
    - category Developer Tools
    - single purpose statement
    - a justification for each permission
    - privacy practices answers: no data collected, no sale, no remote code
    - privacy policy URL
  - A GitHub release with the zip.
- **Done when:** everything the owner has to paste or upload in the Developer Dashboard is in one folder `store/` with the listing doc.

### Phase 10: QA and handover
- **Tasks:**
  - Test on 3 real public sites the owner names, plus the fixture.
  - Fix false positives.
  - Lighthouse and axe on the site.
  - Write `docs/OWNER-GUIDE.md` (Azerbaijani): how to release a new version, how to change the domain, how to read feedback e-mails, and how to start the next Line tool from the same monorepo.
- **Done when:** no false positives on the test sites, site scores are at least 95, and the guide exists.

## 13. Owner inputs still needed (keep as config placeholders)
- Final TLD (default `hitline.co`) and the other tools' domains
- Web Store listing URL (after the first upload)
- Resend API key and the feedback recipient e-mail (set as Pages secrets by CLI)
- Optional GTM container id for the site
- 3 public sites for QA
