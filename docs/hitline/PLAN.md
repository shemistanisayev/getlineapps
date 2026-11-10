# Hitline: build plan (Faza 3, step 1 = SPEC Phase 0)

Source of truth, in order: root `CLAUDE.md`, `docs/line-family-domains.md`, `docs/line-family-colors.md`, `docs/hitline-SPEC.md` (with its family override note), `design/hitline/`. This file maps every Hitline artboard to code, fixes the open choices and lists the gaps found while reading the design.

## Tools (checked 2026-11-10)

Node 24.22.1, pnpm 12.15.0, gh 2.103.3, wrangler 4.153.0, git. Nothing to install.

## What Faza 1 and 2 already cover

| SPEC phase | Status |
|---|---|
| P1 Scaffold (monorepo, CI, repo) | Done in Faza 1. Only `apps/hitline/extension` and `apps/fixture` are new. |
| P2 Design system | Done in Faza 1: tokens, fonts, `Logo`, `Button`, `Pill`, `Card`, `Table`, `CtaBand`, icons 16/32/48/128, `Mark` with `googleanalytics`, `googleads`, `meta`, `tiktok`, `hotjar`, `googletagmanager`. Hitline adds only `PlatformBadge` (tint square + mark, `pf-*` in the artboards) inside the extension. |
| P8 Landing | Becomes Faza 3B: route `/hitline` in `apps/site`. `/privacy/hitline`, `/api/feedback`, consent banner, SEO helpers already exist. |

## Package and app layout

```
packages/core/src/hitline/
  classify.ts      request classifiers (§4.1) + decoders (query, POST body, GA4 batch lines)
  route.ts         Browser / sGTM / Page route label, registrable domain helper
  sgtm.ts          4 signals + "browser only" platforms (§4.2)
  consent.ts       Consent Mode v2: dataLayer commands, gcs/gcd decode, CMP globals, timeline split (§4.3)
  attribution.ts   pages from navigations, UTM/click ids, _gl, cid, dr, issues (§4.4)
  plan.ts          CSV/JSON parse + validate, diff, draft export, sample CSV (§4.5)
  gtm.ts           container stats and tag list from gtm.js resource JSON (see gap G4)
  issues.ts        one rule list (§4.6), ids, severity, evidence
  session.ts       Session model: hits[], pages[], snapshots[]; analyze(session, settings) -> Audit
  popup.ts         analyzePopup(probe) for the URL-only summary
  report.ts        hitlineReport(audit, fonts, mode: 'full' | 'summary') -> LineReportConfig
  index.ts
packages/core/fixtures/hitline/
  lumo-accept.har.json, lumo-reject.har.json   recorded from apps/fixture by Playwright
  lumo-*.snapshots.json                        dataLayer / cookie / google_tag_manager snapshots
  lumo-tracking-plan.csv                       the 8-event plan from the Plan artboard
  expected-*.json                              issues and counts the design shows

apps/fixture/                Lumo shop (static, shared with Serpline later)
apps/hitline/extension/      WXT + React + TS
  entrypoints/popup/         372 px React app
  entrypoints/devtools/      devtools page, creates the "Hitline" panel
  entrypoints/devtools-panel/React panel
  entrypoints/welcome/       Welcome artboard
  entrypoints/background.ts  onInstalled -> welcome, setUninstallURL, nothing else
  src/capture/               DevtoolsSource (chrome.devtools.*) and ReplaySource (HAR file, tests)
  src/i18n/en.ts, az.ts      typed dictionaries
  src/components/            PlatformBadge, StatusPill, RoutePill, ParamTable, IssueCard, CtaCard ...
  src/storage.ts             domains, plans, lang, installedAt
apps/site/src/pages/hitline/ index.astro, uninstalled.astro (+ az/ variants)
apps/site/src/content/hitline/en.json, az.json
```

## Artboards to components

### Extension (popup 372 px)

| Artboard | Component | Notes |
|---|---|---|
| `Main` | `PopupMain`: `PopupHeader` (Logo 28 + settings button), `HostHero` (host, request count, sGTM verdict or neutral "No server-side GTM"), `PlatformTiles` (2x2, max 4, "+N more"), `TopIssues` (max 3), primary "Download audit PDF", F12 hint, dark `PopupFooterCta` | CTA `panel_cta` |
| `PopupEmpty` | `PopupEmpty`: pulse icon, title, text with host, "What Hitline checked" chips, lime `CtaCard` | CTA `panel_cta` |
| `PopupSettings` | `PopupSettings`: domains list (add/remove), plan row (Replace/Remove), language select, "Clear all settings", privacy note, "More free tools" (4 rows with `Logo word=false`, `toolUrl(slug, '', more_tools)`), version, Privacy (`/privacy/hitline`, no UTM), Contact (`settings`) | |
| (no artboard) | `PopupRestricted`: "Hitline can't read this page" for `chrome://`, Web Store, `edge://`, PDF viewer | Built from the PopupEmpty layout |

### Extension (DevTools panel)

| Artboard | Component | Notes |
|---|---|---|
| `PanelHeader` | `PanelHeader`: Logo 22, 5 tabs with count badges (active violet, issue red tint, else neutral), `RecordingPill` (blinking dot, off with reduced motion), Clear, Audit PDF | Counts: Events = events, GTM = tags, Consent/Attribution/Plan = issues |
| `Empty` | `PanelEmpty`: "Reload page" (`inspectedWindow.reload`), "Load tracking plan", shortcut hint (Ctrl/Cmd by platform), "What Hitline watches" card | Shown while the session has no hits |
| `Events` | `EventsTab`: platform filter chips with counts, search (event name + param keys and values), table (Time, Platform, Event, Route, Status), `EventDetail` (name, badge, route pill, time, raw request line with host bold, `ParamTable`, consent card for the hit, linked `IssueCard`) | Keyboard: arrow keys move the selected row |
| `Gtm` | `GtmTab`: container stats (id, tags, triggers, variables, "estimated" label), tag table (Tag, Type, Trigger, Status), `SgtmCard` (4 signals with evidence), "Only GA4 goes server-side" warning, lime CTA | See G4 |
| `Consent` | `ConsentTab`: hero (banner found, visitor's choice), signal table (default vs after choice), Google correctness note, timeline split "Before the choice" / choice marker / "After <choice>", "How to fix" card, CTA | |
| `Attribution` | `AttributionTab`: visit path (up to 5 page cards with arrows, broken step red), parameter table across pages, issue card, CTA | More than 5 pages: first 4 + last, rest collapsed |
| `Plan` | `PlanTab`: summary counts, segmented bar, table (Event, Platform, Parameters in plan, What arrived, Status), "Change plan", local storage note | |
| `PlanSetup` | `PlanSetup`: drop zone + "Choose file", CSV format card + "Download sample CSV", lime "No plan yet?" + "Create plan from this session", note | |
| `Report` | `hitlineReport()` -> `buildLineReport` (full from panel, summary from popup) | `hitlineSample` already matches the artboard |
| `Welcome` | `welcome.html`: Logo 44, title, 3 trust chips, 3 steps, "Built by", contact link (`welcome`) | |
| `Logo` | `@line/ui` `Logo` | done |
| `BrowserBar`, `DevtoolsBar` | not built (mock only) | |
| `SitePage` | `apps/fixture` Lumo shop | |

### Site (`apps/site`, Faza 3B)

| Artboard | Route / component | Notes |
|---|---|---|
| `Landing`, `LandingTablet`, `LandingMobile` | `/hitline` and `/az/hitline`: `ToolNav` (dark sticky), `Hero` (pill, title, CTAs, trust row, animated panel mock with looping event rows, sGTM chip, issue toast), `Marquee` ("Reads the tags you already use"), `Problem` (3 cards with mini illustrations), `TabShowcase` (5 radio tabs, keyboard accessible), `HowItWorks` (3 steps), `AuditCta` (dark, lime "Book a tracking audit", report mock), `PrivacyGrid` (4 cards), `Faq` (`<details>`, "Ask me directly"), `MoreTools` (4 dark cards, internal links no UTM), `ToolFooter` | Breakpoints from the artboard CSS: 1024 and 640. 19 keyframes, all CSS, off under `prefers-reduced-motion`. `LandingTablet`/`LandingMobile` just embed `Landing` at 820/390, so the artboard's own media queries are the spec. Status `soon`: "Add to Chrome" becomes "Coming soon" (as on the hub) |
| `Landing` "Sample audit" modal | `<dialog>` with the Report mock + "Download sample PDF" -> `/hitline/sample-audit.pdf` | PDF generated at build time from `hitlineSample` |
| `Uninstall` | `/hitline/uninstalled` (+ AZ): 4 radios, optional text, hidden `v`, honeypot, posts `/api/feedback` with `tool=hitline`; "Reinstall Hitline" (store URL or landing), dark card "Book a tracking audit" (`uninstall`) | `noindex` |
| SEO | `SoftwareApplication` + `FAQPage` JSON-LD, OG image 1200x630 from the hero, canonical, hreflang, sitemap entries | via `@line/site-kit` `seo.ts` |

## Data capture design

- **One `Session` model** fed by a `CaptureSource` interface. `DevtoolsSource` wraps `chrome.devtools.network` (`onRequestFinished`, `getHAR` backfill, `getContent` for gtm.js), `onNavigated` and a 1 s `inspectedWindow.eval` snapshot (dataLayer new entries, `google_tag_manager` keys, `google_tag_data` server_container_url, CMP globals, the allowed cookie names only). `ReplaySource` feeds a recorded HAR + snapshots so tests and screenshots run without DevTools UI (Playwright cannot drive the DevTools panel).
- **Popup** runs one `chrome.scripting.executeScript` (allowed by `activeTab`) that returns resource entry names with `startTime`, dataLayer consent commands and length, GTM ids, CMP globals and the allowed cookie names. `analyzePopup` classifies from URLs only.
- Nothing is persisted except §7 settings. "Clear" empties the session.

## Decisions

1. **Three fixture runs** (step 3). The artboards show different visits, so the Lumo scenarios in `packages/core/fixtures/hitline/lumo.ts` have three runs: `events` (returning visitor who accepted, one product page: Events, GTM, Plan, popup), `consent` (first visit, "Reject all": Consent) and `journey` (campaign link to order confirmation over 5 pages: Attribution). The Report artboard is the three together (core test "Report artboard issues"). The shop takes `?run=events|consent`; the journey run starts from the campaign URL.
2. **Design hosts in tests.** Playwright Chromium starts with `--host-resolver-rules` mapping `example.com`, `data.example.com` and `pay.example.net` to the local fixture server, so screenshots show the same hosts as the design. Vendor URLs are fulfilled with 204 by `page.route`; nothing leaves the machine. On plain `localhost` the shop sends no vendor requests at all; `pnpm --filter @line/fixture open:hitline [run]` opens it with the extension and the host rules for manual testing.
3. **Issue de-duplication.** When `VALUE_MISSING` and `PLAN_PARAMS` point to the same event and parameter, the panel keeps both (Plan tab shows "Wrong parameters" for Meta AddToCart) but the PDF and popup show one line. Several `PLAN_MISSING` issues become one PDF line ("generate_lead and begin_checkout never arrive"). That gives exactly the 3 high + 3 medium of the Report artboard.
4. **Popup consent issues from URLs.** The popup has no timestamps for dataLayer pushes, so it orders resource entries by `startTime` and reads the choice moment from `gcd` on Google hits (update vs default letters). It reports `CONSENT_BEFORE` / `CONSENT_AFTER_REJECT` only when that is provable, otherwise it leaves them to the panel.
5. **Settings "Your domains"** default to the inspected site's registrable domain; the user adds others (for example `pay.example.net`). Registrable domain uses a small built-in public-suffix list (common two-part suffixes), no network and no big dependency.
6. **Plan storage key** is the registrable domain, plus `default`. Max file size 256 KB, max 500 rows; clear error messages per row.
7. **PDF** uses the existing `buildLineReport`; file name `hitline-audit-<host>-<yyyy-mm-dd>.pdf`, download through a blob URL (no `downloads` permission).
8. **AZ copy** lives in `src/i18n/az.ts` and the site's `content/hitline/az.json`; every string goes to `docs/hitline/AZ-REVIEW.md`. Tool, event and parameter names stay untranslated.

## Gaps and questions found in the design (resolved here unless marked "owner")

- **G1. Event counts do not add up.** Events: "All 14", but the chips say GA4 6 + Meta 4 + TikTok 2 + Google Ads 1 + dataLayer 3 = 16, and the table shows 11 rows. Decision: counts are always computed. The events run is built to give **14** events: GA4 5, Meta 3, TikTok 2, Google Ads 1, dataLayer 3. These are the 11 visible rows plus dataLayer `begin_checkout` (as in the landing hero), GA4 `view_cart` and GA4 `sign_up` with an empty `method` (as in the Plan tab), so the visible rows stay exactly as drawn. The chip numbers in the screenshot will differ slightly from the artboard (6/4 vs 5/3).
- **G2. Popup "13 tracking requests" vs 14 events.** Different things: requests are network hits (no dataLayer), events include dataLayer. Kept as two separate numbers.
- **G3. Popup shows 2 issues, the PDF 6.** The popup is a summary of one moment on the events run (Meta AddToCart without value, TikTok after rejection as drawn). On the fixture the popup will show what it can prove (decision 4); the e2e test asserts the popup's own list, not the PDF's.
- **G4. GTM tag names.** Public `gtm.js` has tag types, trigger conditions and consent settings, but no tag or trigger names. The panel reads the container JSON from the gtm.js response body (`getContent`, already in DevTools memory, no extra request) and builds readable labels: "GA4 Event: add_to_cart", "Custom HTML: Meta AddToCart" (from `fbq('track', ...)` in the HTML), trigger "dl add_to_cart" from the rule `_event equals add_to_cart`. "No consent check" comes from the tag's consent settings. When gtm.js is not available (popup, or cached before DevTools opened) the list is inferred from hits and labelled "estimated". Built names: "GA4 Config", "GA4 <event>", "Google Ads Conversion", "Meta Pixel Base" (fbq init), "Meta <event>", "TikTok Pixel" (ttq.load), "TikTok <event>", "Hotjar". The fixture container (`gtm-K7P2QX.js`) reproduces the design's 8 rows and statuses, but its stats are real: 8 tags, 3 triggers, 6 variables (the artboard says 24 / 31 / 18 for a bigger container).
- **G5. Privacy text.** `content/privacy/hitline.en.json` says "Your settings, such as the language". Hitline also stores your domains list and tracking plans. Step 3A-7 updates the text (EN + AZ) and the existing manifest-vs-privacy test covers permissions.
- **G6. Hotjar.** Appears in GTM and Consent but not in the popup tiles or the "What Hitline watches" list. It is detected and shown where the design shows it; the popup tiles list it only when found (counts toward "+N more").
- **G7. Events time format.** Table shows `mm:ss.mmm` (`42:18.204`), detail shows `hh:mm:ss.mmm`. Kept as drawn.
- **G8. Store screenshots** (SPEC P9) are 1280x800 and are made from the fixture with the ReplaySource panel page, the popup page and a rendered PDF page.
- **Owner:** 3 real public sites for QA (step 9). Web Store listing URL after upload (then `tools.json` -> `live`).

## Step order (Faza 3)

| Step | What | Done when |
|---|---|---|
| 1 | This plan | `docs/hitline/PLAN.md` |
| 2 | `apps/hitline/extension` scaffold: empty popup, "Hitline" DevTools panel, background (welcome + uninstall URL), manifest `activeTab`, `scripting`, `storage`, `devtools_page` | Playwright loads it unpacked; manifest test passes; panel page renders |
| 3 | `packages/core/src/hitline` (all of §4) + `apps/fixture` Lumo shop + recorded fixtures | Unit tests per module; both runs produce the design's issues |
| 3B | `/hitline` landing, sample PDF, `/hitline/uninstalled`, SEO, AZ | Screenshots 1440 / 820 / 390 |
| 4 | Panel header, Empty, Events, GTM, live capture | Matches artboards on the fixture |
| 5 | Consent, Attribution, Plan, PlanSetup | Plan upload and draft export work |
| 6 | Popup Main, Empty, Settings, restricted state, EN + AZ | Language switch changes popup and panel |
| 7 | Audit PDF (full + summary), welcome, uninstall hook, privacy text update | PDF matches `Report` |
| 8 | Store package: zip, 5 screenshots, promo 440x280, marquee 1400x560, `docs/hitline/STORE-LISTING.md`, GitHub release | `store/hitline/` complete |
| 9 | QA on 3 real sites + fixture, Lighthouse and axe | No false positives |

Each step ends with typecheck, lint, tests and build for every app and package, screenshots of the touched screens, commit, push and a short Azerbaijani report.
