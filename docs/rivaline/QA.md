# Rivaline 1.0.0: QA (Faza 5, step 10)

Date: 2026-11-13. Built extension loaded in Edge (Chromium) through CDP in a real window, opened by a real toolbar click (`Extensions.triggerAction`, which grants `activeTab` like a person's click). Script: `pnpm exec tsx scripts/qa-rivaline.ts [url ...]`. Per site it saves the text of the Stack, Ads and Brand tabs, two panel screenshots and a JSON file with every match's evidence and the brand kit (in `test-results/qa-rivaline/`, not committed).

## Real sites

The owner named no sites, so the agent chose two Shopify stores, two big SaaS brands, two Azerbaijani sites, a news site, Wikipedia and the owner's own site. Each finding was checked against its evidence (script URL, request, global, cookie).

| Site | Tools | Gaps | Brand (primary, text, background) and main button | Verdict |
|---|---|---|---|---|
| `allbirds.com` (Shopify) | 12: Meta, TikTok, Google Ads, Pinterest, Reddit, GA4, Clarity, GTM, OneTrust, Attentive, Shopify, Impact | server-side, CRM | `#000000`, `#212121`, `#ECE9E2`; "SHOP WOMENS" | Correct |
| `gymshark.com` | 12: Meta, TikTok, Microsoft Ads, Pinterest, Reddit, Amazon Ads, GA4, GTM, OneTrust, Braze, Intercom, Dynamic Yield | server-side | `#767A7F`, `#0D1012`, `#FFFFFF`; "ROW" (country switch in the hero) | Stack correct. Primary and button are weak picks: the shop is black and white with no brand color |
| `hubspot.com` | 11, with HubSpot's own banner and a real server-side GTM (`sgtm-amer.hubspot.com`) | none | `#FF4800`, `#1F1F1F`, `#FFFFFF`; "Get started free" | Correct |
| `notion.com` | 8: Meta, Google Ads, Microsoft Ads, LinkedIn, X, GA4, Clarity, GTM | server-side | `#0075DE`, `#000000`, `#FFFFFF`; "Get Notion free" | Correct |
| `umico.az` | 7: Meta, TikTok, Google Ads, GA4, Clarity, Yandex Metrica, GTM | server-side, consent | `#EA207E`, `#1E244D`, `#FFFFFF`; "Axtar" | Correct |
| `azertag.az` | 3: GA4, Yandex Metrica, GTM | consent | `#FF0000`, `#1F2F4A`, `#FFFFFF`; no button | Correct |
| `theguardian.com/international` | 1: Sourcepoint | analytics | `#052962`, `#121212`, `#FFFFFF`; "News" | Correct for what loads before consent; the panel shows the consent note (below) |
| `en.wikipedia.org` | 0 (Empty) | analytics | `#3366CC`, `#202122`, `#F5FAFF`; "Search" | Correct: Wikipedia runs no marketing tools |
| `shamistanisayev.com` | 0 (Empty) | analytics | `#7F56D9`, `#4A4A5C`, `#F7F7FB`; "Əməkdaşlıq üçün yazın" | Correct: the site loads no tags before consent |

Ads tab: every site got four library links with the brand and domain filled in (in the saved Ads text). Kova, Glowbar and Mira fixtures (`apps/rivaline/fixture`): every number from the design, checked by unit and e2e tests.

## False positives found and fixed

| Where | Problem | Fix |
|---|---|---|
| Stack, server-side GTM | `stats.g.doubleclick.net` (Google Signals) counted as a first-party collect host, so "Server-side GTM" showed on sites without one | Google's own hosts (doubleclick, google.com, googletagmanager, googleadservices, googlesyndication) never count as server-side. Regression test in `rules.test.ts` |
| Stack, Adobe Commerce (Guardian) | Any `/static/.../frontend/` path matched | Only Magento's own `/static/versionNNN/frontend/` and `/Magento_*` paths, or the `mage-cache-sessid` / `form_key` cookies. Test |
| Gaps, consent (Guardian, HubSpot) | Sourcepoint and HubSpot's cookie banner were not known, so "no consent banner" showed | Two new rules: Sourcepoint and HubSpot cookie banner. Test |
| Brand, colors (real shops) | A country pop-up and the cookie banner gave the background and accent | Dialogs, `aria-modal` layers and large fixed layers (not the header) are skipped |
| Brand, background (short pages) | The empty canvas under the content counted, so the role depended on the window height | Sampling stops where the content ends (step 9, kept) |
| Brand, accent | Near-black grays were picked as accent | Accent needs real color (chroma at least 0.2) |
| Brand, text | Light gray text on dark sections won "text" | Text role only for colors readable on their own background (3:1 or more) |
| Brand, fonts | Google Fonts loaded by CSS `@import` showed as "self-hosted" | A font is "Google Fonts" when the page loads files from `fonts.gstatic.com` and the family is in its font faces. Test |
| Brand, main button (real shops) | A country picker or a page number in the header beat the hero button | Buttons in the content win over header and navigation; the label needs two letters; buttons in overlays are skipped |
| Brand, logo | Home link written as a full URL was not found | Header links to the same origin's `/` count as the home link |

## Known limits (documented, not bugs)

- **Consent.** Tools that wait for consent (Guardian, shamistanisayev.com) load only after the visitor accepts. When Rivaline finds a consent platform but no analytics or no ad pixel, the Stack tab says so and tells the user to accept the banner and press Read the page again.
- **In-house analytics** (Guardian's own system) are not in the rule list, so the analytics gap shows.
- **Black and white shops** (gymshark): with no brand color, the primary is a gray and the main button may be a white header-like control.
- **Self-hosted Google fonts** (Roboto on umico.az and azertag.az) show "self", which is true for those files.
- **Body font** shows the first family of `body`'s font stack (Guardian: "Times New Roman" before its own font loads on body).

## Panel behaviour (owner request after step 10)

`pnpm exec tsx scripts/ux-rivaline.ts` records every state the side panel shows, with its time, in seven scenarios on a local test server. Found and fixed:

| Scenario | Before | After |
|---|---|---|
| First click, panel closed | "Read this tab?" flashed before the reading steps | Header, then the reading steps, then the result in about 1.6 s |
| Click while the page is still loading | Correct, but the bar sat at 8% for 6 s, then jumped to 100% | The bar keeps moving inside each step; a step that takes 3 s or more shows its seconds |
| Tab closed while it is read | "Read this tab?" flashed | The next tab's result shows at once |
| An alert open on the page | The panel waited forever | After 45 s: "This page is not answering" with Try again |
| Logo under a pop-up or cookie banner (HubSpot, umico.az) | The crop showed the pop-up (a black bar, a gray stripe) | A covered logo is never cropped. An inline SVG logo is drawn from its markup (umico.az shows its logo); otherwise the panel says to close the pop-up and read again |
| Main button (HubSpot) | A white outline button, invisible on the white card, label cut | Filled buttons win over outline ones (now the orange "Get a demo"); the preview shows the button's own border, an outline for white buttons, and "..." for long labels |
| No logo in the header | "Scroll to the top" (wrong advice) | "No logo found in the page header" |

New page in the same tab, a single-page app changing its URL and Read the page again were already correct (about 1.6 s each). The pop-up and SVG cases are e2e tested on Kova.

## Accessibility (axe-core, WCAG 2.1 A and AA)

- Side panel: axe is injected into the real side panel over CDP (`e2e/rivaline-extension.spec.ts`) and runs on Stack, StackDetail, Ads, Brand, the export sheet, Settings, Access, Empty and Restricted. No violations; each run confirms axe evaluated more than 10 passing rules. Fixed on the way: muted text and section labels on the panel's gray background (4.28:1, now Neutral `#475467`), and the color swatch buttons' names now include their visible role and hex (WCAG 2.5.3; the copy hint is the tooltip).
- Site: `/rivaline`, `/az/rivaline`, `/rivaline/uninstalled` pass in `e2e/a11y.spec.ts`.
- Narrow panel: no sideways scroll at 280 px in English and Azerbaijani (e2e).

## Lighthouse (mobile, `pnpm lighthouse`)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/rivaline` | 97 | 100 | 100 | 100 |
| `/az/rivaline` | 95 | 100 | 100 | 100 |
| `/rivaline/uninstalled` | 100 | 100 | 100 | 66 (by design: `noindex`, only for people who just removed Rivaline) |

## Not covered automatically

- Pressing `Alt+Shift+V` needs a person; the command is registered as `_execute_action` (manifest test) and fires the same click handler the tests use.
- The ad library pages themselves (Meta, Google, TikTok, LinkedIn) are not opened by the tests; the URL builders are unit tested against the formats checked in step 1.
- `setUninstallURL`: Chrome has no API to read it back; the URL builder is unit tested and `/rivaline/uninstalled` is tested in the site e2e.
