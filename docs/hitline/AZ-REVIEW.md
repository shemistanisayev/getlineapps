# Hitline: Azərbaycanca mətnlərin yoxlanması

Agent yazıb, sən yoxlayırsan. Dəyişmək istədiyin sətri burada və ya `apps/hitline/extension/src/i18n/az.ts` faylında düzəlt (və ya agentə yaz). Tool, event və parametr adları (GA4, page_view, consent) tərcümə olunmur.

## Extension (popup, panel, welcome)

Fayl: `apps/hitline/extension/src/i18n/az.ts`. {platform}, {event} kimi yerlər avtomatik dolur.

| Açar | English | Azərbaycanca |
|---|---|---|
| `popup.settings` | Settings | Ayarlar |
| `popup.loading` | Reading this page... | Səhifə oxunur... |
| `popup.request` | {n} tracking request | {n} tracking sorğusu |
| `popup.requests` | {n} tracking requests | {n} tracking sorğusu |
| `popup.sgtm.yes` | Server-side GTM detected | Server-side GTM tapıldı |
| `popup.sgtm.via` | GA4 goes through {host} | GA4 {host} ilə gedir |
| `popup.sgtm.no` | No server-side GTM | Server-side GTM yoxdur |
| `popup.sgtm.noText` | Tracking goes straight from the browser | Tracking birbaşa brauzerdən gedir |
| `popup.tile.event` | {n} event | {n} event |
| `popup.tile.events` | {n} events | {n} event |
| `popup.tile.issue` | {n} issue | {n} problem |
| `popup.tile.issues` | {n} issues | {n} problem |
| `popup.more` | +{n} more | +{n} daha |
| `popup.issueFound` | {n} issue found | {n} problem tapıldı |
| `popup.issuesFound` | {n} issues found | {n} problem tapıldı |
| `popup.noIssues` | No issues found in the requests on this page. | Bu səhifənin sorğularında problem tapılmadı. |
| `popup.issue.value` | {platform} {event} is sent without a value | {platform} {event} dəyərsiz göndərilir |
| `popup.issue.before` | {platform} fires before consent | {platform} consent-dən əvvəl işləyir |
| `popup.issue.after` | {platform} still fires after cookies are rejected | {platform} cookie-lər rədd olunandan sonra da işləyir |
| `popup.pdf` | Download audit PDF | Audit PDF-i yüklə |
| `popup.f12.before` | Full analysis in DevTools: press | Tam analiz DevTools-dadır: |
| `popup.f12.after` | , open the Hitline tab |  bas, Hitline tabını aç |
| `popup.help` | Need help fixing these? | Bunları düzəltməyə kömək lazımdır? |
| `popup.empty.title` | No tracking on this page | Bu səhifədə tracking yoxdur |
| `popup.empty.text` | No GA4, Google Ads, Meta Pixel or TikTok Pixel was found on {host}. Visits and sales from this page are not measured. | {host} saytında GA4, Google Ads, Meta Pixel və ya TikTok Pixel tapılmadı. Bu səhifədən gələn ziyarətlər və satışlar ölçülmür. |
| `popup.empty.checked` | What Hitline checked | Hitline nəyi yoxladı |
| `popup.empty.gtm` | GTM container | GTM konteyneri |
| `popup.empty.scripts` | page scripts | səhifə skriptləri |
| `popup.empty.ctaTitle` | Want this site measured properly? | Bu sayt düzgün ölçülsün? |
| `popup.empty.ctaText` | GA4, ad pixels and consent, set up and tested. | GA4, reklam pixel-ləri və consent, qurulmuş və yoxlanmış. |
| `popup.restricted.title` | Hitline can’t read this page | Hitline bu səhifəni oxuya bilmir |
| `popup.restricted.text` | Chrome does not let extensions read its own pages, the Web Store or the PDF viewer. Open a website and click the Hitline icon again. | Chrome extension-lara öz səhifələrini, Web Store-u və PDF baxıcısını oxumağa icazə vermir. Hər hansı sayt aç və Hitline ikonuna yenidən bas. |
| `settings.back` | Back | Geri |
| `settings.domains` | Your domains | Sənin domenlərin |
| `settings.domainsHint` | Hitline treats these as one site when it checks attribution. | Hitline atribusiyanı yoxlayanda bunları bir sayt sayır. |
| `settings.domainLabel` | Domain to add | Əlavə ediləcək domen |
| `settings.addDomain` | + Add domain | + Domen əlavə et |
| `settings.add` | Add | Əlavə et |
| `settings.removeDomain` | Remove {domain} | {domain} sil |
| `settings.invalidDomain` | Enter a domain like example.com. | example.com kimi bir domen yaz. |
| `settings.plan` | Tracking plan | Tracking plan |
| `settings.noPlan` | No plan for this site yet. | Bu sayt üçün hələ plan yoxdur. |
| `settings.load` | Load plan | Plan yüklə |
| `settings.replace` | Replace | Dəyiş |
| `settings.removePlan` | Remove | Sil |
| `settings.language` | Language | Dil |
| `settings.yourData` | Your data | Məlumatların |
| `settings.clearAll` | Clear all settings | Bütün ayarları təmizlə |
| `settings.cleared` | All settings are cleared. | Bütün ayarlar təmizləndi. |
| `settings.privacyNote` | Only these settings are saved, and only on this computer. Hitline sends nothing anywhere. | Yalnız bu ayarlar saxlanır, o da yalnız bu kompüterdə. Hitline heç yerə heç nə göndərmir. |
| `settings.more` | More free tools | Daha çox pulsuz alət |
| `settings.tool.serpline` | SEO and AI search | SEO və AI axtarış |
| `settings.tool.rivaline` | Competitor research | Rəqib araşdırması |
| `settings.tool.foldline` | Landing page CRO | Landing səhifə CRO |
| `settings.tool.markline` | Feedback screenshots | Rəy üçün ekran şəkilləri |
| `settings.version` | Version {v} | Versiya {v} |
| `settings.privacy` | Privacy | Məxfilik |
| `settings.contact` | Contact | Əlaqə |
| `list.and` | and | və |
| `panel.tabsLabel` | Hitline sections | Hitline bölmələri |
| `panel.tab.events` | Events | Eventlər |
| `panel.tab.gtm` | GTM | GTM |
| `panel.tab.consent` | Consent | Consent |
| `panel.tab.attribution` | Attribution | Atribusiya |
| `panel.tab.plan` | Plan | Plan |
| `panel.recording` | Recording | Yazılır |
| `panel.clear` | Clear | Təmizlə |
| `panel.auditPdf` | Audit PDF | Audit PDF |
| `panel.empty.title` | Reload the page to start recording | Yazmağa başlamaq üçün səhifəni yenilə |
| `panel.empty.text` | Hitline records tracking requests while DevTools is open. Reload once to catch everything the page sends on load, including page_view and consent defaults. | Hitline DevTools açıq olanda tracking sorğularını yazır. Səhifənin yüklənəndə göndərdiyi hər şeyi, page_view və consent default-ları da daxil, tutmaq üçün bir dəfə yenilə. |
| `panel.empty.reload` | Reload page | Səhifəni yenilə |
| `panel.empty.loadPlan` | Load tracking plan | Tracking planı yüklə |
| `panel.empty.shortcut` | Shortcut | Qısayol |
| `panel.empty.watches` | What Hitline watches | Hitline nəyi izləyir |
| `panel.empty.w.ga4` | GA4 and Google Tag | GA4 və Google Tag |
| `panel.empty.w.ads` | Google Ads conversions | Google Ads konversiyaları |
| `panel.empty.w.meta` | Meta Pixel | Meta Pixel |
| `panel.empty.w.tiktok` | TikTok Pixel | TikTok Pixel |
| `panel.empty.w.gtm` | dataLayer and GTM containers | dataLayer və GTM konteynerləri |
| `panel.empty.w.sgtm` | Server-side GTM endpoints | Server-side GTM endpoint-ləri |
| `events.all` | All | Hamısı |
| `events.filtersLabel` | Filter by platform | Platformaya görə süz |
| `events.search` | Search events or parameters | Event və ya parametr axtar |
| `events.th.time` | Time | Vaxt |
| `events.th.platform` | Platform | Platforma |
| `events.th.event` | Event | Event |
| `events.th.route` | Route | Yol |
| `events.th.status` | Status | Status |
| `events.listLabel` | Recorded events | Yazılan eventlər |
| `events.noMatch` | No events match this filter. | Bu süzgəcə uyğun event yoxdur. |
| `route.sgtm` | sGTM | sGTM |
| `route.browser` | Browser | Brauzer |
| `route.page` | Page | Səhifə |
| `route.viaSgtm` | via sGTM | sGTM ilə |
| `status.ok` | OK | OK |
| `status.noValue` | No value | Dəyər yoxdur |
| `status.beforeConsent` | Before consent | Consent-dən əvvəl |
| `status.afterReject` | After rejection | Rədddən sonra |
| `status.mismatch` | Wrong signal | Səhv siqnal |
| `detail.params` | Parameters | Parametrlər |
| `detail.noParams` | This hit carries no event parameters. | Bu hit-də event parametri yoxdur. |
| `consent.granted` | Consent granted | Consent verilib |
| `consent.cookieless` | Cookieless ping | Cookieless ping |
| `consent.before` | Sent before any consent | Heç bir consent-dən əvvəl getdi |
| `consent.after` | Sent after rejection | Rədddən sonra getdi |
| `consent.mismatch` | Signals do not match the choice | Siqnallar seçimə uyğun deyil |
| `consent.noSignal` | No consent signal on this hit | Bu hit-də consent siqnalı yoxdur |
| `consent.unknown` | No Consent Mode on this page | Bu səhifədə Consent Mode yoxdur |
| `issue.sameClick.title` | The same click sends {platform} {event} without a value | Eyni klik {platform} {event} eventini dəyərsiz göndərir |
| `issue.sameClick.text` | {own} gets {value}, {platform} gets no value. {platform} ad optimization can’t see the cart value. | {own} {value} alır, {platform} isə dəyər almır. {platform} reklam optimizasiyası səbətin dəyərini görmür. |
| `issue.self.title` | {platform} {event} is sent without a value | {platform} {event} dəyərsiz göndərilir |
| `issue.self.text` | Pass value and currency from the dataLayer to this tag. | value və currency-ni dataLayer-dən bu tag-a ötür. |
| `gtm.container` | Container | Konteyner |
| `gtm.tags` | Tags | Tag-lar |
| `gtm.triggers` | Triggers | Trigger-lər |
| `gtm.variables` | Variables | Dəyişənlər |
| `gtm.estimated` | estimated from the hits | hit-lərə görə təxmini |
| `gtm.th.tag` | Tag | Tag |
| `gtm.th.type` | Type | Növ |
| `gtm.th.trigger` | Trigger | Trigger |
| `gtm.th.status` | Status | Status |
| `gtm.status.fired` | Fired | İşlədi |
| `gtm.status.missing_value` | Missing value | Dəyər yoxdur |
| `gtm.status.no_consent_check` | No consent check | Consent yoxlaması yoxdur |
| `gtm.status.waiting_consent` | Waiting for consent | Consent gözləyir |
| `gtm.status.not_fired` | Not fired yet | Hələ işləməyib |
| `gtm.none` | No GTM container on this page yet. | Bu səhifədə hələ GTM konteyneri yoxdur. |
| `sgtm.title` | Server-side GTM | Server-side GTM |
| `sgtm.detected` | Detected | Tapıldı |
| `sgtm.notDetected` | Not detected | Tapılmadı |
| `sgtm.own_subdomain` | Requests go to the site’s own subdomain | Sorğular saytın öz subdomeninə gedir |
| `sgtm.ga4_path` | Path uses the GA4 format | Yol GA4 formatındadır |
| `sgtm.server_container_url` | Google Tag sets server_container_url | Google Tag server_container_url qurur |
| `sgtm.fpid_cookie` | FPID cookie set by the server | FPID cookie-ni server yazır |
| `sgtm.fpidDays` | HttpOnly, {days} days | HttpOnly, {days} gün |
| `sgtm.notFound` | Not found | Tapılmadı |
| `sgtm.browserOnly.title` | Only {server} goes server-side | Server-side yalnız {server} gedir |
| `sgtm.browserOnly.text` | {browser} still send from the browser. Ad blockers and browser limits can drop part of these events. | {browser} hələ də brauzerdən göndərir. Reklam blokerləri və brauzer limitləri bu eventlərin bir hissəsini itirə bilər. |
| `sgtm.cta.move` | Move {browser} server-side too? | {browser} da server-side-a keçsin? |
| `sgtm.cta.setup` | Want server-side tracking set up? | Server-side tracking qurulsun? |
| `cta.contact` | Get in touch | Əlaqə saxla |
| `ct.title` | Consent Mode v2 | Consent Mode v2 |
| `ct.banner` | Cookie banner | Cookie banneri |
| `ct.found` | Found | Tapıldı |
| `ct.notFound` | Not found | Tapılmadı |
| `ct.choice` | Visitor’s choice | Ziyarətçinin seçimi |
| `ct.choice.reject` | Reject all | Reject all |
| `ct.choice.accept` | Accept all | Accept all |
| `ct.choice.custom` | Custom choice | Fərdi seçim |
| `ct.choice.none` | No choice yet | Hələ seçim yoxdur |
| `ct.th.signal` | Signal | Siqnal |
| `ct.th.default` | Default | Default |
| `ct.th.after` | After choice | Seçimdən sonra |
| `ct.granted` | granted | granted |
| `ct.denied` | denied | denied |
| `ct.notSet` | not set | qurulmayıb |
| `ct.none` | No Consent Mode on this page. Google tags send full hits whatever the visitor chooses. | Bu səhifədə Consent Mode yoxdur. Google tag-ları ziyarətçi nə seçsə də tam hit göndərir. |
| `ct.google.okTitle` | Google tags are set up correctly. | Google tag-ları düzgün qurulub. |
| `ct.google.okText` | GA4 and Google Ads read the signals and send cookieless pings. | GA4 və Google Ads siqnalları oxuyur və cookieless ping göndərir. |
| `ct.google.badTitle` | Google tags do not follow the choice. | Google tag-ları seçimə əməl etmir. |
| `ct.google.badText` | Some GA4 or Google Ads hits carry signals that differ from the visitor’s choice. | Bəzi GA4 və ya Google Ads hit-ləri ziyarətçinin seçimindən fərqli siqnal daşıyır. |
| `ct.before` | Before the choice | Seçimdən əvvəl |
| `ct.session` | This page | Bu səhifə |
| `ct.beforeSub` | Page load, consent defaults applied | Səhifə yükləndi, consent default-ları tətbiq olundu |
| `ct.clicks` | Visitor clicks "{choice}" | Ziyarətçi "{choice}" basır |
| `ct.status.cookieless` | Cookieless ping | Cookieless ping |
| `ct.status.granted` | Consent granted | Consent verilib |
| `ct.status.notLoaded` | Not loaded, correct | Yüklənmədi, düzgündür |
| `ct.noHits` | No tracking requests on this page yet. | Bu səhifədə hələ tracking sorğusu yoxdur. |
| `ct.fix.title` | How to fix | Necə düzəltməli |
| `ct.fix.tags` | In GTM, add "Additional consent checks" to the {tags} tags so they never fire without ad_storage. | GTM-də {tags} tag-larına "Additional consent checks" əlavə et ki, ad_storage olmadan heç vaxt işləməsinlər. |
| `ct.fix.platforms` | In GTM, add "Additional consent checks" to the {platforms} tags so they never fire without ad_storage. | GTM-də {platforms} tag-larına "Additional consent checks" əlavə et ki, ad_storage olmadan heç vaxt işləməsinlər. |
| `ct.cta` | Want a GDPR-ready Consent Mode setup? | GDPR-a hazır Consent Mode quraşdırılsın? |
| `at.title` | Visit path: {n} pages | Ziyarət yolu: {n} səhifə |
| `at.sub` | From the campaign link to the order confirmation | Kampaniya linkindən sifariş təsdiqinə qədər |
| `at.noCampaign` | No campaign link in this session yet | Bu sessiyada hələ kampaniya linki yoxdur |
| `at.kind.landing` | Landing | Landing |
| `at.kind.product` | Product | Məhsul |
| `at.kind.cart` | Cart | Səbət |
| `at.kind.payment` | Payment | Ödəniş |
| `at.kind.confirmation` | Confirmation | Təsdiq |
| `at.kind.page` | Page {n} | Səhifə {n} |
| `at.badge.utmAnd` | UTM and {click} | UTM və {click} |
| `at.badge.gclSaved` | Saved in _gcl_aw | _gcl_aw-da saxlanıb |
| `at.badge.glMissing` | _gl not passed | _gl ötürülmədi |
| `at.badge.referral` | {domain} / referral | {domain} / referral |
| `at.th.param` | Parameter | Parametr |
| `at.cell.present` | present | var |
| `at.cell.inSession` | in session | sessiyada |
| `at.cell.inCookie` | in cookie | cookie-də |
| `at.cell.created` | created | yaradıldı |
| `at.cell.same` | same | eyni |
| `at.cell.lost` | lost | itdi |
| `at.cell.referral` | referral | referral |
| `at.cell.new` | new | yeni |
| `at.cell.none` | none | yoxdur |
| `at.issue.referral.title` | The sale is credited to the payment site, not the ad | Satış reklama yox, ödəniş saytına yazılır |
| `at.issue.referral.text` | Add {host} to "Unwanted referrals" in GA4. If you own the payment page, set up cross-domain measurement. | GA4-də {host} domenini "Unwanted referrals" siyahısına əlavə et. Ödəniş səhifəsi sənindirsə, cross-domain ölçməni qur. |
| `at.issue.break.title` | Campaign parameters are lost on {host} | Kampaniya parametrləri {host} saytında itir |
| `at.issue.break.text` | Links to {host} drop _gl. Set up cross-domain measurement in GA4 for this domain. | {host} keçidləri _gl-i itirir. GA4-də bu domen üçün cross-domain ölçməni qur. |
| `at.allGood` | Campaign parameters survive the whole visit. | Kampaniya parametrləri bütün ziyarət boyu qalır. |
| `at.howTo` | Open the site from a link with UTM parameters or a gclid, then click through to the order to see the path. | Yolu görmək üçün saytı UTM parametrli və ya gclid-li linkdən aç, sonra sifarişə qədər klikləyərək keç. |
| `at.cta` | Want attribution you can trust? | Etibar edə biləcəyin atribusiya istəyirsən? |
| `plan.status.match` | Match | Uyğun |
| `plan.status.missing` | Missing | İtkin |
| `plan.status.wrong` | Wrong parameters | Səhv parametrlər |
| `plan.count.match` | match | uyğun |
| `plan.count.missing` | missing | itkin |
| `plan.count.wrong` | wrong parameters | səhv parametrlər |
| `plan.arrived.same` | Same as plan | Plandakı kimi |
| `plan.arrived.never` | Never arrived in this session | Bu sessiyada heç gəlmədi |
| `plan.arrived.dataLayer` | In the dataLayer, no {platform} event | dataLayer-də var, {platform} eventi yoxdur |
| `plan.arrived.only` | Only {params} arrived | Yalnız {params} gəldi |
| `plan.arrived.missing` | {params} missing | {params} yoxdur |
| `plan.arrived.empty` | {params} arrives empty | {params} boş gəlir |
| `plan.error.empty` | The file is empty. | Fayl boşdur. |
| `plan.error.too_big` | The file is larger than 256 KB. | Fayl 256 KB-dan böyükdür. |
| `plan.error.too_many_rows` | The plan has more than 500 rows. | Planda 500-dən çox sətir var. |
| `plan.error.header` | The first line must be: event,platform,parameters | Birinci sətir belə olmalıdır: event,platform,parameters |
| `plan.error.json` | This JSON is not a list of event, platform and parameters. | Bu JSON event, platform və parameters siyahısı deyil. |
| `plan.error.row.columns` | Line {line}: use 3 columns. | {line}-ci sətir: 3 sütun istifadə et. |
| `plan.error.row.event` | Line {line}: the event name is empty. | {line}-ci sətir: event adı boşdur. |
| `plan.error.row.platform` | Line {line}: platform must be GA4, Meta, TikTok or Google Ads. | {line}-ci sətir: platforma GA4, Meta, TikTok və ya Google Ads olmalıdır. |
| `plan.drop.title` | Drop your tracking plan here | Tracking planını bura at |
| `plan.drop.text` | CSV or JSON. Hitline compares every recorded event with the plan and flags what is missing or wrong. | CSV və ya JSON. Hitline yazılan hər eventi planla müqayisə edir və itkin və ya səhv olanları göstərir. |
| `plan.drop.choose` | Choose file | Fayl seç |
| `plan.back` | Back to the results | Nəticələrə qayıt |
| `plan.format.title` | CSV format | CSV formatı |
| `plan.format.cols` | 3 columns | 3 sütun |
| `plan.format.sample` | Download sample CSV | Nümunə CSV-ni yüklə |
| `plan.draft.title` | No plan yet? | Planın yoxdur? |
| `plan.draft.text` | Hitline can turn the {n} events recorded in this session into a draft plan you edit and save. | Hitline bu sessiyada yazılan {n} eventi redaktə edib saxlaya biləcəyin plan qaralamasına çevirə bilər. |
| `plan.draft.button` | Create plan from this session | Bu sessiyadan plan yarat |
| `plan.local` | The plan stays on this computer and is never uploaded. | Plan bu kompüterdə qalır və heç vaxt yüklənmir. |
| `plan.compared` | Compared with your tracking plan | Tracking planınla müqayisə |
| `plan.event` | {n} event | {n} event |
| `plan.events` | {n} events | {n} event |
| `plan.change` | Change plan | Planı dəyiş |
| `plan.remove` | Remove plan | Planı sil |
| `plan.th.event` | Event | Event |
| `plan.th.platform` | Platform | Platforma |
| `plan.th.params` | Parameters in plan | Plandakı parametrlər |
| `plan.th.arrived` | What arrived | Nə gəldi |
| `plan.th.status` | Status | Status |
| `plan.note` | The plan is stored only on this computer. CSV columns: event, platform, parameters. | Plan yalnız bu kompüterdə saxlanır. CSV sütunları: event, platform, parameters. |
| `report.eyebrow` | Tracking audit | Tracking audit |
| `report.pages` | Pages checked: {pages} | Yoxlanan səhifələr: {pages} |
| `report.summary` | Summary from the toolbar popup, read from the page’s request URLs. | Toolbar popup-dan xülasə, səhifənin sorğu URL-lərindən oxunub. |
| `report.kind.landing` | landing page | landing səhifə |
| `report.kind.product` | product | məhsul |
| `report.kind.cart` | cart | səbət |
| `report.kind.payment` | payment | ödəniş |
| `report.kind.confirmation` | order confirmation | sifariş təsdiqi |
| `report.kind.page` | page | səhifə |
| `report.tile.platforms` | platforms | platforma |
| `report.tile.events` | events | event |
| `report.tile.requests` | requests | sorğu |
| `report.tile.high` | high priority | yüksək prioritet |
| `report.tile.medium` | medium priority | orta prioritet |
| `report.setup` | Setup | Quruluş |
| `report.setup.gtm` | {id}, {n} tags | {id}, {n} tag |
| `report.setup.none` | Not found | Tapılmadı |
| `report.setup.server` | Server-side | Server-side |
| `report.setup.noSgtm` | Not detected | Tapılmadı |
| `report.setup.sgtm` | {server} through {host} | {server} {host} ilə |
| `report.setup.sgtmVia` | GA4 through {host} | GA4 {host} ilə |
| `report.setup.sgtmSplit` | {server} through {host}, {browser} from the browser | {server} {host} ilə, {browser} brauzerdən |
| `report.setup.consentOk` | Correct on Google tags | Google tag-larında düzgündür |
| `report.setup.consentSplit` | Correct on Google tags, missing on {platforms} | Google tag-larında düzgündür, {platforms} tag-larında yoxdur |
| `report.setup.consentGoogleBad` | Google tags do not follow the visitor’s choice | Google tag-ları ziyarətçinin seçiminə əməl etmir |
| `report.setup.planKey` | Tracking plan | Tracking plan |
| `report.setup.plan` | {match} of {total} events match | {total} eventdən {match} uyğundur |
| `report.setup.noPlan` | No plan loaded | Plan yüklənməyib |
| `report.setup.platformsKey` | Platforms | Platformalar |
| `report.setup.fullKey` | Full audit | Tam audit |
| `report.setup.full` | Open DevTools, then the Hitline tab, for events, consent, attribution and your plan | Eventlər, consent, atribusiya və plan üçün DevTools-u, sonra Hitline tabını aç |
| `report.issues` | Issues and fixes | Problemlər və həllər |
| `report.sev.high` | High | Yüksək |
| `report.sev.medium` | Medium | Orta |
| `report.sev.low` | Info | Məlumat |
| `report.i.before.lead` | {platform} fires before consent. | {platform} consent-dən əvvəl işləyir. |
| `report.i.before.text` | Add an ad_storage consent check in GTM. | GTM-də ad_storage consent yoxlaması əlavə et. |
| `report.i.after.lead` | {platform} fires after rejection. | {platform} rədddən sonra işləyir. |
| `report.i.after.same` | The {platform} tag needs the same consent check. | {platform} tag-ına da eyni consent yoxlaması lazımdır. |
| `report.i.referral.lead` | Sales are credited to the payment site. | Satışlar ödəniş saytına yazılır. |
| `report.i.referral.text` | Add {host} to “Unwanted referrals” in GA4. | GA4-də {host} domenini “Unwanted referrals” siyahısına əlavə et. |
| `report.i.break.lead` | Campaign parameters are lost on {host}. | Kampaniya parametrləri {host} saytında itir. |
| `report.i.break.text` | Set up cross-domain measurement in GA4. | GA4-də cross-domain ölçməni qur. |
| `report.i.value.both` | {platform} {event} has no value or currency. | {platform} {event} eventində value və currency yoxdur. |
| `report.i.value.value` | {platform} {event} has no value. | {platform} {event} eventində value yoxdur. |
| `report.i.value.currency` | {platform} {event} has no currency. | {platform} {event} eventində currency yoxdur. |
| `report.i.value.text` | Pass value and currency from the dataLayer to the tag. | value və currency-ni dataLayer-dən tag-a ötür. |
| `report.i.missing.one` | {events} never arrives. | {events} heç gəlmir. |
| `report.i.missing.many` | {events} never arrive. | {events} heç gəlmir. |
| `report.i.missing.text` | Check the GTM triggers for these events. | Bu eventlər üçün GTM trigger-lərini yoxla. |
| `report.i.empty.lead` | {event} has an empty {params}. | {event} eventində {params} boşdur. |
| `report.i.empty.text` | Write the {params} to the dataLayer. | {params} dəyərini dataLayer-ə yaz. |
| `report.i.params.lead` | {event} is sent without {params}. | {event} {params} olmadan göndərilir. |
| `report.i.params.text` | Add {params} to the tag. | {params} parametrini tag-a əlavə et. |
| `report.i.none.lead` | No issues found. | Problem tapılmadı. |
| `report.i.none.text` | Hitline found nothing to fix in this session. | Hitline bu sessiyada düzəldiləcək heç nə tapmadı. |
| `report.cta.title` | Need help fixing these issues? | Bu problemləri düzəltməyə kömək lazımdır? |
| `report.cta.sub` | Shamistan Isayev, analytics and server-side tracking | Şəmistan İsayev, analitika və server-side tracking |
| `report.footer` | Made with Hitline. No data left the browser. | Hitline ilə hazırlanıb. Heç bir məlumat brauzerdən çıxmadı. |
| `report.page` | Page {i} of {n} | Səhifə {i} / {n} |
| `report.error` | The PDF could not be created. Please try again. | PDF yaradılmadı. Yenə yoxla. |
| `welcome.title` | Hitline is ready. | Hitline hazırdır. |
| `welcome.accent` | Every hit, in plain sight. | Hər hit göz önündə. |
| `welcome.lead` | Three steps and you will see every event your site sends, where it goes and whether it respects consent. | Üç addım və saytının göndərdiyi hər eventi, hara getdiyini və consent-ə əməl edib-etmədiyini görəcəksən. |
| `welcome.free` | Free | Pulsuz |
| `welcome.noAccount` | No account | Hesab lazım deyil |
| `welcome.local` | Nothing leaves your browser | Heç nə brauzerdən çıxmır |
| `welcome.s1.title` | Pin Hitline to the toolbar | Hitline-ı toolbar-a sanc |
| `welcome.s1.text` | Click the puzzle icon next to the address bar and pin Hitline. | Ünvan sətrinin yanındakı tapmaca ikonuna bas və Hitline-ı sanc. |
| `welcome.s2.title` | Open any site, click the icon | İstənilən saytı aç, ikona bas |
| `welcome.s2.text` | The popup shows platforms, server-side status and the top issues. | Popup platformaları, server-side statusunu və əsas problemləri göstərir. |
| `welcome.s3.title` | Press {key} and choose the Hitline tab | {key} bas və Hitline tabını seç |
| `welcome.s3.text` | Events, GTM, consent, attribution and your tracking plan, live. | Eventlər, GTM, consent, atribusiya və tracking planın, canlı. |
| `welcome.built` | Built by Shamistan Isayev | Müəllif: Şəmistan İsayev |
| `welcome.contact` | Need a tracking setup? Get in touch | Tracking quruluşu lazımdır? Əlaqə saxla |

## Sayt: /hitline landing və /hitline/uninstalled (addım 3B)

Fayl: `apps/site/src/content/hitline/az.json`. Səhifə: getlineapps.com/az/hitline və /az/hitline/uninstalled.

Qeydlər:
- "Audit PDF" bölməsindəki kağız nümunəsi (paper) ingiliscə qalır, çünki nümunə PDF ingiliscədir.
- "Reject all", "gclid", "value" kimi düymə və parametr adları tərcümə olunmur.
- Hero başlığı: "Tracking-in işləyir? Sübut et, bir paneldə." Yaşıl hissə "Sübut et," sözüdür.

| Açar | English | Azərbaycanca |
|---|---|---|
| `meta.title` | Hitline: Free Tracking Debugger for GA4, Meta, TikTok & More | Hitline: GA4, Meta, TikTok və s. üçün pulsuz tracking debugger |
| `meta.description` | Free Chrome extension. See every GA4, Google Ads, Meta and TikTok event, spot server-side GTM and catch consent leaks inside Chrome DevTools. | Pulsuz Chrome extension. GA4, Google Ads, Meta və TikTok eventlərinin hamısını gör, server-side GTM-i tap və consent sızmalarını Chrome DevTools-un içində tut. |
| `meta.ogAlt` | Hitline: is your tracking working? Prove it in one panel. | Hitline: tracking-in işləyir? Bir paneldə sübut et. |
| `nav.label` | Hitline sections | Hitline bölmələri |
| `nav.features` | Features | İmkanlar |
| `nav.how` | How it works | Necə işləyir |
| `nav.privacy` | Privacy | Məxfilik |
| `nav.faq` | FAQ | Suallar |
| `add.nav` | Add to Chrome | Chrome-a əlavə et |
| `add.hero` | Add to Chrome, it's free | Chrome-a əlavə et, pulsuzdur |
| `add.soonNav` | Coming soon | Tezliklə |
| `add.soonHero` | Coming soon to Chrome | Tezliklə Chrome-da |
| `sample.eyebrow` | Sample audit | Nümunə audit |
| `sample.title` | example.com, made with Hitline in one click | example.com, Hitline ilə bir kliklə hazırlanıb |
| `sample.note` | Real report layout. No data left the browser. | Hesabatın əsl görünüşü. Heç bir məlumat brauzerdən çıxmadı. |
| `sample.download` | Download sample PDF | Nümunə PDF-i yüklə |
| `sample.close` | Close sample audit | Nümunə auditi bağla |
| `hero.pill` | Free Chrome extension | Pulsuz Chrome extension |
| `hero.titleStart` | Is your tracking working? | Tracking-in işləyir? |
| `hero.titleHighlight` | Prove it | Sübut et, |
| `hero.titleEnd` | in one panel. | bir paneldə. |
| `hero.lead` | See every GA4, Google Ads, Meta and TikTok event, spot server-side GTM and catch consent leaks, right inside Chrome DevTools. | GA4, Google Ads, Meta və TikTok eventlərinin hamısını gör, server-side GTM-i tap və consent sızmalarını elə Chrome DevTools-un içində tut. |
| `hero.secondary` | See a sample audit | Nümunə auditə bax |
| `hero.trust.0` | No account | Hesab lazım deyil |
| `hero.trust.1` | Nothing leaves your browser | Heç nə brauzerdən çıxmır |
| `hero.trust.2` | Open source | Açıq mənbə |
| `hero.tabs.0.label` | Events | Eventlər |
| `hero.tabs.3.label` | Attribution | Atribusiya |
| `hero.live` | Live | Canlı |
| `hero.routes.browser` | Browser | Brauzer |
| `hero.routes.page` | Page | Səhifə |
| `hero.routes.bad` | No value | Dəyər yoxdur |
| `hero.sgtmVia` | via data.example.com | data.example.com ilə |
| `hero.tags` | 4 tags | 4 tag |
| `hero.issueLabel` | Issue found | Problem tapıldı |
| `hero.issueText` | Meta AddToCart is sent without a value | Meta AddToCart dəyərsiz göndərilir |
| `marquee.title` | Reads the tags you already use | Artıq istifadə etdiyin tag-ları oxuyur |
| `problem.eyebrow` | The problem | Problem |
| `problem.title` | Most tracking bugs are silent. | Tracking xətalarının çoxu səssizdir. |
| `problem.lead` | The budget keeps spending on numbers that are wrong. | Büdcə səhv rəqəmlərə xərclənməyə davam edir. |
| `problem.cards.0.title` | Events without values | Dəyərsiz eventlər |
| `problem.cards.0.text` | The pixel fires, the dashboard looks fine, and the ad platform never learns what a cart was worth. | Pixel işləyir, dashboard qaydasında görünür, reklam platforması isə səbətin nə qədər dəyərli olduğunu heç vaxt öyrənmir. |
| `problem.cards.1.title` | Pixels that ignore consent | Consent-ə məhəl qoymayan pixel-lər |
| `problem.cards.1.text` | A visitor clicks "Reject all" and a pixel fires anyway. Nobody notices until a regulator or a client does. | Ziyarətçi "Reject all" basır, pixel yenə işləyir. Regulator və ya müştəri görənə qədər heç kim fərq etmir. |
| `problem.cards.2.title` | Sales credited to the wrong source | Satış səhv mənbəyə yazılır |
| `problem.cards.2.text` | A payment page on another domain drops the click ID, and paid traffic shows up as a referral. | Başqa domendəki ödəniş səhifəsi klik ID-ni itirir və ödənişli trafik referral kimi görünür. |
| `features.eyebrow` | Inside the panel | Panelin içi |
| `features.title` | Five views. One question: can you trust the numbers? | Beş görünüş. Bir sual: rəqəmlərə inanmaq olar? |
| `features.tabsLabel` | Hitline views | Hitline görünüşləri |
| `features.events.label` | Events | Eventlər |
| `features.events.eyebrow` | Event inspector | Event inspektoru |
| `features.events.title` | Every event, every parameter, every platform side by side. | Hər event, hər parametr, hər platforma yan-yana. |
| `features.events.lead` | Hitline reads the requests GA4, Google Ads, Meta and TikTok send, plus every dataLayer push. | Hitline GA4, Google Ads, Meta və TikTok-un göndərdiyi sorğuları və hər dataLayer push-u oxuyur. |
| `features.events.bullets.0` | One click, all platforms on the same row | Bir klik, bütün platformalar eyni sətirdə |
| `features.events.bullets.1` | Every parameter decoded, no query strings to read | Hər parametr açılıb, query string oxumağa ehtiyac yoxdur |
| `features.events.bullets.2` | Missing values flagged the moment they happen | Çatışmayan dəyərlər elə o an qeyd olunur |
| `features.events.demo.via` | via sGTM | sGTM ilə |
| `features.events.demo.issueText` | on the same click has no value. | eyni klikdə dəyərsiz gedir. |
| `features.gtm.label` | GTM and sGTM | GTM və sGTM |
| `features.gtm.eyebrow` | GTM and server-side | GTM və server-side |
| `features.gtm.title` | Know if a site runs server-side GTM, with the proof. | Saytın server-side GTM işlətdiyini sübutla bil. |
| `features.gtm.lead` | Most tools miss requests that go to a site's own subdomain. Hitline checks four signals and lists every GTM tag with its status. | Alətlərin çoxu saytın öz subdomeninə gedən sorğuları görmür. Hitline dörd siqnalı yoxlayır və hər GTM tag-ını statusu ilə göstərir. |
| `features.gtm.bullets.0` | Four independent signals, not a guess | Dörd müstəqil siqnal, təxmin yox |
| `features.gtm.bullets.1` | Every tag with type, trigger and status | Hər tag növü, trigger-i və statusu ilə |
| `features.gtm.bullets.2` | See which platforms still send from the browser | Hansı platformaların hələ brauzerdən göndərdiyini gör |
| `features.gtm.demo.detected` | Detected | Tapıldı |
| `features.gtm.demo.signals.0` | Requests go to data.example.com | Sorğular data.example.com-a gedir |
| `features.gtm.demo.signals.1` | Path uses the GA4 format | Yol GA4 formatındadır |
| `features.gtm.demo.signals.2` | server_container_url is set | server_container_url qurulub |
| `features.gtm.demo.signals.3` | FPID cookie set by the server | FPID cookie-ni server yazır |
| `features.consent.eyebrow` | Consent check | Consent yoxlaması |
| `features.consent.title` | Click "Reject all" and see who keeps firing. | "Reject all" bas və kimin işləməyə davam etdiyini gör. |
| `features.consent.lead` | Hitline reads Consent Mode v2 signals and splits requests into before and after the visitor's choice. | Hitline Consent Mode v2 siqnallarını oxuyur və sorğuları ziyarətçinin seçimindən əvvəl və sonra deyə ayırır. |
| `features.consent.bullets.0` | Default and updated signals side by side | Default və yenilənmiş siqnallar yan-yana |
| `features.consent.bullets.1` | Leaks marked in red, with the GTM fix next to them | Sızmalar qırmızı ilə, yanında GTM həlli |
| `features.consent.bullets.2` | Cookieless pings told apart from real hits | Cookieless ping-lər əsl hit-lərdən ayrılır |
| `features.consent.demo.title` | After "Reject all" | "Reject all"-dan sonra |
| `features.consent.demo.count` | 3 requests | 3 sorğu |
| `features.consent.demo.rows.1.status` | Sent after rejection | Rədddən sonra getdi |
| `features.consent.demo.rows.2.status` | Not loaded | Yüklənmədi |
| `features.attribution.label` | Attribution | Atribusiya |
| `features.attribution.eyebrow` | Attribution path | Atribusiya yolu |
| `features.attribution.title` | Follow UTM and gclid page by page. | UTM və gclid-i səhifə-səhifə izlə. |
| `features.attribution.lead` | See exactly where campaign parameters get lost, from the ad click to the order confirmation. | Kampaniya parametrlərinin reklam klikindən sifariş təsdiqinə qədər harada itdiyini dəqiq gör. |
| `features.attribution.bullets.0` | UTM, gclid and fbclid tracked across pages | UTM, gclid və fbclid səhifələr boyu izlənir |
| `features.attribution.bullets.1` | Cross-domain breaks found automatically | Cross-domain qırılmaları avtomatik tapılır |
| `features.attribution.bullets.2` | The GA4 setting that fixes it, named | Düzəldən GA4 ayarının adı göstərilir |
| `features.attribution.demo.steps.1` | Product | Məhsul |
| `features.attribution.demo.steps.2` | Cart | Səbət |
| `features.attribution.demo.steps.3` | Payment | Ödəniş |
| `features.attribution.demo.steps.4` | Confirmation | Təsdiq |
| `features.attribution.demo.rows.0.cells.0.v` | yes | var |
| `features.attribution.demo.rows.0.cells.1.v` | yes | var |
| `features.attribution.demo.rows.0.cells.2.v` | yes | var |
| `features.attribution.demo.rows.0.cells.3.v` | lost | itdi |
| `features.attribution.demo.rows.0.cells.4.v` | yes | var |
| `features.attribution.demo.rows.1.cells.3.v` | lost | itdi |
| `features.plan.eyebrow` | Tracking plan check | Tracking plan yoxlaması |
| `features.plan.title` | Your plan against what the site really sends. | Planın saytın əslində göndərdiyinə qarşı. |
| `features.plan.lead` | Load your plan as CSV. Hitline flags missing events and wrong parameters as you click through. | Planını CSV kimi yüklə. Sən saytda klikləyərkən Hitline itkin eventləri və səhv parametrləri qeyd edir. |
| `features.plan.bullets.0` | CSV or JSON, three columns | CSV və ya JSON, üç sütun |
| `features.plan.bullets.1` | Missing events and wrong parameters, live | İtkin eventlər və səhv parametrlər, canlı |
| `features.plan.bullets.2` | No plan yet? Draft one from your session | Planın yoxdur? Sessiyandan qaralama çıxar |
| `features.plan.demo.count` | 8 events | 8 event |
| `features.plan.demo.bars.0.label` | Match | Uyğun |
| `features.plan.demo.bars.1.label` | Missing | İtkin |
| `features.plan.demo.bars.2.label` | Wrong parameters | Səhv parametrlər |
| `features.plan.demo.rows.0.status` | Missing | İtkin |
| `features.plan.demo.rows.1.status` | Wrong parameters | Səhv parametrlər |
| `how.eyebrow` | How it works | Necə işləyir |
| `how.title` | Three steps, no setup. | Üç addım, quraşdırma yoxdur. |
| `how.steps.0.title` | Add Hitline to Chrome | Hitline-ı Chrome-a əlavə et |
| `how.steps.0.text` | Free from the Chrome Web Store. No account to create. | Chrome Web Store-dan pulsuz. Hesab açmaq lazım deyil. |
| `how.steps.1.title` | Open a site, click the icon | Sayt aç, ikona bas |
| `how.steps.1.text` | The popup shows platforms, server-side status and the top issues. | Popup platformaları, server-side statusunu və əsas problemləri göstərir. |
| `how.steps.2.title` | Press | Tam mənzərə üçün |
| `how.steps.2.titleEnd` | for the full picture | bas |
| `how.steps.2.text` | The Hitline tab in DevTools records every event live as you browse. | DevTools-dakı Hitline tabı sən gəzdikcə hər eventi canlı yazır. |
| `audit.titleStart` | Found something broken? | Nəsə xarab çıxdı? |
| `audit.titleHighlight` | Get it fixed | Düzəlt |
| `audit.titleEnd` | by the person who built Hitline. | Hitline-ı quran adamın əli ilə. |
| `audit.lead` | One click turns the findings into a prioritized report. Send it to a developer, or send it to me: I set up GA4, server-side GTM, Consent Mode and ad pixels for growing brands. | Bir klik tapıntıları prioritetli hesabata çevirir. Onu developerə göndər və ya mənə: böyüyən brendlər üçün GA4, server-side GTM, Consent Mode və reklam pixel-lərini qururam. |
| `audit.cta` | Book a tracking audit | Tracking üçün audit istə |
| `audit.from` | From | Müəllif: |
| `privacy.eyebrow` | Privacy | Məxfilik |
| `privacy.title` | Your data never leaves your browser. | Məlumatın heç vaxt brauzerdən çıxmır. |
| `privacy.items.0.title` | No server | Server yoxdur |
| `privacy.items.0.text` | All analysis runs inside Chrome. Hitline makes no requests of its own. | Bütün analiz Chrome-un içində gedir. Hitline öz adından heç bir sorğu göndərmir. |
| `privacy.items.1.title` | Minimal permissions | Minimum icazə |
| `privacy.items.1.text` | DevTools panel, active tab and local storage. No access to all your sites. | DevTools paneli, aktiv tab və lokal yaddaş. Bütün saytlarına giriş yoxdur. |
| `privacy.items.2.title` | No analytics inside | İçində analitika yoxdur |
| `privacy.items.2.text` | The extension doesn't track you. Results disappear when you close the tab. | Extension səni izləmir. Tabı bağlayanda nəticələr yox olur. |
| `privacy.items.3.title` | Open source | Açıq mənbə |
| `privacy.items.3.text` | Read the code and check every claim on this page for yourself. | Kodu oxu və bu səhifədəki hər iddianı özün yoxla. |
| `faq.eyebrow` | FAQ | Suallar |
| `faq.title` | Questions | Suallar |
| `faq.askBefore` | Something else? | Başqa sualın var? |
| `faq.askLink` | Ask me directly | Birbaşa məndən soruş |
| `faq.items.0.q` | Is Hitline really free? | Hitline doğrudan pulsuzdur? |
| `faq.items.0.a` | Yes. There is no paid plan, no account and no usage limit. | Bəli. Pullu plan, hesab və istifadə limiti yoxdur. |
| `faq.items.1.q` | Does it send my data anywhere? | Məlumatımı haraya isə göndərir? |
| `faq.items.1.a` | No. Everything is analyzed in your browser. Only your settings are saved, and only on your computer. | Xeyr. Hər şey brauzerində analiz olunur. Yalnız ayarların saxlanılır, o da yalnız sənin kompüterində. |
| `faq.items.2.q` | How does it detect server-side GTM? | Server-side GTM-i necə tapır? |
| `faq.items.2.a` | It checks where GA4 requests go, the request path, the server_container_url setting and cookies set by the server. | GA4 sorğularının haraya getdiyini, sorğunun yolunu, server_container_url ayarını və serverin yazdığı cookie-ləri yoxlayır. |
| `faq.items.3.q` | How is it different from Tag Assistant? | Tag Assistant-dan fərqi nədir? |
| `faq.items.3.a` | Tag Assistant focuses on Google tags. Hitline shows Google, Meta and TikTok side by side, checks consent and attribution, and compares events with your tracking plan. | Tag Assistant Google tag-larına fokuslanır. Hitline Google, Meta və TikTok-u yan-yana göstərir, consent və atribusiyanı yoxlayır və eventləri tracking planınla müqayisə edir. |
| `faq.items.4.q` | Do I need DevTools open? | DevTools açıq olmalıdır? |
| `faq.items.4.a` | The popup works without it. For the live event stream, open DevTools before the page loads, or reload once. | Popup onsuz da işləyir. Canlı event axını üçün DevTools-u səhifə yüklənmədən əvvəl aç və ya bir dəfə yenilə. |
| `more.eyebrow` | The Line family | Line ailəsi |
| `more.title` | More free tools from the same family | Eyni ailədən daha çox pulsuz alət |
| `more.tools.serpline.text` | Technical SEO and AI search checks for any page. | İstənilən səhifə üçün texniki SEO və AI axtarış yoxlamaları. |
| `more.tools.serpline.open` | Open Serpline | Serpline-ı aç |
| `more.tools.rivaline.text` | A competitor's stack, ads and brand style in one panel. | Rəqibin texnologiyaları, reklamları və brend stili bir paneldə. |
| `more.tools.rivaline.open` | Open Rivaline | Rivaline-ı aç |
| `more.tools.foldline.text` | Find what stops a landing page from converting. | Landing səhifəsinin konversiyasına nəyin mane olduğunu tap. |
| `more.tools.foldline.open` | Open Foldline | Foldline-ı aç |
| `more.tools.markline.text` | Screenshot, mark up and share feedback in seconds. | Saniyələr içində ekran şəkli çək, qeyd et və rəy paylaş. |
| `more.tools.markline.open` | Open Markline | Markline-ı aç |
| `footer.builtBy` | Built by | Müəllif: |
| `footer.privacy` | Privacy policy | Məxfilik siyasəti |
| `footer.source` | Source code | Mənbə kodu |
| `uninstall.meta.title` | Sorry to see you go | Hitline | Getməyinə təəssüf edirik | Hitline |
| `uninstall.meta.description` | Tell us why you removed Hitline. One click helps make the next version better. | Hitline-ı niyə sildiyini yaz. Bir klik növbəti versiyanı daha yaxşı edir. |
| `uninstall.titleStart` | Hitline is removed. | Hitline silindi. |
| `uninstall.titleEnd` | What made you leave? | Niyə getdin? |
| `uninstall.lead` | One click helps make the next version better. | Bir klik növbəti versiyanı daha yaxşı edir. |
| `uninstall.reasonsLabel` | Reason | Səbəb |
| `uninstall.reasons.0` | It didn't detect my setup | Mənim quruluşumu tanımadı |
| `uninstall.reasons.1` | I only needed it once | Cəmi bir dəfə lazım idi |
| `uninstall.reasons.2` | Too hard to understand | Başa düşmək çətindir |
| `uninstall.reasons.3` | I use another tool | Başqa alətdən istifadə edirəm |
| `uninstall.moreLabel` | Anything else? | Başqa nəsə? |
| `uninstall.optional` | (optional) | (istəyə bağlı) |
| `uninstall.placeholder` | Which site or setup did it miss? | Hansı saytı və ya quruluşu buraxdı? |
| `uninstall.send` | Send feedback | Rəyi göndər |
| `uninstall.sending` | Sending... | Göndərilir... |
| `uninstall.thanks` | Thank you. Your feedback was sent. | Təşəkkürlər. Rəyin göndərildi. |
| `uninstall.error` | Sending failed. Please try again in a minute. | Göndərmək alınmadı. Bir dəqiqədən sonra yenə yoxla. |
| `uninstall.pickOne` | Pick a reason or write a few words. | Bir səbəb seç və ya bir neçə söz yaz. |
| `uninstall.reinstall` | Reinstall Hitline | Hitline-ı yenidən quraşdır |
| `uninstall.card.eyebrow` | Still have a tracking problem? | Tracking problemin hələ də var? |
| `uninstall.card.title` | I can audit and fix it for you. | Auditini edib düzəldə bilərəm. |
| `uninstall.card.text` | GA4, server-side GTM, Consent Mode and ad pixels. You get a clear list of what is broken and a working setup. | GA4, server-side GTM, Consent Mode və reklam pixel-ləri. Nəyin xarab olduğunun aydın siyahısını və işləyən quruluş alırsan. |
| `uninstall.card.cta` | Book a tracking audit | Tracking üçün audit istə |
| `uninstall.card.sub` | Shamistan Isayev | Şəmistan İsayev |

## 1.1 yenilikləri (2026-11-11)

Extension-da yeni mətnlər. Fayl: `apps/hitline/extension/src/i18n/az.ts`.

| Açar | English | Azərbaycanca |
|---|---|---|
| `panel.loading` | Reading the page... | Səhifə oxunur... |
| `panel.loading.host` | Reading {host}... | {host} oxunur... |
| `panel.empty.textHost` | DevTools only sees what {host} sends while it is open. Reload once to record everything from the start, including page_view and consent defaults. | DevTools yalnız açıq olduğu vaxt {host} saytının göndərdiklərini görür. Hər şeyi əvvəldən yazmaq üçün səhifəni bir dəfə yenilə, page_view və consent defaultları da daxil olmaqla. |
| `panel.empty.listening` | Listening. New events appear here as soon as the page sends them. | Dinləyir. Yeni eventlər səhifə onları göndərən kimi burada görünəcək. |
| `panel.empty.paused` | Recording is paused. Click "Paused" to continue. | Yazma dayandırılıb. Davam etmək üçün "Dayandırılıb" düyməsinə bas. |
| `panel.empty.more` | and {n} more, {total} platforms in total: | və daha {n}, cəmi {total} platforma: |
| `panel.late` | This page loaded before DevTools was opened, so requests sent on load are missing. Reload to record everything. | Bu səhifə DevTools açılmadan əvvəl yüklənib, ona görə yüklənmə zamanı göndərilən sorğular yoxdur. Hamısını yazmaq üçün səhifəni yenilə. |
| `panel.paused` | Paused | Dayandırılıb |
| `panel.pauseHint` | Pause recording | Yazmanı dayandır |
| `panel.resumeHint` | Continue recording | Yazmanı davam etdir |
| `panel.pdfBusy` | Making PDF... | PDF hazırlanır... |
| `panel.sites` | {n} sites | {n} sayt |
| `events.newOne` | {n} new event | {n} yeni event |
| `events.newMany` | {n} new events | {n} yeni event |
| `events.sort.newest` | Newest first. Click for oldest first. | Əvvəlcə ən yenilər. Köhnələri əvvəl görmək üçün kliklə. |
| `events.sort.oldest` | Oldest first. Click for newest first. | Əvvəlcə ən köhnələr. Yeniləri əvvəl görmək üçün kliklə. |
| `events.approx` | Estimated time: this dataLayer push happened before Hitline started recording. | Təxmini vaxt: bu dataLayer push Hitline yazmağa başlamazdan əvvəl olub. |
| `status.other` | Possible tracking | İzləməyə oxşayır |
| `status.pii` | Personal data | Şəxsi məlumat |
| `status.duplicate` | Sent twice | İki dəfə göndərilib |
| `status.noId` | No order ID | Sifariş ID yoxdur |
| `detail.account` | ID | ID |
| `detail.page` | Page | Səhifə |
| `detail.context` | Page and visitor | Səhifə və ziyarətçi |
| `detail.copy` | Copy the request URL | Sorğu URL-ni kopyala |
| `detail.copied` | Copied | Kopyalandı |
| `detail.empty` | empty | boş |
| `detail.alsoSent` | The same event was also sent to {hosts}. That is normal for this platform and counts once. | Eyni event {hosts} ünvanına da göndərilib. Bu platforma üçün normaldır və bir dəfə sayılır. |
| `detail.otherNote` | Hitline does not know this service. The request looks like tracking. Add a custom platform in Settings to name it. | Hitline bu servisi tanımır. Sorğu izləməyə oxşayır. Ona ad vermək üçün Ayarlarda öz platformanı əlavə et. |
| `gtm.containers` | GTM containers on this page | Bu səhifədəki GTM konteynerləri |
| `gtm.view` | Show tags or events | Taglər və ya eventlər |
| `gtm.events` | Events | Eventlər |
| `gtm.events.list` | dataLayer events | dataLayer eventləri |
| `gtm.events.none` | No dataLayer events on this page yet. | Bu səhifədə hələ dataLayer eventi yoxdur. |
| `gtm.events.tags` | {n} tags | {n} tag |
| `gtm.events.fired` | Tags for this event | Bu event üçün taglər |
| `gtm.events.noTags` | No tag fires on this event. | Bu eventdə heç bir tag işləmir. |
| `gtm.events.seen` | Request seen | Sorğu görünüb |
| `gtm.events.inPage` | Runs in the page | Səhifənin içində işləyir |
| `gtm.events.noRequest` | No request seen | Sorğu görünməyib |
| `gtm.events.maybe` | Depends on a value Hitline cannot read | Hitline-ın oxuya bilmədiyi dəyərdən asılıdır |
| `gtm.noTags` | This container has no tags. | Bu konteynerdə tag yoxdur. |
| `gtm.estimatedNote` | Hitline could not read this container, so the list is built from the requests. Reload the page with DevTools open to see every tag and trigger. | Hitline bu konteyneri oxuya bilmədi, siyahı sorğulardan qurulub. Bütün tag və triggerləri görmək üçün DevTools açıq ikən səhifəni yenilə. |
| `gtm.status.triggered` | Triggered | İşə düşüb |
| `gtm.more.trigger` | Fires on | Nə vaxt işləyir |
| `gtm.more.blocking` | Exceptions | İstisnalar |
| `gtm.more.consent` | Consent checks | Consent yoxlamaları |
| `gtm.more.noConsent` | None | Yoxdur |
| `gtm.more.requests` | Requests | Sorğular |
| `gtm.more.sent` | {n} seen in this session | Bu sessiyada {n} görünüb |
| `gtm.more.silent` | Works inside the page without a request of its own | Öz sorğusu olmadan səhifənin içində işləyir |
| `issue.pii.title` | {platform} receives an e-mail address in {field} | {platform} {field} sahəsində e-poçt ünvanı alır |
| `issue.pii.fix` | Remove personal data from URLs and event parameters, or send it hashed where the platform supports it. | Şəxsi məlumatı URL və event parametrlərindən çıxar və ya platforma dəstəkləyirsə hash ilə göndər. |
| `issue.dup.title` | {platform} {event} is sent twice for one action | {platform} {event} bir hərəkət üçün iki dəfə göndərilir |
| `issue.dup.fix` | Check GTM for two tags or two triggers that send this event, and keep one. | GTM-də bu eventi göndərən iki tag və ya iki trigger olub-olmadığını yoxla və birini saxla. |
| `issue.noId.title` | GA4 purchase is sent without transaction_id | GA4 purchase transaction_id olmadan göndərilir |
| `issue.noId.fix` | Add transaction_id from the order number to the purchase event. | Purchase eventinə sifariş nömrəsindən transaction_id əlavə et. |
| `issue.multi.title` | Data goes to {ids} | Məlumat {ids} ünvanlarına gedir |
| `issue.multi.fix` | Make sure every GA4 property here is meant to receive this site’s data. | Buradakı hər GA4 property-nin bu saytın məlumatını almalı olduğuna əmin ol. |
| `why.consent` | Personal data is sent without the visitor’s permission, which breaks GDPR. | Şəxsi məlumat ziyarətçinin icazəsi olmadan göndərilir, bu GDPR-ı pozur. |
| `why.referral` | Sales are credited to the payment site instead of the ad that brought the visitor. | Satışlar ziyarətçini gətirən reklama deyil, ödəniş saytına yazılır. |
| `why.break` | The visit splits in two and the campaign loses the sale. | Ziyarət ikiyə bölünür və kampaniya satışı itirir. |
| `why.value` | The ad platform cannot optimize for value or report revenue. | Reklam platforması dəyərə görə optimizasiya edə və gəliri göstərə bilmir. |
| `why.plan` | Reports and audiences that need this event stay empty. | Bu eventə ehtiyacı olan hesabatlar və auditoriyalar boş qalır. |
| `why.pii` | Ad and analytics platforms forbid personal data and may suspend the account. | Reklam və analitika platformaları şəxsi məlumatı qadağan edir və hesabı dayandıra bilər. |
| `why.dup` | Every action is counted twice, so reports and ad optimization are wrong. | Hər hərəkət iki dəfə sayılır, hesabatlar və reklam optimizasiyası səhv olur. |
| `why.noId` | GA4 cannot remove repeated purchases, so revenue can be counted twice. | GA4 təkrar alışları silə bilmir, gəlir iki dəfə sayıla bilər. |
| `why.multi` | Often on purpose, but an old or wrong property also receives data. | Çox vaxt qəsdəndir, amma köhnə və ya səhv property də məlumat alır. |
| `popup.unknownEvent` | (name in request body) | (ad sorğu gövdəsində) |
| `popup.live` | Live | Canlı |
| `popup.refresh` | Read the page again | Səhifəni yenidən oxu |
| `popup.newEvents` | +{n} new | +{n} yeni |
| `popup.tile.loaded` | Loaded | Yüklənib |
| `popup.recent` | Latest events | Son eventlər |
| `popup.moreEvents` | and {n} more in DevTools | və daha {n} DevTools-da |
| `popup.noUrlParams` | This request carries its data in the body. DevTools shows all of it. | Bu sorğu məlumatını gövdədə daşıyır. DevTools hamısını göstərir. |
| `popup.showInDevtools` | Show in DevTools | DevTools-da göstər |
| `popup.openDevtools` | Open in DevTools | DevTools-da aç |
| `popup.bufferFull` | Chrome lists only the first 250 requests of a page, so later events may be missing here. DevTools sees all of them. | Chrome səhifənin yalnız ilk 250 sorğusunu siyahıya alır, ona görə sonrakı eventlər burada olmaya bilər. DevTools hamısını görür. |
| `popup.guide.title` | Chrome does not let extensions open DevTools, so: | Chrome extension-ların DevTools açmasına icazə vermir, ona görə: |
| `popup.guide.s1` | Press | Bas |
| `popup.guide.or` | or | və ya |
| `popup.guide.s2` | Choose the Hitline tab (behind » if it is hidden). It opens on what you clicked. | Hitline tabını seç (gizlidirsə » işarəsinin arxasındadır). Kliklədiyin şeydə açılacaq. |
| `popup.guide.note` | DevTools remembers the last tab, so next time it opens on Hitline. | DevTools son tabı yadda saxlayır, növbəti dəfə Hitline-da açılacaq. |
| `popup.guide.ok` | Got it | Aydındır |
| `popup.moved.title` | This tab moved to another site | Bu tab başqa sayta keçib |
| `popup.moved.text` | Click the Hitline icon again to read the new page. | Yeni səhifəni oxumaq üçün Hitline ikonuna yenidən kliklə. |
| `popup.empty.platforms` | 50 platforms | 50 platforma |
| `popup.empty.later` | Tags that wait for a click or for consent show up once they fire. Accept cookies or click around, the popup updates by itself. | Klik və ya consent gözləyən taglər işə düşəndə görünür. Cookie-ləri qəbul et və ya saytda gəz, popup özü yenilənir. |
| `settings.rules` | Custom platforms | Öz platformaların |
| `settings.rulesHint` | For a service Hitline does not know: requests whose URL contains this text are shown as its events. | Hitline-ın tanımadığı servis üçün: URL-də bu mətn olan sorğular onun eventləri kimi göstərilir. |
| `settings.ruleName` | Name | Ad |
| `settings.ruleMatch` | URL contains | URL-də var |
| `settings.ruleField` | Event name field (optional) | Event adı sahəsi (istəyə bağlı) |
| `settings.ruleEvent` | event from {field} | event {field} sahəsindən |
| `settings.ruleInvalid` | Enter a name and at least 3 characters of the URL. | Ad və URL-dən ən azı 3 simvol yaz. |
| `settings.addRule` | + Add custom platform | + Platforma əlavə et |
| `settings.removeRule` | Remove {name} | {name} sil |
| `report.pageOne` | Page checked: {pages} | Yoxlanılan səhifə: {pages} |
| `report.pagesN` | Pages checked ({n}): {pages} | Yoxlanılan səhifələr ({n}): {pages} |
| `report.seen` | Seen at {time}. | {time} görünüb. |
| `report.seenMany` | Seen {n} times, first at {time}. | {n} dəfə görünüb, ilk dəfə {time}. |
| `report.moreRows` | And {n} more rows in the Hitline panel. | Daha {n} sətir Hitline panelindədir. |
| `report.platforms` | Platforms and IDs | Platformalar və ID-lər |
| `report.events` | Events | Eventlər |
| `report.gtmTags` | GTM tags in {id} | {id} içindəki GTM tagləri |
| `report.consentTimeline` | Consent timeline | Consent zaman xətti |
| `report.path` | Visit path | Ziyarət yolu |
| `report.path.campaign` | Campaign link | Kampaniya linki |
| `report.path.ok` | Parameters kept | Parametrlər qorunub |
| `report.loadedOnly` | loaded | yüklənib |
| `report.th.platform` | Platform | Platforma |
| `report.th.ids` | IDs | ID-lər |
| `report.th.events` | Events | Eventlər |
| `report.th.route` | Sends from | Haradan gedir |
| `report.th.event` | Event | Event |
| `report.th.count` | Count | Say |
| `report.th.params` | Parameters | Parametrlər |
| `report.th.time` | Time | Vaxt |
| `report.th.status` | Status | Status |
| `report.th.page` | Page | Səhifə |
| `report.th.finding` | Finding | Nəticə |
| `report.setup.ga4Key` | GA4 properties | GA4 property-ləri |
| `report.setup.cmpKey` | Cookie banner | Cookie banneri |
| `report.setup.noConsent` | Not set up: Google tags send full hits whatever the visitor chooses | Qurulmayıb: Google tagləri ziyarətçinin seçimindən asılı olmayaraq tam hit göndərir |
| `report.setup.limitKey` | Note | Qeyd |
| `report.summary` | Summary from the toolbar popup for {page}, read from the request URLs. DevTools shows bodies, consent and attribution too. | {page} üçün toolbar popup-dan xülasə, sorğu URL-lərindən oxunub. DevTools gövdələri, consenti və atribusiyanı da göstərir. |
| `popup.empty.text` | Hitline checks 50 analytics, ad, CRM and testing platforms and found none on {host}. Visits and sales from this page are not measured. | Hitline 50 analitika, reklam, CRM və test platformasını yoxlayır və {host} saytında heç birini tapmadı. Bu səhifədən gələn ziyarət və satışlar ölçülmür. |

Landing (`apps/site/src/content/hitline/az.json`):

| Yer | English | Azərbaycanca |
|---|---|---|
| `hero.lead` | See every event from GA4, Google Ads, Meta, TikTok and 46 more platforms, spot server-side GTM and catch consent leaks, right inside Chrome DevTools. | GA4, Google Ads, Meta, TikTok və daha 46 platformanın bütün eventlərini gör, server-side GTM-i tap və consent sızmalarını elə Chrome DevTools-un içində tut. |
| `marquee.title` | Reads 50 platforms you already use | Artıq istifadə etdiyin 50 platformanı oxuyur |
| `features.title` | Six views. One question: can you trust the numbers? | Altı görünüş. Bir sual: rəqəmlərə inanmaq olar? |
| `features.checks.label` | Checks | Yoxlamalar |
| `features.checks.eyebrow` | Data quality checks | Məlumat keyfiyyəti |
| `features.checks.title` | The mistakes that quietly break reports. | Hesabatları səssizcə pozan səhvlər. |
| `features.checks.lead` | Hitline checks every event as it arrives and explains each problem: what happens, why it matters and how to fix it. | Hitline hər eventi gələn kimi yoxlayır və hər problemi izah edir: nə baş verir, niyə vacibdir və necə düzəlir. |
| `features.checks.bullets[0]` | E-mail addresses sent to ad and analytics platforms | Reklam və analitika platformalarına gedən e-poçt ünvanları |
| `features.checks.bullets[1]` | The same purchase or lead sent twice | Eyni alış və ya lead-in iki dəfə göndərilməsi |
| `features.checks.bullets[2]` | Purchases without an order ID, events without a value | Sifariş ID-si olmayan alışlar, dəyəri olmayan eventlər |
| `features.events.lead` | Hitline reads the requests of 50 analytics, ad, CRM and testing platforms, plus every dataLayer push. Newest events come first and new ones light up as they arrive. | Hitline 50 analitika, reklam, CRM və test platformasının sorğularını və hər dataLayer push-u oxuyur. Ən yeni eventlər yuxarıdadır, yeniləri gələndə işıqlanır. |
| `features.gtm.lead` | Hitline reads the GTM container itself: every tag with its trigger, consent checks and status, and for each dataLayer event the tags it fired. Plus four signals for server-side GTM. | Hitline GTM konteynerinin özünü oxuyur: hər tag trigger-i, consent yoxlamaları və statusu ilə, hər dataLayer eventi üçün isə işə düşən tag-lar. Üstəlik server-side GTM üçün dörd siqnal. |
| `faq[2].q` | Which platforms does Hitline read? | Hitline hansı platformaları oxuyur? |
| `faq[2].a` | 50 of them: analytics (GA4, Adobe, Amplitude, Mixpanel, Segment, PostHog, Matomo and more), ad pixels (Google Ads, Meta, TikTok, LinkedIn, Microsoft Ads, X, Pinterest, Snapchat, Reddit, Criteo and more), session recording, CRM, tag managers, A/B testing tools and the dataLayer. | 50 platforma: analitika (GA4, Adobe, Amplitude, Mixpanel, Segment, PostHog, Matomo və s.), reklam pikselləri (Google Ads, Meta, TikTok, LinkedIn, Microsoft Ads, X, Pinterest, Snapchat, Reddit, Criteo və s.), sessiya yazma, CRM, tag menecerlər, A/B test alətləri və dataLayer. |
| `faq[3].q` | My tool is not on the list. Can Hitline still show it? | Alətim siyahıda yoxdur. Hitline onu yenə göstərə bilər? |
| `faq[3].a` | Yes. Add it in Settings as a custom platform: a name and a part of its URL. Requests that only look like tracking are also listed under "Other". | Bəli. Onu Ayarlarda öz platforma kimi əlavə et: ad və URL-indən bir hissə. Sadəcə izləməyə oxşayan sorğular da "Digər" altında göstərilir. |
| `faq[5].q` | How is it different from Tag Assistant? | Tag Assistant-dan fərqi nədir? |
| `faq[5].a` | Tag Assistant focuses on Google tags. Hitline shows 50 platforms side by side, reads your GTM tags and triggers, checks consent, attribution and data quality, and compares events with your tracking plan. | Tag Assistant Google tag-larına fokuslanır. Hitline 50 platformanı yan-yana göstərir, GTM tag və trigger-lərini oxuyur, consenti, atribusiyanı və məlumat keyfiyyətini yoxlayır və eventləri tracking planınla müqayisə edir. |
| `faq[6].q` | Do I need DevTools open? | DevTools açıq olmalıdır? |
| `faq[6].a` | The popup works without it and updates itself while open. For the full event stream, open DevTools and the Hitline tab, then reload the page once. Chrome does not let extensions open DevTools, so the popup shows the shortcut and DevTools opens on the event you clicked. | Popup onsuz da işləyir və açıq qaldıqca özü yenilənir. Tam event axını üçün DevTools-u və Hitline tabını aç, sonra səhifəni bir dəfə yenilə. Chrome extension-ların DevTools açmasına icazə vermir, ona görə popup qısayolu göstərir və DevTools kliklədiyin eventdə açılır. |

Privacy səhifəsi (`apps/site/src/content/privacy/hitline.az.json`): "reads", "stores" və "notes" siyahıları yeniləndi (digər data layer-lər, popup-ın 2 saniyədən bir oxuması, öz platformalar, "DevTools-da göstər" qeydi, dataLayer taymeri).
