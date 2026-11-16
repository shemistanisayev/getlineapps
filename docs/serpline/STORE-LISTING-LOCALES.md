# Serpline: Chrome Web Store listing in 10 languages

Texts for the localized store listings of Serpline 1.1.2. The English detailed description is in `docs/serpline/STORE-LISTING.md`; this file adds Turkish, Russian, Romanian, Ukrainian, Portuguese, Dutch, Spanish and French. Screenshots per language are in `store/serpline/locales/<code>/screenshots/` (the dashboard takes promo tiles once for all languages, so only the English ones are used) (made by `pnpm store:serpline` from `scripts/store-copy.ts`).

**How the store uses them.** The listing title and the short description come from the manifest, localized through `apps/serpline/extension/public/_locales/<code>/messages.json` (`extName`, `extDescription`). The detailed description is typed per language in the dashboard ("Store listing", language picker).

Store language codes: `en`, `tr`, `ru`, `ro`, `uk`, `pt_BR` and `pt_PT` (same text), `nl`, `es`, `fr`. Chrome has no Azerbaijani locale (`az` is not in its list), so there is no Azerbaijani listing; the AZ rows below are kept for reference only.

## Titles (75 characters max)

| Lang | Title |
|---|---|
| en | Serpline: SEO Checker & AI Crawler Audit for Google, ChatGPT & More |
| az | Serpline: Google, ChatGPT və s. üçün SEO yoxlayıcı və AI crawler auditi |
| tr | Serpline: SEO Kontrol ve AI Tarayıcı Denetimi, Google, ChatGPT ve Fazlası |
| ru | Serpline: SEO-проверка и аудит AI-краулеров для Google, ChatGPT и др. |
| ro | Serpline: Verificator SEO și Audit AI pentru Google, ChatGPT și altele |
| uk | Serpline: SEO-перевірка й аудит AI-краулерів для Google, ChatGPT та ін. |
| pt | Serpline: Verificador SEO e Auditoria de IA para Google, ChatGPT e Mais |
| nl | Serpline: SEO Checker & AI Crawler Audit voor Google, ChatGPT en Meer |
| es | Serpline: Analizador SEO y Auditoría de IA para Google, ChatGPT y Más |
| fr | Serpline : analyse SEO et audit IA pour Google, ChatGPT et plus |

## Short descriptions (132 characters max)

| Lang | Short description |
|---|---|
| en | Technical SEO, JavaScript render and AI crawler checks for the page you're on. Free, no data collected. |
| az | Açıq olan səhifə üçün texniki SEO, JavaScript render və AI crawler yoxlamaları. Pulsuzdur, heç bir data yığmır. |
| tr | Açık olan sayfa için teknik SEO, JavaScript render ve AI tarayıcı kontrolleri. Ücretsiz, hiçbir veri toplanmaz. |
| ru | Технический SEO, рендер JavaScript и проверка AI-краулеров для открытой страницы. Бесплатно, без сбора данных. |
| ro | SEO tehnic, randare JavaScript și verificarea crawlerilor AI pentru pagina deschisă. Gratuit, fără colectare de date. |
| uk | Технічне SEO, рендер JavaScript і перевірка AI-краулерів для відкритої сторінки. Безкоштовно, без збору даних. |
| pt | SEO técnico, renderização JavaScript e verificação de rastreadores de IA na página aberta. Grátis, sem coleta de dados. |
| nl | Technische SEO, JavaScript-rendering en AI-crawlercontroles voor de pagina die je bekijkt. Gratis, zonder dataverzameling. |
| es | SEO técnico, renderizado JavaScript y revisión de rastreadores de IA en la página abierta. Gratis, sin recopilar datos. |
| fr | SEO technique, rendu JavaScript et contrôle des robots d'IA pour la page ouverte. Gratuit, aucune donnée collectée. |

## Detailed descriptions

### Turkish (tr)

```
Sayfanı Google ve yapay zekâ nasıl görüyorsa öyle gör.

Serpline açık olan sayfayı kontrol eder: teknik SEO temelleri, yalnızca JavaScript'ten sonra görünen içerik ve hangi AI tarayıcılarının sayfayı okuyabildiği. Simgeye tıkla (veya Alt+Shift+S) ve sayfanın yanında skor, sorunlar ve her birinin çözümüyle bir yan panel açılır.

ÖZET
- Önceliğe göre ağırlıklandırılmış, 100 üzerinden tek bir SEO skoru
- "Google bu sayfayı indeksleyebilir mi?" sorusuna net cevap: durum kodu, noindex, robots.txt, canonical ve sitemap
- Google'ın ilk okuduğu sayfa temelleri, title ve description'dan yapılandırılmış veriye kadar, her biri net bir durumla
- Google'ın rich result kurallarına göre yapılandırılmış veri kontrolü: Product, Article, FAQ, Breadcrumb ve diğerleri için ne eksik
- hreflang kodları, kendine bağlantı ve diğer dil sürümlerinden dönüş bağlantıları
- Mobil ve masaüstü için Google önizlemesi, piksel ölçülü, Google'ın title ve description'ı tam nerede kestiğiyle

BAŞLIKLAR
- Atlanan seviyeler ve tekrarlanan H1'lerle H1'den H6'ya başlık yapısı
- Yalnızca JavaScript'ten sonra oluşan başlıklar işaretlenir
- "Sayfada vurgula" her başlığı ve alt metni olmayan her görseli doğrudan sayfa üzerinde gösterir

BAĞLANTILAR
- Bağlantı metinleriyle iç, dış ve nofollow bağlantılar
- İç bağlantıların tarayıcından gerçek durum kontrolü: kırık bağlantılar (404, 410, 500) ve yönlendirmeler
- Metni olmayan bağlantılar, "buraya tıklayın" gibi belirsiz metinler ve kendi sayfalarındaki nofollow, doğrudan sayfada vurgulanır

HIZ VE MOBİL
- Ziyaretinin Core Web Vitals değerleri (LCP, CLS ve INP) Google'ın eşikleriyle, ayrıca ilk boyama ve sunucu yanıt süresi
- Türe göre sayfa ağırlığı ve çok ağır, gösterilenden büyük, eski formatta ya da üstte lazy-load edilen her görsel
- Viewport, yana kaydırma, küçük metin ve küçük dokunma hedefleri için mobil kontroller
- Sunucu yanıtı: HTTPS, sıkıştırma ve önbellek başlıkları

RENDER
- Ham HTML ile render edilmiş sayfa yan yana, sinyal sinyal, tarayıcıların neyi kaçırdığını görmek için
- Metnin ne kadarının JavaScript gerektirdiği ve script'lerin tam olarak ne eklediği
- AI tarayıcıları ne görür: okuyabildikleri metin oranı, başlık ve schema, ve aldıkları ilk kelimeler

AI
- Sitenin robots.txt dosyasının hangi AI arama ve eğitim tarayıcılarına izin verdiği ya da onları engellediği, arama botları ve eğitim botları olarak gruplanmış
- Her engellemenin arkasındaki tam robots.txt satırı
- robots.txt, sitemap ve llms.txt tek bakışta

DENETİM PDF'İ
- Tek tık bulguları her sorun ve çözümüyle önceliklendirilmiş bir rapora çevirir, geliştiriciye göndermeye hazır

GİZLİLİK ÖNCELİKLİ
- Hesap yok, sunucu yok, eklentinin içinde analitik yok
- Serpline yalnızca kontrol etmesini istediğin sayfayı okur. O sayfanın ham HTML'ini ve sitenin robots.txt, llms.txt ve sitemap dosyalarını tarayıcından alır
- Bağlantı, canonical ve hreflang kontrolleri yalnızca aynı siteye gider
- Yalnızca ayarların (dil, önizleme cihazı, açılışta bağlantı kontrolü) kaydedilir, o da sadece kendi bilgisayarında
- Minimum izin: aktif sekme, scripting, yan panel ve yerel depolama. Bir siteye erişim yalnızca sen seçtiğinde, her seferinde tek site için istenir
- Açık kaynak: https://github.com/shemistanisayev/getlineapps

Ücretsiz, ücretli plan ve kullanım limiti yok. Geliştiren: Shamistan Isayev, teknik SEO ve analitik danışmanı. Serpline'ın bulduklarını düzeltmek için yardıma mı ihtiyacın var? https://shamistanisayev.com
```

### Russian (ru)

```
Смотрите на страницу так, как её видят Google и ИИ.

Serpline проверяет открытую страницу: базовое техническое SEO, то, что появляется только после JavaScript, и какие AI-краулеры могут её читать. Нажмите на иконку (или Alt+Shift+S), и рядом со страницей откроется боковая панель с оценкой, проблемами и решением для каждой из них.

СВОДКА
- Одна SEO-оценка из 100, взвешенная по приоритету
- Ясный ответ на вопрос «Может ли Google проиндексировать эту страницу?» по коду ответа, noindex, robots.txt, canonical и sitemap
- Базовые элементы, которые Google читает первыми, от title и description до структурированных данных, у каждого понятный статус
- Проверка структурированных данных по правилам расширенных результатов Google: чего не хватает для Product, Article, FAQ, Breadcrumb и других
- Коды hreflang, ссылка на себя и обратные ссылки с других языковых версий
- Превью в Google для мобильных и десктопа, измеренное в пикселях, с точным местом, где Google обрезает title и description

ЗАГОЛОВКИ
- Структура от H1 до H6 с пропущенными уровнями и повторяющимися H1
- Отмечены заголовки, которые появляются только после JavaScript
- «Подсветить на странице» выделяет каждый заголовок и каждое изображение без alt прямо на странице

ССЫЛКИ
- Внутренние, внешние и nofollow-ссылки с их анкорами
- Реальная проверка статуса внутренних ссылок из вашего браузера: битые ссылки (404, 410, 500) и редиректы
- Ссылки без текста, размытые анкоры вроде «нажмите здесь» и nofollow на собственных страницах подсвечиваются прямо на странице

СКОРОСТЬ И МОБИЛЬНЫЕ
- Core Web Vitals вашего визита (LCP, CLS и INP) с порогами Google, а также первая отрисовка и время ответа сервера
- Вес страницы по типам и каждое изображение, которое слишком тяжёлое, больше отображаемого, в старом формате или лениво загружается вверху
- Мобильные проверки: viewport, горизонтальная прокрутка, мелкий текст и маленькие области нажатия
- Ответ сервера: HTTPS, сжатие и заголовки кеширования

РЕНДЕР
- Исходный HTML рядом с отрисованной страницей, сигнал за сигналом, чтобы увидеть, что пропускают краулеры
- Какая часть текста требует JavaScript и что именно добавляют скрипты
- Что видят AI-краулеры: долю текста, заголовок и schema, которые они могут прочитать, и первые слова, которые они получают

ИИ
- Каким AI-краулерам поиска и обучения robots.txt сайта разрешает или запрещает доступ, с разделением на поисковых и обучающих ботов
- Точная строка robots.txt за каждой блокировкой
- robots.txt, sitemap и llms.txt одним взглядом

PDF-АУДИТ
- Один клик превращает находки в отчёт по приоритетам с каждой проблемой и её решением, готовый для отправки разработчику

ПРИВАТНОСТЬ ПО УМОЛЧАНИЮ
- Без аккаунта, без сервера, без аналитики внутри расширения
- Serpline читает только ту страницу, которую вы попросили проверить. Исходный HTML этой страницы и файлы robots.txt, llms.txt и sitemap сайта он получает из вашего браузера
- Проверки ссылок, canonical и hreflang идут только на тот же сайт
- Сохраняются только ваши настройки (язык, устройство превью, проверка ссылок при открытии), и только на вашем компьютере
- Минимум разрешений: активная вкладка, scripting, боковая панель и локальное хранилище. Доступ к сайту запрашивается только когда вы сами его выбираете, по одному сайту
- Открытый исходный код: https://github.com/shemistanisayev/getlineapps

Бесплатно, без платного тарифа и без лимитов. Автор: Shamistan Isayev, консультант по техническому SEO и аналитике. Нужна помощь, чтобы исправить то, что нашёл Serpline? https://shamistanisayev.com
```

### Romanian (ro)

```
Vezi pagina așa cum o văd Google și AI.

Serpline verifică pagina pe care ești: elementele de bază ale SEO-ului tehnic, ce apare doar după JavaScript și ce crawleri AI au voie să o citească. Apasă pe pictogramă (sau Alt+Shift+S) și lângă pagină se deschide un panou lateral cu un scor, problemele și soluția pentru fiecare.

REZUMAT
- Un singur scor SEO din 100, ponderat după prioritate
- Un răspuns clar la „Poate Google să indexeze pagina?” din codul de stare, noindex, robots.txt, canonical și sitemap
- Elementele de bază pe care Google le citește primele, de la title și description la datele structurate, fiecare cu o stare clară
- Datele structurate verificate după regulile Google pentru rich results: ce lipsește pentru Product, Article, FAQ, Breadcrumb și altele
- Codurile hreflang, linkul către sine și linkurile de întoarcere din celelalte versiuni de limbă
- Previzualizare Google pentru mobil și desktop, măsurată în pixeli, cu punctul exact unde Google taie title-ul și description-ul

TITLURI
- Structura de la H1 la H6, cu niveluri sărite și H1 duplicate
- Titlurile care apar doar după JavaScript sunt marcate
- „Evidențiază pe pagină” conturează fiecare titlu și fiecare imagine fără text alt direct pe pagină

LINKURI
- Linkuri interne, externe și nofollow, cu textul lor ancoră
- O verificare reală a stării linkurilor interne din browserul tău: linkuri rupte (404, 410, 500) și redirecționări
- Linkuri fără text, ancore vagi ca „click aici” și nofollow pe propriile pagini, evidențiate direct pe pagină

VITEZĂ ȘI MOBIL
- Core Web Vitals ale vizitei tale (LCP, CLS și INP) cu pragurile Google, plus prima afișare și timpul de răspuns al serverului
- Greutatea paginii pe tipuri și fiecare imagine prea grea, mai mare decât e afișată, într-un format vechi sau cu lazy-load în partea de sus
- Verificări pentru mobil: viewport, derulare laterală, text mic și zone de atingere mici
- Răspunsul serverului: HTTPS, compresie și antete de cache

RANDARE
- HTML-ul brut lângă pagina randată, semnal cu semnal, ca să vezi ce ratează crawlerii
- Cât din text are nevoie de JavaScript și exact ce adaugă scripturile
- Ce văd crawlerii AI: partea din text, titlul și schema pe care le pot citi și primele cuvinte pe care le primesc

AI
- Ce crawleri AI de căutare și de antrenare sunt permiși sau blocați de robots.txt al site-ului, grupați în boți de căutare și boți de antrenare
- Linia exactă din robots.txt din spatele fiecărei blocări
- robots.txt, sitemap și llms.txt dintr-o privire

AUDIT PDF
- Un clic transformă constatările într-un raport pe priorități, cu fiecare problemă și soluția ei, gata de trimis unui developer

CONFIDENȚIALITATE DIN CONSTRUCȚIE
- Fără cont, fără server, fără analytics în extensie
- Serpline citește doar pagina pe care îi ceri să o verifice. Preia HTML-ul brut al acelei pagini și fișierele robots.txt, llms.txt și sitemap ale site-ului din browserul tău
- Verificările de linkuri, canonical și hreflang merg doar către același site
- Se salvează doar setările tale (limba, dispozitivul de previzualizare, verificarea linkurilor la deschidere) și doar pe calculatorul tău
- Permisiuni minime: fila activă, scripting, panou lateral și stocare locală. Accesul la un site se cere doar când îl alegi tu, câte un site
- Open source: https://github.com/shemistanisayev/getlineapps

Gratuit, fără plan plătit și fără limită de utilizare. Creat de Shamistan Isayev, consultant de SEO tehnic și analytics. Ai nevoie de ajutor să rezolvi ce găsește Serpline? https://shamistanisayev.com
```

### Ukrainian (uk)

```
Дивіться на сторінку так, як її бачать Google і ШІ.

Serpline перевіряє відкриту сторінку: базове технічне SEO, те, що з'являється лише після JavaScript, і які AI-краулери можуть її читати. Натисніть на іконку (або Alt+Shift+S), і поруч зі сторінкою відкриється бічна панель з оцінкою, проблемами та рішенням для кожної.

ПІДСУМОК
- Одна SEO-оцінка зі 100, зважена за пріоритетом
- Чітка відповідь на питання «Чи може Google проіндексувати цю сторінку?» за кодом відповіді, noindex, robots.txt, canonical і sitemap
- Базові елементи, які Google читає першими, від title і description до структурованих даних, кожен із зрозумілим статусом
- Перевірка структурованих даних за правилами розширених результатів Google: чого бракує для Product, Article, FAQ, Breadcrumb та інших
- Коди hreflang, посилання на себе й зворотні посилання з інших мовних версій
- Прев'ю в Google для мобільних і десктопа, виміряне в пікселях, з точним місцем, де Google обрізає title і description

ЗАГОЛОВКИ
- Структура від H1 до H6 із пропущеними рівнями та повторюваними H1
- Позначено заголовки, що з'являються лише після JavaScript
- «Підсвітити на сторінці» виділяє кожен заголовок і кожне зображення без alt просто на сторінці

ПОСИЛАННЯ
- Внутрішні, зовнішні та nofollow-посилання з їхніми анкорами
- Реальна перевірка статусу внутрішніх посилань із вашого браузера: биті посилання (404, 410, 500) і редиректи
- Посилання без тексту, розмиті анкори на кшталт «натисніть тут» і nofollow на власних сторінках підсвічуються просто на сторінці

ШВИДКІСТЬ І МОБІЛЬНІ
- Core Web Vitals вашого візиту (LCP, CLS і INP) з порогами Google, а також перше відмальовування й час відповіді сервера
- Вага сторінки за типами й кожне зображення, яке занадто важке, більше за показане, у старому форматі чи ліниво завантажується вгорі
- Мобільні перевірки: viewport, горизонтальне прокручування, дрібний текст і малі зони натискання
- Відповідь сервера: HTTPS, стиснення й заголовки кешування

РЕНДЕР
- Вихідний HTML поруч із відрендереною сторінкою, сигнал за сигналом, щоб побачити, що пропускають краулери
- Яка частина тексту потребує JavaScript і що саме додають скрипти
- Що бачать AI-краулери: частку тексту, заголовок і schema, які вони можуть прочитати, і перші слова, які вони отримують

ШІ
- Яким AI-краулерам пошуку й навчання robots.txt сайту дозволяє або забороняє доступ, з поділом на пошукових і навчальних ботів
- Точний рядок robots.txt за кожним блокуванням
- robots.txt, sitemap і llms.txt одним поглядом

PDF-АУДИТ
- Один клік перетворює знахідки на звіт за пріоритетами з кожною проблемою та її рішенням, готовий для надсилання розробнику

ПРИВАТНІСТЬ ЗА ЗАМОВЧУВАННЯМ
- Без акаунта, без сервера, без аналітики всередині розширення
- Serpline читає лише ту сторінку, яку ви попросили перевірити. Вихідний HTML цієї сторінки та файли robots.txt, llms.txt і sitemap сайту він отримує з вашого браузера
- Перевірки посилань, canonical і hreflang ідуть лише на той самий сайт
- Зберігаються лише ваші налаштування (мова, пристрій прев'ю, перевірка посилань під час відкриття), і лише на вашому комп'ютері
- Мінімум дозволів: активна вкладка, scripting, бічна панель і локальне сховище. Доступ до сайту запитується лише тоді, коли ви його обираєте, по одному сайту
- Відкритий код: https://github.com/shemistanisayev/getlineapps

Безкоштовно, без платного тарифу й без лімітів. Автор: Shamistan Isayev, консультант з технічного SEO та аналітики. Потрібна допомога, щоб виправити те, що знайшов Serpline? https://shamistanisayev.com
```

### Portuguese (pt)

```
Veja a sua página como o Google e a IA a veem.

O Serpline verifica a página em que você está: o básico do SEO técnico, o que só aparece depois do JavaScript e quais rastreadores de IA podem lê-la. Clique no ícone (ou Alt+Shift+S) e um painel lateral se abre ao lado da página com uma nota, os problemas e a correção de cada um.

RESUMO
- Uma única nota de SEO de 0 a 100, ponderada por prioridade
- Uma resposta clara para "O Google pode indexar esta página?" a partir do código de status, noindex, robots.txt, canonical e sitemap
- O básico que o Google lê primeiro, do title e da description até os dados estruturados, cada um com um status claro
- Dados estruturados verificados pelas regras de rich results do Google: o que falta para Product, Article, FAQ, Breadcrumb e outros
- Códigos hreflang, o link para si mesma e os links de volta das outras versões de idioma
- Prévia do Google para celular e desktop, medida em pixels, com o ponto exato em que o Google corta o title e a description

TÍTULOS
- A estrutura de H1 a H6, com níveis pulados e H1 duplicados
- Títulos que só existem depois do JavaScript são marcados
- "Destacar na página" contorna cada título e cada imagem sem texto alt diretamente na página

LINKS
- Links internos, externos e nofollow com o texto âncora
- Uma verificação real do status dos links internos a partir do seu navegador: links quebrados (404, 410, 500) e redirecionamentos
- Links sem texto, âncoras vagas como "clique aqui" e nofollow nas suas próprias páginas, destacados diretamente na página

VELOCIDADE E CELULAR
- Core Web Vitals da sua visita (LCP, CLS e INP) com os limites do Google, além da primeira renderização e do tempo de resposta do servidor
- Peso da página por tipo e cada imagem pesada demais, maior do que é exibida, em formato antigo ou com lazy-load no topo
- Verificações para celular: viewport, rolagem lateral, texto pequeno e áreas de toque pequenas
- A resposta do servidor: HTTPS, compressão e cabeçalhos de cache

RENDERIZAÇÃO
- O HTML bruto ao lado da página renderizada, sinal por sinal, para ver o que os rastreadores perdem
- Quanto do texto precisa de JavaScript e exatamente o que os scripts adicionam
- O que os rastreadores de IA veem: a parte do texto, o título e o schema que conseguem ler e as primeiras palavras que recebem

IA
- Quais rastreadores de IA de busca e de treinamento o robots.txt do site permite ou bloqueia, agrupados em bots de busca e bots de treinamento
- A linha exata do robots.txt por trás de cada bloqueio
- robots.txt, sitemap e llms.txt em um relance

PDF DE AUDITORIA
- Um clique transforma os achados em um relatório por prioridade, com cada problema e a sua correção, pronto para enviar a um desenvolvedor

PRIVACIDADE DESDE A ORIGEM
- Sem conta, sem servidor, sem analytics dentro da extensão
- O Serpline lê só a página que você pede para verificar. Ele busca o HTML bruto dessa página e o robots.txt, o llms.txt e o sitemap do site a partir do seu navegador
- As verificações de links, canonical e hreflang vão só para o mesmo site
- Só as suas configurações (idioma, dispositivo da prévia, verificação de links ao abrir) são salvas, e só no seu computador
- Permissões mínimas: aba ativa, scripting, painel lateral e armazenamento local. O acesso a um site só é pedido quando você o escolhe, um site por vez
- Código aberto: https://github.com/shemistanisayev/getlineapps

Grátis, sem plano pago e sem limite de uso. Criado por Shamistan Isayev, consultor de SEO técnico e analytics. Precisa de ajuda para corrigir o que o Serpline encontra? https://shamistanisayev.com
```

### Dutch (nl)

```
Zie je pagina zoals Google en AI hem zien.

Serpline controleert de pagina waarop je bent: de basis van technische SEO, wat pas na JavaScript verschijnt en welke AI-crawlers hem mogen lezen. Klik op het icoon (of druk op Alt+Shift+S) en naast de pagina opent een zijpaneel met een score, de problemen en de oplossing voor elk ervan.

SAMENVATTING
- Eén SEO-score op 100, gewogen naar prioriteit
- Een duidelijk antwoord op "Kan Google deze pagina indexeren?" op basis van statuscode, noindex, robots.txt, canonical en sitemap
- De basis die Google als eerste leest, van title en description tot gestructureerde data, elk met een duidelijke status
- Gestructureerde data gecontroleerd volgens de rich result-regels van Google: wat ontbreekt voor Product, Article, FAQ, Breadcrumb en meer
- hreflang-codes, de link naar zichzelf en de terugverwijzingen van de andere taalversies
- Google-preview voor mobiel en desktop, gemeten in pixels, met het exacte punt waar Google de title en description afkapt

KOPPEN
- De structuur van H1 tot H6, met overgeslagen niveaus en dubbele H1's
- Koppen die pas na JavaScript bestaan, worden gemarkeerd
- "Markeer op pagina" omlijnt elke kop en elke afbeelding zonder alt-tekst direct op de pagina

LINKS
- Interne, externe en nofollow-links met hun ankertekst
- Een echte statuscheck van interne links vanuit je browser: kapotte links (404, 410, 500) en redirects
- Links zonder tekst, vage ankers zoals "klik hier" en nofollow op je eigen pagina's, direct op de pagina gemarkeerd

SNELHEID EN MOBIEL
- Core Web Vitals van je bezoek (LCP, CLS en INP) met de drempels van Google, plus eerste weergave en serverresponstijd
- Paginagewicht per type en elke afbeelding die te zwaar is, groter dan getoond, in een oud formaat of bovenaan lazy-loaded
- Mobiele checks voor viewport, horizontaal scrollen, kleine tekst en kleine tikdoelen
- De serverrespons: HTTPS, compressie en cacheheaders

RENDERING
- De ruwe HTML naast de gerenderde pagina, signaal voor signaal, om te zien wat crawlers missen
- Hoeveel van de tekst JavaScript nodig heeft en wat scripts precies toevoegen
- Wat AI-crawlers zien: het deel van de tekst, de kop en het schema dat ze kunnen lezen, en de eerste woorden die ze krijgen

AI
- Welke AI-zoek- en trainingscrawlers de robots.txt van de site toestaat of blokkeert, gegroepeerd in zoekbots en trainingsbots
- De exacte robots.txt-regel achter elke blokkade
- robots.txt, sitemap en llms.txt in één oogopslag

AUDIT-PDF
- Eén klik maakt van de bevindingen een rapport op prioriteit, met elk probleem en de oplossing, klaar om naar een developer te sturen

PRIVACY VANAF HET ONTWERP
- Geen account, geen server, geen analytics in de extensie
- Serpline leest alleen de pagina die je laat controleren. Het haalt de ruwe HTML van die pagina en de robots.txt, llms.txt en sitemap van de site op vanuit je browser
- Checks van links, canonical en hreflang gaan alleen naar dezelfde site
- Alleen je instellingen (taal, preview-apparaat, linkcheck bij openen) worden opgeslagen, en alleen op je eigen computer
- Minimale rechten: actief tabblad, scripting, zijpaneel en lokale opslag. Toegang tot een site wordt alleen gevraagd als jij die kiest, één site tegelijk
- Open source: https://github.com/shemistanisayev/getlineapps

Gratis, zonder betaald abonnement en zonder gebruikslimiet. Gemaakt door Shamistan Isayev, consultant voor technische SEO en analytics. Hulp nodig om op te lossen wat Serpline vindt? https://shamistanisayev.com
```

### Spanish (es)

```
Mira tu página como la ven Google y la IA.

Serpline revisa la página en la que estás: lo básico del SEO técnico, lo que solo aparece después de JavaScript y qué rastreadores de IA pueden leerla. Haz clic en el icono (o pulsa Alt+Shift+S) y se abre un panel lateral junto a la página con una puntuación, los problemas y la solución de cada uno.

RESUMEN
- Una sola puntuación SEO sobre 100, ponderada por prioridad
- Una respuesta clara a "¿Puede Google indexar esta página?" a partir del código de estado, noindex, robots.txt, canonical y sitemap
- Lo básico que Google lee primero, del title y la description a los datos estructurados, cada uno con un estado claro
- Datos estructurados revisados con las reglas de resultados enriquecidos de Google: qué falta para Product, Article, FAQ, Breadcrumb y más
- Códigos hreflang, el enlace a sí misma y los enlaces de vuelta de las otras versiones de idioma
- Vista previa de Google para móvil y escritorio, medida en píxeles, con el punto exacto donde Google corta el title y la description

ENCABEZADOS
- La estructura de H1 a H6, con niveles saltados y H1 duplicados
- Se marcan los encabezados que solo existen después de JavaScript
- "Resaltar en la página" marca cada encabezado y cada imagen sin texto alt directamente en la página

ENLACES
- Enlaces internos, externos y nofollow con su texto ancla
- Una comprobación real del estado de los enlaces internos desde tu navegador: enlaces rotos (404, 410, 500) y redirecciones
- Enlaces sin texto, anclas vagas como "haz clic aquí" y nofollow en tus propias páginas, resaltados directamente en la página

VELOCIDAD Y MÓVIL
- Core Web Vitals de tu visita (LCP, CLS e INP) con los umbrales de Google, además del primer pintado y el tiempo de respuesta del servidor
- Peso de la página por tipo y cada imagen demasiado pesada, más grande de lo que se muestra, en un formato antiguo o con lazy-load arriba
- Comprobaciones móviles de viewport, scroll lateral, texto pequeño y áreas táctiles pequeñas
- La respuesta del servidor: HTTPS, compresión y cabeceras de caché

RENDERIZADO
- El HTML sin procesar junto a la página renderizada, señal por señal, para ver lo que se pierden los rastreadores
- Cuánto del texto necesita JavaScript y qué añaden exactamente los scripts
- Lo que ven los rastreadores de IA: la parte del texto, el encabezado y el schema que pueden leer, y las primeras palabras que reciben

IA
- Qué rastreadores de IA de búsqueda y de entrenamiento permite o bloquea el robots.txt del sitio, agrupados en bots de búsqueda y bots de entrenamiento
- La línea exacta del robots.txt detrás de cada bloqueo
- robots.txt, sitemap y llms.txt de un vistazo

PDF DE AUDITORÍA
- Un clic convierte los hallazgos en un informe por prioridad con cada problema y su solución, listo para enviar a un desarrollador

PRIVACIDAD DESDE EL DISEÑO
- Sin cuenta, sin servidor, sin analítica dentro de la extensión
- Serpline solo lee la página que le pides revisar. Obtiene el HTML sin procesar de esa página y el robots.txt, el llms.txt y el sitemap del sitio desde tu navegador
- Las comprobaciones de enlaces, canonical y hreflang van solo al mismo sitio
- Solo se guardan tus ajustes (idioma, dispositivo de la vista previa, comprobar enlaces al abrir), y solo en tu ordenador
- Permisos mínimos: pestaña activa, scripting, panel lateral y almacenamiento local. El acceso a un sitio se pide solo cuando tú lo eliges, un sitio cada vez
- Código abierto: https://github.com/shemistanisayev/getlineapps

Gratis, sin plan de pago y sin límite de uso. Creado por Shamistan Isayev, consultor de SEO técnico y analítica. ¿Necesitas ayuda para corregir lo que encuentra Serpline? https://shamistanisayev.com
```

### French (fr)

```
Voyez votre page comme Google et l'IA la voient.

Serpline vérifie la page sur laquelle vous êtes : les bases du SEO technique, ce qui n'apparaît qu'après JavaScript et quels robots d'IA ont le droit de la lire. Cliquez sur l'icône (ou appuyez sur Alt+Shift+S) et un panneau latéral s'ouvre à côté de la page avec un score, les problèmes et la correction de chacun.

RÉSUMÉ
- Un score SEO sur 100, pondéré par priorité
- Une réponse claire à « Google peut-il indexer cette page ? » à partir du code de statut, du noindex, du robots.txt, du canonical et du sitemap
- Les bases que Google lit en premier, du title et de la description aux données structurées, chacune avec un statut clair
- Données structurées vérifiées selon les règles des résultats enrichis de Google : ce qui manque pour Product, Article, FAQ, Breadcrumb et plus
- Codes hreflang, le lien vers soi-même et les liens retour des autres versions linguistiques
- Aperçu Google sur mobile et ordinateur, mesuré en pixels, avec l'endroit exact où Google coupe le title et la description

TITRES
- La structure de H1 à H6, avec les niveaux sautés et les H1 en double
- Les titres qui n'existent qu'après JavaScript sont signalés
- « Surligner sur la page » encadre chaque titre et chaque image sans texte alt directement sur la page

LIENS
- Liens internes, externes et nofollow avec leur texte d'ancre
- Une vraie vérification du statut des liens internes depuis votre navigateur : liens cassés (404, 410, 500) et redirections
- Liens sans texte, ancres vagues comme « cliquez ici » et nofollow sur vos propres pages, surlignés directement sur la page

VITESSE ET MOBILE
- Les Core Web Vitals de votre visite (LCP, CLS et INP) avec les seuils de Google, plus le premier affichage et le temps de réponse du serveur
- Le poids de la page par type et chaque image trop lourde, plus grande qu'affichée, dans un ancien format ou en lazy-load en haut de page
- Contrôles mobiles du viewport, du défilement horizontal, du texte trop petit et des zones tactiles trop petites
- La réponse du serveur : HTTPS, compression et en-têtes de cache

RENDU
- Le HTML brut à côté de la page rendue, signal par signal, pour voir ce que les robots manquent
- La part du texte qui dépend de JavaScript et ce que les scripts ajoutent exactement
- Ce que voient les robots d'IA : la part du texte, le titre et le schema qu'ils peuvent lire, et les premiers mots qu'ils reçoivent

IA
- Quels robots d'IA de recherche et d'entraînement le robots.txt du site autorise ou bloque, regroupés en robots de recherche et robots d'entraînement
- La ligne exacte du robots.txt derrière chaque blocage
- robots.txt, sitemap et llms.txt en un coup d'œil

PDF D'AUDIT
- Un clic transforme les constats en rapport par priorité, avec chaque problème et sa correction, prêt à envoyer à un développeur

CONFIDENTIEL PAR CONCEPTION
- Pas de compte, pas de serveur, pas d'analytics dans l'extension
- Serpline ne lit que la page que vous lui demandez de vérifier. Il récupère le HTML brut de cette page ainsi que le robots.txt, le llms.txt et le sitemap du site depuis votre navigateur
- Les vérifications des liens, du canonical et du hreflang ne vont que vers ce même site
- Seuls vos paramètres (langue, appareil de l'aperçu, vérification des liens à l'ouverture) sont enregistrés, et uniquement sur votre ordinateur
- Permissions minimales : onglet actif, scripting, panneau latéral et stockage local. L'accès à un site n'est demandé que lorsque vous le choisissez, un site à la fois
- Open source : https://github.com/shemistanisayev/getlineapps

Gratuit, sans offre payante et sans limite d'utilisation. Créé par Shamistan Isayev, consultant en SEO technique et analytics. Besoin d'aide pour corriger ce que Serpline trouve ? https://shamistanisayev.com
```
