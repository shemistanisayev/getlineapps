# Hitline: Chrome Web Store listing in 10 languages

Texts for the localized store listings of Hitline 1.2.2. The English detailed description is in `docs/hitline/STORE-LISTING.md`; this file adds Turkish, Russian, Romanian, Ukrainian, Portuguese, Dutch, Spanish and French. Screenshots and promo tiles per language are in `store/hitline/locales/<code>/` (made by `pnpm store:hitline` from `scripts/store-copy.ts`).

**How the store uses them.** The listing title and the short description come from the manifest, localized through `apps/hitline/extension/public/_locales/<code>/messages.json` (`extName`, `extDescription`). The detailed description is typed per language in the dashboard ("Store listing", language picker).

Store language codes: `en`, `tr`, `ru`, `ro`, `uk`, `pt_BR` and `pt_PT` (same text), `nl`, `es`, `fr`. Chrome has no Azerbaijani locale (`az` is not in its list), so there is no Azerbaijani listing; the AZ rows below are kept for reference only.

## Titles (75 characters max)

| Lang | Title |
|---|---|
| en | Hitline: Tracking Debugger for GA4, Meta, TikTok & More |
| az | Hitline: GA4, Meta, TikTok və s. üçün tracking debugger |
| tr | Hitline: İzleme Hata Ayıklayıcı, GA4, Meta, TikTok ve Daha Fazlası |
| ru | Hitline: отладчик трекинга для GA4, Meta, TikTok и не только |
| ro | Hitline: Debugger de tracking pentru GA4, Meta, TikTok și altele |
| uk | Hitline: налагоджувач трекінгу для GA4, Meta, TikTok та інших |
| pt | Hitline: Depurador de Rastreamento para GA4, Meta, TikTok e Mais |
| nl | Hitline: Tracking Debugger voor GA4, Meta, TikTok en Meer |
| es | Hitline: Depurador de Tracking para GA4, Meta, TikTok y Más |
| fr | Hitline : débogueur de tracking pour GA4, Meta, TikTok et plus |

## Short descriptions (132 characters max)

| Lang | Short description |
|---|---|
| en | See events from GA4, Meta, TikTok and 47 more platforms, read GTM tags and catch consent leaks in Chrome DevTools. |
| az | GA4, Meta, TikTok və daha 47 platformanın eventlərini gör, GTM tag-larını oxu, consent sızmalarını DevTools-da tut. |
| tr | GA4, Meta, TikTok ve diğer 47 platformun eventlerini gör, GTM etiketlerini oku, consent sızıntılarını DevTools'ta yakala. |
| ru | События GA4, Meta, TikTok и ещё 47 платформ, теги GTM и утечки согласия (consent) прямо в Chrome DevTools. |
| ro | Evenimente GA4, Meta, TikTok și încă 47 de platforme, taguri GTM și scurgeri de consimțământ, direct în Chrome DevTools. |
| uk | Події GA4, Meta, TikTok та ще 47 платформ, теги GTM і витоки згоди (consent) просто в Chrome DevTools. |
| pt | Veja eventos do GA4, Meta, TikTok e mais 47 plataformas, leia tags do GTM e encontre vazamentos de consentimento no DevTools. |
| nl | Bekijk events van GA4, Meta, TikTok en 47 andere platforms, lees GTM-tags en vind consentlekken in Chrome DevTools. |
| es | Ve eventos de GA4, Meta, TikTok y 47 plataformas más, lee las etiquetas de GTM y detecta fugas de consentimiento en DevTools. |
| fr | Voyez les événements GA4, Meta, TikTok et 47 autres plateformes, lisez les balises GTM et repérez les fuites de consentement. |

## Detailed descriptions

### Turkish (tr)

```
Tracking'in çalışıyor mu? Tek panelde kanıtla.

Hitline bir sayfada hangi tracking'in çalıştığını, nereye gittiğini, consent'e uyup uymadığını ve attribution'ın ziyaret boyunca korunup korunmadığını gösterir. Bir tık özet verir, DevTools tüm resmi gösterir, bir tık daha bulguları denetim PDF'ine çevirir.

NELERİ OKUR
- 50 platform: analitik, reklam pikselleri, oturum kaydı, CRM, etiket yöneticileri, A/B test araçları ve dataLayer
- Kendi servislerin de: Ayarlar'da bir ad ve URL'nin bir parçasıyla özel platform ekle

POPUP'TA
- Bulunduğun site, popup açık kaldıkça canlı güncellenir
- Sayfada bulunan platformlar event sayılarıyla ve server-side GTM sonucu
- Son eventler, tek tıkla detaylarıyla
- Öne çıkan sorunlar ve kısa bir denetim PDF'i

CHROME DEVTOOLS'TA (F12'ye bas, Hitline sekmesini aç)
- Eventler: her hit ve her dataLayer push'u, en yenisi üstte, tüm parametreler çözülmüş, hesap ID'si ve rotasıyla (tarayıcı, server-side GTM veya sayfa). Yeni eventler geldikçe vurgulanır
- GTM ve sGTM: her etiket tetikleyicisi, consent kontrolleri ve durumuyla, her dataLayer eventi üzerinde çalışan etiketlerle, server-side GTM dört sinyalle kontrol edilir
- Kontroller: reklam ve analitik platformlarına giden e-posta adresleri, iki kez gönderilen eventler, sipariş ID'si olmayan satın almalar, değeri olmayan eventler
- Consent: Consent Mode v2 varsayılanları ve ziyaretçinin seçimi, seçimden önce ve sonrasının zaman çizelgesi, her sızıntı için GTM çözümü
- Attribution: UTM ve gclid sayfa sayfa izlenir, cross-domain kopmaları ve istenmeyen referral'lar bulunur, düzelten GA4 ayarıyla birlikte
- Tracking planı: planını CSV veya JSON olarak yükle, eksik veya yanlış parametreli eventleri gör
- Denetim PDF'i: platformlar ve ID'ler, eventler, GTM etiketleri, consent zaman çizelgesi, ziyaret yolu ve her sorun, neden önemli olduğu ve nasıl düzeltileceğiyle

GİZLİLİK ÖNCELİKLİ
- Hesap yok, sunucu yok, eklentinin içinde analitik yok
- Her şey tarayıcında analiz edilir. Hitline kendi adına hiçbir ağ isteği yapmaz
- Yalnızca ayarların (dil, kendi domainlerin, tracking planları, özel platformlar) kaydedilir, o da sadece kendi bilgisayarında
- Minimum izin: aktif sekme, scripting, yerel depolama ve DevTools paneli. Tüm sitelerine erişim yok
- Açık kaynak: https://github.com/shemistanisayev/getlineapps

Ücretsiz, ücretli plan ve kullanım limiti yok. Geliştiren: Shamistan Isayev, analitik ve server-side tracking danışmanı. Hitline'ın bulduklarını düzeltmek için yardıma mı ihtiyacın var? https://shamistanisayev.com
```

### Russian (ru)

```
Ваш трекинг работает? Докажите это в одной панели.

Hitline показывает, какой трекинг срабатывает на странице, куда уходят данные, соблюдается ли согласие посетителя (consent) и сохраняется ли атрибуция на протяжении визита. Один клик даёт сводку, DevTools показывает полную картину, ещё один клик превращает находки в PDF-аудит.

ЧТО ОН ЧИТАЕТ
- 50 платформ: аналитика, рекламные пиксели, запись сессий, CRM, менеджеры тегов, инструменты A/B-тестов и dataLayer
- И ваши собственные сервисы: добавьте свою платформу в настройках, указав название и часть её URL

ВО ВСПЛЫВАЮЩЕМ ОКНЕ
- Текущий сайт, данные обновляются вживую, пока окно открыто
- Найденные на странице платформы с числом событий и вердикт по server-side GTM
- Последние события, подробности по одному клику
- Главные проблемы и короткий PDF-аудит

В CHROME DEVTOOLS (нажмите F12 и откройте вкладку Hitline)
- События: каждый хит и каждый push в dataLayer, новые сверху, все параметры расшифрованы, с ID аккаунта и маршрутом (браузер, server-side GTM или страница). Новые события подсвечиваются при появлении
- GTM и sGTM: каждый тег с триггером, проверками согласия и статусом, каждое событие dataLayer с тегами, которые на нём сработали, server-side GTM проверяется по четырём сигналам
- Проверки: адреса e-mail, отправленные в рекламные и аналитические платформы, события, отправленные дважды, покупки без ID заказа, события без ценности
- Согласие: значения по умолчанию Consent Mode v2 и выбор посетителя, хронология до и после выбора и исправление в GTM для каждой утечки
- Атрибуция: UTM и gclid отслеживаются от страницы к странице, находятся разрывы cross-domain и нежелательные рефералы, с настройкой GA4, которая это исправляет
- План трекинга: загрузите свой план в CSV или JSON и увидите, каких событий не хватает и где параметры неверны
- PDF-аудит: платформы и ID, события, теги GTM, хронология согласия, путь визита и каждая проблема с объяснением, почему она важна и как её исправить

ПРИВАТНОСТЬ ПО УМОЛЧАНИЮ
- Без аккаунта, без сервера, без аналитики внутри расширения
- Всё анализируется в вашем браузере. Hitline сам не делает никаких сетевых запросов
- Сохраняются только ваши настройки (язык, ваши домены, планы трекинга, свои платформы), и только на вашем компьютере
- Минимум разрешений: активная вкладка, scripting, локальное хранилище и панель DevTools. Нет доступа ко всем вашим сайтам
- Открытый исходный код: https://github.com/shemistanisayev/getlineapps

Бесплатно, без платного тарифа и без лимитов. Автор: Shamistan Isayev, консультант по аналитике и server-side трекингу. Нужна помощь, чтобы исправить то, что нашёл Hitline? https://shamistanisayev.com
```

### Romanian (ro)

```
Tracking-ul tău funcționează? Dovedește-o într-un singur panou.

Hitline arată ce tracking se declanșează pe o pagină, unde ajung datele, dacă respectă alegerea de consimțământ a vizitatorului și dacă atribuirea rezistă pe tot parcursul vizitei. Un clic îți dă un rezumat, DevTools îți arată imaginea completă, iar încă un clic transformă constatările într-un audit PDF.

CE CITEȘTE
- 50 de platforme: analytics, pixeli de reclame, înregistrare de sesiuni, CRM, managere de taguri, instrumente de testare A/B și dataLayer
- Și serviciile tale: adaugă o platformă proprie în Setări, cu un nume și o parte din URL-ul ei

ÎN POPUP
- Site-ul pe care ești, actualizat live cât timp popup-ul e deschis
- Platformele găsite pe pagină, cu numărul de evenimente, și verdictul pentru server-side GTM
- Ultimele evenimente, cu detaliile la un clic
- Problemele principale și un audit PDF scurt

ÎN CHROME DEVTOOLS (apasă F12 și deschide fila Hitline)
- Evenimente: fiecare hit și fiecare push în dataLayer, cele mai noi primele, cu toți parametrii decodați, ID-ul contului și ruta (browser, server-side GTM sau pagină). Evenimentele noi se evidențiază când apar
- GTM și sGTM: fiecare tag cu triggerul, verificările de consimțământ și starea lui, fiecare eveniment dataLayer cu tagurile declanșate pe el, iar server-side GTM verificat prin patru semnale
- Verificări: adrese de e-mail trimise către platforme de reclame și analytics, evenimente trimise de două ori, achiziții fără ID de comandă, evenimente fără valoare
- Consimțământ: valorile implicite Consent Mode v2 și alegerea vizitatorului, o cronologie înainte și după alegere și soluția în GTM pentru fiecare scurgere
- Atribuire: UTM și gclid urmărite pagină cu pagină, întreruperi cross-domain și referral-uri nedorite găsite, cu setarea GA4 care le rezolvă
- Plan de tracking: încarcă planul tău ca CSV sau JSON și vezi ce evenimente lipsesc sau au parametri greșiți
- Audit PDF: platforme și ID-uri, evenimente, taguri GTM, cronologia consimțământului, traseul vizitei și fiecare problemă, cu motivul pentru care contează și cum se rezolvă

CONFIDENȚIALITATE DIN CONSTRUCȚIE
- Fără cont, fără server, fără analytics în extensie
- Totul se analizează în browserul tău. Hitline nu face nicio cerere de rețea proprie
- Se salvează doar setările tale (limba, domeniile tale, planurile de tracking, platformele proprii) și doar pe calculatorul tău
- Permisiuni minime: fila activă, scripting, stocare locală și panoul DevTools. Fără acces la toate site-urile tale
- Open source: https://github.com/shemistanisayev/getlineapps

Gratuit, fără plan plătit și fără limită de utilizare. Creat de Shamistan Isayev, consultant de analytics și server-side tracking. Ai nevoie de ajutor să rezolvi ce găsește Hitline? https://shamistanisayev.com
```

### Ukrainian (uk)

```
Ваш трекінг працює? Доведіть це в одній панелі.

Hitline показує, який трекінг спрацьовує на сторінці, куди йдуть дані, чи дотримується він згоди відвідувача (consent) і чи зберігається атрибуція протягом візиту. Один клік дає підсумок, DevTools показує повну картину, ще один клік перетворює знахідки на PDF-аудит.

ЩО ВІН ЧИТАЄ
- 50 платформ: аналітика, рекламні пікселі, запис сесій, CRM, менеджери тегів, інструменти A/B-тестів і dataLayer
- І ваші власні сервіси: додайте свою платформу в налаштуваннях, вказавши назву й частину її URL

У СПЛИВАЮЧОМУ ВІКНІ
- Поточний сайт, дані оновлюються наживо, поки вікно відкрите
- Знайдені на сторінці платформи з кількістю подій і вердикт щодо server-side GTM
- Останні події, деталі одним кліком
- Головні проблеми й короткий PDF-аудит

У CHROME DEVTOOLS (натисніть F12 і відкрийте вкладку Hitline)
- Події: кожен хіт і кожен push у dataLayer, нові зверху, усі параметри розшифровані, з ID акаунта й маршрутом (браузер, server-side GTM або сторінка). Нові події підсвічуються, щойно з'являються
- GTM і sGTM: кожен тег із тригером, перевірками згоди та статусом, кожна подія dataLayer із тегами, що на ній спрацювали, server-side GTM перевіряється за чотирма сигналами
- Перевірки: адреси e-mail, надіслані в рекламні й аналітичні платформи, події, надіслані двічі, покупки без ID замовлення, події без цінності
- Згода: типові значення Consent Mode v2 і вибір відвідувача, хронологія до й після вибору та виправлення в GTM для кожного витоку
- Атрибуція: UTM і gclid відстежуються від сторінки до сторінки, знаходяться розриви cross-domain і небажані реферали, разом із налаштуванням GA4, яке це виправляє
- План трекінгу: завантажте свій план у CSV або JSON і побачите, яких подій бракує і де параметри хибні
- PDF-аудит: платформи й ID, події, теги GTM, хронологія згоди, шлях візиту й кожна проблема з поясненням, чому вона важлива і як її виправити

ПРИВАТНІСТЬ ЗА ЗАМОВЧУВАННЯМ
- Без акаунта, без сервера, без аналітики всередині розширення
- Усе аналізується у вашому браузері. Hitline сам не робить жодних мережевих запитів
- Зберігаються лише ваші налаштування (мова, ваші домени, плани трекінгу, власні платформи), і лише на вашому комп'ютері
- Мінімум дозволів: активна вкладка, scripting, локальне сховище й панель DevTools. Немає доступу до всіх ваших сайтів
- Відкритий код: https://github.com/shemistanisayev/getlineapps

Безкоштовно, без платного тарифу й без лімітів. Автор: Shamistan Isayev, консультант з аналітики та server-side трекінгу. Потрібна допомога, щоб виправити те, що знайшов Hitline? https://shamistanisayev.com
```

### Portuguese (pt)

```
O seu tracking está funcionando? Prove em um único painel.

O Hitline mostra qual tracking dispara em uma página, para onde os dados vão, se ele respeita o consentimento do visitante e se a atribuição sobrevive à visita. Um clique dá um resumo, o DevTools mostra o quadro completo e mais um clique transforma os achados em um PDF de auditoria.

O QUE ELE LÊ
- 50 plataformas: analytics, pixels de anúncios, gravação de sessão, CRM, gerenciadores de tags, ferramentas de teste A/B e o dataLayer
- Os seus próprios serviços também: adicione uma plataforma personalizada nas Configurações com um nome e uma parte da URL

NO POPUP
- O site em que você está, atualizado ao vivo enquanto o popup fica aberto
- As plataformas encontradas na página com a contagem de eventos e o veredito sobre o server-side GTM
- Os eventos mais recentes, com os detalhes em um clique
- Os principais problemas e um PDF de auditoria curto

NO CHROME DEVTOOLS (pressione F12 e abra a aba Hitline)
- Eventos: cada hit e cada push no dataLayer, os mais novos primeiro, com todos os parâmetros decodificados, o ID da conta e a rota (navegador, server-side GTM ou página). Novos eventos se destacam ao chegar
- GTM e sGTM: cada tag com o acionador, as verificações de consentimento e o status, cada evento do dataLayer com as tags disparadas nele, e o server-side GTM verificado com quatro sinais
- Verificações: endereços de e-mail enviados a plataformas de anúncios e analytics, eventos enviados duas vezes, compras sem ID de pedido, eventos sem valor
- Consentimento: os padrões do Consent Mode v2 e a escolha do visitante, uma linha do tempo antes e depois da escolha e a correção no GTM para cada vazamento
- Atribuição: UTM e gclid seguidos página a página, quebras de cross-domain e referências indesejadas encontradas, com a configuração do GA4 que as corrige
- Plano de tracking: carregue o seu plano em CSV ou JSON e veja quais eventos faltam ou têm parâmetros errados
- PDF de auditoria: plataformas e IDs, eventos, tags do GTM, a linha do tempo de consentimento, o caminho da visita e cada problema com o motivo de importar e como corrigir

PRIVACIDADE DESDE A ORIGEM
- Sem conta, sem servidor, sem analytics dentro da extensão
- Tudo é analisado no seu navegador. O Hitline não faz nenhuma requisição de rede própria
- Só as suas configurações (idioma, os seus domínios, planos de tracking, plataformas personalizadas) são salvas, e só no seu computador
- Permissões mínimas: aba ativa, scripting, armazenamento local e o painel do DevTools. Sem acesso a todos os seus sites
- Código aberto: https://github.com/shemistanisayev/getlineapps

Grátis, sem plano pago e sem limite de uso. Criado por Shamistan Isayev, consultor de analytics e server-side tracking. Precisa de ajuda para corrigir o que o Hitline encontra? https://shamistanisayev.com
```

### Dutch (nl)

```
Werkt je tracking? Bewijs het in één paneel.

Hitline laat zien welke tracking op een pagina afgaat, waar de data naartoe gaat, of de toestemmingskeuze van de bezoeker wordt gerespecteerd en of de attributie het hele bezoek overeind blijft. Eén klik geeft een samenvatting, DevTools toont het volledige beeld en nog één klik maakt van de bevindingen een audit-PDF.

WAT HET LEEST
- 50 platforms: analytics, advertentiepixels, sessie-opnames, CRM, tagmanagers, A/B-testtools en de dataLayer
- Ook je eigen diensten: voeg in Instellingen een eigen platform toe met een naam en een deel van de URL

IN DE POPUP
- De site waarop je bent, live bijgewerkt zolang de popup open is
- De platforms op de pagina met hun aantal events, en het oordeel over server-side GTM
- De nieuwste events, met de details in één klik
- De belangrijkste problemen en een korte audit-PDF

IN CHROME DEVTOOLS (druk op F12 en open het tabblad Hitline)
- Events: elke hit en elke dataLayer-push, nieuwste eerst, met alle parameters gedecodeerd, het account-ID en de route (browser, server-side GTM of pagina). Nieuwe events lichten op zodra ze binnenkomen
- GTM en sGTM: elke tag met trigger, consentchecks en status, elk dataLayer-event met de tags die erop afgingen, en server-side GTM gecontroleerd met vier signalen
- Checks: e-mailadressen die naar advertentie- en analyticsplatforms gaan, dubbel verstuurde events, aankopen zonder order-ID, events zonder waarde
- Consent: de standaardwaarden van Consent Mode v2 en de keuze van de bezoeker, een tijdlijn voor en na de keuze, en de GTM-oplossing voor elk lek
- Attributie: UTM en gclid pagina voor pagina gevolgd, cross-domain breuken en ongewenste referrals gevonden, met de GA4-instelling die ze oplost
- Trackingplan: laad je plan als CSV of JSON en zie welke events ontbreken of verkeerde parameters hebben
- Audit-PDF: platforms en ID's, events, GTM-tags, de consenttijdlijn, het bezoekpad en elk probleem met waarom het telt en hoe je het oplost

PRIVACY VANAF HET ONTWERP
- Geen account, geen server, geen analytics in de extensie
- Alles wordt in je browser geanalyseerd. Hitline doet zelf geen enkel netwerkverzoek
- Alleen je instellingen (taal, je eigen domeinen, trackingplannen, eigen platforms) worden opgeslagen, en alleen op je eigen computer
- Minimale rechten: actief tabblad, scripting, lokale opslag en het DevTools-paneel. Geen toegang tot al je sites
- Open source: https://github.com/shemistanisayev/getlineapps

Gratis, zonder betaald abonnement en zonder gebruikslimiet. Gemaakt door Shamistan Isayev, consultant voor analytics en server-side tracking. Hulp nodig om op te lossen wat Hitline vindt? https://shamistanisayev.com
```

### Spanish (es)

```
¿Tu tracking funciona? Demuéstralo en un solo panel.

Hitline muestra qué tracking se dispara en una página, adónde van los datos, si respeta el consentimiento del visitante y si la atribución sobrevive a la visita. Un clic te da un resumen, DevTools te muestra el panorama completo y otro clic convierte los hallazgos en un PDF de auditoría.

QUÉ LEE
- 50 plataformas: analítica, píxeles de anuncios, grabación de sesiones, CRM, gestores de etiquetas, herramientas de test A/B y el dataLayer
- También tus propios servicios: añade una plataforma personalizada en Ajustes con un nombre y una parte de su URL

EN EL POPUP
- El sitio en el que estás, actualizado en vivo mientras el popup sigue abierto
- Las plataformas encontradas en la página con su número de eventos y el veredicto sobre server-side GTM
- Los últimos eventos, con sus detalles en un clic
- Los problemas principales y un PDF de auditoría breve

EN CHROME DEVTOOLS (pulsa F12 y abre la pestaña Hitline)
- Eventos: cada hit y cada push al dataLayer, los más nuevos primero, con todos los parámetros decodificados, el ID de cuenta y la ruta (navegador, server-side GTM o página). Los eventos nuevos se resaltan al llegar
- GTM y sGTM: cada etiqueta con su activador, sus comprobaciones de consentimiento y su estado, cada evento del dataLayer con las etiquetas que se dispararon en él, y server-side GTM comprobado con cuatro señales
- Comprobaciones: direcciones de e-mail enviadas a plataformas de anuncios y analítica, eventos enviados dos veces, compras sin ID de pedido, eventos sin valor
- Consentimiento: los valores por defecto de Consent Mode v2 y la elección del visitante, una cronología antes y después de la elección y la solución en GTM para cada fuga
- Atribución: UTM y gclid seguidos página a página, cortes de cross-domain y referencias no deseadas detectados, con el ajuste de GA4 que los corrige
- Plan de tracking: carga tu plan en CSV o JSON y mira qué eventos faltan o tienen parámetros incorrectos
- PDF de auditoría: plataformas e IDs, eventos, etiquetas de GTM, la cronología de consentimiento, el recorrido de la visita y cada problema con por qué importa y cómo corregirlo

PRIVACIDAD DESDE EL DISEÑO
- Sin cuenta, sin servidor, sin analítica dentro de la extensión
- Todo se analiza en tu navegador. Hitline no hace ninguna petición de red propia
- Solo se guardan tus ajustes (idioma, tus dominios, planes de tracking, plataformas personalizadas), y solo en tu ordenador
- Permisos mínimos: pestaña activa, scripting, almacenamiento local y el panel de DevTools. Sin acceso a todos tus sitios
- Código abierto: https://github.com/shemistanisayev/getlineapps

Gratis, sin plan de pago y sin límite de uso. Creado por Shamistan Isayev, consultor de analítica y server-side tracking. ¿Necesitas ayuda para corregir lo que encuentra Hitline? https://shamistanisayev.com
```

### French (fr)

```
Votre tracking fonctionne ? Prouvez-le dans un seul panneau.

Hitline montre quel tracking se déclenche sur une page, où partent les données, s'il respecte le consentement du visiteur et si l'attribution tient pendant toute la visite. Un clic donne un résumé, DevTools montre la vue complète, et un clic de plus transforme les constats en PDF d'audit.

CE QU'IL LIT
- 50 plateformes : analytics, pixels publicitaires, enregistrement de sessions, CRM, gestionnaires de balises, outils de test A/B et le dataLayer
- Vos propres services aussi : ajoutez une plateforme personnalisée dans les Paramètres avec un nom et une partie de son URL

DANS LA POPUP
- Le site sur lequel vous êtes, mis à jour en direct tant que la popup reste ouverte
- Les plateformes trouvées sur la page avec leur nombre d'événements, et le verdict sur le server-side GTM
- Les derniers événements, avec leurs détails en un clic
- Les principaux problèmes et un court PDF d'audit

DANS CHROME DEVTOOLS (appuyez sur F12 et ouvrez l'onglet Hitline)
- Événements : chaque hit et chaque push dans le dataLayer, les plus récents en premier, avec tous les paramètres décodés, l'ID du compte et la route (navigateur, server-side GTM ou page). Les nouveaux événements s'allument à leur arrivée
- GTM et sGTM : chaque balise avec son déclencheur, ses contrôles de consentement et son statut, chaque événement du dataLayer avec les balises qui s'y sont déclenchées, et le server-side GTM vérifié avec quatre signaux
- Contrôles : adresses e-mail envoyées aux plateformes publicitaires et analytics, événements envoyés deux fois, achats sans ID de commande, événements sans valeur
- Consentement : les valeurs par défaut de Consent Mode v2 et le choix du visiteur, une chronologie avant et après le choix, et la correction GTM pour chaque fuite
- Attribution : UTM et gclid suivis page après page, ruptures cross-domain et référents indésirables détectés, avec le réglage GA4 qui les corrige
- Plan de tracking : chargez votre plan en CSV ou JSON et voyez quels événements manquent ou ont des paramètres erronés
- PDF d'audit : plateformes et ID, événements, balises GTM, la chronologie du consentement, le parcours de la visite et chaque problème avec pourquoi il compte et comment le corriger

CONFIDENTIEL PAR CONCEPTION
- Pas de compte, pas de serveur, pas d'analytics dans l'extension
- Tout est analysé dans votre navigateur. Hitline n'effectue aucune requête réseau de lui-même
- Seuls vos paramètres (langue, vos domaines, plans de tracking, plateformes personnalisées) sont enregistrés, et uniquement sur votre ordinateur
- Permissions minimales : onglet actif, scripting, stockage local et le panneau DevTools. Aucun accès à tous vos sites
- Open source : https://github.com/shemistanisayev/getlineapps

Gratuit, sans offre payante et sans limite d'utilisation. Créé par Shamistan Isayev, consultant en analytics et server-side tracking. Besoin d'aide pour corriger ce que Hitline trouve ? https://shamistanisayev.com
```
