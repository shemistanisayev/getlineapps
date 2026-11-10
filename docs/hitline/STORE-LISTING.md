# Hitline: Chrome Web Store listing

Everything to paste into the Chrome Web Store Developer Dashboard for Hitline 1.0.0. The files to upload are in `store/hitline/` (see `store/hitline/README.md`).

## Package

| Field | Value |
|---|---|
| File | `store/hitline/hitline-1.0.0.zip` |
| Name | Hitline |
| Version | 1.0.0 |
| Category | Developer Tools |
| Language | English (default), Azerbaijani (second listing language) |

## Store listing (English, default)

**Name**

```
Hitline
```

**Short description** (from the manifest, 107 of 132 characters)

```
See every GA4, Google Ads, Meta and TikTok event, spot server-side GTM and catch consent leaks in DevTools.
```

**Detailed description**

```
Is your tracking working? Prove it in one panel.

Hitline shows which tracking fires on a page, where it goes, whether it respects consent and whether attribution survives the visit. One click gives a summary, DevTools gives the full picture, and one more click turns the findings into an audit PDF.

IN THE POPUP
- Platforms found on the page: GA4, Google Ads, Meta Pixel, TikTok Pixel, Hotjar
- Server-side GTM verdict
- The top issues, with a short audit PDF

IN CHROME DEVTOOLS (press F12, open the Hitline tab)
- Events: every GA4, Google Ads, Meta and TikTok hit and every dataLayer push, with all parameters decoded and the route (browser, server-side GTM or page)
- GTM and sGTM: container stats, every tag with type, trigger and status, and server-side GTM checked with four signals (own subdomain, GA4 path, server_container_url, FPID cookie)
- Consent: Consent Mode v2 defaults and the visitor's choice, a timeline before and after the choice, cookieless pings told apart from leaks, and the GTM fix for each leak
- Attribution: UTM and gclid followed page by page, cross-domain breaks and unwanted referrals found, with the GA4 setting that fixes them
- Tracking plan: load your plan as CSV or JSON and see which events are missing or have wrong parameters, or draft a plan from the session
- Audit PDF: a prioritized report with every issue and its fix

PRIVATE BY DESIGN
- No account, no server, no analytics inside the extension
- Everything is analyzed in your browser. Hitline makes no network requests of its own
- Only your settings (language, your domains, tracking plans) are saved, and only on your computer
- Minimal permissions: active tab, scripting, local storage and the DevTools panel. No access to all your sites
- Open source: https://github.com/shemistanisayev/getlineapps

Free, with no paid plan and no usage limit. Built by Shamistan Isayev, analytics and server-side tracking consultant. Need help fixing what Hitline finds? https://shamistanisayev.com
```

## Store listing (Azerbaijani)

**Short description** (Azerbaijani, 110 of 132 characters)

```
GA4, Google Ads, Meta və TikTok eventlərini gör, server-side GTM-i tap və consent sızmalarını DevTools-da tut.
```

**Detailed description**

```
Tracking-in işləyir? Sübut et, bir paneldə.

Hitline səhifədə hansı tracking-in işlədiyini, hara getdiyini, consent-ə əməl edib-etmədiyini və atribusiyanın ziyarət boyu qalıb-qalmadığını göstərir. Bir klik xülasə verir, DevTools tam mənzərəni, bir klik də tapıntıları audit PDF-ə çevirir.

POPUP-DA
- Səhifədə tapılan platformalar: GA4, Google Ads, Meta Pixel, TikTok Pixel, Hotjar
- Server-side GTM olub-olmadığı
- Əsas problemlər və qısa audit PDF

CHROME DEVTOOLS-DA (F12 bas, Hitline tabını aç)
- Eventlər: hər GA4, Google Ads, Meta və TikTok hit-i və hər dataLayer push-u, bütün parametrlər açılmış və yolu ilə (brauzer, server-side GTM və ya səhifə)
- GTM və sGTM: konteyner rəqəmləri, hər tag növü, trigger-i və statusu ilə, server-side GTM dörd siqnalla yoxlanır (öz subdomen, GA4 yolu, server_container_url, FPID cookie)
- Consent: Consent Mode v2 default-ları və ziyarətçinin seçimi, seçimdən əvvəl və sonranın xronologiyası, cookieless ping-lər sızmalardan ayrılır, hər sızma üçün GTM həlli
- Atribusiya: UTM və gclid səhifə-səhifə izlənir, cross-domain qırılmaları və arzuolunmaz referral-lar tapılır, düzəldən GA4 ayarı göstərilir
- Tracking plan: planını CSV və ya JSON kimi yüklə, itkin və ya səhv parametrli eventləri gör, ya da sessiyadan plan qaralaması çıxar
- Audit PDF: hər problem və həlli ilə prioritetli hesabat

MƏXFİLİK ƏSASDIR
- Hesab, server və extension-un içində analitika yoxdur
- Hər şey brauzerində analiz olunur. Hitline öz adından heç bir sorğu göndərmir
- Yalnız ayarların (dil, domenlərin, tracking planlar) saxlanılır, o da yalnız sənin kompüterində
- Minimum icazə: aktiv tab, scripting, lokal yaddaş və DevTools paneli. Bütün saytlarına giriş yoxdur
- Açıq mənbə: https://github.com/shemistanisayev/getlineapps

Pulsuzdur, pullu plan və istifadə limiti yoxdur. Müəllif: Şəmistan İsayev, analitika və server-side tracking məsləhətçisi. Hitline-ın tapdığını düzəltməyə kömək lazımdır? https://shamistanisayev.com
```

## Graphic assets

| Field | File |
|---|---|
| Store icon 128x128 | inside the zip (`icon-128.png`); also `packages/ui/icons/hitline/icon-128.png` |
| Screenshots 1280x800 (5) | `store/hitline/screenshots/1-popup.png`, `2-events.png`, `3-consent.png`, `4-attribution.png`, `5-audit-pdf.png` |
| Small promo tile 440x280 | `store/hitline/promo-small-440x280.png` |
| Marquee promo tile 1400x560 | `store/hitline/promo-marquee-1400x560.png` |

Screenshots are made from the fictional Lumo shop (`apps/fixture`), not from a real site. Regenerate with `pnpm store:hitline` (see the header of `scripts/store-hitline.ts`).

## Additional fields

| Field | Value |
|---|---|
| Official URL | none (not needed) |
| Homepage URL | `https://getlineapps.com/hitline` |
| Support URL | `https://github.com/shemistanisayev/getlineapps/issues` |
| Mature content | No |

## Privacy practices tab

**Single purpose**

```
Hitline helps people check the analytics and advertising tracking on a website: which tracking requests a page sends (GA4, Google Ads, Meta Pixel, TikTok Pixel, Hotjar, Google Tag Manager), whether they respect the visitor's consent choice, and whether campaign attribution survives the visit. It shows this in a popup and a Chrome DevTools panel and can export it as a PDF.
```

**Permission justifications**

| Permission | Justification to paste |
|---|---|
| `activeTab` | When the user clicks the Hitline icon, Hitline reads the current tab once to list the tracking requests it sent. Without a click it has no access to any tab. |
| `scripting` | Runs one read-only function in the active tab (after the user clicks the icon) that returns the page's resource URLs, dataLayer consent commands, Google Tag Manager container ids and the names of tracking cookies. Nothing is changed and nothing is sent. |
| `storage` | Saves the user's settings in chrome.storage.local on their computer: interface language, the domains they mark as their own site, and tracking plan files they load. Nothing else is stored. |
| DevTools page (`devtools_page`, not a permission) | Adds the Hitline tab to Chrome DevTools. Chrome gives it the inspected tab's network requests only while DevTools is open. |
| Host permissions | None requested. |

**Remote code**

```
No, I am not using remote code.
```

Hitline loads no scripts, fonts or data from the network. All code and fonts are in the package.

**Data usage**

Tick nothing in "What user data do you plan to collect". Hitline collects none of: personally identifiable information, health, financial, authentication, personal communications, location, web history, user activity or website content. Page data is analyzed in memory in the browser and never leaves it.

Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**

```
https://getlineapps.com/privacy/hitline
```

## Distribution

| Field | Value |
|---|---|
| Visibility | Public |
| Regions | All regions |
| Pricing | Free |

## After approval

Send the listing link (`https://chromewebstore.google.com/detail/...`) to the agent. It sets Hitline to `live` with that `storeUrl` in `apps/site/src/content/tools.json`, so every "Add to Chrome" button on getlineapps.com points to the listing.
