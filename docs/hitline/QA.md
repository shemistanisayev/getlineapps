# Hitline 1.0.0: QA (Faza 3, step 9)

Date: 2026-11-10. The owner chose to run QA on the Lumo fixture only (no real sites). Real-site QA can be added later with `pnpm --filter @line/fixture open:hitline` replaced by any URL in a normal Chrome profile.

## Lumo fixture runs (real Chromium, `e2e/hitline-fixture.spec.ts`)

| Run | What it reproduces | Result |
|---|---|---|
| `events` | Events, GTM, Plan, popup artboards | 14 events (GA4 5, Meta 3, TikTok 2, Google Ads 1, dataLayer 3), sGTM 4/4 signals, 8 tags with design statuses, plan 4/2/2, Meta AddToCart without value |
| `consent` | Consent artboard | Reject all at 10:41:09.480, Meta before consent, TikTok after rejection, Hotjar not loaded, Google tags correct |
| `journey` | Attribution artboard | 5 pages, `_gl` lost on pay.example.net, referral on confirmation, one issue (unwanted referral) |
| `clean` | The same shop set up correctly (new in this step) | No high or medium issue in the panel and none in the popup: no false positives |

Each run is recorded the way the panel records (requests with bodies and headers, navigations, timestamped dataLayer) and must give the same audit as the scenario.

## False positives found and fixed during Faza 3

| Where | Problem | Fix |
|---|---|---|
| Popup consent | Without dataLayer timestamps the popup could call a hit "before consent" when it was not | Popup reports consent issues only when the `gcd` order on Google hits proves them |
| Attribution | A break to the payment domain and the referral it causes were two issues for one cause | Cross-domain break is folded into the referral issue, whose fix names cross-domain measurement |
| PDF and popup | The same Meta AddToCart showed as "no value" and as "wrong plan parameters" | Report list de-duplicates (`reportIssues`) |
| Panel timing | dataLayer entries read once a second could land after the hits they caused | "Reload page" injects a push timer; entries already present at the first look get the page start time |

## Accessibility (`e2e/a11y.spec.ts`, axe-core, WCAG 2.1 A and AA)

All pass: `/`, `/hitline`, `/az/hitline`, `/hitline/uninstalled`, `/privacy/hitline`, `/404`, the sample audit dialog, every panel tab, the first-open and plan setup screens, popup main, settings and restricted state, and the welcome page.

Fixed in this step: grey text on the panel and uninstall page backgrounds (contrast 4.2:1 to 7:1), and decorative tool logos in Settings exposed as unnamed images (`@line/ui` Logo with `label=""` is now hidden from screen readers).

## Lighthouse (mobile, `pnpm lighthouse`)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/hitline` | 98 | 100 | 100 | 100 |
| `/az/hitline` | 97 | 100 | 100 | 100 |
| `/` | 98 | 100 | 100 | 100 |
| `/privacy/hitline` | 99 | 100 | 100 | 100 |
| `/hitline/uninstalled` | 100 | 100 | 100 | 66 (by design: `noindex`, the page is only for people who just removed Hitline) |

## Not covered automatically

- The DevTools panel inside real DevTools: Playwright cannot open DevTools. The capture code is unit tested with a fake `chrome.devtools` (`src/capture/devtools.test.ts`) and the UI with recorded sessions. Manual check: load `apps/hitline/extension/.output/chrome-mv3` unpacked, open the Lumo shop with `pnpm --filter @line/fixture open:hitline`, press F12, open the Hitline tab, click "Reload page".
- The popup's `activeTab` grant needs a real click on the toolbar icon; the probe function itself runs in the real shop in the tests.
- `setUninstallURL`: Chrome has no API to read it back; the URL builder is unit tested in `packages/core`.

# Hitline 1.1.0: QA on real sites (2026-11-11)

Sites named by the owner: irshad.az, kontakt.az, umico.az (now birmarket.az), misli.az, birbank.az. Each was browsed in Chrome by `scripts/qa-hitline.ts`, which runs the panel's own capture code (`DevtoolsSource`, `SessionStore`) on Chrome DevTools Protocol events and the popup's probe at the end. `scripts/qa-hitline-report.ts` prints what the panel and the popup show, `scripts/qa-hitline-shots.ts` replays each session in the built panel and saves screenshots and the audit PDF. Nothing was bought, no bet was placed, no form was sent, cookie banners were declined.

| Site | Path | Result |
|---|---|---|
| irshad.az | home, Samsung phones, product, add to cart, cart, checkout form (not sent) | Done |
| kontakt.az | | Not tested: Cloudflare shows "Verify you are human", which an automated browser must not solve. To check by hand: load the extension, open kontakt.az, press F12, open the Hitline tab |
| umico.az | redirects to birmarket.az; home, phones category, product, city picker, add to cart, cart | Done. The guest cart stays empty after "Add to cart" (the site needs a login), so no add_to_cart event exists to check |
| misli.az | home, football, two odds picked for a coupon, coupon opened (no bet) | Done |
| birbank.az | home, cards, credits, deposits | Done |

## Hitline bugs found on these sites, fixed

| Seen on | Problem | Fix |
|---|---|---|
| birbank.az | GA4's Google Signals copy (`stats.g.doubleclick.net/g/collect`) counted as a second GA4 event and as a server-side GTM endpoint (false "sGTM" signal) | Not classified as an event any more (`classify.ts`) |
| birbank.az | Universal Analytics event tags whose trigger never matched showed "Fired" because another UA tag sent a hit | When the container and GTM's gtm.js push were read, a tag only counts as fired when its trigger matched an event |
| birbank.az | Paused tags (`__paused`) listed as tags | Treated as paused and hidden |
| birbank.az, misli.az | GA4 event tags with a variable name showed "GA4 macro,25" | Shown as "GA4 {{Event}}" and matched to any GA4 event |
| irshad.az | TikTok `/pixel/act` hits showed "(unknown)" | The automatic action name is the event (Click, Metadata, ...) |
| irshad.az | GTM's Pinterest template (`__pntr`) not named | Pinterest, Criteo and Quora GTM templates named |
| irshad.az | TikTok sends events up to 15 s after the tag runs, so GTM events showed "No request seen" | Window for matching requests to an event raised to 30 s |
| umico.az | "GA4 Config" showed "Missing value" because a GA4 view_item had no value | Base tags never take the status of an event tag |
| misli.az | The same page counted twice in the visit path (first read and DevTools' navigation event) | One page when the same URL repeats within 10 s |
| irshad.az, birbank.az | Audit PDF failed: JetBrains Mono code ligatures in parameter names ("-data-layer-") crash the font engine | Ligatures off in the PDF, characters the fonts lack become "?" (`packages/report`) |
| birbank.az | GTM internal events sent to GA4 and TikTok were not reported | New check INTERNAL_EVENTS (medium) |

## What Hitline reports on the sites (for the owner to confirm)

- birbank.az: GA4 receives about 9 page_view hits per page (4 GA4 Config tags plus a GA4 {{Event}} tag), flagged as "Sent twice". GA4 and TikTok receive GTM's own events (gtm.js, gtm.dom, gtag.config). Meta Pixel Base runs twice (All Pages and DOM Ready). Floodlight, Universal Analytics, Clarity and TikTok are also present. No Consent Mode.
- irshad.az: GA4 with dataLayer ecommerce, Meta, TikTok, Pinterest, Yandex Metrica. The GTM tags Meta ViewContent and Meta AddToCart are triggered but no Meta request follows (Meta gets only PageView and InitiateCheckout). No Consent Mode.
- birmarket.az: GA4, Google Ads remarketing, TikTok, Clarity; Meta Pixel and Yandex are loaded but send nothing in this visit. GA4 view_item has no value, view_cart has no value and no currency. 189 GTM tags.
- misli.az: GA4, Meta, Hotjar; picking odds pushes add_to_cart to the dataLayer and the GA4 add_to_cart tag is triggered; the GA4 request had not been sent when the recording stopped (GA4 batches events for a few seconds).
- Unknown services were listed under "Other" and not counted as issues: OpenAI's site SDK and a chat widget (irshad), Gleap, Umico clickstream and an event collector (birmarket), Dengage (misli).
