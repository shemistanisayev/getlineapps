# SPEC: Markline (Chrome extension + landing site)

Read `apps/markline/CLAUDE.md` and the root `CLAUDE.md` first. This file is the source of truth for Markline features and phases.

---

## 1. Product
- **What:** a free Chrome extension that captures the page in the current tab (visible area, full page, a selected area or one element), opens it in its own editor tab where the user marks it up (arrow, box, numbered note, text, highlight, blur) and shares it as a PNG, a one-page PDF feedback summary or a copy on the clipboard. Emails and phone numbers on the page are found and blurred before the editor opens. The page URL, browser, viewport and time come with every capture.
- **Audience:** agencies and their clients giving website feedback, QA and developers filing bugs, marketing and design teams sharing examples. English first, Azerbaijani second.
- **Business goal:** lead magnet and the widest-reaching tool of the family. Contact CTAs drive users to shamistanisayev.com; the optional "Made with Markline" line on exported images brings new users to markline.website. No paid plan, no account.
- **Name in the Chrome Web Store:** "Markline: Feedback Screenshot".
- **What it is not:** no cloud links, no uploads, no team workspace, no screen recording, no integrations with Jira, Slack or any other service. Sharing is only downloading a file or copying to the clipboard.

## 2. Design reference (`design/markline/`)
Same format as Hitline's, Rivaline's and Foldline's design folders: `*.dc.html` artboards with `{{holes}}`, `<sc-for>`, `<sc-if>`, `<dc-import>` and a `DCLogic` class with demo data; `screens/*.png` rendered at 1x with the real fonts; `canvas.json`. There is no `brand-icons/` folder: Markline does not work with any third-party platform, so every icon is a neutral `Glyph`.

The demo shop "Bramble Bakery" on `example.com/order` is fictional. All numbers in the design (4 found, 1440 x 2400, 3 screens, 4 notes, 3 blurred areas, 1920 x 2512) are the expected output for the fixture (§12).

| Artboard | What it is | Where it lives |
|---|---|---|
| Main | Popup: choose what to capture, auto blur switch | `extension` popup |
| Capturing | Popup while a full page capture runs | popup state |
| AreaSelect | Markline's overlay on the page: drag a box | `overlay.js` (mode `area`) |
| ElementPick | Markline's overlay on the page: hover and click an element | `overlay.js` (mode `element`) |
| Editor | Editor tab, Number tool, notes panel, page details | extension page `editor.html` |
| EditorBlur | Editor with the Blur tool: found items, style, drawn areas | editor state |
| Export | Export dialog over the editor, copied toast | editor overlay |
| EditorEmpty | Editor opened with no image (drop, paste, choose) | editor state |
| Settings | Popup settings view | popup route |
| Restricted | Popup on chrome:// pages, Web Store, other extensions | popup state |
| Report | Feedback summary PDF (A4) | `packages/report` |
| Welcome | Page opened after install | extension page `welcome.html` |
| Uninstall | Page opened after uninstall | site route `/uninstalled` |
| Landing, LandingTablet, LandingMobile | Landing at 1440, 820, 390 | site route `/` |
| BrowserBar, SitePage | Chrome UI and the fictional shop | mock only (SitePage is the model for the fixture, §12) |
| Shot | SitePage plus the demo annotations, in page coordinates | mock only (expected editor output) |
| PopupHeader | Markline popup header | popup component |
| EditorBar | Editor toolbar | editor component |
| Glyph | Neutral line icons for modes, tools and formats | `packages/ui` |
| Logo | Line family logo (shared) | `packages/ui` |

## 3. Extension architecture (`apps/markline/extension`)
Entrypoints (WXT):
- `popup/`: React app. Manifest `action.default_popup`. Opening the popup (click or `_execute_action`) grants `activeTab` for the current tab.
- `editor/`: React app at `editor.html`. One tab per capture. Also opens empty from the popup header button and from Restricted.
- `welcome/`: static page from the Welcome artboard.
- `background.ts` (service worker):
  - `runtime.onInstalled` (reason `install`): open `welcome.html`, store `installedAt`. On every start, delete hand-off records older than 10 minutes (§3.2).
  - `runtime.setUninstallURL(MARKLINE_SITE_URL + '/uninstalled?utm_source=markline&utm_medium=extension&utm_campaign=uninstall&v=' + version)`.
  - `commands` (each grants `activeTab` like a click):

    | Command | suggested_key | Does |
    |---|---|---|
    | `_execute_action` | `Alt+Shift+M` | opens the popup |
    | `capture-visible` | `Alt+Shift+1` | visible area |
    | `capture-full` | `Alt+Shift+2` | full page |
    | `capture-area` | `Alt+Shift+3` | selected area |
    | `capture-element` | none (Chrome allows 4 suggested keys) | element |
  - Runs the capture pipeline (§3.1), keeps no state between captures, makes no network requests.
- Injected on demand with `chrome.scripting.executeScript({ files })` (no `content_scripts` in the manifest): `probe.js` (page info and blur targets), `overlay.js` (area and element UI), `fullpage.js` (measure, scroll, hide and restore fixed elements).
- Manifest: name "Markline", short description (§13), permissions `activeTab`, `scripting`, `storage`. No `host_permissions`, no `tabs`, no `downloads`, no `debugger`, no `clipboardWrite`, no `offscreen`. Icons 16, 32, 48, 128 from the Markline logo tile. `minimum_chrome_version` "116".

### 3.1 Capture pipeline
- **Probe** (on popup open and before every capture): `executeScript({ files: ['probe.js'] })` in the isolated world returns `{ url, title, innerWidth, innerHeight, devicePixelRatio, scrollX, scrollY, scrollWidth, scrollHeight, blurTargets }`. Values of the matches never leave `probe.js`: only rectangles and kinds are returned.
  - Probe works: popup shows Main with "<n> found on this page" (or "None found on this page").
  - Error says the page can't be scripted (chrome://, chrome-extension://, the Chrome Web Store, `view-source:`): **Restricted** state.
  - `file://` without file access: Restricted with one extra line: "For files on your computer, turn on Allow access to file URLs on Markline's details page."
- **Blur targets** (pure matcher in `packages/core/src/markline/blur.ts`, unit-tested; `probe.js` only walks the DOM):
  - Email: `/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i` in visible text nodes (rect from `Range.getClientRects` of the match) and in the value of `input` and `textarea` fields (rect = the field's content box, width of the value measured with the field's computed font).
  - Phone: `/\+?\d[\d\s().-]{6,}\d/` with 8 to 15 digits, not a time, a date or a price (reject matches next to `:`, `/` between two-digit groups, or a currency sign). Same sources as email, plus `a[href^="tel:"]` text.
  - Each target: `{ kind: 'email' | 'phone', rect, where }` with `rect` in document coordinates and `where` the closest `form` legend or heading text, else `header`, `footer` or `main` (shown as "Your details form", "Footer"). Fixed and sticky elements report viewport coordinates plus `fixed: true`.
- **Visible area:** probe, then `chrome.tabs.captureVisibleTab(windowId, { format: 'png' })`. Image = the viewport at device pixels.
- **Full page** (`fullpage.js` + background):
  1. Measure; height to capture = `min(scrollHeight, floor(32000 / devicePixelRatio))` CSS px (Chrome's canvas limit). If cut, the editor shows "This page is <h> px tall. Markline kept the first <max> px."
  2. Scroll to the top, wait two `requestAnimationFrame`s plus 150 ms, capture screen 1.
  3. Hide every element whose computed `position` is `fixed` or `sticky` (inline `visibility: hidden !important`, previous value saved in a `WeakMap`), so they appear once.
  4. Scroll down by `innerHeight` per step; the last step scrolls to `height - innerHeight` and its overlap is cropped. Keep at least 550 ms between `captureVisibleTab` calls (Chrome allows two per second).
  5. Join the screens with `OffscreenCanvas` and `createImageBitmap` in the service worker into one PNG.
  6. Always (also on error or Cancel): restore hidden elements and the original scroll position, clear the badge.
  - Progress: background sends `{ type: 'progress', step, steps }` to the popup (Capturing artboard: "Screen 2 of 3") and sets the action badge text to `2/3`. The capture continues if the popup closes.
  - Bramble (§12) at 1440 x 808 gives 3 screens and a 1440 x 2400 image.
- **Selected area:** inject `overlay.js` with mode `area` and close the popup. The overlay draws the AreaSelect UI: dimmed page, selection with 8 handles, size label in CSS px, toolbar with Cancel and "Capture area", hint pill with Enter and Esc. Enter or "Capture area" resolves the rect; the overlay removes itself, waits two frames, then background captures the visible area and crops (rect x devicePixelRatio). The area is limited to the viewport in v1.
- **Element:** inject `overlay.js` with mode `element` and close the popup. Hover outlines the element under the pointer (ElementPick: 2px `#FACC15` outline with a 1px `#101828` outer line, `rgba(250,204,21,.14)` fill, yellow label with `#101828` text, label with a short selector and size). Up arrow selects the parent, Down returns to the previous child, click or Enter captures, Esc cancels. If the element fits the viewport: scroll it into view if needed, capture visible, crop. If it is taller: run the full page steps over the element's vertical range and crop to its box.
- **Overlay rules:** one host `<markline-overlay>` on `document.documentElement`, fixed, full viewport, `z-index: 2147483647`, closed shadow root, copy passed in from the extension (i18n). Removed before every `captureVisibleTab`, so it never appears in an image. Store policy: the overlay is shown only after the user picks a mode, and only until the capture ends.
- **Auto blur:** when the setting `blurAuto` is on, blur targets that fall inside the captured region become blur shapes with `source: 'auto'` (coordinates shifted into image space).

### 3.2 Hand-off to the editor
- The background writes `{ id, png: Blob, width, height, dpr, context, blurTargets, mode, cutAt? }` to IndexedDB `markline-handoff`, store `pending`, key `id`, then calls `chrome.tabs.create({ url: 'editor.html#' + id, index: tab.index + 1 })`.
- The editor reads the record and deletes it at once. Startup cleanup removes records older than 10 minutes. This record is the only thing besides settings that is ever written, and it lives for seconds. Phase 0 confirms this is reliable; if not, stop and ask.
- **Context** (`packages/core/src/markline/context.ts`, unit-tested): URL, page title, browser label from `navigator.userAgentData` (`brands` and `platform`, e.g. "Chrome 154 on macOS"), viewport `innerWidth x innerHeight` and pixel ratio, capture time in the user's locale ("Nov 7, 2026, 14:32"), capture mode and screens joined.

### 3.3 Editor (`editor.html`)
- **Model** (`packages/core/src/markline/annotate/`, pure, unit-tested, shared with the site tool §9):
  - `Doc = { image: { width, height, dpr }, shapes: Shape[], notes: Record<number, string> }`, coordinates in image CSS px.
  - `Shape`: `arrow {x1,y1,x2,y2,color}`, `box {x,y,w,h,color}`, `pin {x,y,n,color}`, `text {x,y,text,color}`, `highlight {x,y,w,h,color}`, `blur {x,y,w,h,source: 'auto' | 'user', kind?, where?, on}`.
  - Pins are numbered 1..n in creation order; deleting one renumbers the rest and their notes.
  - History: undo and redo, 100 steps.
  - `render(ctx, doc, bitmap, { scale, blurStyle, selection })` draws everything on a Canvas 2D context. The same function is used on screen, for export and on the site.
- **Tools and keys:** Select `V`, Arrow `A`, Box `R`, Numbered note `N`, Text `T`, Highlight `H`, Blur `B`. `Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z`, `Delete` removes the selection, `Esc` clears it, `Shift` while drawing an arrow snaps to 45 degrees. Stroke 4 px, pin 36 px (see Colors), text 22 px/800 with a white halo, highlight at 30% opacity.
- **Colors:** Black `#101828` (default), Yellow `#FACC15`, Blue `#2563EB`, Red `#D92D20`, Green `#12B76A`. Pins in Black or Yellow use the Markline pin: `#FACC15` fill, `#101828` number and 2.5 px inner ring, 3 px white outer ring; pins in other colors are filled with that color and have a white number. Boxes and arrows in Black get a 2 px white halo so they read on any page. Highlight is always the chosen color at 45% (yellow by default).
- **Zoom:** fit width (default), 50%, 70%, 100%, 150%, 200%; the canvas scrolls.
- **Right panel (Editor):** Notes with count and "Copy notes"; one card per pin (number, editable text, delete); the selected pin's card is highlighted; "<n> areas blurred for you" card with "Review" (switches to Blur); Page details card with the "Under the image" switch; the note "This capture lives only in this tab. Close it and it is gone, so export first."
- **Blur panel (EditorBlur):** style segmented Blur, Pixelate, Solid (setting `blurStyle`); "Found on the page" with a switch per target and "<on> of <found> on"; "Drawn by you" list with size and remove; the note "Blur is painted into the exported image. The text under it is not kept in the file."
  - Blur: `ctx.filter = 'blur(<10 x dpr>px)'` over the region drawn from the original bitmap, twice. Pixelate: downscale to 1/12 with smoothing off and scale back. Solid: fill with the average color of the region darkened by 40%.
- **Hint pill** at the bottom of the canvas for the current tool ("Click the image to place note 5", "Drag over anything you want to hide").
- **Leaving:** `beforeunload` warning while there are changes that were not exported or copied.
- **Empty state (EditorEmpty):** drop zone, paste (`Ctrl/Cmd+V`), "Choose a file" (`<input type=file accept="image/png,image/jpeg,image/webp">`), the capture hint with the real `_execute_action` shortcut from `chrome.commands.getAll()`. Images loaded this way have no page details.

### 3.4 Export (Export artboard)
- Dialog with preview (left) and options (right): format segmented PNG image / PDF summary (default from settings `exportFormat`); switches "Notes beside the image", "Page details under the image" (default `details`), "'Made with Markline' line" (default `madeWith`); file name input; "Download PNG" or "Download PDF"; "Copy image" (turns into "Copied" with a check for 2 seconds); "Copy notes as text"; the note "Made on this computer. Markline uploads nothing, so share the file the way you like."; dark toast "<What> copied to clipboard".
- **PNG layout** (CSS px, rendered at the capture's pixel ratio): the image; a notes column 480 px wide on the right when there are notes and the switch is on (title "Notes", pins 52 px, text 30 px); a details strip 72 px high under everything (URL, browser, viewport, time); a 40 px line with "Made with Markline" right aligned in `#667085` when on. Bramble with all options: 1920 x 2512 at 1x, 3840 x 5024 at 2x (shown under the preview).
- **Copy image:** `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` from the focused editor page. Phase 0 confirms this works without `clipboardWrite`; if not, stop and ask.
- **Copy notes as text:**
  ```
  Feedback: <host><path>
  1. <note>
  2. <note>
  Page: <url>
  <browser>, viewport <w> x <h>, <dpr>x, <time>
  Made with Markline: <MARKLINE_SITE_URL>/?utm_source=markline&utm_medium=extension&utm_campaign=share
  ```
  The last line only when `madeWith` is on.
- **Downloads:** blob URL and `<a download>` (no `downloads` permission). File names: `markline-<host>-<yyyy-mm-dd>.png`, `markline-feedback-<host>-<yyyy-mm-dd>.pdf`; an image opened from a file uses `markline-image-<yyyy-mm-dd>`.

## 4. Feedback summary PDF (`packages/report`)
- Use the shared `buildLineReport(config)` (built in Rivaline Phase 2). If it does not exist yet in this repo, build it exactly as Rivaline SPEC §8 describes and keep Hitline's PDF identical (snapshot test). Add one generic section type `imageWithList` (image on the left at a fixed width, list and key/value rows on the right; a tall image continues on the next pages at the same scale) without changing the output of the other tools.
- **Markline content (Report artboard):**
  - eyebrow "Feedback summary", host + path, "<Mode> capture, <w> x <h> px. <browser>, viewport <w> x <h> at <dpr>x."
  - tiles: notes (Markline tint tone `#FEFCE8` with `#101828` text), areas blurred (neutral), capture mode (neutral), viewport width (neutral)
  - `imageWithList`: the flattened image (with blur, without the notes column and strip) 330 px wide; "Notes" numbered list with Markline pin badges (yellow, ink number); "Page details" rows (URL, Page title, Browser, Viewport, Captured, Capture); the note "Blurred areas are painted into the image. The text under them is not in this file."
  - dark CTA "Need a hand with the fixes?", "Shamistan Isayev, analytics, tracking and CRO", lime button to shamistanisayev.com (`utm_campaign=pdf_footer`)
  - footer "Made with Markline. No data left the browser." and page numbers
- An image opened from a file: no Page details rows; tiles show notes, areas blurred, "Image" and its width.

## 5. Screens
Build every screen to match its artboard and copy.
- **Popup frame:** 360 px wide, panel background `#EFEDF5`, max height 600 px (Chrome's popup limit; Settings scrolls if a language makes it taller).
- **PopupHeader:** Logo; icon button "Open an image in the editor"; icon button Settings.
- **Main:** card "Capture" with the host and path; four mode buttons (Glyph 36, name, one line, the current shortcut keys from `chrome.commands.getAll()` or "No shortcut"); the hovered or focused row gets the tint and a 3 px left bar; card with the auto blur switch and "<n> found on this page"; the lock note. Arrow keys move between modes, Enter starts.
- **Capturing:** hero card (Markline gradient) with "Capturing full page", "Screen <i> of <n>", segmented progress, host and page size in mono; checklist (fixed parts hidden, "<n> emails and phone numbers marked for blur", scroll position comes back); Cancel; the note about two screenshots a second.
- **AreaSelect, ElementPick:** §3.1.
- **Editor, EditorBlur, Export, EditorEmpty:** §3.3 and §3.4. EditorBar: logo, title (host + path, mode and size), tools, colors, undo, redo, zoom, "Copy image", "Export". All tools and buttons are disabled in EditorEmpty.
- **Restricted:** "Markline can't capture this page", the reason, Works on (any website on http or https, sites on localhost), Doesn't work on (chrome:// pages and settings, Chrome Web Store, pages of other extensions), "Open an image in the editor".
- **Settings:** Capture (auto blur switch, blur style select), Export (default format, page details switch, "Made with Markline" switch with "Helps others find the tool. Off any time."), Shortcuts (current `_execute_action` keys and "and <n> more", "Change" opens `chrome://extensions/shortcuts` with `chrome.tabs.create`), Language (English, Azərbaycan), Your data ("Clear all settings" and "Only settings are saved, on this computer. Captures are not."), More free tools (Hitline, Serpline, Rivaline, Foldline as four tiles with the full description in `title`), footer with version, Privacy, Contact.
- **Welcome:** 3 steps, chips, "Built by Shamistan Isayev", "Need help with your site? Get in touch".
- **Toasts:** dark pill, 2.5 seconds, `role="status"`.

## 6. Settings and storage
`chrome.storage.local` keys: `blurAuto: boolean` (true), `blurStyle: 'blur' | 'pixelate' | 'solid'` ('blur'), `exportFormat: 'png' | 'pdf'` ('png'), `details: boolean` (true), `madeWith: boolean` (true), `lang: 'en' | 'az'`, `installedAt: number`. Export dialog switches change only the current export, except "Made with Markline", which also saves `madeWith` (the FAQ promises it stays off). "Clear all settings" wipes `local`. Captures are never stored (§3.2).

## 7. i18n
All strings in one dictionary per language (`en`, `az`), including overlay copy, export text and PDF labels. Never hard-code UI text. `docs/markline/AZ-REVIEW.md` lists every Azerbaijani string for the owner.

## 8. Links and UTM
`utm_source` is always `markline`.

| Place | URL | utm_medium | utm_campaign |
|---|---|---|---|
| Report PDF CTA | shamistanisayev.com | extension | pdf_footer |
| Welcome contact link | shamistanisayev.com | extension | welcome |
| Settings "Contact" | shamistanisayev.com | extension | settings |
| Settings "More free tools" | hitline/serpline/rivaline/foldline + `.website` | extension | more_tools |
| Settings "Privacy" | MARKLINE_SITE_URL/privacy | (none) | (none) |
| Copied notes, last line | MARKLINE_SITE_URL | extension | share |
| Uninstall URL | MARKLINE_SITE_URL/uninstalled | extension | uninstall |
| Uninstall page "Book a call" | shamistanisayev.com | extension | uninstall |
| Landing "Book a call" | shamistanisayev.com | landing | audit_cta |
| Landing FAQ "Ask me directly" | shamistanisayev.com | landing | faq |
| Landing footer "Built by" | shamistanisayev.com | landing | footer |
| Landing "More free tools" cards | tool domains | landing | more_tools |

The "Made with Markline" line on PNG images is plain text, not a link. Other tools' domains are config values; their sites may not exist yet.

## 9. Landing site (`apps/markline/site`, Astro)
- **Routes:**
  - `/`: landing from `design/markline/Landing.dc.html`, responsive as in LandingTablet and LandingMobile. Keep all animations and hover effects (CSS only): the hero mock where the box, pins, arrow, blur and notes appear in sequence and loop, the floating "Blurred for you" card, the copied toast, the problem cards, the tab showcase (radio-input tabs, keyboard accessible), the marquee, `prefers-reduced-motion` (everything shown in its final state, marquee stopped).
  - **Annotate an image** (`#annotate`): a small vanilla script (no framework) built on the shared `annotate` model and `render` (§3.3). Drop, paste or choose an image; tools Arrow, Box, Number, Text, Highlight, Blur; 4 colors; Undo; Clear; "Download PNG"; "Copy image"; the checkbox "Blur emails and phone numbers in the sample" toggles the two demo blur shapes. Starts with a sample: a WebP of the Bramble order page (rendered from the fixture in Phase 8) with the demo pins, box and highlight. Pointer events so it works with touch. Nothing is sent anywhere; the site loads no analytics unless `PUBLIC_GTM_ID` is set (same rule as Hitline).
  - `/privacy`: what is stored (settings only, locally), that captures are never stored or uploaded and live only in the editor tab, the short-lived hand-off record, the three permissions and why, that pages are read only after a click or shortcut, that the overlay exists only while selecting, the "Made with Markline" line and how to turn it off, contact.
  - `/uninstalled`: Uninstall artboard. Form with 4 reasons, optional text, hidden `v`. Posts to `/api/feedback`.
  - `/404`
- **Shared site code:** use `packages/site-kit` (feedback Pages Function with Resend, honeypot and rate limit, consent banner, SEO head). If it does not exist yet, create it as Rivaline SPEC §9 describes and keep Hitline's site working.
- **Dark hero:** background `#120D24` with grid lines `rgba(255,255,255,.05)` (48 px), a soft yellow glow top right (`#FDE68A` at about 25%, so it never turns olive on the dark background) and a soft lime `#C6F36B` glow bottom left; the hero clips its own glows (`overflow: hidden` on the hero section only). Headline white, the highlighted words in `#FDE68A`, lead `#D0CBE6`. Main button `#FACC15` with `#101828` text and icons; second button transparent (background `rgba(255,255,255,.06)`, border `rgba(255,255,255,.28)`, white text). White cards inside the hero (product mock, floating card) keep dark text.
- **Hero pill:** "Free Chrome extension", height 32px, padding `0 14px 0 12px`, 8px between dot and text, 13px/600, background `rgba(255,255,255,.08)`, border `rgba(255,255,255,.16)`; 8px green `#12B76A` dot with a green pulse.
- **Hero callouts:** no background or border: 20px lime `#C6F36B` circle with a `#1A2E05` check, 14px/600 `#D0CBE6` text, 24px gap, the icon grows and rotates a little on hover.
- **Sticky dark header:** `position: sticky; top: 0`, background `rgba(18,13,36,.94)`, `backdrop-filter: blur(14px)`, bottom border `rgba(255,255,255,.08)`, logo in the dark theme, links `#D0CBE6` turning white on hover with a lime underline. No ancestor of the header may have `overflow: hidden` (it breaks sticky): use `overflow-x: clip` on the page wrapper.
- **Buttons:** on hover only the arrow icon (`class="arr"`) moves right; Chrome and download icons stay. Text color stays the same in hover, focus, active and visited (`#101828` on yellow, white on transparent buttons, `#1A2E05` on lime); use selectors strong enough that a generic `a:hover` rule can't override them.
- **Marquee:** inside the hero, 110px below it, centered: 13px/600 `#B9B4D0` title "Every capture mode, tool and format", 18px gap; translucent cards 52px high, radius 14px, background `rgba(255,255,255,.06)`, `box-shadow: inset 0 0 0 1px rgba(255,255,255,.13)`, `backdrop-filter: blur(8px)`, text `#EDEAF8`, padding `0 20px 0 12px`, 14px apart; 30px Glyph (radius 27%, mark 62%, tint `#FEF9C3` with `#101828` mark, ring `0 0 0 1px rgba(255,255,255,.08)`) and the name at 15px/600; hover: background `rgba(255,255,255,.1)`, border `rgba(255,255,255,.26)`, shadow `0 12px 20px -14px rgba(0,0,0,.7)`, lifts 3px; list twice, `translateX(-50%)`, 40s linear infinite; pause on hover; 10% mask fade at the edges; 44px and 14px on phones; stops with `prefers-reduced-motion`. Items: the 4 capture modes, the 6 tools, auto blur for emails and for phone numbers, page details, PNG download, PDF summary, copy to clipboard, notes as text, undo and redo, keyboard shortcuts. No brand marks.
- **CTA section:** "Book a call" lime button with the signature "From <u>Shamistan Isayev</u>" in white, 14px.
- **SEO:** title, description, Open Graph image 1200x630 from the hero, canonical, sitemap, robots, JSON-LD `SoftwareApplication` (price 0, operatingSystem Chrome, applicationCategory BusinessApplication, author Person Shamistan Isayev with url shamistanisayev.com) and `FAQPage` from the six FAQ items.
- **Performance:** Lighthouse mobile at least 95 on all four categories. Self-hosted fonts (Plus Jakarta Sans, Inter, JetBrains Mono; Young Serif and Figtree only for the Bramble mock, subset to the characters used). The hero mock uses a static image of the Bramble page with HTML annotations on top, not a live page.
- "Add to Chrome" buttons point to the Web Store listing URL (config value until the listing exists).
- Cloudflare Pages project `markline`, custom domain from `MARKLINE_SITE_URL`.

## 10. Colors
- Markline: accent `#FACC15` (yellow), bright `#FDE68A`. Yellow is never text on white (1.5:1). On the yellow tile, yellow buttons, yellow badges and the selected tool, icons and text are `#101828`. Text that would have been "accent on light" (links, eyebrows, active labels) is `#101828`, with yellow only as a bar, underline, marker or fill behind it. Switches use an ink track with a yellow knob; focus rings, selected cards and selected radio buttons use `#101828` so they keep 3:1. Tints: `#FEFCE8` (row hover, PDF tile), `#FEF9C3` (Glyph background).
- **Logo:** every tool keeps its own glyph in the rounded tile, never a letter: Hitline pulse line, Serpline magnifier, Rivaline radar, Foldline page with a dashed fold, Markline crop corners with a squiggle. Tile radius 26%, glyph 64%, wordmark 66% of the tile at 800. Markline on light: yellow tile with an ink glyph, "Mark" and "line" both ink, "line" with the marker `linear-gradient(transparent 42%, #FACC15 42%, #FACC15 74%, transparent 74%)`. Markline on dark: `#FDE68A` tile with an ink glyph, "line" in `#FDE68A` without the marker. Source of truth: `design/markline/Logo.dc.html`.
- The other tools' logos and "More free tools" cards use the family colors: Hitline `#7F56D9` / `#B692F6`, Serpline `#2563EB` / `#93C5FD`, Rivaline `#0E7490` / `#67E8F9`, Foldline `#C11574` / `#FAA7E0`. Retired colors that must not appear anywhere: `#15803D`, `#86EFAC`, `#C2410C`, `#FDBA74`, `#A16207`, `#FDE047`, `#A21CAF`, `#F0ABFC`.
- **Status colors are only for statuses** and always come with an icon and a label: OK `#067647` on `#ECFDF3`, problem `#B42318` on `#FEF3F2`, warning `#B54708` on `#FFFAEB`, neutral `#475467` on `#EEEDF3`. In Markline that means: the done checks in Capturing, the Works on / Doesn't work on lists in Restricted and the "Copied" confirmation. A brand color is never used for a status, and a status color is never used as decoration (lock notes, chips, delete hovers stay neutral or brand).
- The annotation palette (black, yellow, blue `#2563EB`, red `#D92D20`, green `#12B76A`) is user content drawn on the image, not UI status or brand.
- Shared lime `#C6F36B` (text `#1A2E05`) is for the main contact CTA and the hero callout icons.

## 11. Accessibility
WCAG AA contrast, visible focus, every tool and switch reachable by keyboard with `aria-pressed` or `role="switch"`, `aria-label` on icon-only buttons, the overlay hint pill announced with `role="status"`, focus trapped in the Export dialog and returned to the Export button on close.

## 12. Test fixture (`apps/markline/fixture`)
- **Bramble** (`bramble.localhost/order`) built from `SitePage.dc.html` with the exact positions in that file: 1440 wide, 2400 tall, the "Your details" form at 120, 260 (700 x 500) with Jane Miller, `jane.miller@example.com`, `+1 555 0187`; the order summary at 860, 260 (460 x 420); footer with `hello@bramble.example` and `+1 555 0142`. Nothing fixed or sticky.
- **Bramble sticky** (`bramble.localhost/order-sticky`): the same page with a sticky header, for the full page test.
- **Nori** (`nori.localhost`): a page with no emails or phones.
- E2E tests (test build with localhost host permission, like the other tools), window sized so the viewport is 1440 x 808 at pixel ratio 1:
  - popup on Bramble shows "4 found on this page"; on Nori "None found on this page"
  - Visible area: the editor opens next to the tab with a 1440 x 808 image and the form email and phone blurred
  - Full page: 3 screens, a 1440 x 2400 image, the page scroll position is restored; on Bramble sticky the header appears once (pixel check)
  - Selected area: dragging from 848, 248 to 1332, 692 gives a 484 x 444 image
  - Element: hovering the email input and pressing Up until the label shows `form#checkout-details`; the capture is 700 x 500
  - Blur targets: 4 found with the rects in `Shot.dc.html` (±2 px), footer items marked `where: 'Footer'`
  - Editor: placing 4 pins with the notes from the design, turning off the footer items and drawing one blur gives "3 areas blurred"; undo and redo; deleting pin 2 renumbers
  - Export PNG with all options is 1920 x 2512; without notes 1440 x 2512; the copied notes text equals §3.4
  - the PDF is generated and contains the 4 notes and the page details
  - `chrome://extensions` shows Restricted; the overlay host is gone after every capture
  - the hand-off record is deleted after the editor loads
  - a unit test asserts the production manifest has no `host_permissions`, no `tabs`, no `downloads` and no `debugger`

## 13. Chrome Web Store
- Name: "Markline: Feedback Screenshot"
- Short description (max 132): "Capture any page, mark it up with arrows, numbered notes and blur, then download or copy it. Free, no account, nothing uploaded." (128)
- Category: Tools (or Workflow & Planning if Tools is not offered). Single purpose: "Capture the page in the current tab, mark it up and save or copy the image."
- Permission justifications: activeTab (capture and read the current tab only after the user clicks or presses a shortcut), scripting (find emails and phone numbers to blur, show the area and element picker, scroll for full page capture), storage (settings).
- Privacy answers: no data collected, no sale, no remote code. Privacy policy URL: MARKLINE_SITE_URL/privacy.

## 14. Phases
Each phase ends with the checks from `apps/markline/CLAUDE.md` "Working style", a commit and a short Azerbaijani report. Hitline (and Rivaline, Foldline, if present) tests must stay green.

### Phase 0: Setup and plan
- Pull, install, run the whole test suite.
- Add Markline to the "Line family" section of the root `CLAUDE.md` (create the section if it is missing) pointing to `apps/markline/CLAUDE.md` and `docs/markline/SPEC.md`.
- Check what already exists: `packages/site-kit`, the generic `buildLineReport`, the `packages/ui` accent themes and `Glyph`. Note in PLAN.md which of them Markline has to create.
- In a scratch extension, confirm on stable Chrome: popup open grants `activeTab` and the background can then call `captureVisibleTab` and `executeScript`; each command grants `activeTab`; `captureVisibleTab` rate limit and the 550 ms spacing; `OffscreenCanvas` and `createImageBitmap` in the service worker for a 1440 x 2400 at 2x join; IndexedDB hand-off from the service worker to a new tab; `navigator.clipboard.write` with an image from the editor page without `clipboardWrite`; overlay injection and removal before capture; the error messages for chrome://, the Web Store, other extensions and `file://`.
- Write `docs/markline/PLAN.md`: artboards to components, shared package changes, API check results, open questions.
- **Done when:** PLAN.md exists and every API check is marked pass or has a question for the owner.

### Phase 1: Scaffold
- `apps/markline/extension` (WXT, React, TS) with popup, editor, welcome and background; `apps/markline/site` (Astro); `apps/markline/fixture`; add them to the pnpm workspace and CI.
- Icon click opens an empty popup, `Alt+Shift+M` does the same, the editor page opens empty.
- **Done when:** CI is green for every tool and the unpacked Markline opens its popup and editor.

### Phase 2: Shared packages
- `packages/ui`: Markline accent theme (CSS variables from `apps/markline/CLAUDE.md`), `Glyph` kinds from `design/markline/Glyph.dc.html`, extension icons for Markline, preview page updated.
- `packages/report`: Markline config and the `imageWithList` section (create the builder first if missing, §4).
- `packages/site-kit`: reuse (create if missing, §9).
- **Done when:** the other tools' outputs are unchanged and the preview page shows the Markline theme.

### Phase 3: Core logic and fixture
- `packages/core/src/markline`: blur matchers, context formatting, file names, notes text, the `annotate` model (shapes, numbering, history, hit testing) and `render`. Unit tests for each, including phone false positives (times, dates, prices) and renumbering.
- `probe.js`, `fullpage.js` and the fixture sites from §12.
- **Done when:** Bramble's probe gives exactly the 4 targets and rects in the design, and rendering the demo Doc matches `Shot.png` within a small pixel tolerance.

### Phase 4: Capture
- Popup Main, Capturing and Restricted; the four capture modes (§3.1) with the overlay; hand-off (§3.2); commands; badge.
- **Done when:** on the fixture the popup matches `Main.png`, `Capturing.png` and `Restricted.png`, the overlay matches `AreaSelect.png` and `ElementPick.png`, and the capture sizes in §12 pass.

### Phase 5: Editor
- Editor, EditorBlur, EditorEmpty: tools, colors, zoom, notes, blur list and styles, undo and redo, keyboard, leaving guard.
- **Done when:** on the fixture the editor matches `Editor.png`, `EditorBlur.png` and `EditorEmpty.png` and the editor tests in §12 pass.

### Phase 6: Export
- Export dialog, PNG layout, copy image, copy notes, downloads.
- **Done when:** the dialog matches `Export.png`, the PNG sizes in §12 pass and a downloaded PNG opens correctly.

### Phase 7: PDF, settings, i18n, welcome, uninstall hook
- Feedback summary PDF through the shared builder; Settings; EN and AZ dictionaries with `docs/markline/AZ-REVIEW.md`; welcome page; `setUninstallURL`.
- **Done when:** the Bramble PDF matches `Report.png` in content and layout, Settings matches `Settings.png`, the language switch changes every string (overlay, export text and PDF too) and the welcome page opens on install.

### Phase 8: Landing site and deploy
- All routes from §9 with the Annotate tool, the sample WebP, SEO, Cloudflare Pages project `markline`, custom domain, Resend through `packages/site-kit`.
- **Done when:** the live domain serves `/`, `/privacy` and `/uninstalled` over HTTPS, a test feedback reaches the owner, the Annotate tool downloads a PNG on desktop and on a phone, and screenshots at 1440, 820 and 390 match the Landing PNGs.

### Phase 9: Chrome Web Store package
- Production zip, 5 screenshots at 1280x800 from the fixture (Popup, Editor with notes, Blur, Export, Feedback summary PDF), promo tile 440x280 and marquee 1400x560, `docs/markline/STORE-LISTING.md` from §13, a GitHub release.
- **Done when:** everything the owner uploads is in `store/markline/` with the listing doc.

### Phase 10: QA and handover
- Test on 3 real public sites the owner names plus the fixture: full page on long pages, sticky headers, lazy images, pages with cookie banners, phone and email false positives.
- Lighthouse and axe on the site.
- Add a Markline chapter to `docs/OWNER-GUIDE.md` (Azerbaijani): releasing, changing the domain, changing what auto blur finds, reading feedback.
- **Done when:** captures on the test sites have no repeated headers or gaps, no false blur on prices and dates, site scores are at least 95, and the guide is updated.

## 15. Owner inputs still needed (keep as config placeholders)
Domains are final: `hitline.website`, `serpline.website`, `rivaline.website`, `foldline.website`, `markline.website`. `MARKLINE_SITE_URL` is `https://markline.website`; the other tools' URLs are config values with the same `.website` domains.

- Web Store listing URL (after the first upload)
- 3 public sites for QA
