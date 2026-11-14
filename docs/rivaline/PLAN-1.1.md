# Rivaline 1.1: competitor research, not a tracking audit

Owner, 2026-11-13: "Rivaline is not Hitline, keep it for competitor research. Add different features. No checks like tags firing before consent. Comparing two competitors is great. New local and popular tools are good. Find more."

Rules that stay: no server, no network requests of its own, the same four permissions (`activeTab`, `scripting`, `storage`, `sidePanel`), results only in memory per tab, EN + AZ, family colors, no em dashes. Everything below is read from the page the user opened, in the DOM, after a click.

## What a marketer wants from a rival's site

| Question | Feature | Read from |
|---|---|---|
| Which tools do they pay for? | Stack (1.0) plus about 35 local and popular tools (step 1) | scripts, requests, globals, cookies, elements |
| What do they promise and sell right now? | **Offer**: page title and description, main headline and subline, call-to-action labels, the announcement bar, promotions (discounts, free shipping threshold, promo codes), price range | DOM, JSON-LD, Open Graph |
| Where else are they? | **Channels**: social profiles (Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Telegram, Pinterest), WhatsApp, apps (App Store, Google Play, smart app banner), public email and phone | links and meta tags on the page |
| Which markets do they serve? | **Markets**: languages (`hreflang`), currency, the page language | `link[hreflang]`, JSON-LD, Shopify and meta currency |
| How do they catch leads? | **Lead capture** line: email pop-up, newsletter form, chat, web push, WhatsApp | Stack tools plus forms |
| How do two rivals differ? | **Compare**: any two tabs Rivaline has read, side by side: tools only A has, only B has, both; channels; markets; colors | the panel's memory |

Ads (four libraries) and Brand stay as in 1.0. Social and app links open only when the user clicks them, in a new tab, like the ad libraries.

## Panel

Tabs become **Stack, Offer, Ads, Brand**. Offer holds Offer, Channels, Markets and Lead capture as cards. Compare opens from the header (an icon next to Read again) once two tabs in the window have been read; it lists the read tabs to pick from. Nothing is stored: closing a tab drops its result, as in 1.0.

The competitor report PDF gains the offer line, channels and markets. Compare can be exported as a second PDF page type later if the owner wants it.

## Steps

| Step | What | Done when |
|---|---|---|
| 1 | 35 new tools (165 in all): local and regional (Jivo, Bitrix24, Kommo/amoCRM, Carrot quest, SendPulse, LiveInternet, VK Ads, AdRiver, Admitad, Calltouch, Ringostat, Tabby, Tamara, WhatsApp chat, OpenCart, 1C-Bitrix) and popular (OneSignal, PushOwl, PushEngage, AdSense, Google Ad Manager, AppsFlyer, Branch, Smartlook, LogRocket, Lucky Orange, Fathom, Simple Analytics, Cloudflare Web Analytics, CallRail, Chatra, Smartsupp, Drupal, Joomla, Framer). "Email" is "Email and push"; kind labels (chat, web push ...) are translated in Azerbaijani | Done: every rule unit tested, look-alike paths tested as no match. QA on 13 sites (the 9 from 1.0 plus kontakt.az, irshad.az, bakuelectronics.az, tap.az): new matches only where real (OneSignal on umico.az, WhatsApp on kontakt.az and irshad.az); tap.az showed AdRiver and Cloudflare Web Analytics, both added |
| 2 | Core: `readOffer`, `readChannels`, `readMarkets`, `leadCapture` (`packages/core/src/rivaline/research.ts`) from a new `collectSite` read (`apps/rivaline/extension/src/capture/site.ts`, isolated world, read only) | Done: the scan keeps `site` per tab (shown from step 3). Offer: title, description, headline and subline, buttons in the first viewport (not skip links, not fixed pop-ups), the announcement bar (first message, no countdown digits, not a utility menu), offers by kind (discount, code, shipping, sale, installments, gift, returns) in EN, AZ, RU and TR, price range from JSON-LD or price texts. Channels: one profile per network (shares, posts and plugins skipped), App Store and Google Play, WhatsApp numbers (a WhatsApp channel is not a chat), emails, phones. Markets: languages and regions from hreflang, currency from JSON-LD, meta or prices. Lead capture: email, SMS, push, chat, WhatsApp, CRM forms. Kova gained a footer (profiles, newsletter with a code, apps, hreflang, JSON-LD) in its own colors: stack and brand unchanged. 18 unit tests; QA on 8 real sites tuned the announcement, button and WhatsApp rules |
| 3 | Offer tab in the panel (Offer, Channels, Markets, Lead capture), EN + AZ, axe | Done: tabs Stack, Offer (count = offers), Ads, Brand; a fifth reading step "Reading the offer and channels". Cards: What they say (top bar, headline, subline, buttons, the search result title and description), Offers (kind chips in Rivaline's tint, the text, promo code with Copy, price range in the panel language's number format), Channels (profiles and apps open in a new tab only on click, email and phone copy), Markets (language and country names from Intl, currency), How they catch leads. Icons for Instagram, Facebook, YouTube, Telegram, Threads, VK, WhatsApp, App Store, Google Play and six new stack tools from simple-icons (CC0). e2e on Kova (every value, links, code copy, AZ with no English left, 280 px), axe on the Offer view; four tabs fit 280 px. 46 strings in AZ-REVIEW |
| 4 | Compare view | e2e with Kova and Glowbar |
| 5 | PDF, landing, store listing, version 1.1.0, QA on real sites | All checks; store package |
