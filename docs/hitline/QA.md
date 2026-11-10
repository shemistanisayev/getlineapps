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
