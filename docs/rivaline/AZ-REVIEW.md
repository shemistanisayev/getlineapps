# Rivaline: Azərbaycanca mətnlərin yoxlanması

Agent yazıb, sən yoxlayırsan. Dəyişmək istədiyin sətri burada və ya göstərilən faylda düzəlt (və ya agentə yaz). Alət və platforma adları (Rivaline, Meta Pixel, Stack, Ads, Brand) tərcümə olunmur. Bu siyahı hər addımda böyüyür.

## Side panel, Settings, PDF və salamlama səhifəsi (addım 2 ilə 8 arası)

Fayl: `apps/rivaline/extension/src/i18n/az.ts`. {n}, {host}, {hex} kimi yerlər avtomatik dolur. `rep.*` açarları rəqib hesabatı PDF-indədir. "Consent", kitabxana adları (Meta Ad Library və s.), şrift mənbələri (Google Fonts) və tab adları (Stack, Ads, Brand) ingiliscə saxlanılıb. Ölkə adları Chrome-un öz tərcüməsindən gəlir.

| Açar | English | Azərbaycanca |
|---|---|---|
| `list.and` | and | və |
| `panel.sections` | Rivaline sections | Rivaline bölmələri |
| `panel.settings` | Settings | Ayarlar |
| `panel.pdf` | Report PDF | Hesabat PDF |
| `tab.stack` | Stack | Stack |
| `tab.ads` | Ads | Ads |
| `tab.brand` | Brand | Brand |
| `panel.reading` | Reading this page... | Səhifə oxunur... |
| `panel.readAgain` | Read the page again | Səhifəni yenidən oxu |
| `panel.access.title` | Read this tab? | Bu tab oxunsun? |
| `panel.access.text` | You switched tabs. Rivaline reads a page only after you ask it to. | Başqa taba keçdin. Rivaline səhifəni yalnız sən istəyəndən sonra oxuyur. |
| `panel.access.icon` | Click the Rivaline icon in the toolbar | Alətlər panelində Rivaline ikonuna bas |
| `panel.access.keys` | Or press | Və ya bas |
| `panel.access.noKeys` | Or set a keyboard shortcut in Settings | Və ya Ayarlarda klaviatura qısayolu təyin et |
| `panel.access.note` | This is how Chrome's activeTab permission works. Rivaline never gets access to all the sites you visit. | Chrome-un activeTab icazəsi belə işləyir. Rivaline heç vaxt girdiyin bütün saytlara giriş almır. |
| `panel.restricted.title` | Rivaline can't read this page | Rivaline bu səhifəni oxuya bilmir |
| `panel.restricted.text` | Chrome keeps its own pages closed to extensions. Open any website and click the Rivaline icon. | Chrome öz səhifələrini extension-lara bağlı saxlayır. İstənilən saytı aç və Rivaline ikonuna bas. |
| `panel.restricted.worksOn` | Works on | İşləyir |
| `panel.restricted.web` | Any website on http or https | http və ya https ilə açılan istənilən saytda |
| `panel.restricted.notOn` | Doesn't work on | İşləmir |
| `panel.restricted.chrome` | Chrome pages like chrome://extensions | chrome://extensions kimi Chrome səhifələrində |
| `panel.restricted.store` | The Chrome Web Store | Chrome Web Store-da |
| `panel.restricted.extensions` | Pages of other extensions | Başqa extension-ların səhifələrində |
| `panel.restricted.pdf` | PDF files opened in Chrome | Chrome-da açılan PDF fayllarında |
| `read.load` | Waiting for the page to finish loading | Səhifənin yüklənməsi gözlənilir |
| `read.tools` | Finding marketing tools | Marketinq alətləri axtarılır |
| `read.brand` | Reading colors and fonts | Rənglər və şriftlər oxunur |
| `read.logo` | Taking the logo | Loqo götürülür |
| `cat.advertising` | Advertising | Reklam |
| `cat.analytics` | Analytics | Analitika |
| `cat.tagmanagement` | Tag management | Teq idarəetməsi |
| `cat.consent` | Consent | Consent |
| `cat.crm` | CRM | CRM |
| `cat.email` | Email | E-poçt |
| `cat.chat` | Chat | Çat |
| `cat.abtesting` | A/B testing | A/B test |
| `cat.ecommerce` | E-commerce | E-ticarət |
| `cat.reviews` | Reviews | Rəylər |
| `cat.payments` | Payments | Ödənişlər |
| `cat.affiliate` | Affiliate | Partnyor proqramı |
| `chips.label` | Categories | Kateqoriyalar |
| `chips.all` | All | Hamısı |
| `stack.title` | {tools} in {cats} | {cats} {tools} |
| `n.tool.one` | {n} tool | {n} alət |
| `n.tool.other` | {n} tools | {n} alət |
| `n.cat.one` | {n} category | {n} kateqoriyada |
| `n.cat.other` | {n} categories | {n} kateqoriyada |
| `stack.storeAds` | {platform} store running {channels} ads | {channels} reklamları işlədən {platform} mağazası |
| `stack.siteAds` | {platform} site running {channels} ads | {channels} reklamları işlədən {platform} saytı |
| `stack.store` | {platform} store | {platform} mağazası |
| `stack.site` | {platform} site | {platform} saytı |
| `stack.ads` | Running {channels} ads | {channels} reklamları işlədir |
| `stack.home` | Home page | Ana səhifə |
| `stack.more` | {n} more tools | Daha {n} alət |
| `stack.list` | Tools on this page | Bu səhifədəki alətlər |
| `stack.full` | Chrome lists only the first 250 requests of a page, so a tool that loaded later may be missing. | Chrome səhifənin yalnız ilk 250 sorğusunu göstərir, ona görə sonra yüklənən alət görünməyə bilər. |
| `stack.consentNote` | This site has a consent banner. Tools that wait for consent show up after you accept it and press Read the page again. | Bu saytda consent banneri var. Razılıq gözləyən alətlər onu qəbul edib Səhifəni yenidən oxu düyməsinə basandan sonra görünür. |
| `gaps.one` | 1 gap | 1 boşluq |
| `gaps.other` | {n} gaps | {n} boşluq |
| `gap.GAP_SERVER_SIDE.short` | server-side tracking | server-side izləmə |
| `gap.GAP_CONSENT.short` | consent banner | consent banneri |
| `gap.GAP_CRM.short` | CRM | CRM |
| `gap.GAP_ANALYTICS.short` | analytics | analitika |
| `gap.GAP_SERVER_SIDE.title` | Server-side tracking | Server-side izləmə |
| `gap.GAP_CONSENT.title` | Consent banner | Consent banneri |
| `gap.GAP_CRM.title` | CRM | CRM |
| `gap.GAP_ANALYTICS.title` | Analytics | Analitika |
| `gap.GAP_SERVER_SIDE.one` | The ad pixel sends straight from the browser. | Reklam pikseli birbaşa brauzerdən göndərir. |
| `gap.GAP_SERVER_SIDE.other` | All {n} ad pixels send straight from the browser. | {n} reklam pikselinin hamısı birbaşa brauzerdən göndərir. |
| `gap.GAP_CONSENT.text` | No consent platform or consent update found. | Nə consent platforması, nə də consent yeniləməsi tapıldı. |
| `gap.GAP_CRM.text` | No HubSpot, Salesforce or Zoho script on the page. | Səhifədə HubSpot, Salesforce və ya Zoho skripti yoxdur. |
| `gap.GAP_ANALYTICS.text` | No analytics tool found on this page. | Bu səhifədə analitika aləti tapılmadı. |
| `notFound.title` | Not found on this page | Bu səhifədə tapılmadı |
| `notFound.cta` | Want these in place on your own site? | Bunların öz saytında qurulmasını istəyirsən? |
| `cta.touch` | Get in touch | Əlaqə saxla |
| `detail.how` | How Rivaline found it | Rivaline bunu necə tapdı |
| `detail.copyId` | Copy ID | ID-ni kopyala |
| `detail.copied` | ID copied to clipboard | ID kopyalandı |
| `detail.openIn` | Open in {library} | {library}-da aç |
| `ev.Script` | Script | Skript |
| `ev.Request` | Request | Sorğu |
| `ev.Global` | Global | Qlobal |
| `ev.Cookie` | Cookie | Cookie |
| `ev.Meta` | Meta | Meta |
| `ev.Element` | Element | Element |
| `lib.meta` | Meta Ad Library | Meta Ad Library |
| `lib.google` | Google Ads Transparency Center | Google Ads Transparency Center |
| `lib.tiktok` | TikTok Ad Library | TikTok Ad Library |
| `lib.linkedin` | LinkedIn Ad Library | LinkedIn Ad Library |
| `count.stack` | {n} tools | {n} alət |
| `count.ads` | {n} ad libraries | {n} reklam kitabxanası |
| `count.brand` | {n} colors | {n} rəng |
| `empty.title` | No marketing tools found | Marketinq aləti tapılmadı |
| `empty.text` | No analytics, ad pixels, CRM or chat on {host}. Visits and leads from this site are not measured. | {host} saytında analitika, reklam pikseli, CRM və ya çat yoxdur. Bu saytdan gələn ziyarətlər və lidlər ölçülmür. |
| `empty.checked` | What Rivaline checked | Rivaline nəyi yoxladı |
| `empty.t1` | page scripts | səhifə skriptləri |
| `empty.t2` | cookies | cookie-lər |
| `empty.t3` | window globals | qlobal dəyişənlər |
| `empty.t4` | meta tags | meta teqlər |
| `empty.t5` | loaded resources | yüklənən fayllar |
| `empty.still` | The Ads and Brand tabs still work for this site. | Ads və Brand tabları bu sayt üçün yenə işləyir. |
| `empty.waited` | Read {s} s after the page finished loading. | Səhifə yükləndikdən {s} san sonra oxundu. |
| `empty.ctaTitle` | Starting from zero? | Sıfırdan başlayırsan? |
| `empty.ctaText` | Analytics, ad pixels and consent, set up and tested. | Analitika, reklam pikselləri və consent, qurulmuş və yoxlanmış. |
| `ads.searchFor` | Search for | Axtarış |
| `ads.brand` | Brand name | Brend adı |
| `ads.domain` | Domain | Domen |
| `ads.country` | Country | Ölkə |
| `ads.allCountries` | All countries | Bütün ölkələr |
| `ads.desc.meta` | Facebook, Instagram and Messenger ads | Facebook, Instagram və Messenger reklamları |
| `ads.desc.google` | Search, YouTube, Shopping and Display ads | Search, YouTube, Shopping və Display reklamları |
| `ads.desc.tiktok` | Ads shown in Europe. Press Search on TikTok’s page | Avropada göstərilən reklamlar. TikTok səhifəsində Search-ə bas |
| `ads.desc.linkedin` | Sponsored content on LinkedIn | LinkedIn-də sponsorlu məzmun |
| `ads.tool.meta` | Meta Pixel | Meta Pixel |
| `ads.tool.google` | Google Ads tag | Google Ads teqi |
| `ads.tool.tiktok` | TikTok Pixel | TikTok Pixel |
| `ads.tool.linkedin` | LinkedIn Insight Tag | LinkedIn Insight Tag |
| `ads.found` | {tool} on site | {tool} saytdadır |
| `ads.missing` | No {tool} | {tool} yoxdur |
| `ads.open` | Open {library} | {library}-nı aç |
| `ads.openAll` | Open all 4 in new tabs | Dördünü yeni tablarda aç |
| `ads.copyLinks` | Copy links | Linkləri kopyala |
| `ads.copied` | Links copied to clipboard | Linklər kopyalandı |
| `ads.note` | A pixel shows the site can measure ads on that channel. The library shows which ads are running now. | Piksel saytın həmin kanalda reklamı ölçə bildiyini göstərir. Kitabxana isə hazırda hansı reklamların getdiyini göstərir. |
| `brand.logo` | Logo | Loqo |
| `brand.logoFrom` | From the page header, {w} x {h} px | Səhifə başlığından, {w} x {h} px |
| `brand.logoMissing` | Scroll to the top of the page and press Read the page again | Səhifənin ən yuxarısına qalx və Səhifəni yenidən oxu düyməsinə bas |
| `brand.logoAlt` | Logo of {host} | {host} loqosu |
| `brand.copyPng` | Copy PNG | PNG-ni kopyala |
| `brand.downloadPng` | Download PNG | PNG-ni yüklə |
| `brand.copySvg` | Copy SVG | SVG-ni kopyala |
| `brand.logoCopied` | Logo copied to clipboard | Loqo kopyalandı |
| `brand.svgCopied` | SVG copied to clipboard | SVG kopyalandı |
| `brand.colors` | Colors | Rənglər |
| `brand.clickCopy` | Click a color to copy | Kopyalamaq üçün rəngə bas |
| `brand.copyHex` | Copy {hex} | {hex} kopyala |
| `brand.hexCopied` | {hex} copied to clipboard | {hex} kopyalandı |
| `brand.noColors` | No colors could be read on this page. | Bu səhifədə rəng oxumaq mümkün olmadı. |
| `role.primary` | Primary | Əsas |
| `role.text` | Text | Mətn |
| `role.background` | Background | Fon |
| `role.accent` | Accent | Vurğu |
| `role.surface` | Surface | Səth |
| `brand.fonts` | Fonts | Şriftlər |
| `brand.headings` | Headings | Başlıqlar |
| `brand.body` | Body | Mətn |
| `brand.fontDetail` | {weight}, {size} px | {weight}, {size} px |
| `src.google` | Google Fonts | Google Fonts |
| `src.adobe` | Adobe Fonts | Adobe Fonts |
| `src.self` | Self-hosted | Öz serverində |
| `src.system` | System | Sistem |
| `brand.button` | Main button | Əsas düymə |
| `brand.noButton` | No main button in the first screen of this page. | Bu səhifənin ilk ekranında əsas düymə yoxdur. |
| `brand.btnBg` | background {hex} | fon {hex} |
| `brand.btnBox` | radius {radius}, height {h}px | radius {radius}, hündürlük {h}px |
| `brand.btnFont` | {family} {weight}, {size}px | {family} {weight}, {size}px |
| `brand.export` | Export | Export |
| `fmt.css` | CSS variables | CSS dəyişənləri |
| `fmt.json` | JSON | JSON |
| `fmt.png` | PNG palette | PNG palitra |
| `export.title` | Export brand kit | Brend dəstini export et |
| `export.close` | Close | Bağla |
| `export.format` | Format | Format |
| `export.copy` | Copy | Kopyala |
| `export.copied` | Copied | Kopyalandı |
| `export.download` | Download {file} | {file} yüklə |
| `export.note` | Font names only. Rivaline never downloads font files. | Yalnız şrift adları. Rivaline şrift fayllarını heç vaxt yükləmir. |
| `export.toast.css` | CSS copied to clipboard | CSS kopyalandı |
| `export.toast.json` | JSON copied to clipboard | JSON kopyalandı |
| `export.toast.png` | PNG palette copied to clipboard | PNG palitra kopyalandı |
| `export.palette` | Palette of {name} | {name} palitrası |
| `set.back` | Back to results | Nəticələrə qayıt |
| `set.ads` | Ad libraries | Reklam kitabxanaları |
| `set.country` | Default country | Defolt ölkə |
| `set.countryHint` | Used for the Meta, Google and TikTok searches. TikTok only knows European countries. | Meta, Google və TikTok axtarışlarında işlənir. TikTok yalnız Avropa ölkələrini tanıyır. |
| `set.shortcut` | Keyboard shortcut | Klaviatura qısayolu |
| `set.noShortcut` | Not set | Təyin olunmayıb |
| `set.change` | Change | Dəyiş |
| `set.language` | Language | Dil |
| `set.data` | Your data | Məlumatların |
| `set.clear` | Clear all settings | Bütün ayarları sil |
| `set.cleared` | All settings are cleared. | Bütün ayarlar silindi. |
| `set.privacyNote` | Only these settings are saved, and only on this computer. Rivaline sends nothing anywhere and forgets each page when you close the tab. | Yalnız bu ayarlar saxlanılır, o da yalnız bu kompüterdə. Rivaline heç yerə heç nə göndərmir və tabı bağlayanda hər səhifəni unudur. |
| `set.more` | More free tools | Daha çox pulsuz alət |
| `set.tool.hitline` | Tracking and consent audit | İzləmə və consent auditi |
| `set.tool.serpline` | SEO and AI search | SEO və AI axtarış |
| `set.tool.foldline` | Landing page CRO | Landing səhifə CRO |
| `set.tool.markline` | Feedback screenshots | Rəy üçün ekran şəkilləri |
| `set.version` | Version {v} | Versiya {v} |
| `set.privacy` | Privacy | Məxfilik |
| `set.contact` | Contact | Əlaqə |
| `rep.eyebrow` | Competitor report | Rəqib hesabatı |
| `rep.subline` | Page read: {page}. Brand name used for ad searches: {brand} | Oxunan səhifə: {page}. Reklam axtarışlarında işlənən brend adı: {brand} |
| `rep.home` | home page | ana səhifə |
| `rep.tile.tools.one` | tool | alət |
| `rep.tile.tools.other` | tools | alət |
| `rep.tile.cats.one` | category | kateqoriya |
| `rep.tile.cats.other` | categories | kateqoriya |
| `rep.tile.pixels.one` | ad pixel | reklam pikseli |
| `rep.tile.pixels.other` | ad pixels | reklam pikseli |
| `rep.tile.gaps.one` | gap | boşluq |
| `rep.tile.gaps.other` | gaps | boşluq |
| `rep.stack` | Stack | Stack |
| `rep.stack.noneK` | Tools | Alətlər |
| `rep.stack.noneV` | No marketing tools found on this page | Bu səhifədə marketinq aləti tapılmadı |
| `rep.gaps` | Gaps and opportunities | Boşluqlar və imkanlar |
| `rep.gap.GAP_SERVER_SIDE.lead` | No server-side tracking. | Server-side izləmə yoxdur. |
| `rep.gap.GAP_SERVER_SIDE.one` | The ad pixel sends from the browser, so blocked requests never reach the ad platform. | Reklam pikseli brauzerdən göndərir, ona görə bloklanan sorğular reklam platformasına çatmır. |
| `rep.gap.GAP_SERVER_SIDE.other` | All {n} ad pixels send from the browser, so blocked requests never reach the ad platforms. | {n} reklam pikselinin hamısı brauzerdən göndərir, ona görə bloklanan sorğular reklam platformalarına çatmır. |
| `rep.gap.GAP_CONSENT.lead` | No consent banner. | Consent banneri yoxdur. |
| `rep.gap.GAP_CONSENT.text` | Ad pixels load for every visitor before any choice is made. | Reklam pikselləri hər ziyarətçi üçün seçimdən əvvəl yüklənir. |
| `rep.gap.GAP_CONSENT.analytics` | Tracking loads for every visitor before any choice is made. | İzləmə hər ziyarətçi üçün seçimdən əvvəl yüklənir. |
| `rep.gap.GAP_CRM.lead` | No CRM on the site. | Saytda CRM yoxdur. |
| `rep.gap.GAP_CRM.email` | {email} collects emails, but chat and form leads are not tied to one customer record. | {email} e-poçtları toplayır, amma çat və form lidləri bir müştəri qeydinə bağlanmır. |
| `rep.gap.GAP_CRM.text` | Leads from chat and forms are not tied to one customer record. | Çat və formlardan gələn lidlər bir müştəri qeydinə bağlanmır. |
| `rep.gap.GAP_ANALYTICS.lead` | No analytics. | Analitika yoxdur. |
| `rep.gap.GAP_ANALYTICS.text` | Visits and sales from this site are not measured. | Bu saytdan gələn ziyarətlər və satışlar ölçülmür. |
| `rep.none.lead` | No gaps found. | Boşluq tapılmadı. |
| `rep.none.text` | Analytics, consent, CRM and server-side tracking are all in place. | Analitika, consent, CRM və server-side izləmə yerindədir. |
| `rep.brand` | Brand kit | Brend dəsti |
| `rep.brand.fonts` | {heading} for headings, {body} for body. | Başlıqlar üçün {heading}, mətn üçün {body}. |
| `rep.brand.font` | {family} {weight} | {family} {weight} |
| `rep.brand.button` | Main button {hex}, {shape}. | Əsas düymə {hex}, {shape}. |
| `rep.shape.round` | fully rounded | tam yuvarlaq |
| `rep.shape.radius` | {r} corners | {r} künclər |
| `rep.shape.square` | square corners | düz künclər |
| `rep.brand.none` | No brand colors could be read on this page. | Bu səhifədə brend rəngi oxumaq mümkün olmadı. |
| `rep.libs` | Ad libraries | Reklam kitabxanaları |
| `rep.cta.title` | Need help closing gaps like these? | Belə boşluqları bağlamağa kömək lazımdır? |
| `rep.cta.sub` | Shamistan Isayev, analytics and server-side tracking | Shamistan Isayev, analitika və server-side izləmə |
| `rep.footer` | Made with Rivaline. No data left the browser. | Rivaline ilə hazırlanıb. Heç bir məlumat brauzerdən çıxmadı. |
| `rep.pageOf` | Page {i} of {n} | Səhifə {i} / {n} |
| `rep.sev.high` | High | Yüksək |
| `rep.sev.medium` | Medium | Orta |
| `rep.sev.low` | Low | Aşağı |
| `rep.saved` | PDF saved: {file} | PDF saxlanıldı: {file} |
| `rep.failed` | The PDF could not be made. Try again. | PDF hazırlamaq alınmadı. Yenidən yoxla. |
| `welcome.title` | Rivaline is ready. | Rivaline hazırdır. |
| `welcome.accent` | Any site, one click. | İstənilən sayt, bir klik. |
| `welcome.lead` | Three steps and you will see what a site runs, where it advertises and how its brand looks. | Üç addım və saytın nə işlətdiyini, harada reklam verdiyini və brendinin necə göründüyünü görəcəksən. |
| `welcome.free` | Free | Pulsuz |
| `welcome.noAccount` | No account | Hesab lazım deyil |
| `welcome.local` | Nothing leaves your browser | Heç nə brauzerindən çıxmır |
| `welcome.s1.title` | Pin Rivaline to the toolbar | Rivaline-ı alətlər panelinə bərkit |
| `welcome.s1.text` | Click the puzzle icon next to the address bar and pin Rivaline. | Ünvan sətrinin yanındakı tapmaca ikonuna bas və Rivaline-ı bərkit. |
| `welcome.s2.title` | Open a site, click the icon | Saytı aç, ikona bas |
| `welcome.s2.text` | The side panel opens next to the page. Or press | Side panel səhifənin yanında açılır. Və ya bas |
| `welcome.s2.noKeys` | The side panel opens next to the page. | Side panel səhifənin yanında açılır. |
| `welcome.s3.title` | Switch between Stack, Ads and Brand | Stack, Ads və Brand arasında keç |
| `welcome.s3.text` | Then download everything as one competitor report PDF. | Sonra hamısını bir rəqib hesabatı PDF-i kimi yüklə. |
| `welcome.built` | Built by Shamistan Isayev | Shamistan Isayev tərəfindən hazırlanıb |
| `welcome.contact` | Need a martech audit? Get in touch | Martech auditi lazımdır? Əlaqə saxla |

## Landing və silinmə səhifəsi (addım 5B)

Fayl: `apps/site/src/content/rivaline/az.json`. {brand}, {q} kimi yerlər avtomatik dolur. Yalnız fərqli olan sətirlər göstərilir; demo saytın mətni (Kova) ingiliscə qalır.

| Açar | English | Azərbaycanca |
|---|---|---|
| `meta.title` | Rivaline: Free Competitor Research for Meta, Google & More | Rivaline: Meta, Google və s. üçün pulsuz rəqib araşdırması |
| `meta.description` | Free Chrome extension. See any site's martech stack, open its ads in Meta, Google, TikTok and LinkedIn ad libraries and copy its brand colors and fonts, in one side panel. | Pulsuz Chrome extension. İstənilən saytın martech stack-ini gör, reklamlarını Meta, Google, TikTok və LinkedIn reklam kitabxanalarında aç, brend rənglərini və şriftlərini kopyala, hamısı bir yan paneldə. |
| `meta.ogAlt` | Rivaline: see any rival's stack, ads and brand in one panel. | Rivaline: istənilən rəqibin stack-ini, reklamlarını və brendini bir paneldə gör. |
| `nav.label` | Rivaline sections | Rivaline bölmələri |
| `nav.features` | Features | İmkanlar |
| `nav.finder` | Ad library finder | Reklam kitabxanası axtarışı |
| `nav.how` | How it works | Necə işləyir |
| `nav.privacy` | Privacy | Məxfilik |
| `nav.faq` | FAQ | Suallar |
| `add.nav` | Add to Chrome | Chrome-a əlavə et |
| `add.hero` | Add to Chrome, it's free | Chrome-a əlavə et, pulsuzdur |
| `add.band` | Add to Chrome | Chrome-a əlavə et |
| `add.soonNav` | Coming soon | Tezliklə |
| `add.soonHero` | Coming soon to Chrome | Tezliklə Chrome-da |
| `hero.pill` | Free Chrome extension | Pulsuz Chrome extension |
| `hero.titleStart` | See any rival's stack, ads and brand in | İstənilən rəqibin stack-i, reklamları və brendi |
| `hero.titleHighlight` | one panel | bir paneldə |
| `hero.lead` | Rivaline shows the analytics, ad pixels, CRM and chat a site runs, opens its ads in four ad libraries and pulls its colors and fonts. Right in Chrome's side panel | Rivaline saytın işlətdiyi analitikanı, reklam piksellərini, CRM-i və çatı göstərir, reklamlarını dörd reklam kitabxanasında açır, rənglərini və şriftlərini çıxarır. Birbaşa Chrome-un yan panelində |
| `hero.secondary` | Try the ad library finder | Reklam kitabxanası axtarışını yoxla |
| `hero.trustLabel` | Why it is safe to try | Niyə yoxlamaq təhlükəsizdir |
| `hero.trust.0` | No account | Hesab lazım deyil |
| `hero.trust.1` | Nothing leaves your browser | Heç nə brauzerindən çıxmır |
| `hero.trust.2` | Open source | Açıq mənbə |
| `hero.mock.label` | Rivaline side panel on the Kova demo shop | Kova demo mağazasında Rivaline yan paneli |
| `hero.mock.title` | 13 tools in 8 categories | 8 kateqoriyada 13 alət |
| `hero.kit.eyebrow` | Brand kit | Brend dəsti |
| `hero.kit.hint` | Hover to see HEX | HEX üçün üzərinə gəl |
| `hero.kit.headings` | headings | başlıqlar |
| `hero.kit.body` | body | mətn |
| `hero.toast.eyebrow` | Not found | Tapılmadı |
| `hero.toast.text` | No server-side tracking on this site | Bu saytda server-side izləmə yoxdur |
| `marquee.title` | Recognizes the tools marketers use | Marketoloqların işlətdiyi alətləri tanıyır |
| `problem.eyebrow` | The problem | Problem |
| `problem.title` | Researching a rival takes ten tabs and view-source | Rəqibi araşdırmaq on tab və view-source tələb edir |
| `problem.lead` | The answers are already on the page. They are just scattered | Cavablar artıq səhifədədir. Sadəcə səpələnib |
| `problem.cards.0.title` | The stack hides in source code | Stack mənbə kodunda gizlənir |
| `problem.cards.0.text` | Finding which pixels, CRM and chat a site uses means reading its scripts line by line | Saytın hansı piksel, CRM və çat işlətdiyini tapmaq skriptləri sətir-sətir oxumaq deməkdir |
| `problem.cards.1.title` | Four ad libraries, four searches | Dörd reklam kitabxanası, dörd axtarış |
| `problem.cards.1.text` | Meta, Google, TikTok and LinkedIn each want the brand typed again, every time | Meta, Google, TikTok və LinkedIn hər dəfə brendin adını yenidən yazmağı istəyir |
| `problem.cards.2.title` | Brand colors by eyedropper | Brend rəngləri damcıladanla |
| `problem.cards.2.text` | Inspect, copy, paste, repeat. For every color, every font and the button style | Yoxla, kopyala, yapışdır, təkrar et. Hər rəng, hər şrift və düymə stili üçün |
| `features.eyebrow` | Inside the panel | Panelin içi |
| `features.title` | Three tabs. A full picture of any site | Üç tab. İstənilən sayt haqqında tam mənzərə |
| `features.tabsLabel` | Rivaline features | Rivaline imkanları |
| `features.stack.title` | Every tool, grouped by what it does | Hər alət, nə iş gördüyünə görə qruplaşdırılıb |
| `features.stack.lead` | Analytics, ad pixels, tag managers, email, chat, reviews, payments and the platform underneath, each with the ID it uses | Analitika, reklam pikselləri, teq menecerləri, e-poçt, çat, rəylər, ödənişlər və altdakı platforma, hər biri işlətdiyi ID ilə |
| `features.stack.bullets.0` | IDs like GTM-N4KV8R and G-8XK2LM4QPZ, ready to copy | GTM-N4KV8R və G-8XK2LM4QPZ kimi ID-lər, kopyalamağa hazır |
| `features.stack.bullets.1` | Evidence for each match: script, cookie or global | Hər tapıntının sübutu: skript, cookie və ya qlobal dəyişən |
| `features.stack.bullets.2` | Gaps listed too: server-side tracking, consent, CRM | Boşluqlar da göstərilir: server-side izləmə, consent, CRM |
| `features.stack.demo.advertising` | Advertising | Reklam |
| `features.stack.demo.emailChat` | Email and chat | E-poçt və çat |
| `features.stack.demo.notFoundStrong` | Not found: | Tapılmadı: |
| `features.stack.demo.notFound` | server-side tracking, consent banner, CRM | server-side izləmə, consent banneri, CRM |
| `features.ads.title` | Four ad libraries, already searched | Dörd reklam kitabxanası, axtarış artıq edilib |
| `features.ads.lead` | Rivaline fills in the brand name and the domain, so Meta, Google, TikTok and LinkedIn open on the right results | Rivaline brendin adını və domeni özü doldurur, ona görə Meta, Google, TikTok və LinkedIn düz nəticələrdə açılır |
| `features.ads.bullets.0` | Open all four in one click | Dördünü bir kliklə aç |
| `features.ads.bullets.1` | Pick your default country once in Settings | Defolt ölkəni Ayarlarda bir dəfə seç |
| `features.ads.bullets.2` | See which channels have a pixel on the site | Hansı kanalın saytda pikseli olduğunu gör |
| `features.ads.demo.searchesBrand` | Searches "Kova" | "Kova" axtarılır |
| `features.ads.demo.searchesDomain` | Searches example.com | example.com axtarılır |
| `features.ads.demo.openAll` | Open all 4 in new tabs | Dördünü yeni tablarda aç |
| `features.brand.title` | The brand kit, without the eyedropper | Brend dəsti, damcıladan olmadan |
| `features.brand.lead` | Logo, colors with their roles, font names and the main button style. Export as CSS variables, a PNG palette or JSON | Loqo, rolları ilə rənglər, şrift adları və əsas düymənin stili. CSS dəyişənləri, PNG palitra və ya JSON kimi export et |
| `features.brand.bullets.0` | Click any color to copy its HEX | HEX-i kopyalamaq üçün istənilən rəngə bas |
| `features.brand.bullets.1` | Font names only, never the font files | Yalnız şrift adları, şrift faylları heç vaxt |
| `features.brand.bullets.2` | Ready for a pitch deck or a mockup | Prezentasiya və ya maket üçün hazır |
| `features.brand.demo.headings` | Headings | Başlıqlar |
| `features.brand.demo.body` | Body | Mətn |
| `features.report.label` | Report | Hesabat |
| `features.report.title` | One PDF for the next meeting | Növbəti görüş üçün bir PDF |
| `features.report.lead` | Stack, gaps, ad library links and the brand kit on one A4 page, built in your browser | Stack, boşluqlar, reklam kitabxanası linkləri və brend dəsti bir A4 səhifədə, brauzerində hazırlanır |
| `features.report.bullets.0` | Ready for a sales call or a client pitch | Satış zəngi və ya müştəri təqdimatı üçün hazır |
| `features.report.bullets.1` | Selectable text and working links | Seçilə bilən mətn və işləyən linklər |
| `features.report.bullets.2` | Made on your computer, sent nowhere | Kompüterində hazırlanır, heç yerə göndərilmir |
| `features.report.demo.date` | Nov 7, 2026 | 7 noyabr 2026 |
| `features.report.demo.eyebrow` | Competitor report | Rəqib hesabatı |
| `features.report.demo.tools` | tools | alət |
| `features.report.demo.categories` | categories | kateqoriya |
| `features.report.demo.pixels` | ad pixels | reklam pikseli |
| `features.report.demo.gaps` | gaps | boşluq |
| `features.report.demo.high` | High | Yüksək |
| `features.report.demo.rows.0.strong` | No server-side tracking. | Server-side izləmə yoxdur. |
| `features.report.demo.rows.0.text` | All 4 pixels send from the browser. | 4 pikselin hamısı brauzerdən göndərir. |
| `features.report.demo.rows.1.strong` | No consent banner. | Consent banneri yoxdur. |
| `features.report.demo.rows.1.text` | Pixels load before any choice. | Piksellər seçimdən əvvəl yüklənir. |
| `finder.eyebrow` | Free tool, no install | Pulsuz alət, quraşdırmadan |
| `finder.title` | Ad library finder | Reklam kitabxanası axtarışı |
| `finder.lead` | Type a brand or a domain. Four ad library searches are ready to open. It runs on this page and sends nothing anywhere | Brend adı və ya domen yaz. Dörd reklam kitabxanasında axtarış açılmağa hazır olur. Bu səhifədə işləyir və heç yerə heç nə göndərmir |
| `finder.label` | Brand or domain | Brend və ya domen |
| `finder.placeholder` | example.com or a brand name | example.com və ya brend adı |
| `finder.brand` | Brand: {brand} | Brend: {brand} |
| `finder.typeAbove` | type above | yuxarıda yaz |
| `finder.searchesBrand` | Searches "{q}" | "{q}" axtarılır |
| `finder.searchesDomain` | Searches {q} | {q} axtarılır |
| `finder.needsDomain` | Needs a domain | Domen lazımdır |
| `finder.typeBrand` | Type a brand | Brend adı yaz |
| `finder.open` | Open search | Axtarışı aç |
| `finder.opensNewTab` | opens in a new tab | yeni tabda açılır |
| `finder.tiktokNote` | TikTok's library covers ads shown in Europe | TikTok kitabxanası Avropada göstərilən reklamları əhatə edir |
| `finder.band` | Want the pixels, brand kit and a PDF too? The extension does it from any site | Pikselləri, brend dəstini və PDF-i də istəyirsən? Extension bunu istənilən saytdan edir |
| `how.eyebrow` | How it works | Necə işləyir |
| `how.title` | Three steps, no setup | Üç addım, quraşdırma yoxdur |
| `how.steps.0.title` | Add Rivaline to Chrome | Rivaline-ı Chrome-a əlavə et |
| `how.steps.0.text` | Free from the Chrome Web Store. No account to create | Chrome Web Store-dan pulsuz. Hesab açmaq lazım deyil |
| `how.steps.1.title` | Open a site, click the icon | Saytı aç, ikona bas |
| `how.steps.1.text` | The side panel opens next to the page. Or press | Yan panel səhifənin yanında açılır. Və ya bas |
| `how.steps.2.title` | Download the report | Hesabatı yüklə |
| `how.steps.2.text` | Stack, gaps, ad links and brand kit in one PDF | Stack, boşluqlar, reklam linkləri və brend dəsti bir PDF-də |
| `report.eyebrow` | Competitor report | Rəqib hesabatı |
| `report.titleStart` | Your rival has it and you don't? | Rəqibdə var, səndə yoxdur? |
| `report.titleHighlight` | Get it set up | Qurulmasını tapşır |
| `report.titleEnd` | by the person who built Rivaline | Rivaline-ı yaradan adama |
| `report.text` | One click turns any site into a report: stack, gaps, ad libraries and brand kit. Share it with your team, or send it to me. I set up analytics, server-side tracking, consent and ad pixels for growing brands | Bir klik istənilən saytı hesabata çevirir: stack, boşluqlar, reklam kitabxanaları və brend dəsti. Komandanla paylaş və ya mənə göndər. Böyüyən brendlər üçün analitika, server-side izləmə, consent və reklam piksellərini qururam |
| `report.cta` | Book an audit | Audit sifariş et |
| `report.from` | From | Müəllif: |
| `report.paper.date` | Nov 7, 2026 | 7 noyabr 2026 |
| `report.paper.eyebrow` | Competitor report | Rəqib hesabatı |
| `report.paper.tools` | tools in 8 categories | alət, 8 kateqoriyada |
| `report.paper.gaps` | gaps | boşluq |
| `report.paper.rows.0.label` | High | Yüksək |
| `report.paper.rows.0.strong` | No server-side tracking. | Server-side izləmə yoxdur. |
| `report.paper.rows.0.text` | All 4 ad pixels send from the browser. | 4 reklam pikselinin hamısı brauzerdən göndərir. |
| `report.paper.rows.1.label` | High | Yüksək |
| `report.paper.rows.1.strong` | No consent banner. | Consent banneri yoxdur. |
| `report.paper.rows.1.text` | Pixels load before any choice. | Piksellər seçimdən əvvəl yüklənir. |
| `report.paper.rows.2.label` | Medium | Orta |
| `report.paper.rows.2.strong` | No CRM on the site. | Saytda CRM yoxdur. |
| `report.paper.rows.2.text` | Leads stay in separate tools. | Lidlər ayrı-ayrı alətlərdə qalır. |
| `privacy.eyebrow` | Privacy | Məxfilik |
| `privacy.title` | Your research stays in your browser | Araşdırman brauzerində qalır |
| `privacy.items.0.title` | No server | Server yoxdur |
| `privacy.items.0.text` | All analysis runs inside Chrome. Rivaline makes no requests of its own | Bütün analiz Chrome-un içində gedir. Rivaline özü heç bir sorğu göndərmir |
| `privacy.items.1.title` | Minimal permissions | Minimal icazələr |
| `privacy.items.1.text` | Side panel, active tab and local storage. No access to all your sites | Yan panel, aktiv tab və lokal yaddaş. Bütün saytlarına giriş yoxdur |
| `privacy.items.2.title` | No tracking inside | İçində izləmə yoxdur |
| `privacy.items.2.text` | The extension doesn't track you. Results disappear when you close the tab | Extension səni izləmir. Tabı bağlayanda nəticələr silinir |
| `privacy.items.3.title` | Open source | Açıq mənbə |
| `privacy.items.3.text` | Read the code and check every claim on this page for yourself | Kodu oxu və bu səhifədəki hər iddianı özün yoxla |
| `faq.eyebrow` | FAQ | Suallar |
| `faq.title` | Questions | Suallar |
| `faq.askBefore` | Something else? | Başqa sualın var? |
| `faq.askLink` | Ask me directly | Birbaşa məndən soruş |
| `faq.items.0.q` | Is Rivaline really free? | Rivaline həqiqətən pulsuzdur? |
| `faq.items.0.a` | Yes. There is no paid plan, no account and no usage limit. | Bəli. Ödənişli plan, hesab və istifadə limiti yoxdur. |
| `faq.items.1.q` | Does it send any data anywhere? | Haraya isə məlumat göndərir? |
| `faq.items.1.a` | No. Rivaline reads the page in your browser and keeps the result in memory until you close the tab. Only your settings are saved, and only on your computer. | Xeyr. Rivaline səhifəni brauzerində oxuyur və nəticəni tabı bağlayana qədər yaddaşda saxlayır. Yalnız ayarların saxlanılır, o da yalnız kompüterində. |
| `faq.items.2.q` | How does it recognize tools? | Alətləri necə tanıyır? |
| `faq.items.2.a` | It matches script addresses, cookie names, page globals and meta tags against its own list of about 130 marketing tools. Every match shows the evidence it found. | Skript ünvanlarını, cookie adlarını, səhifənin qlobal dəyişənlərini və meta teqləri təxminən 130 marketinq alətindən ibarət öz siyahısı ilə tutuşdurur. Hər tapıntı tapdığı sübutu göstərir. |
| `faq.items.3.q` | Can it show a competitor's ad spend? | Rəqibin reklam büdcəsini göstərə bilir? |
| `faq.items.3.a` | No. Ad libraries show which ads are running, not budgets. Rivaline opens those libraries with the search already filled in. | Xeyr. Reklam kitabxanaları büdcəni yox, hansı reklamların getdiyini göstərir. Rivaline həmin kitabxanaları axtarışı artıq doldurulmuş halda açır. |
| `faq.items.4.q` | Why do I click the icon again on a new tab? | Yeni tabda niyə ikona yenidən basmalıyam? |
| `faq.items.4.a` | Rivaline uses Chrome's activeTab permission. It can read a page only after you ask, so it never has access to every site you visit. | Rivaline Chrome-un activeTab icazəsini işlədir. Səhifəni yalnız sən istəyəndən sonra oxuya bilir, ona görə girdiyin bütün saytlara heç vaxt girişi olmur. |
| `faq.items.5.q` | Why does TikTok show only European ads? | TikTok niyə yalnız Avropa reklamlarını göstərir? |
| `faq.items.5.a` | TikTok's ad library covers ads shown in the EU, the EEA, Switzerland and the UK. Rivaline fills in the brand and the country, then you press Search on TikTok's page. | TikTok reklam kitabxanası Aİ, AİZ, İsveçrə və Böyük Britaniyada göstərilən reklamları əhatə edir. Rivaline brendi və ölkəni doldurur, sonra TikTok səhifəsində Search düyməsinə basırsan. |
| `more.eyebrow` | The Line family | Line ailəsi |
| `more.title` | More free tools from the same family | Eyni ailədən daha çox pulsuz alət |
| `more.tools.hitline.text` | See what tracking a site really sends, right in DevTools | Saytın əslində hansı izləmə məlumatını göndərdiyini birbaşa DevTools-da gör |
| `more.tools.hitline.open` | Open Hitline | Hitline-ı aç |
| `more.tools.serpline.text` | Technical SEO and AI search checks for any page | İstənilən səhifə üçün texniki SEO və AI axtarış yoxlamaları |
| `more.tools.serpline.open` | Open Serpline | Serpline-ı aç |
| `more.tools.foldline.text` | Find what stops a landing page from converting | Landing səhifənin konversiyasına nəyin mane olduğunu tap |
| `more.tools.foldline.open` | Open Foldline | Foldline-ı aç |
| `more.tools.markline.text` | Screenshot, mark up and share feedback in seconds | Saniyələr içində ekran şəkli çək, qeyd et və paylaş |
| `more.tools.markline.open` | Open Markline | Markline-ı aç |
| `footer.builtBy` | Built by | Hazırlayan |
| `footer.privacy` | Privacy policy | Məxfilik siyasəti |
| `footer.source` | Source code | Mənbə kodu |
| `uninstall.meta.title` | Sorry to see you go / Rivaline | Getməyinə təəssüf edirik / Rivaline |
| `uninstall.meta.description` | Tell us why you removed Rivaline. One click helps make the next version better. | Rivaline-ı niyə sildiyini bizə de. Bir klik növbəti versiyanı daha yaxşı etməyə kömək edir. |
| `uninstall.titleStart` | Rivaline is removed | Rivaline silindi |
| `uninstall.titleEnd` | What made you leave? | Niyə getdin? |
| `uninstall.lead` | One click helps make the next version better | Bir klik növbəti versiyanı daha yaxşı etməyə kömək edir |
| `uninstall.reasonsLabel` | Reason | Səbəb |
| `uninstall.reasons.0` | It missed tools on a site | Saytda alətləri tapmadı |
| `uninstall.reasons.1` | I only needed it once | Yalnız bir dəfə lazım idi |
| `uninstall.reasons.2` | Too hard to understand | Başa düşmək çətin idi |
| `uninstall.reasons.3` | I use another tool | Başqa alət işlədirəm |
| `uninstall.moreLabel` | Anything else? | Başqa nəsə? |
| `uninstall.optional` | (optional) | (istəyə görə) |
| `uninstall.placeholder` | Which site or tool did it miss? | Hansı saytı və ya aləti tapmadı? |
| `uninstall.send` | Send feedback | Rəy göndər |
| `uninstall.sending` | Sending... | Göndərilir... |
| `uninstall.thanks` | Thank you. Your feedback was sent. | Təşəkkür edirik. Rəyin göndərildi. |
| `uninstall.error` | Sending failed. Please try again in a minute. | Göndərmək alınmadı. Bir dəqiqədən sonra yenidən yoxla. |
| `uninstall.pickOne` | Pick a reason or write a few words. | Səbəb seç və ya bir neçə söz yaz. |
| `uninstall.reinstall` | Reinstall Rivaline | Rivaline-ı yenidən quraşdır |
| `uninstall.card.eyebrow` | Saw gaps on your own site? | Öz saytında boşluq gördün? |
| `uninstall.card.title` | I can close them for you | Onları sənin üçün bağlaya bilərəm |
| `uninstall.card.text` | Analytics, server-side tracking, consent and ad pixels. You get a clear list of what is missing and a working setup | Analitika, server-side izləmə, consent və reklam pikselləri. Nəyin çatışmadığının aydın siyahısını və işləyən quraşdırmanı alırsan |
| `uninstall.card.cta` | Book an audit | Audit sifariş et |
| `uninstall.card.sub` | Shamistan Isayev, analytics and tracking | Shamistan Isayev, analitika və izləmə |
