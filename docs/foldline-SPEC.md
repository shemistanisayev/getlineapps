# SPEC: Foldline (Chrome side panel extension + landing site)

Read `apps/foldline/CLAUDE.md` and the root `CLAUDE.md` first. This file is the source of truth for Foldline features and phases.

---

## 1. Product
- **What:** a free Chrome extension that opens in the side panel next to any landing page, draws the fold line on the page and runs 27 conversion checks in six sections: First screen, Form, Trust, Mobile, Speed, Contact. It gives a score out of 100 for Desktop and for Mobile, a list of issues sorted by priority with "why it matters" and "how to fix", and a one-page audit PDF.
- **Audience:** campaign managers checking a page before ads go live, business owners asking "why are sales low?", CRO and web agencies preparing a first audit for a prospect. English first, Azerbaijani second.
- **Business goal:** lead magnet. Contact CTAs drive users to shamistanisayev.com. No paid plan, no account.
- **Name in the Chrome Web Store:** "Foldline: Landing Page CRO Checker".
- **What it is not:** no heatmaps, no visitor recording, no A/B testing, no AI. Foldline only looks at the page that is open.

## 2. Design reference (`design/foldline/`)
Same format as Hitline's and Rivaline's design folders: `*.dc.html` artboards with `{{holes}}`, `<sc-for>`, `<sc-if>`, `<dc-import>` and a `DCLogic` class with demo data; `screens/*.png` rendered at 1x with the real fonts; `brand-icons/whatsapp.svg`; `canvas.json`.

The demo landing page "Sunvo" on `example.com/free-quote` and "Nori Yoga" on `example.net` are fictional. All numbers in the design (scores, px values, 2.1 s) are the expected output for the fixture (§11).

| Artboard | What it is | Where it lives |
|---|---|---|
| Main | Side panel, Overview tab, Desktop view, fold line and main-button mark on the page | `extension` side panel |
| Issues | Issues tab, first issue open, "Show on page" active (spotlight on the page) | side panel tab |
| Checks | Checks tab with measured values | side panel tab |
| Share | "Share fixes" sheet over the Issues tab, Markdown selected, copied toast | side panel overlay |
| Mobile | Mobile view: window narrowed so the page is 390 px wide, mobile score | side panel state |
| Settings | Settings view | side panel route |
| Access | The user switched tabs, the page has not been granted yet | side panel state |
| Restricted | chrome:// pages, Chrome Web Store, PDF viewer, other extensions | side panel state |
| Report | Audit PDF (A4) | `packages/report` |
| Welcome | Page opened after install | extension page `welcome.html` |
| Uninstall | Page opened after uninstall | site route `/uninstalled` |
| Landing, LandingTablet, LandingMobile | Landing at 1440, 820, 390 | site route `/` |
| BrowserBar, PanelChrome, SitePage | Chrome UI and the fictional sites | mock only (SitePage is the model for the fixture, §11) |
| PanelHeader | Foldline header with tabs and actions | side panel component |
| Glyph | Neutral line icons for checks and sections (plus the WhatsApp mark) | `packages/ui` |
| Logo | Line family logo (shared) | `packages/ui` |

The fold line, the red dashed marks, the labels and the spotlight drawn on the Sunvo page in SitePage are Foldline's own overlay (§3.3), not part of the site.

## 3. Extension architecture (`apps/foldline/extension`)
Entrypoints (WXT):
- `sidepanel/`: React app. Manifest `side_panel.default_path`.
- `background.ts` (service worker):
  - `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })`.
  - `chrome.action.onClicked`: call `chrome.sidePanel.open({ tabId })` first and synchronously (inside the user gesture), then send `{ type: 'scan', tabId }` to the panel. If the panel is not open yet, the panel scans the active tab when it loads.
  - `commands`: `_execute_action` with `suggested_key` `Alt+Shift+F`. It fires `action.onClicked` and grants `activeTab` like a click.
  - `runtime.onInstalled` (reason `install`): open `welcome.html`, store `installedAt`.
  - `runtime.setUninstallURL(FOLDLINE_SITE_URL + '/uninstalled?utm_source=foldline&utm_medium=extension&utm_campaign=uninstall&v=' + version)`.
  - `runtime.onConnect` (port name `panel`): on disconnect, restore the window bounds saved for Mobile view (§3.4) and remove the overlay from the tab (§3.3). No other logic. No network.
- `welcome/`: static page from the Welcome artboard.
- Content scripts: none declared in the manifest. `scan.js` and `overlay.js` are injected on demand with `chrome.scripting.executeScript({ files })`.
- Manifest: name "Foldline", short description (§12), permissions `activeTab`, `scripting`, `storage`, `sidePanel`. No `host_permissions`, no `debugger`, no `tabs`, no `webRequest`. Icons 16, 32, 48, 128 from the Foldline logo tile. `minimum_chrome_version` "116".

### 3.1 Reading a page
- The panel keeps `Map<tabId, { desktop?: ScanResult, mobile?: ScanResult }>` in memory. Nothing about pages is persisted.
- **Scan** = one `executeScript({ target: { tabId }, files: ['scan.js'] })` in the isolated world. It returns a plain-data `PageSnapshot` (§4.1) and keeps element references in a registry inside the isolated world (`globalThis.__foldline`, a `Map<id, WeakRef<Element>>`) so the overlay can find them later. The page DOM is never changed by the scan.
- Speed values come from `PerformanceObserver` with `buffered: true` for `largest-contentful-paint` and `layout-shift`, read for 300 ms and then disconnected. They describe the page load in this browser, so they are labelled "this visit" in the UI and the PDF.
- **Tab changes:** listen to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` (status `complete`). On a change, show the cached result for that tab if the URL is the same; otherwise run a cheap probe (`executeScript` returning `location.href`).
  - Probe works: scan.
  - Error says the page can't be scripted (chrome://, chrome-extension://, the Chrome Web Store, the PDF viewer, `view-source:`): **Restricted** state.
  - Any other permission error: **Access** state ("Check this tab?").
- The header "Check again" button rescans the current tab and view while the grant is valid.
- Phase 0 must confirm each API assumption in §3 on the current stable Chrome and write the result in `docs/foldline/PLAN.md`. If one fails, stop and ask.

### 3.2 Panel lifecycle
- On load the panel opens a long-lived port `chrome.runtime.connect({ name: 'panel' })` so the background knows when the panel closes.
- Results are dropped when the tab closes or navigates to another URL.

### 3.3 Overlay on the page
- Injected with `executeScript({ files: ['overlay.js'] })` after each scan while the setting `fold` is on, and removed when the panel closes, the setting is turned off, or the tab navigates.
- One host element `<foldline-overlay>` appended to `document.documentElement`, absolutely positioned at the document's top left, `pointer-events: none`, `z-index: 2147483647`, with a closed shadow root so page CSS can't reach it.
- Draws, in document coordinates:
  - the fold line at `y = innerHeight` of the scanned view: 2px dashed `#C11574` with a 2px `#FAA7E0` line under it, and the pill "Fold <n> px" (bg `#C11574`, white text);
  - red dashed marks (`#D92D20`) with a red label for High issues that point to one element (main button below the fold, form too long), as in Main and Mobile;
  - the spotlight for "Show on page" (Issues artboard): 3px `#FAA7E0` ring with a soft pulse, the rest of the page dimmed with `rgba(16,24,40,.38)`, and a `#C11574` label. The element is scrolled into view with `scrollIntoView({ block: 'center', behavior: 'smooth' })`. Clicking "Shown on page" again, opening another issue or pressing Escape in the panel clears it.
- The panel talks to the overlay with `chrome.tabs.sendMessage(tabId, msg)`; `overlay.js` adds a `chrome.runtime.onMessage` listener once per document.
- Copy and labels on the page come from the panel (i18n), never hard-coded in `overlay.js`.
- Store policy: the overlay is Foldline's own UI, shown only while the user has the panel open on that tab. Never inject anything else into pages.

### 3.4 Mobile view
- "View as: Mobile" reads the current window with `chrome.windows.getCurrent()` and the page's `innerWidth`/`innerHeight` (from the last scan). It saves `{ windowId, left, top, width, height, state }` to `chrome.storage.session` and calls `chrome.windows.update(windowId, { state: 'normal', width, height })` so that the page viewport becomes the size from Settings (default 390 x 844):
  - `width = target.width + (window.width - page.innerWidth)` (the side panel and window frame stay as they are),
  - `height = target.height + (window.height - page.innerHeight)`, capped to the screen's available height; if capped, the fold uses the real `innerHeight` and the hero card shows the real size.
- After the `resize` settles (wait for two `requestAnimationFrame`s after the new `innerWidth` is reported, max 1.5 s) the panel scans again and stores the result as `mobile`.
- "View as: Desktop" restores the saved bounds and state, then rescans if there is no desktop result for this URL.
- If the panel closes in Mobile view, the background restores the bounds (port disconnect, §3).
- `chrome.windows` needs no permission. The user agent, touch and device pixel ratio stay the same: the panel says so (Mobile artboard note). No `debugger` permission, no device emulation.
- Phase 0 checks: minimum window width Chrome allows with the side panel open, and whether `windows.update` works for a maximized and a fullscreen window (fullscreen: show a short note "Leave full screen to use Mobile view" and stay in Desktop).

## 4. Checks (`packages/core/src/foldline`)
Every function that turns a snapshot into results is pure and unit-tested with fixtures in `packages/core/fixtures/foldline/`. `scan.js` (in the extension) only collects plain data.

### 4.1 Page snapshot (input)
`collectPage()` returns:
- `url`, `protocol`, `title`, `lang`, `innerWidth`, `innerHeight`, `devicePixelRatio`, `scrollWidth`, `scrollHeight`
- `viewportMeta`: content of `<meta name=viewport>` or `null`
- `headline`: first visible `h1` (fallback: largest font-size text block in the first viewport): text, word count, top (document y), font size
- `actions`: visible `a`, `button`, `input[type=submit|button]`, `[role=button]` with: id (registry), text (max 60 chars), href or form, rect in document coordinates, computed background, border, font weight and size, inside `header`/`nav`/`footer`, `display` (inline or not)
- `forms`: visible forms (and form-like groups: 2+ inputs and a submit button inside one container without `<form>`), each with fields (type, name, id, autocomplete, has label, label text, placeholder, font size, required, rect), submit button id and text, `autocomplete` on the form, links near the form (text and href, inside the form or within 300 px below it)
- `overlays`: elements with `position: fixed|sticky` and `z-index > 0` covering more than 20% of the viewport at scan time: rect, area share, text sample, whether it looks like a cookie banner (`cookie|consent|gdpr` in id, class or text)
- `text`: visible text blocks (p, li, span with own text) with font size and rect, capped at 400; used for font-size, phone, guarantee and review patterns
- `images`: visible `img` and CSS background images on elements larger than 200x120: natural size (for `img`), rendered size, top, `loading` attribute
- `links`: all `href` values that start with `tel:`, `mailto:`, `https://wa.me/`, `https://api.whatsapp.com/`, `whatsapp:`, `https://m.me/`, `https://t.me/`
- `chatWidgets`: elements or iframes whose id, class or src matches `intercom|crisp|tawk|drift|tidio|zendesk|livechat|hubspot-messages|freshchat|jivo|gorgias`
- `jsonLd`: `@type` values found in `application/ld+json` blocks (for `AggregateRating`, `Review`)
- `perf`: `lcp` (ms, or null), `cls` (largest session window, or null)
- `view`: `'desktop' | 'mobile'` (passed in by the panel)

### 4.2 Main button
`findMainButton(actions, forms)` picks one element:
1. Candidates: visible actions with height ≥ 32 px and width ≥ 80 px, not in `footer`, not plain inline text links.
2. Score: filled background that differs from its section background (ΔE > 20) +4; text matches `/(get|start|book|buy|order|request|claim|try|sign up|join|contact|call|quote|demo|download|subscribe|apply)/i` +3; area rank (largest gets +3, second +2, third +1); inside `header`/`nav` −3; is the submit of the main form +2.
3. Highest score wins; ties go to the higher one on the page.
The result is shown in Checks as the button text (Issue copy uses it: Move "Get my free quote" ...). If no candidate exists, `FOLD_CTA` fails with the value "no button found".

### 4.3 The 27 checks
`High` −12, `Medium` −6, `Low` −2 from 100 for each failed check that ran in the current view. Checks marked "Mobile" run only in Mobile view. Floor 0. Not-run checks never change the score.

| Id | Section | View | Severity | Passes when | Value shown | Issue title (panel) |
|---|---|---|---|---|---|---|
| FOLD_HEADLINE | First screen | both | High | a headline exists and its top is above the fold | `H1 at 212 px` | Headline is below the fold |
| FOLD_HEADLINE_LENGTH | First screen | both | Low | headline has 12 words or fewer | `10 words` | Headline has <n> words |
| FOLD_CTA | First screen | both | High | main button top + 40 px is above the fold | `872 px` | Main button is below the fold |
| FOLD_ACTIONS | First screen | both | Medium | 3 or fewer button-styled actions start above the fold (nav text links excluded) | `5 buttons` | <n> buttons compete for one click |
| FOLD_POPUP | First screen | both | Medium | no overlay covers more than 30% of the first screen | `none` / `38%, cookie banner` | A pop-up covers <n>% of the first screen |
| FORM_FIELDS | Form | both | High | the main form has 5 visible fields or fewer | `9 fields` | Quote form asks for <n> fields |
| FORM_LABELS | Form | both | Medium | every visible field has a label (`<label>`, wrapping label, `aria-label` or `aria-labelledby`; a placeholder is not a label) | `3 missing` | <n> fields have no label |
| FORM_TYPES | Form | both | Medium | fields that ask for email use `type=email` and phone fields use `type=tel` (matched by name, id, autocomplete or label) | `email, tel` | Email or phone field opens the wrong keyboard |
| FORM_AUTOFILL | Form | both | Low | no `autocomplete="off"` on the form or on name, email and phone fields | `on` | Autofill is turned off |
| FORM_BUTTON | Form | both | Low | submit text is not one of `submit, send, ok, go, enter, next` | `"Get my quote"` | Button says "<text>" |
| TRUST_REVIEWS | Trust | both | Medium | a rating or review pattern in text (`/\b[1-5](\.\d)?\s*(\/\s*5|out of 5|stars?)\b/i`, star characters with a review count), a known widget (Trustpilot, Google reviews, Yotpo, Judge.me, Okendo, Reviews.io, Feefo) or `AggregateRating`/`Review` in JSON-LD | `in hero` / `below the fold` | No reviews or rating on the page |
| TRUST_LOGOS | Trust | both | Low | a group of 3 or more logos or brand names under a heading matching `/trusted by|as seen in|featured in|our clients|partners|customers/i`, or 4+ similar-height images in one row | `4 logos` | No client or press logos |
| TRUST_GUARANTEE | Trust | both | Low | text matches `/guarantee|warranty|money[- ]back|refund|risk[- ]free|free returns/i` | `25-year` | No guarantee or warranty |
| TRUST_PRIVACY | Trust | both | Low | a link matching `/privacy|data protection|gdpr/i` inside the main form or within 300 px below it | `found` | No privacy link near the form |
| TRUST_HTTPS | Trust | both | High | `protocol` is `https:` (`http://localhost` passes with the value `local`) | `https` | The page is not on https |
| MOB_VIEWPORT | Mobile | both | High | viewport meta has `width=device-width` | `width=device-width` | No mobile viewport tag |
| MOB_TAP | Mobile | Mobile | Medium | fewer than 3 visible non-inline actions are smaller than 44 x 44 px | `7 small` | <n> tap targets are smaller than 44 px |
| MOB_TEXT | Mobile | Mobile | Medium | median font size of visible text blocks is 16 px or more | `16 px` | Body text is <n> px |
| MOB_SIDEWAYS | Mobile | Mobile | Medium | `scrollWidth - innerWidth` is 1 px or less | `46 px` | The page scrolls sideways by <n> px |
| MOB_ZOOM | Mobile | Mobile | Low | every visible input, select and textarea has font size 16 px or more | `14 px` | Form text is <n> px, so iPhone zooms in |
| SPEED_LCP | Speed | both | Medium | largest contentful paint is 2.5 s or less | `2.1 s` | Largest paint takes <n> s |
| SPEED_CLS | Speed | both | Medium | layout shift is 0.1 or less | `0.04` | Layout shifts by <n> |
| SPEED_IMAGES | Speed | both | Medium | no image has a natural width more than 2 x (rendered width x devicePixelRatio) and over 1200 px | `3840 px for 520 px` | Hero image is <n> times too large |
| SPEED_LAZY | Speed | both | Low | images that start below two screens use `loading=lazy` (pass if fewer than 2 such images lack it) | `6 of 6` | <n> images below the fold load right away |
| CONTACT_PHONE | Contact | both | Low on Desktop, Medium on Mobile | every visible phone number (`/\+?\d[\d\s().-]{7,}\d/` near "call", "phone" or a phone icon, or in `header`) is inside a `tel:` link; pass with value `no phone shown` when there is none | `plain text` | Phone number can't be tapped |
| CONTACT_QUICK | Contact | both | Low | a WhatsApp, Messenger or Telegram link or a chat widget exists | `chat link` | No WhatsApp or chat option |
| CONTACT_DETAILS | Contact | both | Low | a `mailto:` link, an `<address>`, or a link with text matching `/contact/i` | `email in footer` | No email or address shown |

- "Why it matters" and "How to fix" copy for each id lives in the i18n dictionaries (`foldline.check.<ID>.why`, `.fix`). The fix may use values from the result (button text, field names, image sizes). Use the copy from the design where it exists:
  - FOLD_CTA why "Visitors who don't scroll never see the button." fix 'Move "<button text>" into the hero, under the headline.'
  - FORM_FIELDS fix "Keep name, email, phone and postcode. Ask the rest after the first call." For other pages: "Keep only the fields you need for the first reply. Ask the rest later."
  - FORM_LABELS fix "Add a visible label above <field names>."
  - SPEED_IMAGES fix "Serve it at about <2 x rendered width> px wide in WebP or AVIF."
  - MOB_TAP fix "Give links and icons at least 44 x 44 px of tap area."
  - MOB_SIDEWAYS fix "Let the <element short name> wrap or scroll inside its own box."
  - CONTACT_PHONE fix "Wrap <number> in a tel: link."
  - MOB_ZOOM fix "Set form fields to 16 px or more."
- Each failed check that points to elements keeps their registry ids for "Show on page" (max 10).
- Results: `{ id, section, severity, status: 'pass' | 'fail' | 'skip', value, elementIds }`. Score and section summaries are derived from these, never stored separately.
- The same check list, severities and weights are exported for the landing calculator (§9) so both always agree.

### 4.4 Section summaries (Overview)
- Pill per section: any High failed: red "<n> issue(s)"; else any failed: orange "<n> issue(s)"; all passed: green "Good", except a section whose Mobile-only checks did not run in Desktop view: neutral "Mobile view".
- Subtitle under the section name: fixed text per section ("Headline, main button, pop-ups") in Desktop, or the most important value in Mobile view, as in the Mobile artboard.
- Hero card: host + path, view and viewport size, score ring (stroke `#FAA7E0` on the pink gradient `#C11574` to `#9E165F`), "<n> issues to fix", a line built from data: "<h> high, <m> medium, <l> low." plus the top issue sentence ("The main button sits below the fold."). In Mobile view: "<n> points lower than on Desktop." when a desktop result exists.

## 5. Issues, Show on page and Share
- **Issues tab:** chips All, High, Medium, Low with counts; rows sorted High, Medium, Low, then by section order. One row open at a time. Open row: severity pill and section, title, up to three measured value boxes, "Why it matters", "How to fix", "Show on page" (only when the issue has elements) and "Copy fix" (copies "<title>. <fix>"). Under the list: "Share all <n> fixes with your developer" and the lime CTA "Need help fixing these?" with "Get in touch".
- **Show on page:** see §3.3. The button turns into "Shown on page" (pressed style) while the spotlight is on.
- **Share sheet:** segmented Plain text / Markdown, preview, "Copy" (turns into "Copied" with a check for 2 seconds) and "Download .txt" / "Download .md" (blob URL and `<a download>`, no `downloads` permission), the note about the last line, and the dark toast "<Format> copied to clipboard". File names `foldline-fixes-<host>-<yyyy-mm-dd>.md|.txt`.
- **Markdown format:**
  ```
  ## Landing audit: <host><path>
  Score <n>/100. <View>, <w> x <h>.

  ### High
  - [ ] <title>
    <measured line>
    Fix: <fix>
  ...
  Checked with Foldline: https://getlineapps.com/foldline/?utm_source=foldline&utm_medium=extension&utm_campaign=share
  ```
  Plain text is the same without `#`, `- [ ]` and with "HIGH", "MEDIUM", "LOW" headings. The last line uses `FOLDLINE_SITE_URL`.

## 6. Screens
Build every screen to match its artboard and copy.
- **Side panel frame:** Chrome draws its own header (PanelChrome is only a mock). Foldline starts at PanelHeader.
- **PanelHeader:** Logo; "Check again" icon button; Settings icon button; "Audit PDF" primary button (disabled in Access and Restricted). Tabs Overview, Issues (count in the normal tab badge: pink when active, neutral otherwise; never red, see §15), Checks (count of checks run in this view). Counts hidden in Access and Restricted.
- **Overview (Main):** hero card (§4.4), "View as" segmented Desktop/Mobile, "Fold line on the page" switch with "First screen ends at <n> px", "By section" card (6 rows with Glyph, name, subtitle, status pill, chevron that opens Checks filtered by that section), lime CTA "Want these fixed before the next campaign?" with "Get in touch".
- **Issues:** §5.
- **Checks:** summary card "<n> checks on <View>" with "<n> more in Mobile view" (Desktop only), a segmented bar (passed green `#12B76A`, high `#D92D20`, medium or low `#F79009`) and legend; section chips with a fade; grouped list with status icon, check name and value in mono (value colored for failed checks).
- **Mobile:** same Overview layout in Mobile view, the note "Foldline made the window narrow, so the page shows its phone layout. Sites that detect phones another way may still show the desktop layout.", lime CTA "Want the phone version fixed first?". The callouts and the dashed window outline around the browser in the Mobile artboard explain the behaviour and are not part of the UI.
- **Access:** "Check this tab?", the host, the two ways (icon, shortcut), the activeTab note. The shortcut shown is the real one from `chrome.commands.getAll()`.
- **Restricted:** "Foldline can't check this page", Works on and Doesn't work on lists.
- **Settings:** Checks (Open in: Desktop view or Mobile view; Mobile size: 390 x 844, 360 x 780, 430 x 932; Draw the fold line switch), Keyboard shortcut ("Change" opens `chrome://extensions/shortcuts` with `chrome.tabs.create`), Language (English, Azərbaycan), Your data ("Clear all settings" and the privacy note), More free tools (Hitline, Serpline, Rivaline, Markline), footer with version, Privacy, Contact.
- **Welcome:** 3 steps, chips, "Built by Shamistan Isayev", contact link "Want a CRO review? Get in touch".
- **Toasts:** dark pill, 2.5 seconds, `role="status"`.
- **Empty values:** a page with no form shows the Form section as "No form" (neutral pill) and its five checks as `skip`, which do not count.

## 7. Settings and storage
`chrome.storage.local` keys: `view: 'desktop' | 'mobile'`, `mobileSize: '390x844' | '360x780' | '430x932'`, `fold: boolean`, `lang: 'en' | 'az'`, `installedAt: number`. `chrome.storage.session`: `savedBounds` for Mobile view only. Nothing else. "Clear all settings" wipes `local`.

## 8. Audit PDF (`packages/report`)
- Use the shared `buildLineReport(config)` (built in Rivaline Phase 2). If it does not exist yet in this repo, build it now exactly as Rivaline SPEC §8 describes and keep Hitline's PDF identical (snapshot test).
- **Foldline content (Report artboard):**
  - eyebrow "Landing page audit", host + path, "Checked on Desktop (<w> x <h>) and Mobile (<w> x <h>). 27 checks in 6 sections."
  - tiles: desktop score and mobile score (Foldline tint tone `#FDF2FA` with `#9E165F` text), issues (neutral), high priority (bad tone, with an alert icon). Severity pills carry icons. A view that was not checked shows "Not checked" in its tile and column.
  - "Sections" table with Desktop and Mobile columns
  - "Issues and fixes": one list for both views, merged by id, severity pills (High, Medium, Low), bold title, fix, and a muted note where it applies (Desktop, Mobile or Both, plus values)
  - dark CTA "Need help fixing these issues?", "Shamistan Isayev, analytics, tracking and CRO", lime button to shamistanisayev.com (`utm_campaign=pdf_footer`)
  - footer "Made with Foldline. No data left the browser." and page numbers
- Multi-page when the list is long. File name: `foldline-audit-<host>-<yyyy-mm-dd>.pdf`.

## 9. Landing site (`apps/foldline/site`, Astro)
- **Routes:**
  - `/`: landing from `design/foldline/Landing.dc.html`, responsive as in LandingTablet and LandingMobile. Keep all animations and hover effects (CSS only), the tab showcase (radio-input tabs, keyboard accessible), the marquee (pause on hover, 40s, list twice, `translateX(-50%)`), `prefers-reduced-motion`.
  - **Landing page score calculator** (`#calculator`): a tiny vanilla script (no framework) built from the shared check list (§4.3): 27 checkboxes in 6 fieldsets with severity tags, the score card (score, bar, band "Losing leads" under 50, "Room to grow" 50 to 79, "In good shape" 80 and up, the "Missing: ..." sentence), "Start from zero". The default ticks are the ones in the design (score 50). Mobile-only checks count here, and CONTACT_PHONE uses its Mobile severity. Nothing is sent anywhere; the site loads no analytics unless `PUBLIC_GTM_ID` is set (same rule as Hitline).
  - `/privacy`: what is stored (settings only, locally), what is never collected, the four permissions and why, that pages are read only after a click, that Mobile view resizes the window and puts it back, that the overlay exists only while the panel is open, contact.
  - `/uninstalled`: Uninstall artboard. Form with 4 reasons, optional text, hidden `v`. Posts to `/api/feedback`.
  - `/404`
- **Shared site code:** use `packages/site-kit` (feedback Pages Function with Resend, honeypot and rate limit, consent banner, SEO head). If it does not exist yet, create it as Rivaline SPEC §9 describes and keep Hitline's site working.
- **Header:** dark and sticky: background `rgba(18,13,36,.94)`, `backdrop-filter: blur(14px)`, bottom border `rgba(255,255,255,.08)`, Logo in the dark theme, links `#D0CBE6` (white on hover, lime underline), `position: sticky; top: 0`. No ancestor may have `overflow: hidden`; the page wrapper uses `overflow-x: clip`. Test: after scrolling 600, 2500 and 5000 px the header's top is still 0 at 1440, 820 and 390.
- **Hero rules:** dark hero `#120D24` with grid lines `rgba(255,255,255,.05)`, a soft `#C11574` glow top right and a lime glow bottom left; no animated line in the background. Title white, lead `#D0CBE6`, highlighted words `#FAA7E0`. Primary button `#C11574` with white text, secondary transparent (`rgba(255,255,255,.06)`, border `rgba(255,255,255,.28)`, white text). Pill "Free Chrome extension": 32px high, padding `0 14px 0 12px`, gap 8px, 13px/600, background `rgba(255,255,255,.08)`, border `rgba(255,255,255,.16)`, 8px `#12B76A` dot with a green pulse. The three callouts without background or border: 20px lime circle with a `#1A2E05` check, 14px/600 `#D0CBE6` text, 24px gap, the icon grows and rotates a little on hover. White cards inside the hero keep dark text.
- **Buttons:** only the arrow (`class="arr"`) moves on hover; the Chrome icon stays still. Text color stays white on `#C11574` and `#1A2E05` on lime in every link state, with selectors stronger than a global `a:hover`.
- **Marquee:** inside the hero, 110px below it, centered: 13px/600 `#B9B4D0` title "27 checks on every page", 18px gap; translucent cards 52px high, radius 14px, background `rgba(255,255,255,.06)`, `box-shadow: inset 0 0 0 1px rgba(255,255,255,.13)`, `backdrop-filter: blur(8px)`, text `#EDEAF8`, padding `0 20px 0 12px`, 14px apart; 30px Glyph (radius 27%, mark 62%, light Foldline tint `#FCE7F6` with a `0 0 0 1px rgba(255,255,255,.08)` ring) and the check name at 15px/600; list twice, `translateX(-50%)`, 40s linear, pause on hover; 10% mask fade at the edges; hover: background `rgba(255,255,255,.1)`, border `rgba(255,255,255,.26)`, shadow `0 12px 20px -14px rgba(0,0,0,.7)`, 3px lift; 44px and 14px on phones; stops with `prefers-reduced-motion`. Only the WhatsApp item uses a brand mark.
- **CTA section:** "Book an audit" lime button with the signature "From <u>Shamistan Isayev</u>" in white, 14px.
- **SEO:** title, description, Open Graph image 1200x630 from the hero, canonical, sitemap, robots, JSON-LD `SoftwareApplication` (price 0, operatingSystem Chrome, applicationCategory BusinessApplication, author Person Shamistan Isayev with url shamistanisayev.com). Add `FAQPage` JSON-LD from the six FAQ items.
- **Performance:** Lighthouse mobile at least 95 on all four categories. Self-hosted fonts (Plus Jakarta Sans, Inter, JetBrains Mono; Manrope only for the Sunvo mock, subset to the characters used).
- "Add to Chrome" buttons point to the Web Store listing URL (config value until the listing exists).
- Cloudflare Pages project `foldline`, custom domain from `FOLDLINE_SITE_URL`.

## 10. Links and UTM
`utm_source` is always `foldline`.

| Place | URL | utm_medium | utm_campaign |
|---|---|---|---|
| Panel CTAs (Overview, Issues, Mobile) | shamistanisayev.com | extension | panel_cta |
| Audit PDF CTA | shamistanisayev.com | extension | pdf_footer |
| Welcome contact link | shamistanisayev.com | extension | welcome |
| Settings "Contact" | shamistanisayev.com | extension | settings |
| Settings "More free tools" | getlineapps.com/hitline, /serpline, /rivaline, /markline | extension | more_tools |
| Settings "Privacy" | FOLDLINE_SITE_URL/privacy | (none) | (none) |
| Shared fix list, last line | FOLDLINE_SITE_URL | extension | share |
| Uninstall URL | FOLDLINE_SITE_URL/uninstalled | extension | uninstall |
| Uninstall page "Book an audit" | shamistanisayev.com | extension | uninstall |
| Landing "Book an audit" | shamistanisayev.com | landing | audit_cta |
| Landing FAQ "Ask me directly" | shamistanisayev.com | landing | faq |
| Landing footer "Built by" | shamistanisayev.com | landing | footer |
| Landing "More free tools" cards | tool domains | landing | more_tools |

Tool domains: `getlineapps.com/hitline`, `getlineapps.com/serpline`, `getlineapps.com/rivaline`, `getlineapps.com/foldline`, `getlineapps.com/markline`. Keep them as config values; some sites may not exist yet.

## 11. Test fixture (`apps/foldline/fixture`)
- Two local sites built from `SitePage.dc.html`: **Sunvo** (`sunvo.localhost/free-quote`) and **Nori Yoga** (`nori.localhost`, only for the tab switch test).
- Sunvo has fixed section heights so the numbers are exact:
  - Desktop (viewport 1024 x 808): top bar 36, header 72, hero 668, CTA band 200 (main button "Get my free quote" top at 872), form with 9 fields (Street address, Postcode and Monthly power bill have placeholders only), submit "Get my quote", privacy link under the form, "As seen in" row with 4 names, stars and "4.8 from 1,240 reviews" in the hero, "25-year panel warranty", phone "+1 555 0142" as plain text in the top bar, a "Chat with us" link to `https://wa.me/15550142` in the header, `mailto:` in the footer, 5 button-styled actions above the fold, hero image 3840 px wide shown at 520 px, viewport meta present.
  - Mobile (390 x 844, CSS breakpoint 480 px): the layout in SitePage `sunvo-mobile` (main button top at 1032), a pricing table 436 px wide that makes the page scroll sideways by 46 px, 7 icon links smaller than 44 px, inputs at 14 px, body text 16 px.
  - Images below two screens use `loading=lazy`. LCP and CLS come from the real load; tests assert only pass/fail for them.
- E2E tests (test build with localhost host permission, like Hitline and Rivaline):
  - Desktop: 23 checks run, the 6 failed checks in the Issues artboard, score 56, Overview pills as in Main
  - Mobile view: the window resizes so the page is 390 px wide, 27 checks run, 8 failed, score 44, the window is restored when switching back and when the panel closes
  - the overlay draws the fold at 808 (and 844) and "Show on page" scrolls to and outlines the main button; the overlay is gone after the panel closes
  - switching to Nori shows Access; `chrome://extensions` shows Restricted
  - Share copies the Markdown in §5; the PDF is generated and contains both scores and all 9 issues
  - a unit test asserts the production manifest has no `host_permissions` and no `debugger`

## 12. Chrome Web Store
- Name: "Foldline: Landing Page CRO Checker"
- Short description (max 132): "Check any landing page for conversion leaks: the fold, forms, trust, mobile and speed. Get a score and fixes. Free, no account." (127)
- Category: Tools (or Developer Tools if Tools is not offered). Single purpose: "Check the landing page in the current tab for conversion problems and show how to fix them."
- Permission justifications: activeTab (read the current tab only after the user clicks), scripting (run the checks and draw the fold line in that tab), storage (settings), sidePanel (the UI). Mention that Mobile view uses the windows API, which needs no permission.
- Privacy answers: no data collected, no sale, no remote code. Privacy policy URL: FOLDLINE_SITE_URL/privacy.

## 13. Phases
Each phase ends with the checks from `apps/foldline/CLAUDE.md` "Working style", a commit and a short Azerbaijani report. Hitline (and Rivaline, if present) tests must stay green.

### Phase 0: Setup and plan
- Pull, install, run the whole test suite.
- If it is not done yet (Rivaline Phase 0 does it too), set the family domains: Hitline's `SITE_URL` default becomes `https://getlineapps.com/hitline` (root `CLAUDE.md`, root SPEC, config, tests); the others are `getlineapps.com/serpline`, `getlineapps.com/rivaline`, `getlineapps.com/foldline`, `getlineapps.com/markline`. Redeploy Hitline's site on its new custom domain only when the owner says the domain is ready.
- Add Foldline to the "Line family" section of the root `CLAUDE.md` (create the section if it is missing) pointing to `apps/foldline/CLAUDE.md` and `docs/foldline/SPEC.md`.
- Check what already exists: `packages/site-kit`, the generic `buildLineReport`, the `packages/ui` accent themes. Note in PLAN.md which of them Foldline has to create.
- In a scratch extension, confirm on stable Chrome: `sidePanel.open` from `action.onClicked` and from `_execute_action`; `activeTab` grant then `executeScript` with `files` from the side panel page; buffered `PerformanceObserver` for LCP and CLS from an isolated-world script; `chrome.tabs.sendMessage` to an injected script; `chrome.windows.update` to reach a 390 px page viewport with the side panel open (and the minimum width Chrome allows), restoring bounds, behaviour for maximized and fullscreen windows; port disconnect firing when the side panel closes; the error messages for chrome:// and for an ungranted tab.
- Write `docs/foldline/PLAN.md`: artboards to components, shared package changes, API check results, open questions.
- **Done when:** PLAN.md exists and every API check is marked pass or has a question for the owner.

### Phase 1: Scaffold
- `apps/foldline/extension` (WXT, React, TS), `apps/foldline/site` (Astro), `apps/foldline/fixture`; add them to the pnpm workspace and CI.
- Icon click opens an empty side panel; `Alt+Shift+F` does the same.
- **Done when:** CI is green for every tool and the unpacked Foldline opens its side panel.

### Phase 2: Shared packages
- `packages/ui`: Foldline accent theme (CSS variables from `apps/foldline/CLAUDE.md`), `Glyph` with all kinds from `design/foldline/Glyph.dc.html` plus the WhatsApp mark, extension icons for Foldline, preview page updated.
- `packages/report`: Foldline config for the shared builder (create the builder first if missing, §8).
- `packages/site-kit`: reuse (create if missing, §9).
- **Done when:** Hitline output is unchanged and the preview page shows the Foldline theme.

### Phase 3: Core logic and fixture
- §4: snapshot types, `findMainButton`, all 27 checks, scoring, section summaries, issue copy keys, the shared check list for the calculator. Unit tests for every check (pass, fail and skip cases) and for the score.
- `scan.js` collector and the fixture sites from §11.
- **Done when:** running Sunvo's desktop and mobile snapshots through core gives exactly the results, values and scores in the design.

### Phase 4: Side panel, part 1
- Scan pipeline (§3.1, §3.2), overlay with the fold line (§3.3), PanelHeader, Overview, Issues, Checks, Access, Restricted.
- **Done when:** on the fixture the panel matches `Main.png`, `Issues.png` (without the spotlight), `Checks.png`, `Access.png` and `Restricted.png`.

### Phase 5: Side panel, part 2
- Mobile view (§3.4), Show on page with the spotlight, Copy fix, Share sheet.
- **Done when:** they match `Mobile.png`, `Issues.png` and `Share.png` on the fixture, the window is always restored, and the copied Markdown equals §5.

### Phase 6: Settings and i18n
- Settings view, defaults, shortcut row, language switch, "Clear all settings".
- EN and AZ dictionaries (including every check's title, why and fix), `docs/foldline/AZ-REVIEW.md` for the owner.
- **Done when:** Settings matches `Settings.png` and the language switch changes every panel string and the overlay labels.

### Phase 7: Audit PDF, welcome, uninstall hook
- Foldline report through the shared builder, the welcome page, `setUninstallURL`.
- **Done when:** the Sunvo PDF matches `Report.png` in content and layout and the welcome page opens on install.

### Phase 8: Landing site and deploy
- All routes from §9 with the calculator, SEO, Cloudflare Pages project `foldline`, custom domain, Resend through `packages/site-kit`.
- **Done when:** the live domain serves `/`, `/privacy` and `/uninstalled` over HTTPS, a test feedback reaches the owner, the calculator gives the same score as core for the same ticks (unit test), and screenshots at 1440, 820 and 390 match the Landing PNGs.

### Phase 9: Chrome Web Store package
- Production zip, 5 screenshots at 1280x800 from the fixture (Overview, Issues with Show on page, Mobile view, Share, Audit PDF), promo tile 440x280 and marquee 1400x560, `docs/foldline/STORE-LISTING.md` from §12, a GitHub release.
- **Done when:** everything the owner uploads is in `store/foldline/` with the listing doc.

### Phase 10: QA and handover
- Test on 3 real landing pages the owner names plus the fixture. Fix false positives, mainly in the main button pick, review and logo patterns, and phone numbers.
- Lighthouse and axe on the site.
- Add a Foldline chapter to `docs/OWNER-GUIDE.md` (Azerbaijani): releasing, changing the domain, adding or changing a check and its weight, reading feedback.
- **Done when:** no false positives on the test pages, site scores are at least 95, and the guide is updated.

## 14. Owner inputs still needed (keep as config placeholders)
- Web Store listing URL (after the first upload)
- 3 public landing pages for QA

## 15. Colors
Source of truth: the project doc `line-family-colors.md` (decided 2026-11-08). Foldline is pink: accent `#C11574`, bright `#FAA7E0` (dark backgrounds only). The other tools in the shared Logo and in "More free tools": Hitline `#7F56D9`/`#B692F6`, Serpline `#2563EB`/`#93C5FD`, Rivaline `#0E7490`/`#67E8F9`, Markline `#FACC15`/`#FDE68A` (ink `#101828` text and glyph on yellow, never yellow text on white, marker highlight under "line" in the light wordmark). The old colors listed in `line-family-colors.md` (old Serpline green, old Rivaline orange, old Foldline ochre, the short-lived fuchsia) must not appear anywhere; a test greps the repo for them.

**Semantic rule.** Green `#067647`, red `#B42318` and amber `#B54708` (and their backgrounds) are only for statuses, and a status always has an icon and a label. The brand color is never a status, and a status color is never brand decoration. In practice: severity pills and section pills carry icons; the Issues tab badge is not red; feature checks, welcome chips and callouts use pink or lime, not green; score tiles use the pink tint, and the red "high priority" tile has an alert icon. The fictional Sunvo site keeps its own colors because it is a mock of someone else's page.

**Logo rule.** Each tool keeps its own glyph in the tile, never a letter: Hitline pulse line, Serpline magnifier, Rivaline radar, Foldline page with a dashed fold line, Markline crop corners with a squiggle. `packages/ui` Logo is built from `design/foldline/Logo.dc.html` without changing the glyph shapes; only the colors above change. Test: render all five in the light and dark theme and compare with the design.
