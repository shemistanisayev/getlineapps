# Serpline: Azərbaycanca mətnlərin yoxlanması

Agent yazıb, sən yoxlayırsan. Dəyişmək istədiyin sətri burada və ya göstərilən faylda düzəlt (və ya agentə yaz). Alət adları, bot adları, HTML tag-ları və fayl adları (Serpline, GPTBot, robots.txt, H1) tərcümə olunmur. Demo səhifənin mətni (Lumo məhsulu) ingiliscə qalır, çünki o, test saytının öz mətnidir.

## Landing və silinmə səhifəsi

Fayl: `apps/site/src/content/serpline/az.json`. {n}, {chars} kimi yerlər avtomatik dolur. Yalnız fərqli olan sətirlər göstərilir.

| Açar | English | Azərbaycanca |
|---|---|---|
| `meta.title` | Serpline: Free SEO Checker for Google, ChatGPT & More | Serpline: Google, ChatGPT və s. üçün pulsuz SEO yoxlayıcı |
| `meta.description` | Free Chrome extension. Technical SEO checks, JavaScript rendering, a Google preview and AI crawler access for the page you are on, in one side panel. | Pulsuz Chrome extension. Açıq olan səhifə üçün texniki SEO yoxlamaları, JavaScript render, Google önizləməsi və AI crawler girişi bir yan paneldə. |
| `meta.ogAlt` | Serpline: see your page the way Google and AI do. | Serpline: səhifəni Google və AI necə görürsə, elə gör. |
| `nav.label` | Serpline sections | Serpline bölmələri |
| `nav.preview` | SERP preview | SERP önizləmə |
| `nav.features` | Features | İmkanlar |
| `nav.how` | How it works | Necə işləyir |
| `nav.privacy` | Privacy | Məxfilik |
| `nav.faq` | FAQ | Suallar |
| `add.nav` | Add to Chrome | Chrome-a əlavə et |
| `add.hero` | Add to Chrome, it's free | Chrome-a əlavə et, pulsuzdur |
| `add.band` | Add Serpline to Chrome | Serpline-ı Chrome-a əlavə et |
| `add.soonNav` | Coming soon | Tezliklə |
| `add.soonHero` | Coming soon to Chrome | Tezliklə Chrome-da |
| `hero.pill` | Free Chrome extension | Pulsuz Chrome extension |
| `hero.titleStart` | See your page the way | Səhifəni |
| `hero.titleHighlight` | Google and AI | Google və AI |
| `hero.titleEnd` | do. | necə görürsə, elə gör. |
| `hero.lead` | Technical SEO checks, JavaScript rendering and AI crawler access for the page you are on, in one Chrome side panel. | Açıq olan səhifə üçün texniki SEO yoxlamaları, JavaScript render və AI crawler girişi, hamısı bir Chrome yan panelində. |
| `hero.secondary` | Try the SERP preview | SERP önizləməni yoxla |
| `hero.trustLabel` | Serpline is | Serpline |
| `hero.trust[0]` | No account | Hesab lazım deyil |
| `hero.trust[1]` | Nothing leaves your browser | Heç nə brauzerdən çıxmır |
| `hero.trust[2]` | Open source | Açıq mənbə |
| `hero.mock.rendered` | Rendered | Render |
| `hero.mock.scoreAria` | SEO score 56 | SEO skoru 56 |
| `hero.mock.label` | Needs work | Düzəliş lazımdır |
| `hero.mock.issues` | 10 issues found | 10 problem tapıldı |
| `hero.mock.rows[0].status` | Fits | Sığır |
| `hero.mock.rows[1].status` | Cut off | Kəsilir |
| `hero.mock.rows[2].status` | This page | Bu səhifə |
| `hero.mock.rows[3].status` | JS only | Yalnız JS |
| `hero.mock.rows[4].label` | Alt text | Alt mətn |
| `hero.mock.rows[4].status` | 3 missing | 3 yoxdur |
| `hero.mock.rows[5].status` | JS only | Yalnız JS |
| `hero.mock.rows[6].status` | Allowed | İcazə var |
| `hero.mock.rows[7].status` | Blocked | Bloklanıb |
| `hero.serp.note` | Description cut after 107 characters | Description 107 simvoldan sonra kəsilir |
| `hero.toast.line1` | of the text needs | mətn JavaScript-dən |
| `hero.toast.line2` | JavaScript | asılıdır |
| `marquee.title` | Checks what search engines and AI crawlers see | Axtarış sistemlərinin və AI crawler-lərin nə gördüyünü yoxlayır |
| `marquee.items[0].label` | Google preview | Google önizləmə |
| `problem.eyebrow` | The problem | Problem |
| `problem.title` | The page looks fine. Crawlers read something else. | Səhifə qaydasında görünür. Crawler-lər başqa şey oxuyur. |
| `problem.lead` | Most SEO problems never show on screen, so nobody notices them until traffic drops. | SEO problemlərinin çoxu ekranda görünmür, ona görə trafik düşənə qədər heç kim fərqinə varmır. |
| `problem.cards[0].title` | Content that needs JavaScript | JavaScript-dən asılı məzmun |
| `problem.cards[0].text` | Your browser shows the full page. The HTML a crawler downloads can be an empty shell, and most AI crawlers never run the scripts that fill it. | Brauzerin səhifəni tam göstərir. Crawler-in yüklədiyi HTML isə boş qabıq ola bilər, AI crawler-lərin çoxu da onu dolduran skriptləri heç işə salmır. |
| `problem.cards[1].title` | Snippets cut off in Google | Google-da kəsilən snippet-lər |
| `problem.cards[1].text` | A long title or description ends in three dots. The line that was meant to win the click never shows. | Uzun title və ya description üç nöqtə ilə bitir. Klik qazanmalı olan cümlə heç görünmür. |
| `problem.cards[2].title` | AI crawlers blocked by accident | Təsadüfən bloklanan AI crawler-lər |
| `problem.cards[2].text` | One old line in robots.txt can keep a site out of ChatGPT, Claude or Perplexity answers for months. | robots.txt-dəki köhnə bir sətir saytı aylarla ChatGPT, Claude və ya Perplexity cavablarından kənarda saxlaya bilər. |
| `problem.mini.rawWords` | 38 words | 38 söz |
| `problem.mini.after` | After JavaScript | JavaScript-dən sonra |
| `problem.mini.afterWords` | 412 words | 412 söz |
| `problem.mini.blocked` | Blocked | Bloklanıb |
| `preview.eyebrow` | Free tool | Pulsuz alət |
| `preview.title` | Preview your Google result before you publish. | Google nəticəni dərc etməzdən əvvəl gör. |
| `preview.lead` | Type a title and a description. See where Google cuts them on desktop and on mobile. It runs in this page and nothing is sent anywhere. | Title və description yaz. Google-un onları desktop və mobildə harada kəsdiyini gör. Hər şey bu səhifədə işləyir və heç yerə heç nə göndərilmir. |
| `preview.titleLabel` | Page title | Səhifə title-ı |
| `preview.descPlaceholder` | One or two sentences about the page | Səhifə haqqında bir-iki cümlə |
| `preview.googlePreview` | Google preview | Google önizləmə |
| `preview.deviceLabel` | Preview device | Önizləmə cihazı |
| `preview.mobile` | Mobile | Mobil |
| `preview.measure` | {chars} characters, {px} of {limit} px | {chars} simvol, {limit} px-dən {px} |
| `preview.fits` | Fits | Sığır |
| `preview.cut` | Cut after {n} characters | {n} simvoldan sonra kəsilir |
| `preview.addTitle` | Add a title | Title yaz |
| `preview.addDesc` | Add a description | Description yaz |
| `preview.emptyTitle` | Your page title | Səhifənin title-ı |
| `preview.emptyDesc` | Google will pick text from the page. | Google mətni səhifədən özü seçəcək. |
| `preview.note` | Limits are measured in pixels and are approximate. Google can rewrite titles and snippets. | Limitlər piksellə ölçülür və təxminidir. Google title və snippet-i dəyişə bilər. |
| `preview.band` | Check the whole page, not just the snippet. | Yalnız snippet-i yox, bütün səhifəni yoxla. |
| `features.eyebrow` | Inside the side panel | Yan panelin içində |
| `features.title` | Five tabs. One side panel. | Beş tab. Bir yan panel. |
| `features.tabsLabel` | Serpline tabs | Serpline tabları |
| `features.summary.title` | A score and a checklist the moment the panel opens. | Panel açılan kimi skor və yoxlama siyahısı. |
| `features.summary.lead` | Title, description, canonical, robots, H1, alt text, structured data and Open Graph, each with a clear status. | Title, description, canonical, robots, H1, alt mətn, strukturlaşdırılmış data və Open Graph, hər biri aydın statusla. |
| `features.summary.bullets[0]` | One score out of 100, weighted by priority | Prioritetə görə hesablanan 100 üzərindən bir skor |
| `features.summary.bullets[1]` | Google preview for desktop and mobile | Desktop və mobil üçün Google önizləməsi |
| `features.summary.bullets[2]` | Audit PDF with every issue and its fix | Hər problem və onun həlli ilə audit PDF |
| `features.summary.demo.scoreAria` | SEO score 56 | SEO skoru 56 |
| `features.summary.demo.label` | SEO score: needs work | SEO skoru: düzəliş lazımdır |
| `features.summary.demo.counts` | 2 high, 6 medium, 2 low | 2 yüksək, 6 orta, 2 aşağı |
| `features.summary.demo.rows[0].status` | 32 characters | 32 simvol |
| `features.summary.demo.rows[1].status` | Cut off in Google | Google-da kəsilir |
| `features.summary.demo.rows[2].status` | Points to this page | Bu səhifəni göstərir |
| `features.summary.demo.rows[3].status` | Only after JavaScript | Yalnız JavaScript-dən sonra |
| `features.summary.demo.rows[4].status` | og:description missing | og:description yoxdur |
| `features.headings.title` | The outline crawlers see, highlighted on the page. | Crawler-lərin gördüyü struktur, səhifənin üstündə işarələnmiş. |
| `features.headings.lead` | The H1 to H6 tree with skipped levels and duplicate H1s, plus every image without alt text. | Atlanan səviyyələr və təkrar H1-lərlə H1-dən H6-ya qədər ağac, üstəlik alt mətni olmayan hər şəkil. |
| `features.headings.bullets[0]` | Outlines on the page show where each heading sits | Səhifədəki çərçivələr hər başlığın harada olduğunu göstərir |
| `features.headings.bullets[1]` | Headings that exist only after JavaScript are marked | Yalnız JavaScript-dən sonra yaranan başlıqlar işarələnir |
| `features.headings.demo.rows[0].status` | JavaScript only | Yalnız JavaScript |
| `features.headings.demo.rows[4].status` | Skips H3 | H3 atlanıb |
| `features.links.title` | Broken and redirected links, found from the page itself. | Sınıq və yönləndirilən linklər, birbaşa səhifənin özündən. |
| `features.links.lead` | Internal, external and nofollow links with anchor text. Internal links get a real status check from your browser. | Anchor mətni ilə daxili, xarici və nofollow linklər. Daxili linklərin statusunu brauzerin real yoxlayır. |
| `features.links.bullets[0]` | 404s and redirect chains in one list | 404-lər və yönləndirmə zəncirləri bir siyahıda |
| `features.links.bullets[1]` | Only the site you are on is contacted | Yalnız açıq olduğun sayta sorğu gedir |
| `features.links.demo.internal` | internal | daxili |
| `features.links.demo.external` | external | xarici |
| `features.links.demo.issues` | issues | problem |
| `features.links.demo.rows[1].path` | /headphones to /electronics/headphones | /headphones → /electronics/headphones |
| `features.links.demo.rows[2].path` | /returns to /help/returns | /returns → /help/returns |
| `features.render.title` | Raw HTML next to the rendered page. | Raw HTML render olunmuş səhifənin yanında. |
| `features.render.lead` | Serpline downloads the page source once and compares it with what JavaScript built: headings, words, links and structured data. | Serpline səhifənin mənbəyini bir dəfə yükləyir və JavaScript-in qurduğu ilə müqayisə edir: başlıqlar, sözlər, linklər və strukturlaşdırılmış data. |
| `features.render.bullets[0]` | Shows exactly which elements need JavaScript | Hansı elementlərin JavaScript-dən asılı olduğunu dəqiq göstərir |
| `features.render.bullets[1]` | The check most SEO extensions skip | SEO extension-ların çoxunun atladığı yoxlama |
| `features.render.demo.rawValue` | 38 words, no H1 | 38 söz, H1 yoxdur |
| `features.render.demo.rendered` | Rendered | Render |
| `features.render.demo.renderedValue` | 412 words, 1 H1 | 412 söz, 1 H1 |
| `features.render.demo.words` | 374 words | 374 söz |
| `features.ai.title` | Which AI crawlers can read the site, and what they see. | Hansı AI crawler-lər saytı oxuya bilir və nə görürlər. |
| `features.ai.lead` | Rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended and more from robots.txt, split into search bots and training bots, plus llms.txt. | robots.txt-dən GPTBot, ClaudeBot, PerplexityBot, Google-Extended və başqaları üçün qaydalar, axtarış və təlim botlarına bölünmüş, üstəlik llms.txt. |
| `features.ai.bullets[0]` | The exact robots.txt line behind every block | Hər bloklamanın arxasındakı dəqiq robots.txt sətri |
| `features.ai.bullets[1]` | How much of the page a crawler without JavaScript reads | JavaScript işlətməyən crawler səhifənin nə qədərini oxuyur |
| `features.ai.demo.rows[0].status` | Allowed | İcazə var |
| `features.ai.demo.rows[1].status` | Allowed | İcazə var |
| `features.ai.demo.rows[2].status` | Blocked | Bloklanıb |
| `features.ai.demo.rows[3].status` | Allowed | İcazə var |
| `features.ai.demo.rows[4].status` | Blocked | Bloklanıb |
| `features.ai.demo.llmsStatus` | Not found | Tapılmadı |
| `how.eyebrow` | How it works | Necə işləyir |
| `how.title` | Three steps, no setup. | Üç addım, quraşdırma yoxdur. |
| `how.steps[0].title` | Add Serpline to Chrome | Serpline-ı Chrome-a əlavə et |
| `how.steps[0].text` | Free from the Chrome Web Store. No account to create. | Chrome Web Store-dan pulsuz. Hesab açmaq lazım deyil. |
| `how.steps[1].title` | Open a page, click the icon | Səhifə aç, ikona bas |
| `how.steps[1].text` | The side panel opens next to the page and checks it. Or press | Yan panel səhifənin yanında açılır və onu yoxlayır. Və ya bas: |
| `how.steps[2].title` | Download the audit PDF | Audit PDF-i yüklə |
| `how.steps[2].text` | Every issue with its fix, ready to send to a developer. | Hər problem həlli ilə birlikdə, developerə göndərməyə hazır. |
| `audit.titleStart` | Found problems? | Problem tapdın? |
| `audit.titleHighlight` | Get them fixed | Onları Serpline-ı quran adam |
| `audit.titleEnd` | by the person who built Serpline. | düzəltsin. |
| `audit.text` | One click turns the findings into a prioritized report. Send it to a developer, or send it to me: I fix technical SEO, server-side rendering, structured data and AI search visibility. | Bir klik tapıntıları prioritetli hesabata çevirir. Onu developerə göndər, ya da mənə: texniki SEO, server-side render, strukturlaşdırılmış data və AI axtarışda görünmə ilə bağlı problemləri düzəldirəm. |
| `audit.cta` | Book an SEO audit | SEO audit istə |
| `audit.from` | From | Müəllif: |
| `audit.paper.date` | Nov 7, 2026 | 7 noy 2026 |
| `audit.paper.eyebrow` | SEO and AI search audit | SEO və AI axtarış auditi |
| `audit.paper.score` | score | skor |
| `audit.paper.high` | high | yüksək |
| `audit.paper.medium` | medium | orta |
| `audit.paper.rows[0].label` | High | Yüksək |
| `audit.paper.rows[0].strong` | The H1 appears only after JavaScript. | H1 yalnız JavaScript-dən sonra görünür. |
| `audit.paper.rows[0].text` | Render it on the server. | Onu serverdə render et. |
| `audit.paper.rows[1].label` | High | Yüksək |
| `audit.paper.rows[1].strong` | 91% of the text needs JavaScript. | Mətnin 91%-i JavaScript-dən asılıdır. |
| `audit.paper.rows[2].label` | Medium | Orta |
| `audit.paper.rows[2].strong` | PerplexityBot is blocked. | PerplexityBot bloklanıb. |
| `audit.paper.rows[2].text` | Remove the rule in robots.txt. | robots.txt-dəki qaydanı sil. |
| `audit.paper.ctaText` | Need help fixing these? | Düzəltməkdə kömək lazımdır? |
| `audit.paper.ctaButton` | Get in touch | Əlaqə saxla |
| `privacy.eyebrow` | Privacy | Məxfilik |
| `privacy.title` | Your pages stay in your browser. | Səhifələrin brauzerində qalır. |
| `privacy.items[0].title` | No server | Server yoxdur |
| `privacy.items[0].text` | Every check runs inside Chrome. Serpline has no backend to send pages to. | Bütün yoxlamalar Chrome-un içində gedir. Serpline-ın səhifələri göndərə biləcəyi backend yoxdur. |
| `privacy.items[1].title` | Minimal permissions | Minimum icazə |
| `privacy.items[1].text` | The active tab, the side panel and local settings. No access to all your sites. | Aktiv tab, yan panel və lokal ayarlar. Bütün saytlarına giriş yoxdur. |
| `privacy.items[2].title` | No analytics inside | İçində analitika yoxdur |
| `privacy.items[2].text` | The extension doesn't track you. Results disappear when you close the panel. | Extension səni izləmir. Paneli bağlayanda nəticələr yox olur. |
| `privacy.items[3].title` | Open source | Açıq mənbə |
| `privacy.items[3].text` | Read the code and check every claim on this page yourself. | Kodu oxu və bu səhifədəki hər iddianı özün yoxla. |
| `faq.eyebrow` | FAQ | Suallar |
| `faq.title` | Questions | Suallar |
| `faq.askBefore` | Something else? | Başqa sualın var? |
| `faq.askLink` | Ask me directly | Birbaşa məndən soruş |
| `faq.items[0].q` | Is Serpline really free? | Serpline həqiqətən pulsuzdur? |
| `faq.items[0].a` | Yes. There is no paid plan, no account and no usage limit. | Bəli. Pullu plan, hesab və istifadə limiti yoxdur. |
| `faq.items[1].q` | How is it different from Ahrefs or Screaming Frog? | Ahrefs və ya Screaming Frog-dan nə ilə fərqlənir? |
| `faq.items[1].a` | Those crawl whole sites from a server or from your desktop. Serpline checks the page you are on, inside your browser, including what changes after JavaScript and what AI crawlers are allowed to read. It works well next to them. | Onlar bütün saytı serverdən və ya kompüterindən crawl edir. Serpline isə açıq olan səhifəni brauzerinin içində yoxlayır, JavaScript-dən sonra nəyin dəyişdiyi və AI crawler-lərin nəyi oxuya bildiyi də daxil. Onlarla yanaşı yaxşı işləyir. |
| `faq.items[2].q` | How does it check AI search? | AI axtarışı necə yoxlayır? |
| `faq.items[2].a` | It reads robots.txt and llms.txt on the site, matches the rules for each known AI crawler and compares the raw HTML with the rendered page, because most AI crawlers don't run JavaScript. | Saytdakı robots.txt və llms.txt fayllarını oxuyur, hər tanınmış AI crawler üçün qaydaları uyğunlaşdırır və raw HTML-i render olunmuş səhifə ilə müqayisə edir, çünki AI crawler-lərin çoxu JavaScript işlətmir. |
| `faq.items[3].q` | Does it crawl my whole site? | Bütün saytımı crawl edir? |
| `faq.items[3].a` | No. It checks the open page, the site's robots.txt and llms.txt, and the status of internal links on that page. | Xeyr. Açıq səhifəni, saytın robots.txt və llms.txt fayllarını və həmin səhifədəki daxili linklərin statusunu yoxlayır. |
| `faq.items[4].q` | Does it send my pages anywhere? | Səhifələrimi haraya isə göndərir? |
| `faq.items[4].a` | No. Requests go only to the site you are on, from your own browser. Nothing reaches me or anyone else. | Xeyr. Sorğular yalnız açıq olduğun sayta, öz brauzerindən gedir. Heç nə mənə və ya başqasına çatmır. |
| `more.eyebrow` | The Line family | Line ailəsi |
| `more.title` | More free tools from the same family | Eyni ailədən daha çox pulsuz alət |
| `more.tools.hitline.text` | Every tracking hit, GTM tag and consent signal in DevTools. | Hər tracking hit, GTM tag və consent siqnalı DevTools-da. |
| `more.tools.hitline.open` | Open Hitline | Hitline-ı aç |
| `more.tools.rivaline.text` | A competitor's stack, ads and brand style in one panel. | Rəqibin texnologiyaları, reklamları və brend stili bir paneldə. |
| `more.tools.rivaline.open` | Open Rivaline | Rivaline-ı aç |
| `more.tools.foldline.text` | Find what stops a landing page from converting. | Landing səhifəsinin konversiyasına nəyin mane olduğunu tap. |
| `more.tools.foldline.open` | Open Foldline | Foldline-ı aç |
| `more.tools.markline.text` | Screenshot, mark up and share feedback in seconds. | Saniyələr içində ekran şəkli çək, qeyd et və rəy paylaş. |
| `more.tools.markline.open` | Open Markline | Markline-ı aç |
| `footer.builtBy` | Built by | Müəllif: |
| `footer.privacy` | Privacy policy | Məxfilik siyasəti |
| `footer.source` | Source code | Mənbə kodu |
| `uninstall.meta.title` | Sorry to see you go \| Serpline | Getməyinə təəssüf edirik \| Serpline |
| `uninstall.meta.description` | Tell us why you removed Serpline. One click helps make the next version better. | Serpline-ı niyə sildiyini yaz. Bir klik növbəti versiyanı daha yaxşı edir. |
| `uninstall.titleStart` | Serpline is removed. | Serpline silindi. |
| `uninstall.titleEnd` | What made you leave? | Niyə getdin? |
| `uninstall.lead` | One click helps make the next version better. | Bir klik növbəti versiyanı daha yaxşı edir. |
| `uninstall.reasonsLabel` | Reason | Səbəb |
| `uninstall.reasons[0]` | It missed problems on my site | Saytımdakı problemləri tapmadı |
| `uninstall.reasons[1]` | I only needed it once | Cəmi bir dəfə lazım idi |
| `uninstall.reasons[2]` | Too hard to understand | Başa düşmək çətindir |
| `uninstall.reasons[3]` | I use another tool | Başqa alətdən istifadə edirəm |
| `uninstall.moreLabel` | Anything else? | Başqa nəsə? |
| `uninstall.optional` | (optional) | (istəyə bağlı) |
| `uninstall.placeholder` | Which page or check did it miss? | Hansı səhifəni və ya yoxlamanı buraxdı? |
| `uninstall.send` | Send feedback | Rəyi göndər |
| `uninstall.sending` | Sending... | Göndərilir... |
| `uninstall.thanks` | Thank you. Your feedback was sent. | Təşəkkürlər. Rəyin göndərildi. |
| `uninstall.error` | Sending failed. Please try again in a minute. | Göndərmək alınmadı. Bir dəqiqədən sonra yenə yoxla. |
| `uninstall.pickOne` | Pick a reason or write a few words. | Bir səbəb seç və ya bir neçə söz yaz. |
| `uninstall.reinstall` | Reinstall Serpline | Serpline-ı yenidən quraşdır |
| `uninstall.card.eyebrow` | Still have an SEO problem? | SEO problemin hələ də var? |
| `uninstall.card.title` | I can audit and fix it for you. | Auditini edib düzəldə bilərəm. |
| `uninstall.card.text` | Technical SEO, JavaScript rendering, structured data and AI search visibility. You get a clear list of what is broken and fixes your developers can ship. | Texniki SEO, JavaScript render, strukturlaşdırılmış data və AI axtarışda görünmə. Nəyin xarab olduğunun aydın siyahısını və developerlərinin tətbiq edə biləcəyi həlləri alırsan. |
| `uninstall.card.cta` | Book an SEO audit | SEO audit istə |
| `uninstall.card.sub` | Shamistan Isayev, technical SEO and analytics | Şəmistan İsayev, texniki SEO və analitika |

## Extension (side panel, welcome)

Fayl: `apps/serpline/extension/src/i18n/az.ts`. Tam siyahı addım 7-də (Settings və i18n) əlavə olunacaq, panelin bütün ekranları hazır olandan sonra.
