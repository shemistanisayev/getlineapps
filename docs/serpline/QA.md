# Serpline 1.0.0: QA (Faza 4, step 10)

Date: 2026-11-11. Built extension loaded in Edge (Chromium) through CDP, opened by a real toolbar click (`Extensions.triggerAction`, which grants `activeTab` like a person's click). Script: `pnpm exec tsx scripts/qa-serpline.ts [url ...]` (screenshots and raw panel text in `test-results/qa-serpline/`).

## Real sites

The owner named no sites, so the agent chose one production site, one large server-rendered page and one page rendered entirely by JavaScript.

| Site | Score | Issues | Link check | Render | AI bots | Verdict |
|---|---|---|---|---|---|---|
| `shamistanisayev.com` (redirects to `/az`) | 96, good | 1 medium: description cut on desktop (145 characters, 936 of 920 px) | 109 internal links, 109 OK | 2% needs JavaScript, nothing important added | 13/13 allowed by `*`, robots.txt 7 lines, sitemap listed, llms.txt found | Correct. The description is borderline: shortening it by about 5 characters fits desktop |
| `developer.mozilla.org` (H1 element page, redirects to Heading_Elements) | 92, good | 2 medium: description cut (292 characters), `og:description` missing (MDN has no Open Graph tags, checked in the raw HTML) | 137 internal links (100 unique URLs max), all OK | All text in the raw HTML (1674 raw, 1520 rendered) | 13/13 allowed by `*`, no llms.txt | Correct after fix 2 |
| `todomvc.com/examples/react/dist/` (client-side React) | 78, needs work | 2 high: H1 only after JavaScript, 89% of the text needs JavaScript; 1 medium: `og:description` missing; 1 low: link to a redirect (`/examples/typescript-react` to `.../`) | 2 internal: 1 redirect; `http://todomvc.com/` is "Not checked" (another origin: plain http on an https page) | 13 vs 115 words; `<h1>todos</h1>`, `<aside>` 10 links, `<h3>React</h3>` | No robots.txt: every bot allowed, "No rule" | Correct. The H3 to H5 jump is a real skipped level |

Lumo fixture (`apps/fixture`, Serpline mode): every number from the design, checked by unit and e2e tests (score 62, then 56 after the link check; 38 vs 412 words; 64 links; 10/13 bots; PDF).

## False positives found and fixed

| Where | Problem | Fix |
|---|---|---|
| Render, "Added by JavaScript" (MDN) | MDN gives elements random ids on every load (`uid_x7k...`), so four `<div>` blocks looked new although the raw HTML had the same links | A section counts as added only when the rendered page really gains links (or words) over the raw HTML. Regression test in `packages/core/src/serpline/rules.test.ts` |
| Google preview width (shamistanisayev.com/az) | Every non-ASCII letter counted as an average-width letter, so Azerbaijani text (ə, ş, ı, ç, ğ, ö, ü, İ) was measured too wide | Accented letters use their base letter's Arial width (`ş` like `s`, `ı` like `i`), with a small table for letters that do not decompose (`ə`, `ı`, `ß` ...). The page's description went from cut after 94 to cut after 99 characters on mobile; it is still over the desktop limit by 16 px. Test in `serp.test.ts` |
| Links (TodoMVC) | "1 internal links checked" | Singular text in EN and AZ |

The QA script's first MDN run did not start the link check (the script switched tabs while the panel was still busy); a rerun checked all 137 links. This was the script, not the panel.

## Accessibility (axe-core, WCAG 2.1 A and AA)

- Side panel: axe is injected into the real side panel over CDP (`e2e/serpline-extension.spec.ts`) and runs on Summary, Headings, Links (before and after the check), Render, AI, Settings and Stale. No violations; each run confirms axe evaluated more than 10 passing rules.
- Site: `/serpline`, `/az/serpline`, `/serpline/uninstalled` pass in `e2e/a11y.spec.ts`.
- Contrast pairs of the panel theme: 24 pairs tested in `packages/ui` (hero soft text raised to 92% white for AA in step 3).

## Lighthouse (mobile, `pnpm lighthouse`)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/serpline` | 98 | 100 | 100 | 100 |
| `/az/serpline` | 97 | 100 | 100 | 100 |
| `/serpline/uninstalled` | 100 | 100 | 100 | 66 (by design: `noindex`, only for people who just removed Serpline) |

## Not covered automatically

- Pressing `Alt+Shift+S` needs a person; the command is registered as `_execute_action` (checked in the manifest test) and fires the same click handler the tests use.
- Chrome's own "Allow access to this site?" prompt (after "Check this page" on another site) needs a person to answer; the spike in step 2 confirmed it appears from a click in the panel and fails without one.
- `setUninstallURL`: Chrome has no API to read it back; the URL builder is unit tested and `/serpline/uninstalled` is tested in the site e2e.
- Real-site results depend on those sites at the time of the check; rerun the script before a new release.
