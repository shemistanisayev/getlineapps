# Hitline: Azərbaycanca mətnlərin yoxlanması

Agent yazıb, sən yoxlayırsan. Dəyişmək istədiyin sətri burada və ya `apps/hitline/extension/src/i18n/az.ts` faylında düzəlt (və ya agentə yaz). Tool, event və parametr adları (GA4, page_view, consent) tərcümə olunmur.

## Extension (addım 2: skelet)

| Açar | English | Azərbaycanca |
|---|---|---|
| `popup.settings` | Settings | Ayarlar |
| `popup.f12Hint` | Full analysis in DevTools: press F12, open the Hitline tab | Tam analiz DevTools-dadır: F12 bas, Hitline tabını aç |
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
| `welcome.title` | Hitline is ready. Every hit, in plain sight. | Hitline hazırdır. Hər hit göz önündə. |
| `welcome.lead` | Three steps and you will see every event your site sends, where it goes and whether it respects consent. | Üç addım və saytının göndərdiyi hər eventi, hara getdiyini və consent-ə əməl edib-etmədiyini görəcəksən. |

Sonrakı addımlarda yeni sətirlər bu cədvələ əlavə olunacaq.

## Sayt: /hitline landing və /hitline/uninstalled (addım 3B)

Fayl: `apps/site/src/content/hitline/az.json`. Səhifə: getlineapps.com/az/hitline və /az/hitline/uninstalled.

Qeydlər:
- "Audit PDF" bölməsindəki kağız nümunəsi (paper) ingiliscə qalır, çünki nümunə PDF ingiliscədir.
- "Reject all", "gclid", "value" kimi düymə və parametr adları tərcümə olunmur.
- Hero başlığı: "Tracking-in işləyir? Sübut et, bir paneldə." Yaşıl hissə "Sübut et," sözüdür.

| Açar | English | Azərbaycanca |
|---|---|---|
| `meta.title` | Hitline: free tracking checker for GA4, Meta and TikTok | Hitline: GA4, Meta və TikTok üçün pulsuz tracking yoxlayıcısı |
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
| `audit.cta` | Book a tracking audit | Tracking auditi sifariş et |
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
| `uninstall.card.cta` | Book a tracking audit | Tracking auditi sifariş et |
| `uninstall.card.sub` | Shamistan Isayev, analytics and tracking | Şəmistan İsayev, analitika və tracking |
