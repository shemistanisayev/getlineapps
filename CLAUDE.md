# CLAUDE.md: the Line family (getlineapps.com)

You are building the **Line family**: five free Chrome extensions (Hitline, Serpline, Rivaline, Foldline, Markline) and their shared website **getlineapps.com** (hub, privacy, one landing per tool). Everything lives in one pnpm monorepo.

The owner is Shamistan Isayev (analytics, tracking and CRO consultant, shamistanisayev.com). He does not write code. He pastes short prompts, clicks "Approve" on browser logins and looks at results. Do as much as possible yourself: run CLIs, create resources, test, commit.

## Read order

1. `docs/line-family-PLAN.md`: phases and what to do now. Work only on the phase you are asked for.
2. `docs/line-family-domains.md`: domain, URLs, site structure, privacy, free web tools. **Wins over every SPEC.**
3. `docs/line-family-colors.md`: brand and status colors, logo rules. **Wins over every SPEC.**
4. The tool's SPEC: `docs/hitline-SPEC.md`, `docs/serpline-SPEC.md`, `docs/rivaline-SPEC.md`, `docs/foldline-SPEC.md`, `docs/markline-SPEC.md`.
5. The tool's design: `design/<tool>/` (and `design/hub/` for the hub, privacy and the Line apps logo).

Where a SPEC says "read `apps/<tool>/CLAUDE.md`", read this file and `docs/line-family-colors.md` instead. There are no per-tool CLAUDE.md files.

## Why this exists (decides trade-offs)

Every tool is a lead magnet: genuinely useful for free, trustworthy, and it sends people to shamistanisayev.com when they want paid help. No paid plan, no account.

## Repo layout (decided)

```
apps/
  site/                 Astro, the whole getlineapps.com (hub, /<tool> landings, /privacy/<tool>, /<tool>/uninstalled, /api/feedback)
  hitline/extension     WXT + React + TS (popup + DevTools panel)
  serpline/extension    WXT (side panel)
  rivaline/extension    WXT (side panel)
  foldline/extension    WXT (side panel)
  markline/extension    WXT (popup + editor tab)
  fixture/              Lumo shop (Hitline and Serpline scenarios)
  rivaline/fixture, foldline/fixture, markline/fixture
packages/
  ui/        tokens, Logo (5 tools), HubLogo, Glyph, Mark, Button, Pill, Card, preview page
  core/      pure TS logic per tool: src/<tool>, fixtures/<tool> (Serpline's logic may live in packages/seo-core as its SPEC says)
  report/    buildLineReport(config): shared PDF builder
  site-kit/  feedback Pages Function (Resend, honeypot, rate limit), consent banner, SEO head
docs/        SPECs, PLAN, family docs, per-tool PLAN/STATUS/AZ-REVIEW/STORE-LISTING
design/      <tool>/*.dc.html and canvas.json; hub/
store/<tool>/  everything the owner uploads to the Chrome Web Store
```

If a SPEC names another path (`apps/extension`, `apps/<tool>/site`, `apps/serpline-site`), use this layout.

## Stack (decided, do not change without asking)

- pnpm workspaces, TypeScript everywhere.
- Extensions: WXT (latest), React, Manifest V3, Chrome first.
- Site: Astro, static output, Cloudflare Pages project `getlineapps`, one Pages Function `/api/feedback` (Resend).
- Styling: plain CSS with CSS variables (or CSS modules). No UI kit. Match `design/` exactly.
- Fonts: Plus Jakarta Sans (display), Inter (UI), JetBrains Mono (code). Bundled locally in extensions; self-hosted on the site.
- Tests: Vitest for packages, Playwright for the site and for loading unpacked extensions in Chromium.
- Site content lives in files: `apps/site/src/content/...` (EN + AZ JSON, Zod schemas). Components only read them. `apps/site/src/content/tools.json` holds each tool's `slug`, `status` (`live` | `soon`) and `storeUrl`.

## Non-negotiable rules

- **No server, no data collection in extensions.** No analytics, telemetry, remote config or remote code. Only settings are stored, in `chrome.storage.local`. Each extension makes no network requests of its own except what its SPEC allows (Serpline: same-origin requests to the page being checked).
- **Minimal permissions:** exactly what each SPEC lists. No `host_permissions`, no `<all_urls>`, no `webRequest`, no `debugger`. If something seems to need more, stop and ask.
- **One domain:** every site link is built with `toolUrl(slug, path, utm?)` from `LINE_SITE_URL` (`https://getlineapps.com`). No `.website`, `.co` or per-tool domains anywhere.
- **UI language:** English default, Azerbaijani second. All strings in one dictionary per locale; never hard-code UI text. Write the AZ text yourself and list it in `docs/<tool>/AZ-REVIEW.md` for the owner.
- **Copy rules:** no em dashes, avoid "·", no filler. Use the exact copy from `design/` unless the SPEC says otherwise.
- **Links to the owner:** only contact CTAs go to `https://shamistanisayev.com/` with the UTM from the SPEC. Links between getlineapps.com pages carry no UTM.
- **Colors:** only the values in `docs/line-family-colors.md`. Status colors only for statuses, always with an icon and a label. A test greps the repo for retired colors.
- **Brand marks:** third-party logos only from the design's brand icons or the `simple-icons` npm package (CC0), unaltered, only to show what a tool supports.
- **Accessibility:** WCAG AA contrast, visible focus, keyboard reachable, `prefers-reduced-motion` on the site.
- **Open source:** public repo, MIT license. Never commit secrets; `.env` is gitignored, `.env.example` stays current. Secrets go in by CLI (`wrangler pages secret put`), never pasted into chat.

## Design files

- `*.dc.html` are prototype artboards: HTML with inline styles. `{{...}}` are holes, `<sc-for>` and `<sc-if>` are loops and conditions, `<dc-import name="X">` embeds another artboard, the `class Component extends DCLogic` script holds demo data. Take layout, copy and demo data from them.
- `canvas.json` lists every artboard with its size and title.
- Rendered PNGs are not included. To compare your build, render the artboard markup yourself (the inline styles are enough for a close match) or ask the owner to compare with the live canvas (links in `README.md`).
- If the design and a SPEC disagree, the SPEC wins. If the SPEC is silent, match the design. The family docs win over both.

## Working style

- Work phase by phase as `docs/line-family-PLAN.md` and the tool's SPEC say. At the start of a phase show a short plan (5 to 10 bullets), then build without more questions unless something is blocked or irreversible.
- When an account action is needed, run the CLI login yourself (`gh auth login`, `npx wrangler login`) so the owner only clicks Approve. If a value can only come from a dashboard, say exactly where to click, in Azerbaijani, in at most 3 steps.
- After each phase:
  1. Typecheck, lint, unit tests and build for **every** app and package (one tool must never break another).
  2. For extension phases: load the built extension in Playwright Chromium (`--load-extension`) against its fixture and screenshot the screens touched.
  3. For site phases: screenshots at 1440, 820 and 390 px.
  4. Commit with a clear message and push.
  5. Report in Azerbaijani: what changed, what to look at, what is next. Keep it short. Then stop and wait.
