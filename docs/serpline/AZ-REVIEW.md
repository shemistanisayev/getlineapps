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

Fayl: `apps/serpline/extension/src/i18n/az.ts`. {n}, {type}, {bot} kimi yerlər avtomatik dolur. Yalnız fərqli olan sətirlər göstərilir. `issue.*` sətirləri həm paneldə, həm də audit PDF-də (addım 8) istifadə olunur. "Fix:" / "Həll:" sözündən sonra gələn cümlə kiçik hərflə başlayır.

| Açar | English | Azərbaycanca |
|---|---|---|
| `panel.sections` | Serpline sections | Serpline bölmələri |
| `panel.settings` | Settings | Ayarlar |
| `tab.summary` | Summary | Xülasə |
| `tab.headings` | Headings | Başlıqlar |
| `tab.links` | Links | Linklər |
| `tab.issue` | {n} issue | {n} problem |
| `tab.issues` | {n} issues | {n} problem |
| `cta.help` | Need help fixing these? | Bunları düzəltməyə kömək lazımdır? |
| `cta.audit` | Want a full technical SEO audit? | Tam texniki SEO auditi lazımdır? |
| `cta.render` | Want server-side rendering set up for SEO? | SEO üçün server-side rendering qurmaq istəyirsən? |
| `cta.ai` | Want your site to show up in AI answers? | Saytının AI cavablarında görünməsini istəyirsən? |
| `cta.contact` | Get in touch | Əlaqə saxla |
| `panel.checking` | Reading this page... | Səhifə oxunur... |
| `panel.checkAgain` | Check again | Yenidən yoxla |
| `panel.idle.title` | Check a page | Səhifəni yoxla |
| `panel.idle.text` | Serpline reads a page only when you ask. | Serpline səhifəni yalnız sən istəyəndə oxuyur. |
| `panel.stale.title` | You opened a new page | Yeni səhifə açdın |
| `panel.stale.text` | Serpline reads a page only when you ask, so the results below belong to the previous page. | Serpline səhifəni yalnız sən istəyəndə oxuyur, ona görə aşağıdakı nəticələr əvvəlki səhifəyə aiddir. |
| `panel.checkThis` | Check this page | Bu səhifəni yoxla |
| `panel.shortcut.before` | Or press | Və ya istənilən səhifədə |
| `panel.shortcut.after` | on any page | bas |
| `panel.noAccess` | Click the Serpline icon in the toolbar, or press Alt+Shift+S, to let Serpline read this page. | Serpline-ın bu səhifəni oxuması üçün alətlər panelində onun ikonuna bas və ya Alt+Shift+S düymələrini bas. |
| `panel.restricted.title` | Serpline can't read this page | Serpline bu səhifəni oxuya bilmir |
| `panel.restricted.text` | Chrome does not let extensions read its own pages, the Web Store or PDF files. Open a website and try again. | Chrome extension-lara öz səhifələrini, Web Store-u və PDF faylları oxumağa icazə vermir. Bir sayt aç və yenidən yoxla. |
| `panel.previous` | Previous result | Əvvəlki nəticə |
| `panel.readError.title` | Serpline couldn't read this page | Serpline bu səhifəni oxuya bilmədi |
| `panel.readError.text` | The page answered with something that is not HTML. Try again once it has loaded. | Səhifə HTML olmayan cavab qaytardı. Yüklənəndən sonra yenidən yoxla. |
| `call.checks` | What Serpline checks | Serpline nəyi yoxlayır |
| `call.c.titleDesc` | Title and description | Title və description |
| `call.c.canonical` | Canonical and robots | Canonical və robots |
| `call.c.headings` | Headings | Başlıqlar |
| `call.c.alt` | Image alt text | Şəkillərin alt mətni |
| `call.c.links` | Internal links | Daxili linklər |
| `call.c.schema` | Structured data | Strukturlaşdırılmış data |
| `call.c.render` | Raw HTML vs rendered | Raw HTML və render |
| `call.c.bots` | AI bots in robots.txt | robots.txt-də AI botlar |
| `rd.title` | {percent}% of the text needs JavaScript | Mətnin {percent}%-i JavaScript-dən asılıdır |
| `rd.titleNone` | All the text is in the raw HTML | Bütün mətn raw HTML-dədir |
| `rd.sub` | Raw HTML has {raw} words. The rendered page has {rendered}. | Raw HTML-də {raw} söz var. Render olunmuş səhifədə {rendered}. |
| `rd.barAria` | {raw} of {rendered} words in raw HTML | {rendered} sözdən {raw}-i raw HTML-dədir |
| `rd.inRaw` | In raw HTML | Raw HTML-də |
| `rd.onlyJs` | Only after JavaScript | Yalnız JavaScript-dən sonra |
| `rd.noRaw` | The raw HTML couldn't be downloaded | Raw HTML yüklənmədi |
| `rd.noRawText` | Without it Serpline cannot compare the source with the rendered page. | Onsuz Serpline mənbəni render olunmuş səhifə ilə müqayisə edə bilmir. |
| `rd.tableAria` | Raw HTML compared with the rendered page | Raw HTML render olunmuş səhifə ilə müqayisədə |
| `rd.signal` | Signal | Siqnal |
| `rd.rendered` | Rendered | Render |
| `rd.sig.words` | Words | Sözlər |
| `rd.sig.links` | Links | Linklər |
| `rd.same` | Same | Eyni |
| `rd.none` | None | Yoxdur |
| `rd.missing` | Missing | Yoxdur |
| `rd.present` | Present | Var |
| `rd.changed` | Changed | Fərqlidir |
| `rd.added` | Added by JavaScript | JavaScript ilə əlavə olunan |
| `rd.words` | {n} words | {n} söz |
| `rd.links` | {n} links | {n} link |
| `rd.addedText` | Most AI crawlers read only the raw HTML and miss all of this. | AI crawler-lərin çoxu yalnız raw HTML-i oxuyur və bunların heç birini görmür. |
| `rd.addedFix` | render it on the server. | bunu serverdə render et. |
| `rd.addedNone` | Nothing important is added by JavaScript. Crawlers that skip scripts see the same page. | JavaScript vacib heç nə əlavə etmir. Skriptləri işlətməyən crawler-lər eyni səhifəni görür. |
| `ai.allowedShort` | allowed | icazə |
| `ai.countAria` | {n} of {total} AI bots allowed | {total} AI botdan {n}-nə icazə var |
| `ai.cantCite` | {engine} can't cite this site. | {engine} bu sayta istinad edə bilmir. |
| `ai.cantCiteMany` | {n} answer engines can't cite this site. | {n} AI cavab sistemi bu sayta istinad edə bilmir. |
| `ai.othersRead` | The other answer engines can, but read only {raw} of {rendered} words. | Digərləri edə bilir, amma {rendered} sözdən yalnız {raw}-ni oxuyur. |
| `ai.allSearchAllowed` | AI answer engines can read this site | AI cavab sistemləri bu saytı oxuya bilir |
| `ai.readOnly` | Most of them read only the raw HTML: {raw} of {rendered} words. | Onların çoxu yalnız raw HTML-i oxuyur: {rendered} sözdən {raw}. |
| `ai.readsText` | The page text is in the raw HTML, so crawlers that skip JavaScript read it too. | Səhifənin mətni raw HTML-dədir, ona görə JavaScript işlətməyən crawler-lər də onu oxuyur. |
| `ai.noRobots` | There is no robots.txt, so every bot is allowed. | robots.txt yoxdur, ona görə bütün botlara icazə var. |
| `ai.bots` | AI bots in robots.txt | robots.txt-də AI botlar |
| `ai.group.search` | Search and answers | Axtarış və cavablar |
| `ai.group.training` | Model training | Model təlimi |
| `ai.allowed` | Allowed | İcazə var |
| `ai.allowedStar` | Allowed by * | * ilə icazə var |
| `ai.noRule` | No rule | Qayda yoxdur |
| `ai.blocked` | Blocked | Bloklanıb |
| `ai.more` | {n} more bots | Daha {n} bot |
| `ai.fewer` | Show fewer bots | Daha az bot göstər |
| `ai.files` | Files for crawlers | Crawler-lər üçün fayllar |
| `ai.robotsFound` | Found, {n} lines | Var, {n} sətir |
| `ai.notFound` | Not found | Tapılmadı |
| `ai.unread` | Could not read | Oxunmadı |
| `ai.sitemapListed` | Listed in robots.txt | robots.txt-də göstərilib |
| `ai.sitemapNotListed` | Not listed in robots.txt | robots.txt-də göstərilməyib |
| `ai.llmsFound` | Found | Var |
| `ai.llmsMissing` | Not found, optional | Tapılmadı, istəyə bağlı |
| `set.back` | Back to results | Nəticələrə qayıt |
| `set.checks` | Checks | Yoxlamalar |
| `set.previewOn` | Google preview opens on | Google önizləməsi bununla açılır |
| `set.previewDevice` | Default preview device | Standart önizləmə cihazı |
| `set.autoLinks` | Check internal links on open | Açılanda daxili linkləri yoxla |
| `set.autoLinksHint` | When off, Serpline checks link status only after you press the check button in the Links tab. | Söndürülüb olanda Serpline linklərin statusunu yalnız Links tabındakı yoxlama düyməsini basandan sonra yoxlayır. |
| `set.language` | Language | Dil |
| `set.data` | Your data | Məlumatların |
| `set.clear` | Clear all settings | Bütün ayarları sil |
| `set.cleared` | All settings are cleared. | Bütün ayarlar silindi. |
| `set.privacyNote` | Only these settings are saved, on this computer. Serpline reads the page you are on and its robots.txt from your browser and sends nothing to anyone. | Yalnız bu ayarlar saxlanılır, bu kompüterdə. Serpline açıq olan səhifəni və onun robots.txt faylını brauzerindən oxuyur və heç kimə heç nə göndərmir. |
| `set.more` | More free tools | Daha çox pulsuz alət |
| `set.tool.hitline` | Tracking and analytics | Tracking və analitika |
| `set.tool.rivaline` | Competitor research | Rəqib araşdırması |
| `set.tool.foldline` | Landing page CRO | Landing səhifəsi CRO |
| `set.tool.markline` | Feedback screenshots | Rəy üçün ekran şəkilləri |
| `set.version` | Version {v} | Versiya {v} |
| `set.privacy` | Privacy | Məxfilik |
| `set.contact` | Contact | Əlaqə |
| `list.and` | and | və |
| `rep.eyebrow` | SEO and AI search audit | SEO və AI axtarış auditi |
| `rep.page` | Page checked: {path} | Yoxlanılan səhifə: {path} |
| `rep.tile.score` | SEO score | SEO skoru |
| `rep.tile.high` | high priority | yüksək prioritet |
| `rep.tile.medium` | medium priority | orta prioritet |
| `rep.tile.low` | low priority | aşağı prioritet |
| `rep.pageTitle` | Page | Səhifə |
| `rep.k.canon` | Canonical and robots | Canonical və robots |
| `rep.k.render` | Raw HTML vs rendered | Raw HTML və render |
| `rep.k.links` | Links | Linklər |
| `rep.k.ai` | AI bots | AI botlar |
| `rep.v.title` | {title} ({n} characters) | {title} ({n} simvol) |
| `rep.v.missing` | Missing | Yoxdur |
| `rep.v.descCut` | {n} characters, Google cuts it after {cut} on mobile | {n} simvol, Google mobildə {cut} simvoldan sonra kəsir |
| `rep.v.descFits` | {n} characters, fits in Google | {n} simvol, Google-da sığır |
| `rep.v.noRobots` | no robots meta | robots meta yoxdur |
| `rep.v.words` | {raw} of {rendered} words in raw HTML | raw HTML-də {rendered} sözdən {raw} |
| `rep.v.addedJs` | {items} added by JavaScript | {items} JavaScript ilə əlavə olunur |
| `rep.v.nothingJs` | nothing important added by JavaScript | JavaScript vacib heç nə əlavə etmir |
| `rep.v.noRaw` | The raw HTML could not be downloaded | Raw HTML yüklənmədi |
| `rep.v.linksChecked` | {total} links, {internal} internal checked: {broken} broken, {redirects} redirects | {total} link, {internal} daxili yoxlanıldı: {broken} sınıq, {redirects} yönləndirmə |
| `rep.v.linksUnchecked` | {total} links, {internal} internal, status not checked | {total} link, {internal} daxili, status yoxlanmayıb |
| `rep.v.bots` | {n} of {total} allowed. | {total} botdan {n}-nə icazə var. |
| `rep.v.blocked` | {bots} blocked. | {bots} bloklanıb. |
| `rep.v.llmsFound` | llms.txt found | llms.txt var |
| `rep.v.llmsMissing` | No llms.txt | llms.txt yoxdur |
| `rep.issues` | Issues and fixes | Problemlər və həllər |
| `rep.none.lead` | No issues found. | Problem tapılmadı. |
| `rep.none.text` | The page passes every check Serpline runs. | Səhifə Serpline-ın bütün yoxlamalarından keçir. |
| `rep.lead.BROKEN_LINK` | A link leads to a {status}. | Link {status} səhifəsinə aparır. |
| `rep.lead.BROKEN_LINK.many` | {count} links lead to errors. | {count} link xətaya aparır. |
| `rep.lead.AI_SEARCH_BLOCKED` | {bot} is blocked in robots.txt. | {bot} robots.txt-də bloklanıb. |
| `rep.fix.RAW_H1` | Render the H1 in the server HTML. | H1-i server HTML-ində render et. |
| `rep.fix.RAW_TEXT` | Most AI crawlers see {raw} words. Server-render the main content. | AI crawler-lərin çoxu {raw} söz görür. Əsas məzmunu serverdə render et. |
| `rep.fix.NO_TITLE` | Add a title of 50 to 60 characters, main keyword first. | 50-60 simvolluq title əlavə et, əsas açar söz əvvəldə. |
| `rep.fix.NOINDEX` | Remove noindex if the page should show up in search. | Səhifə axtarışda görünməlidirsə, noindex-i sil. |
| `rep.fix.CANONICAL_OTHER` | Point the canonical to this URL if this page should rank. | Bu səhifə sıralanmalıdırsa, canonical-ı bu URL-ə yönəlt. |
| `rep.fix.SCHEMA_JS` | Put the JSON-LD in the server HTML. | JSON-LD-ni server HTML-inə qoy. |
| `rep.fix.DESC_LONG` | Keep it under 150 characters, key point first. | 150 simvoldan qısa saxla, əsas fikir əvvəldə. |
| `rep.fix.DESC_MISSING` | Add a meta description of about 140 characters. | Təxminən 140 simvolluq meta description əlavə et. |
| `rep.fix.IMG_ALT` | Describe each photo in a few words. | Hər şəkli bir neçə sözlə təsvir et. |
| `rep.fix.OG_DESC` | Shares on social and chat apps show no summary. | Sosial şəbəkələrdə və mesajlaşmada paylaşanda qısa təsvir görünmür. |
| `rep.fix.BROKEN_LINK` | "{text}" points to {href}. | "{text}" {href} ünvanına aparır. |
| `rep.fix.AI_SEARCH_BLOCKED` | Remove the rule if you want {engine} to cite the site. | {engine} sayta istinad etsin istəyirsənsə, qaydanı sil. |
| `rep.fix.H1_MULTI` | Keep one H1 and turn the others into H2s. | Bir H1 saxla, qalanlarını H2 et. |
| `rep.fix.HEADING_SKIP` | Make "{text}" an H{fix}. | "{text}" başlığını H{fix} et. |
| `rep.fix.REDIRECT_LINKS` | Link to {targets} directly. | Birbaşa {targets} ünvanlarına link ver. |
| `rep.fix.TITLE_LONG` | Shorten it and put the main keyword first. | Qısalt və əsas açar sözü əvvələ qoy. |
| `rep.sev.high` | High | Yüksək |
| `rep.sev.medium` | Medium | Orta |
| `rep.sev.low` | Low | Aşağı |
| `rep.cta.title` | Need help fixing these issues? | Bu problemləri düzəltməkdə kömək lazımdır? |
| `rep.cta.sub` | Shamistan Isayev, technical SEO and analytics | Şəmistan İsayev, texniki SEO və analitika |
| `rep.footer` | Made with Serpline. The page was read in your browser and nothing was sent anywhere. | Serpline ilə hazırlanıb. Səhifə brauzerində oxundu və heç yerə heç nə göndərilmədi. |
| `rep.pageOf` | Page {i} of {n} | Səhifə {i} / {n} |
| `rep.making` | Making PDF... | PDF hazırlanır... |
| `rep.failed` | The PDF could not be made. Try again. | PDF hazırlanmadı. Yenidən cəhd et. |
| `sum.checkedAt` | Checked at {time} | Yoxlanıb: {time} |
| `sum.scoreAria` | SEO score {score} of 100 | SEO skoru 100 üzərindən {score} |
| `sum.label.good` | SEO score: good | SEO skoru: yaxşı |
| `sum.label.needs_work` | SEO score: needs work | SEO skoru: düzəliş lazımdır |
| `sum.label.poor` | SEO score: poor | SEO skoru: zəif |
| `sum.counts` | {high} high, {medium} medium, {low} low priority issues | {high} yüksək, {medium} orta, {low} aşağı prioritetli problem |
| `sum.noIssues` | No issues found on this page | Bu səhifədə problem tapılmadı |
| `sum.checks` | On-page checks | Səhifə yoxlamaları |
| `row.alt` | Image alt text | Şəkillərin alt mətni |
| `row.schema` | Structured data | Strukturlaşdırılmış data |
| `st.chars` | {n} characters | {n} simvol |
| `st.cutGoogle` | Cut off in Google | Google-da kəsilir |
| `st.missing` | Missing | Yoxdur |
| `st.canonSelf` | Points to this page | Bu səhifəni göstərir |
| `st.canonOther` | Points to another page | Başqa səhifəni göstərir |
| `st.notSet` | Not set | Təyin olunmayıb |
| `st.h1Js` | Only after JavaScript | Yalnız JavaScript-dən sonra |
| `st.h1Many` | {n} H1s | {n} H1 |
| `st.h1Ok` | One H1 | Bir H1 |
| `st.altMissing` | {m} of {n} missing | {n} şəkildən {m}-də yoxdur |
| `st.altOk` | All {n} have alt | {n} şəklin hamısında var |
| `st.noImages` | No images | Şəkil yoxdur |
| `st.schemaJs` | {type} added by JavaScript | {type} JavaScript ilə əlavə olunur |
| `st.schemaBad` | {n} invalid JSON-LD | {n} səhv JSON-LD |
| `st.none` | None | Yoxdur |
| `st.ogMissing` | {tag} missing | {tag} yoxdur |
| `st.ogOk` | Complete | Tamdır |
| `st.notUsed` | Not used | İstifadə olunmur |
| `st.langs` | {n} languages | {n} dil |
| `serp.title` | Google preview | Google önizləmə |
| `serp.device` | Preview device | Önizləmə cihazı |
| `serp.mobile` | Mobile | Mobil |
| `serp.titleLine` | Title: {n} characters, {px} of {limit} px | Title: {n} simvol, {limit} px-dən {px} |
| `serp.descCut` | Description: {n} characters, cut after {cut} | Description: {n} simvol, {cut}-dən sonra kəsilir |
| `serp.descLine` | Description: {n} characters, {px} of {limit} px | Description: {n} simvol, {limit} px-dən {px} |
| `serp.fits` | Fits | Sığır |
| `serp.tooLong` | Too long | Çox uzundur |
| `serp.noTitle` | No title | Title yoxdur |
| `serp.noDesc` | No description | Description yoxdur |
| `serp.emptyTitle` | Google writes a title for this page | Google bu səhifə üçün title-ı özü yazır |
| `serp.emptyDesc` | Google picks text from the page. | Google mətni səhifədən özü seçir. |
| `hd.highlight` | Highlight on page | Səhifədə işarələ |
| `hd.highlightFailed` | Serpline could not draw on this page. Check it again first. | Serpline bu səhifənin üstündə çəkə bilmədi. Əvvəl səhifəni yenidən yoxla. |
| `hd.outline` | Outline | Struktur |
| `hd.jsOnly` | JavaScript only | Yalnız JavaScript |
| `hd.skips` | Skips H{n} | H{n} atlanıb |
| `hd.extraH1` | Extra H1 | Artıq H1 |
| `hd.noHeadings` | This page has no headings. | Bu səhifədə başlıq yoxdur. |
| `hd.images` | Images | Şəkillər |
| `hd.noAltCount` | {m} of {n} without alt | {n} şəkildən {m}-də alt yoxdur |
| `hd.allAlt` | All images have alt | Bütün şəkillərdə alt var |
| `hd.noImages` | No images on this page. | Bu səhifədə şəkil yoxdur. |
| `hd.noAlt` | No alt | Alt yoxdur |
| `ov.summary` | Serpline highlights: {headings}, {images} | Serpline işarələri: {headings}, {images} |
| `ov.heading` | {n} heading | {n} başlıq |
| `ov.headings` | {n} headings | {n} başlıq |
| `ov.image` | {n} image | {n} şəkil |
| `ov.images` | {n} images | {n} şəkil |
| `ov.addedByJs` | added by JavaScript | JavaScript ilə əlavə olunub |
| `ov.hide` | Hide | Gizlət |
| `ln.links` | links | link |
| `ln.internal` | internal | daxili |
| `ln.external` | external | xarici |
| `ln.checkBtn` | Check {n} internal links | {n} daxili linki yoxla |
| `ln.checkBtn1` | Check 1 internal link | 1 daxili linki yoxla |
| `ln.checking` | Checking {n} internal links... | {n} daxili link yoxlanılır... |
| `ln.checked` | {n} internal links checked | {n} daxili link yoxlanıldı |
| `ln.ok` | {n} OK | {n} qaydasında |
| `ln.redirect` | {n} redirect | {n} yönləndirmə |
| `ln.redirects` | {n} redirects | {n} yönləndirmə |
| `ln.broken` | {n} broken | {n} sınıq |
| `ln.failed` | {n} not reached | {n} cavab vermədi |
| `ln.note` | Checked from this page, one request per link. External links are listed, not checked. | Bu səhifədən yoxlanıldı, hər link üçün bir sorğu. Xarici linklər siyahıdadır, yoxlanılmır. |
| `ln.noteBefore` | Your browser asks this site once for each internal link. External links are listed, not checked. | Brauzerin hər daxili link üçün bu sayta bir dəfə sorğu göndərir. Xarici linklər siyahıdadır, yoxlanılmır. |
| `ln.checkFailed` | The link check could not run. Check the page again, then try once more. | Link yoxlaması işləmədi. Səhifəni yenidən yoxla, sonra bir daha cəhd et. |
| `ln.limit` | Only the first {n} internal URLs are checked. | Yalnız ilk {n} daxili URL yoxlanılır. |
| `ln.noInternal` | No internal links to check. | Yoxlanacaq daxili link yoxdur. |
| `ln.filters` | Filter links | Linkləri süz |
| `ln.f.all` | All | Hamısı |
| `ln.f.issues` | Issues | Problemlər |
| `ln.f.internal` | Internal | Daxili |
| `ln.f.external` | External | Xarici |
| `ln.to` | {from} to {to} | {from} → {to} |
| `ln.noText` | (no text) | (mətn yoxdur) |
| `ln.st.redirect` | Redirect | Yönləndirmə |
| `ln.st.failed` | Not reached | Cavab yoxdur |
| `ln.st.unchecked` | Not checked | Yoxlanmayıb |
| `ln.st.external` | External | Xarici |
| `ln.st.other` | Not a page | Səhifə deyil |
| `ln.empty` | No links in this filter. | Bu süzgəcdə link yoxdur. |
| `fix` | Fix: | Həll: |
| `issue.RAW_H1.title` | The H1 appears only after JavaScript | H1 yalnız JavaScript-dən sonra görünür |
| `issue.RAW_H1.text` | The H1 is not in the HTML the server sends. Crawlers that do not run JavaScript see a page without a main heading. | H1 serverin göndərdiyi HTML-də yoxdur. JavaScript işlətməyən crawler-lər əsas başlığı olmayan səhifə görür. |
| `issue.RAW_H1.fix` | render the H1 in the server HTML. | H1-i server HTML-ində render et. |
| `issue.RAW_TEXT.title` | {percent}% of the text needs JavaScript | Mətnin {percent}%-i JavaScript-dən asılıdır |
| `issue.RAW_TEXT.text` | Raw HTML has {raw} words. The rendered page has {rendered}. Most AI crawlers read only the raw HTML. | Raw HTML-də {raw} söz var. Render olunmuş səhifədə {rendered}. AI crawler-lərin çoxu yalnız raw HTML-i oxuyur. |
| `issue.RAW_TEXT.fix` | render the main content on the server. | əsas məzmunu serverdə render et. |
| `issue.NO_TITLE.title` | The page has no title | Səhifənin title-ı yoxdur |
| `issue.NO_TITLE.text` | Google writes its own title for the result, often a weak one. | Google nəticə üçün öz title-ını yazır, çox vaxt zəif olur. |
| `issue.NO_TITLE.fix` | add a title of 50 to 60 characters, main keyword first. | 50-60 simvolluq title əlavə et, əsas açar söz əvvəldə. |
| `issue.NOINDEX.title` | The page asks not to be indexed | Səhifə indekslənməməyi xahiş edir |
| `issue.NOINDEX.text` | A noindex rule keeps this page out of Google results. | noindex qaydası bu səhifəni Google nəticələrindən kənarda saxlayır. |
| `issue.NOINDEX.fix` | remove noindex if the page should show up in search. | səhifə axtarışda görünməlidirsə, noindex-i sil. |
| `issue.CANONICAL_OTHER.title` | Canonical points to another page | Canonical başqa səhifəni göstərir |
| `issue.CANONICAL_OTHER.text` | Google may index {canonical} instead of this page. | Google bu səhifənin yerinə {canonical} ünvanını indeksləyə bilər. |
| `issue.CANONICAL_OTHER.fix` | point the canonical to this URL if this page should rank. | bu səhifə sıralanmalıdırsa, canonical-ı bu URL-ə yönəlt. |
| `issue.SCHEMA_JS.title` | {type} schema is added by JavaScript | {type} schema JavaScript ilə əlavə olunur |
| `issue.SCHEMA_JS.text` | The structured data appears only after scripts run, so some crawlers never see it. | Strukturlaşdırılmış data yalnız skriptlər işləyəndən sonra yaranır, ona görə bəzi crawler-lər onu heç görmür. |
| `issue.SCHEMA_JS.fix` | put the JSON-LD in the server HTML. | JSON-LD-ni server HTML-inə qoy. |
| `issue.DESC_LONG.title` | The description is cut off in Google | Description Google-da kəsilir |
| `issue.DESC_LONG.text` | It has {length} characters. Google cuts it after {mobile} on mobile and {desktop} on desktop. | Uzunluğu {length} simvoldur. Google onu mobildə {mobile}, desktop-da {desktop} simvoldan sonra kəsir. |
| `issue.DESC_LONG.fix` | keep it under 150 characters, key point first. | 150 simvoldan qısa saxla, əsas fikir əvvəldə. |
| `issue.DESC_MISSING.title` | No meta description | Meta description yoxdur |
| `issue.DESC_MISSING.text` | Google picks a snippet from the page text, which may not sell the page. | Google snippet-i səhifə mətnindən özü seçir, o da səhifəni yaxşı təqdim etməyə bilər. |
| `issue.DESC_MISSING.fix` | add a meta description of about 140 characters. | təxminən 140 simvolluq meta description əlavə et. |
| `issue.IMG_ALT.title` | {count} images have no alt text | {count} şəklin alt mətni yoxdur |
| `issue.IMG_ALT.title1` | An image has no alt text | Bir şəklin alt mətni yoxdur |
| `issue.IMG_ALT.text` | Screen readers and image search get no description of the photo. | Ekran oxuyucuları və şəkil axtarışı şəkil haqqında heç nə bilmir. |
| `issue.IMG_ALT.fix` | describe each photo in a few words. | hər şəkli bir neçə sözlə təsvir et. |
| `issue.OG_DESC.title` | og:description is missing | og:description yoxdur |
| `issue.OG_DESC.text` | Shares on social and chat apps show no summary. | Sosial şəbəkələrdə və mesajlaşmada paylaşanda qısa təsvir görünmür. |
| `issue.OG_DESC.fix` | add an og:description tag. | og:description tag-ı əlavə et. |
| `issue.BROKEN_LINK.title` | {count} links on this page lead to errors | Bu səhifədəki {count} link xətaya aparır |
| `issue.BROKEN_LINK.title1` | A link on this page leads to a {status} | Bu səhifədəki link {status} səhifəsinə aparır |
| `issue.BROKEN_LINK.text` | "{text}" points to a page that no longer exists. Visitors hit a dead end and crawlers spend time on it. | "{text}" artıq olmayan səhifəyə aparır. Ziyarətçi çıxılmaz yerə düşür, crawler-lər isə ona vaxt sərf edir. |
| `issue.BROKEN_LINK.fix` | link to the current URL, or redirect the old one with a 301. | aktual URL-ə link ver və ya köhnəsini 301 ilə yönləndir. |
| `issue.AI_SEARCH_BLOCKED.title` | {bot} and {more} more are blocked | {bot} və daha {more} bot bloklanıb |
| `issue.AI_SEARCH_BLOCKED.title1` | {bot} is blocked | {bot} bloklanıb |
| `issue.AI_SEARCH_BLOCKED.text` | This AI answer engine cannot read or cite the site. | Bu AI cavab sistemi saytı oxuya və ona istinad edə bilmir. |
| `issue.AI_SEARCH_BLOCKED.fix` | remove the rule in robots.txt if you want it to cite the site. | saytına istinad etməsini istəyirsənsə, robots.txt-dəki qaydanı sil. |
| `issue.H1_MULTI.title` | The page has {count} H1s | Səhifədə {count} H1 var |
| `issue.H1_MULTI.text` | Several main headings make the topic of the page less clear. | Bir neçə əsas başlıq səhifənin mövzusunu qeyri-müəyyən edir. |
| `issue.H1_MULTI.fix` | keep one H1 and turn the others into H2s. | bir H1 saxla, qalanlarını H2 et. |
| `issue.HEADING_SKIP.title` | An H{to} follows an H{from} | H{from}-dən sonra H{to} gəlir |
| `issue.HEADING_SKIP.text` | A skipped level breaks the outline crawlers and screen readers use. | Atlanan səviyyə crawler-lərin və ekran oxuyucularının istifadə etdiyi strukturu pozur. |
| `issue.HEADING_SKIP.fix` | make "{text}" an H{fix}. | "{text}" başlığını H{fix} et. |
| `issue.REDIRECT_LINKS.title` | {count} links point to redirects | {count} link yönləndirməyə aparır |
| `issue.REDIRECT_LINKS.title1` | A link points to a redirect | Bir link yönləndirməyə aparır |
| `issue.REDIRECT_LINKS.text` | Each redirect adds a step for visitors and crawlers. | Hər yönləndirmə ziyarətçi və crawler üçün əlavə addımdır. |
| `issue.REDIRECT_LINKS.fix` | link to {targets} directly. | birbaşa {targets} ünvanına link ver. |
| `issue.TITLE_LONG.title` | The title is cut off in Google | Title Google-da kəsilir |
| `issue.TITLE_LONG.text` | It is {px} px wide. Google shows about 600 px. | Eni {px} px-dir. Google təxminən 600 px göstərir. |
| `issue.TITLE_LONG.fix` | shorten it and put the main keyword first. | qısalt və əsas açar sözü əvvələ qoy. |
| `welcome.title` | Serpline is ready. | Serpline hazırdır. |
| `welcome.accent` | See what Google and AI see. | Google və AI nə görür, sən də gör. |
| `welcome.lead` | Open any page and Serpline shows the SEO basics, the content that needs JavaScript and which AI crawlers are allowed in. | İstənilən səhifəni aç: Serpline SEO əsaslarını, JavaScript-ə ehtiyacı olan məzmunu və hansı AI crawler-lərin içəri buraxıldığını göstərir. |
| `welcome.free` | Free | Pulsuz |
| `welcome.noAccount` | No account | Hesab lazım deyil |
| `welcome.local` | Nothing leaves your browser | Heç nə brauzerindən çıxmır |
| `welcome.s1.title` | Pin Serpline to the toolbar | Serpline-ı alətlər panelinə bərkid |
| `welcome.s1.text` | Click the puzzle icon next to the address bar and pin Serpline. | Ünvan sətrinin yanındakı puzzle ikonuna bas və Serpline-ı bərkid. |
| `welcome.s2.title` | Open a page, click the icon | Səhifəni aç, ikona bas |
| `welcome.s2.text` | The side panel opens with the score, the checks and a Google preview. | Side panel skor, yoxlamalar və Google preview ilə açılır. |
| `welcome.s3.title` | Open the Render and AI tabs | Render və AI tablarını aç |
| `welcome.s3.text` | See what needs JavaScript and which AI bots can read the page. Next time press {key}. | Nəyin JavaScript-ə ehtiyacı olduğunu və hansı AI botların səhifəni oxuya bildiyini gör. Növbəti dəfə {key} bas. |
| `welcome.built` | Built by Shamistan Isayev | Müəllif: Şəmistan İsayev |
| `welcome.contact` | Need a technical SEO audit? Get in touch | Texniki SEO auditi lazımdır? Əlaqə saxla |

## Yoxlama addımları və link sayğacı (2026-11-12)

| Açar | English | Azərbaycanca |
|---|---|---|
| `chk.rendered` | Reading the page as the browser shows it | Səhifə brauzerdə göründüyü kimi oxunur |
| `chk.raw` | Fetching the raw HTML | Xam HTML yüklənir |
| `chk.files` | Reading robots.txt and llms.txt | robots.txt və llms.txt oxunur |
| `ln.checkingN` | Checking links: {done} / {total} | Linklər yoxlanılır: {done} / {total} |
| `ln.progress` | Link check progress | Link yoxlamasının gedişi |
