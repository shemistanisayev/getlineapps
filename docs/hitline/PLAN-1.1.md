# Hitline 1.1: plan and decisions (2026-11-11)

The owner tested 1.0.0 and asked for these changes. Plan approved in chat on 2026-11-11.

## What the owner reported, and the cause found

| Report | Cause | Fix |
|---|---|---|
| Events are in the wrong order | The list was oldest first. dataLayer entries read after the panel opened got the page start time | Newest first by default (Time header switches), real push times through a dataLayer.push timer installed when the panel opens, estimated times marked with "≈" |
| "No events" at first, no guidance | DevTools only sees requests sent while it is open; the panel showed the empty state until something arrived. The popup read the request list once | Loading state, a "Listening" line, a bar when the page loaded before DevTools opened, a live popup that reads the page every 2 seconds |
| New events are not noticeable | No indicator | New rows light up, a "N new events" button when scrolled down, the Events count bumps, the popup shows "+N new" |
| More platforms and custom events | 6 platforms | 50 platforms (registry in `packages/core/src/hitline/platforms.ts`), custom platforms from Settings, "Other" for tracking-like requests nobody knows |
| The audit is not detailed, shows unrelated things | Page kinds were guessed from URLs ("payment" for a normal page), rows for things not set up | Real URLs, sections only when they have content, platforms and IDs, events, GTM tags, consent timeline, visit path, every issue with why it matters and when it was seen |
| Popup click should open DevTools on the Hitline tab | Chrome has no API for an extension to open DevTools or pick its tab | The popup shows the shortcut, and leaves a note (chrome.storage.session) so the panel opens on the clicked event. DevTools remembers the last tab |
| GTM events and tags not visible | Containers loaded before DevTools opened were not read (HAR entries have no body); gtm.* events were hidden on purpose | Containers are read from `inspectedWindow.getResources()`; GTM tab has Tags and Events views; triggers are evaluated per event ("yes", "no", "maybe") |
| Which site's data is this? | Nothing showed the site | Site chip in the panel header, site bar in the popup; a typed address on another site starts a new panel session (links from the session, own domains and sites already in the session keep it) |

## Accuracy fixes found while doing this

- Popup missed GA4 on sites that batch events in the request body (the event name is only in the body): now counted as `(unknown)`.
- The browser lists only 250 resources per page: the popup also checks page globals (`fbq`, `ttq`, `clarity`, ...) and says when the list is full.
- Google Ads `viewthroughconversion` without a label is remarketing, not a conversion.
- One event sent to two endpoints (Google Ads, X, Floodlight) is one row (`mergeFanOut`), so it is not counted twice.
- TikTok `tiktokw.us` endpoint, GA4 on server-side containers with their own path.
- New issue rules: e-mail in a tracking hit (high), the same event sent twice within a second (medium), GA4 purchase without transaction_id (medium), several GA4 properties (info).

## Platforms (50)

Analytics: GA4, Universal Analytics, Adobe Analytics, Adobe Web SDK, Amplitude, Mixpanel, Segment, RudderStack, PostHog, Heap, Matomo, Piwik PRO, Snowplow, Yandex Metrica, Plausible.
Session recording: Hotjar, Microsoft Clarity, FullStory, Mouseflow, Contentsquare.
Ad pixels: Google Ads, Floodlight, Meta, TikTok, Microsoft Ads, LinkedIn, X, Pinterest, Snapchat, Reddit, Quora, Criteo, Taboola, Outbrain, Amazon Ads, Awin.
CRM: HubSpot, Klaviyo, Marketo, Pardot, Braze, Customer.io.
Tag managers: GTM, Google Tag, Tealium, Adobe Launch.
A/B testing: Optimizely, VWO, AB Tasty.
Data layer: dataLayer (plus adobeDataLayer, digitalData and utag_data as page data).

Ad pixels in the list must wait for ad_storage like Meta and TikTok (consent issues). Google tags follow Consent Mode. Brand marks: from the designs and the `simple-icons` package; platforms without a mark there get a neutral two-letter tile.

## Storage (SPEC §7 extended)

`chrome.storage.local`: `domains`, `plans`, `lang`, `installedAt`, and new `customRules` (max 20, a name, a URL text, an optional event field). `chrome.storage.session` (memory only): `focus`, the popup's "show this event" note.

## Not done, on purpose

- Google `ccm/collect` hits: their format is not documented and they would double GA4 and Ads rows.
- Consent issues for analytics tools other than Hotjar: many run cookieless and would give false alarms.
