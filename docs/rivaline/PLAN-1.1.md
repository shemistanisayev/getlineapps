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
| 2 | Core: `readOffer`, `readChannels`, `readMarkets` from a new `collectSite` read (pure functions, fixtures) | Unit tests on Kova and on recorded real pages |
| 3 | Offer tab in the panel (Offer, Channels, Markets, Lead capture), EN + AZ, axe | e2e on Kova; screenshots |
| 4 | Compare view | e2e with Kova and Glowbar |
| 5 | PDF, landing, store listing, version 1.1.0, QA on real sites | All checks; store package |
