# getlineapps.com analytics (GTM + GA4)

Site only. Extensions never load analytics (CLAUDE.md, non-negotiable rules).

## Accounts (all under the "Shamistan Isayev" Google accounts)

| What | ID | Where |
| --- | --- | --- |
| GTM web container `getlineapps.com` | `GTM-WNZQGVXL` | tagmanager.google.com, account 6402570646, container 287235188 |
| GA4 property `getlineapps.com` | property 564536076 | analytics.google.com, account 414782240 |
| GA4 web stream `getlineapps.com web` | `G-WX35DJ8R7K` | stream 16353580008 |
| Site build variable | `PUBLIC_GTM_ID=GTM-WNZQGVXL` | GitHub repo variable, read by the deploy job in `.github/workflows/ci.yml` |

GA4 settings: time zone Baku, event data retention 14 months, enhanced measurement only page views
(scrolls, outbound clicks, site search, forms, video, file downloads are off: the site sends its own
events below, so nothing is counted twice).

## How it works

1. `Base.astro` (only when `PUBLIC_GTM_ID` is set) writes Consent Mode v2 defaults (all denied) in `<head>`.
2. `initAnalytics()` (`packages/site-kit/src/analytics.ts`) pushes the page context
   `{ page_type, page_locale, page_tool }` and starts one delegated listener for clicks, inputs,
   section visibility and scroll depth.
3. The consent banner loads GTM only after "Accept". Until then `track()` pushes nothing.
4. GTM: tag `GA4 - Google tag` (All Pages, sends `page_view` with the page context) and tag
   `GA4 - Line events` (trigger `CE - Line events`, event name `{{Event}}`, every parameter below).

No personal data: no form text, no emails, no IDs. The uninstall form sends only the picked reason
and whether a message was written.

## Events

Names follow GA4 conventions: snake_case, verb or object first, max 40 characters, GA4 built-in
parameter names where one exists (`link_url`, `link_domain`, `link_text`, `file_name`,
`file_extension`, `percent_scrolled`, `content_type`). Key events (conversions) are marked ★.

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | Every page (GA4 Google tag) | page_type, page_locale, page_tool |
| ★ `install_click` | Chrome Web Store button anywhere (hero, nav, band, hub cards, reinstall) | tool_slug, cta_location, link_url, link_text |
| ★ `contact_click` | Any link to shamistanisayev.com | tool_slug, cta_location (= the link's utm_campaign: hub_nav, hub_cta, audit_cta, faq, footer, privacy, uninstall), link_url, link_text |
| `select_content` | Link to a tool landing or a free web tool | content_type (tool_landing, web_tool), content_id (hitline, serpline_preview, rivaline_finder, ...), tool_slug, link_text, cta_location |
| `outbound_click` | Any other external link (GitHub source, ...) | link_url, link_domain, link_text, cta_location |
| `nav_click` | In-page jump link (header menu, hero buttons) | section_id, link_text, cta_location |
| `language_switch` | EN / AZ switch | language_to, cta_location |
| `faq_open` | FAQ question opened (closing is not counted) | faq_question, faq_index, cta_location |
| `feature_tab_view` | Feature tab picked on a landing (mouse or keyboard) | tab_id |
| `role_filter` | Role filter on the hub tool cards | role_id |
| `checkpoint_view` | Check point picked on the hub example page | checkpoint_id |
| `sample_report_open` | Hitline sample audit opened | tool_slug, cta_location |
| `sample_download` | Sample PDF downloaded | tool_slug, file_name, file_extension, cta_location |
| `web_tool_use` | Free web tools: SERP preview first edit of each field (edit_title, edit_desc, edit_url), device switch (device_mobile, device_desktop); ad finder first search (search) and library opened (open_library) | web_tool (serp_preview, ad_finder), tool_action, tool_item (meta, google, tiktok, linkedin), link_domain |
| `section_view` | A section with an id is at least half on screen (once per page) | section_id |
| `scroll_depth` | 25, 50, 75, 90 percent (once each) | percent_scrolled |
| ★ `feedback_submit` | Uninstall feedback sent | tool_slug, feedback_reason, has_message |
| `feedback_error` | Uninstall feedback failed | tool_slug, error_type (validation, network) |
| `cookie_settings_open` | "Cookie settings" link | cta_location |

Page context on every event: `page_type` (hub, landing, privacy, uninstall, not_found),
`page_locale` (en, az), `page_tool` (tool slug or none).

`cta_location` is automatic: `data-track-loc` if an element sets it, else `dialog`, `header`,
`footer`, `hero`, the section id, or the section class without `sec-` (`more`, `problem`, `privacy`).

GA4 custom dimensions (event scope, all created): page_type, page_locale, page_tool, tool_slug,
cta_location, content_type, content_id, language_to, section_id, faq_question, faq_index, tab_id,
role_id, checkpoint_id, web_tool, tool_action, tool_item, feedback_reason, has_message, error_type.

## Adding a new page or tool

Nothing to do for the usual cases: store buttons, owner links, tool links, FAQ, sections, language
switch and feature tabs are recognised from the markup. For a new tool landing, add its slug to
`TOOLS` in `analytics.ts` only if it is not in `TOOL_SLUGS` already (all five are).

For a new kind of interaction:

1. Add the event to `EVENTS` (and any new parameter to `PARAMS`) in `packages/site-kit/src/analytics.ts`.
2. Recognise it in `classifyClick` / `classifyInput`, or send it from a page script with
   `document.dispatchEvent(new CustomEvent('line:track', { detail: { event, params } }))`.
3. `GA4_ID=G-WX35DJ8R7K GTM_ID=GTM-WNZQGVXL pnpm --filter @line/site gen:gtm`, then in GTM:
   Admin > Import container > `docs/analytics/gtm-container.json` > Default Workspace > **Merge** >
   Overwrite conflicting > Submit > Publish.
4. A new custom parameter also needs a GA4 custom dimension (Admin > Custom definitions).

`docs/analytics/ga4-setup.json` lists the events, key events and custom dimensions in machine form.

## Testing

- Unit: `packages/site-kit/src/analytics.test.ts` (classification, consent gate, GTM container covers every event).
- Live: GTM Preview (tagassistant.google.com) on https://getlineapps.com, accept the banner, click around;
  or GA4 > Admin > DebugView. Hitline itself shows every GA4 hit on the page too.
