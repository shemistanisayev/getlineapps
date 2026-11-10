# Line ailəsi: fazalarla plan

Məqsəd: getlineapps.com saytını (hub, privacy, 5 landing) və 5 Chrome extension-ı bir monorepoda, ardıcıl olaraq qurmaq. Hər extension Web Store-a çıxacaq formada hazırlanır. Heç bir tool hələ qurulmayıb: hamısı sıfırdan başlayır.

**Əsas qayda:** bir anda bir faza. Hər faza commit, testlər və agentin qısa Azərbaycanca hesabatı ilə bitir. Sən yoxlayırsan və "davam" deyirsən.

---

## Başlanğıc: Claude Code-da necə başlayırsan

1. `Getlineapps.zip` arxivini aç və `Getlineapps` qovluğunu `C:\Users\sabir\OneDrive\Documents\Getlineapps` ünvanına qoy. Qovluğun içində bunlar olmalıdır: `CLAUDE.md`, `README.md`, `docs/`, `design/`.
2. Claude desktop tətbiqində **Code** bölməsini aç və bu qovluğu seç. Bu qovluq repo olacaq.
3. İcazə rejimi olaraq "Accept edits" seç. Terminal əmrləri üçün soruşanda "Yes, don't ask again" seç.
4. Hər fazanı **yeni söhbətdə** başlat və aşağıdakı promptu yapışdır. Qaydalar `CLAUDE.md`-də olduğu üçün prompt qısadır.

**İlk mesajın (Faza 1):**
```
Read CLAUDE.md and docs/line-family-PLAN.md. Do "Faza 1" now. Show a short plan first, then build without more questions. At the end run the checks, commit, push and give me a short report in Azerbaijani.
```

Ondan sonra hər faza üçün: `Do "Faza N" of docs/line-family-PLAN.md.` Daha uzun promptlar aşağıda, hər fazanın içindədir.

**Qeyd:** OneDrive qovluğunda `node_modules` sinxronizasiyanı yavaşlada bilər. Problem olsa, repo-nu `C:\dev\Getlineapps` kimi OneDrive-dan kənar bir yerə köçürə bilərsən; GitHub onsuz da ehtiyat nüsxə olacaq.

---

## Web Store limiti: 2 extension yeri

Yeni publisher hesabı 2 extension yeri ilə başlayır. Limit hər publisher üçün ayrıca təyin olunur (keyfiyyət və istifadəyə görə) və developer dashboard-dan artırılması istənilə bilər.

- **İlk 2 yer:** Hitline və Serpline.
- **Rivaline, Foldline, Markline** tam hazırlanır, `store/<tool>/` paketi yükləməyə hazır qalır və limit artandan sonra yayımlanır.
- **Limit artımını** Hitline və Serpline yayımlanıb ilk istifadəçiləri toplayandan sonra istə.
- **Gözləyən tool-ların landingləri tez açılır:** "Coming soon" göstərilir, "Add to Chrome" düyməsi gizlədilir, free web tool isə işləyir. Belə olanda extension çıxmamış trafik toplanmağa başlayır.
- Limitdən yayınmaq üçün ikinci hesab açma.

## Ümumi baxış

| Faza | Nə | Nəticə |
|---|---|---|
| 0 | Hazırlıq (sən) | Domen, Cloudflare, Resend-ə domen, Web Store hesabı, GitHub |
| 1 | Monorepo, CI, ortaq paketlər | Public GitHub repo, `packages/ui`, `packages/report`, `packages/site-kit`, `LINE_SITE_URL` |
| 2 | getlineapps.com: hub, privacy, sayt qabığı | Canlı `/`, `/privacy/<tool>`, `/404`, rəy formu |
| 3 | Hitline: extension + landing | Store-da (yer 1), `/hitline` canlı |
| 4 | Serpline: extension + landing | Store-da (yer 2), `/serpline` + `#preview` canlı |
| 5 | Rivaline: extension + landing | Paket hazır (limit gözləyir), `/rivaline` + `#finder` canlı |
| 6 | Foldline: extension + landing | Paket hazır (limit gözləyir), `/foldline` + `#calculator` canlı |
| 7 | Markline: extension + landing | Paket hazır (limit gözləyir), `/markline` + `#annotate` canlı |
| 8 | Limit artımı, buraxılış, ölçmə | Qalan 3 tool Store-da, funnel ölçülür |

Faza 3–7-nin hər birinin iki xətti var:
- **A. Extension:** tool-un SPEC fazaları.
- **B. Landing:** `apps/site`-da `/<tool>` route-u və free web tool.

Landing-i core məntiq hazır olandan sonra başlamaq olur, çünki free web tool həmin funksiyaları istifadə edir.

---

## Faza 0: Hazırlıq (sən, kodsuz)

- [ ] **Domen:** `getlineapps.com`-u al və Cloudflare-ə əlavə et. Cloudflare Registrar-dan alsan, DNS avtomatik orada olur.
- [ ] **Resend:** mövcud hesabına (shamistanisayev.com olan) `getlineapps.com`-u ikinci domen kimi əlavə et (pulsuz plan 3 domenə icazə verir). DNS qeydlərini Cloudflare-də təsdiqlə. Açarı özün yaratma: Faza 2-də agent sənə hansı səhifədə nəyə basacağını deyəcək.
- [ ] **Chrome Web Store:** developer hesabın var (2 yer).
- [ ] **GitHub:** hesabın hazır olsun. Repo-nu agent Faza 1-də özü yaradır, sən yalnız brauzerdə "Approve" basırsan.

**Hazırdır:** domen Cloudflare-dədir, Resend-də təsdiqlənib.

---

## Faza 1: Monorepo, CI və ortaq paketlər

Bu faza Hitline SPEC-inin Phase 0–2 hissəsini bütün ailə üçün bir dəfəyə görür.

- Alətlər yoxlanır: Node LTS, pnpm, git, gh, wrangler. Çatmayanlar quraşdırılır.
- Bu qovluq pnpm monorepo olur, `CLAUDE.md`-dəki struktura uyğun. ESLint, Prettier, Vitest, Playwright qoşulur.
- `gh` ilə public GitHub repo (MIT) yaradılır. GitHub Actions CI typecheck, lint, test və build edir.
- Config: `LINE_SITE_URL` + `toolUrl(slug, path, utm?)`.
- `packages/ui`:
  - tokenlər, şriftlər (yerli fayllar)
  - Logo (5 tool) və HubLogo
  - Glyph, Mark, Button, Pill, Card, Table, CTA band
  - extension ikonları (16, 32, 48, 128)
  - köhnə rənglər üçün grep testi
  - preview səhifəsi
- `packages/report`: `buildLineReport(config)`. Rivaline SPEC §8-dəki ortaq düzülüş əsasdır; Hitline-ın PDF-i onun ilk istifadəçisidir.
- `packages/site-kit`: rəy funksiyası (Resend, honeypot, rate limit), consent banner, SEO head.
- `packages/core`: hər tool üçün boş qovluq və test qurğusu.
- `docs/PLAN-REPO.md`: hər tool-un artboardlarının hansı komponentə çevriləcəyinin xəritəsi.

**Hazırdır:** CI yaşıldır, preview səhifəsində 5 tema, HubLogo və komponentlər dizayna uyğundur.

**Sən yoxlayırsan:** GitHub-da repo görünür; agentin göndərdiyi preview şəklində loqolar kanvasdakı kimidir.

**Prompt:**
```
Read CLAUDE.md and docs/line-family-PLAN.md. Do "Faza 1" now: tools check, pnpm monorepo with the layout in CLAUDE.md,
public GitHub repo (MIT) via gh, CI, LINE_SITE_URL + toolUrl, packages/ui (Logo from design/<tool>/Logo.dc.html, HubLogo from design/hub/HubLogo.dc.html,
tokens, fonts, Glyph, Mark, Button, Pill, Card, Table, CTA band, extension icons, retired-color grep test, preview page),
packages/report (buildLineReport, Rivaline SPEC §8 layout), packages/site-kit, empty packages/core/src/<tool>, docs/PLAN-REPO.md.
Short plan first, then build. Checks, commit, push, short report in Azerbaijani.
```

---

## Faza 2: getlineapps.com: hub, privacy və sayt qabığı

Sayt tool-lardan əvvəl qurulur, çünki Web Store hər extension üçün işləyən privacy URL istəyir.

- `apps/site` (Astro), Cloudflare Pages proyekti `getlineapps`, custom domain `getlineapps.com`, `main`-ə hər push-da deploy.
- **Ortaq qabıq:** sticky tünd header, footer, consent banner, `/404`, self-host şriftlər.
- **Mətnlər fayllarda:** `src/content/shared/`, `hub/`, `privacy/<slug>`, EN + AZ, Zod ilə yoxlanılır.
- **`src/content/tools.json`:** hər tool üçün `slug`, `status` (`live` | `soon`), `storeUrl`. Başlanğıcda hamısı `soon`.
- **`/`:** hub (`design/hub/Main.dc.html`, `MainMobile`).
- **`/privacy/<slug>`:** 5 tablı privacy (`design/hub/Privacy.dc.html`, `PrivacyMobile`). `/privacy` ünvanı `/privacy/hitline`-a yönləndirir.
- **`/api/feedback`:** Resend ilə e-mail. Açar `wrangler pages secret put` ilə qoyulur; agent Resend-də hansı düyməyə basacağını deyir.
- **SEO:** sitemap, robots, OG şəkli, JSON-LD.

**Hazırdır:** `https://getlineapps.com` canlıdır, 5 privacy səhifəsi açılır, test rəyi e-mailinə gəlir, Lighthouse mobil 95+.

**Sən yoxlayırsan:** saytı telefonda aç, `docs/site/AZ-REVIEW.md`-də AZ mətnləri oxu.

**Prompt:**
```
Do "Faza 2" of docs/line-family-PLAN.md: apps/site per docs/line-family-domains.md. Shared shell, content collections (EN + AZ, Zod),
src/content/tools.json (all soon), hub at / from design/hub/Main.dc.html, /privacy/<slug> from design/hub/Privacy.dc.html, /privacy -> /privacy/hitline,
/404, /api/feedback via packages/site-kit with Resend (secret by CLI). Deploy to Cloudflare Pages project getlineapps on getlineapps.com.
Lighthouse mobile 95+. Checks, commit, push, short report in Azerbaijani.
```

---

## Faza 3: Hitline (Store yeri 1)

SPEC: `docs/hitline-SPEC.md`. Dizayn: `design/hitline/`. Popup və DevTools paneli, tracking auditi. SPEC-in yuxarısındakı qeydə görə yollar, domen və rənglər ailə qaydalarından gəlir.

### 3A. Extension
| Addım | SPEC | Nə | Hazırdır |
|---|---|---|---|
| 1 | P0 | Hitline planı: artboard → komponent | `docs/hitline/PLAN.md` |
| 2 | P1 | `apps/hitline/extension` scaffold: boş popup və "Hitline" DevTools paneli | Unpacked extension DevTools-da tab göstərir |
| 3 | P3 | `packages/core/src/hitline`: request classifier-lər, sGTM siqnalları, consent, attribution, plan diff, issue qaydaları; Lumo fixture (`apps/fixture`) | Fixture dizayndakı issue-ları verir |
| 4 | P4 | Panel header, Empty, Events, GTM, canlı tutma | Artboardlara uyğundur |
| 5 | P5 | Consent, Attribution, Plan, PlanSetup | Plan yükləmə və export işləyir |
| 6 | P6 | Popup (Main, Empty, Settings), "can't read this page", EN + AZ | Dil popup və paneli dəyişir |
| 7 | P7 | Audit PDF (`buildLineReport` ilə), welcome, uninstall hook | PDF `Report` kimidir |
| 8 | P9 | Store paketi: zip, 5 screenshot, promo, listing mətni | `store/hitline/` |
| 9 | P10 | 3 real saytda QA | Səhv nəticə yoxdur |

### 3B. Landing (`/hitline`)
1. `design/hitline/Landing.dc.html` → `apps/site` route `/hitline` + `src/content/hitline/en.json`, `az.json`.
2. Responsiv 1440 / 820 / 390, animasiyalar CSS ilə, `prefers-reduced-motion`.
3. "Sample audit" modalı, nümunə PDF `/hitline/sample-audit.pdf`.
4. `/hitline/uninstalled` (Uninstall artboardı, `/api/feedback`-ə göndərir).
5. SEO: `SoftwareApplication` və `FAQPage` JSON-LD, OG şəkli.

**Ardıcıllıq:** 3A addım 1–3 → 3B → 3A addım 4–9.

**Sən edirsən:** Phase 6-dan sonra AZ mətnləri yoxlayırsan; Store-a yükləyirsən (`store/hitline/` və `docs/hitline/STORE-LISTING.md`); listing linkini agentə verirsən, o da `tools.json`-da Hitline-ı `live` edir.

**Prompt:**
```
Start Hitline. Read CLAUDE.md, docs/hitline-SPEC.md (note the family override at the top), docs/line-family-domains.md, docs/line-family-colors.md
and Faza 3 of docs/line-family-PLAN.md. SPEC Phases 1-2 are mostly covered by Faza 1, Phase 8 is Faza 3B (route /hitline in apps/site).
Do step 1 (SPEC Phase 0) now and stop. After each step: checks for all apps, commit, push, short report in Azerbaijani, wait for me.
```

---

## Faza 4: Serpline (Store yeri 2)

SPEC: `docs/serpline-SPEC.md`. Dizayn: `design/serpline/`. Side panel, SEO və AI crawler yoxlaması.

### 4A. Extension
| Addım | SPEC | Nə | Hazırdır |
|---|---|---|---|
| 1 | P0 | Plan | `docs/serpline/PLAN.md` |
| 2 | P1 | Scaffold, `Alt+Shift+S`, icazə spike-ı (activeTab, same-origin fetch, `permissions.request`) | Spike real saytda işləyir |
| 3 | P2 | Serpline tema, panel qabığı, crawler badge-ləri, Google nəticə komponenti | Preview |
| 4 | P3 | `packages/seo-core`: extractor-lar, render diff, SERP kəsmə, robots.txt parser, issue qaydaları, skor; Lumo fixture-a Serpline ssenarisi | Skor 56 |
| 5 | P4 | Summary, Headings (səhifədə highlight), Links | Artboardlara uyğundur |
| 6 | P5 | Render, AI, Stale, "can't read this page" | Artboardlara uyğundur |
| 7 | P6 | Settings, EN + AZ | |
| 8 | P7 | Audit PDF, welcome, uninstall hook | PDF `Report` kimidir |
| 9 | P9 | Store paketi | `store/serpline/` |
| 10 | P10 | 3 real saytda QA | |

### 4B. Landing (`/serpline`)
1. `design/serpline/Landing.dc.html` → route + `src/content/serpline/`.
2. Hero, crawler marquee, tab showcase, FAQ.
3. **`#preview` aləti:** `seo-core`-un SERP funksiyaları ilə kiçik island. Title, description və URL daxil edilir, Desktop / Mobile, "Fits" və ya "Cut after N characters".
4. `/serpline/uninstalled`, SEO, sayt səviyyəsində `llms.txt`.

**Ardıcıllıq:** 4A 1–4 → 4B → 4A 5–10.

**Prompt:**
```
Start Serpline. Read CLAUDE.md, docs/serpline-SPEC.md, the family docs and Faza 4 of docs/line-family-PLAN.md.
Follow the family docs where the SPEC disagrees (one site apps/site, landing /serpline, #preview is a section on it, privacy /privacy/serpline already exists).
Reuse packages/ui, packages/report, packages/site-kit and the Lumo fixture. Do step 1 (SPEC Phase 0) and stop.
After each step: checks for all apps, commit, push, short report in Azerbaijani, wait for me.
```

---

## Faza 5: Rivaline (paket hazır, limit gözləyir)

SPEC: `docs/rivaline-SPEC.md`. Dizayn: `design/rivaline/`. Side panel, rəqib araşdırması.

### 5A. Extension
| Addım | SPEC | Nə | Hazırdır |
|---|---|---|---|
| 1 | P0 | API yoxlaması: `sidePanel.open`, activeTab + `executeScript`, `captureVisibleTab`, 4 ad library URL formatı | Hamısı "pass" və ya sual |
| 2 | P1 | Scaffold, `Alt+Shift+R` | Panel açılır |
| 3 | P2 | Rivaline tema, Mark ikonları (ortaq paketlər hazırdır) | Preview |
| 4 | P3 | Stack qaydaları (~120 alət), ID-lər, gap-lər, ad library URL builder-ləri, brand funksiyaları; Kova fixture | 13 alət, 8 kateqoriya, 3 gap |
| 5 | P4 | Scan axını, Stack, StackDetail, Access, Restricted, Empty | Artboardlara uyğundur |
| 6 | P5 | Ads, Brand, BrandExport | Export faylları açılır |
| 7 | P6 | Settings, EN + AZ | |
| 8 | P7 | Competitor report PDF, welcome, uninstall | |
| 9 | P9 | Store paketi | `store/rivaline/` |
| 10 | P10 | 3 real saytda QA | |

### 5B. Landing (`/rivaline`)
1. `design/rivaline/Landing.dc.html` → route + `src/content/rivaline/`.
2. Hero, marquee, tab showcase (Stack, Ads, Brand), FAQ.
3. **`#finder` aləti:** ad library finder (core-dakı URL builder-ləri ilə).
4. Status `soon` ilə tez açılır: "Coming soon" görünür, `#finder` isə işləyir.
5. `/rivaline/uninstalled`, SEO.

**Ardıcıllıq:** 5A 1–4 → 5B (landing tez canlı olur) → 5A 5–10.

**Prompt:** Faza 4 promptu ilə eynidir, tool adı Rivaline, free tool `#finder`. Əlavə et: `Publish the landing early with status soon.`

---

## Faza 6: Foldline (paket hazır, limit gözləyir)

SPEC: `docs/foldline-SPEC.md`. Dizayn: `design/foldline/`. Side panel, landing CRO yoxlaması.

### 6A. Extension
| Addım | SPEC | Nə | Hazırdır |
|---|---|---|---|
| 1 | P0 | API yoxlaması: buffered `PerformanceObserver`, `tabs.sendMessage`, `windows.update` ilə 390 px, maximized və fullscreen, port disconnect | Hamısı "pass" və ya sual |
| 2 | P1 | Scaffold, `Alt+Shift+F` | Panel açılır |
| 3 | P2 | Foldline tema, Glyph ikonları | Preview |
| 4 | P3 | 27 yoxlama, `findMainButton`, skor, `scan.js`; Sunvo fixture | Desktop 56, Mobile 44 |
| 5 | P4 | Scan axını, fold xətti overlay-i, Overview, Issues, Checks, Access, Restricted | Artboardlara uyğundur |
| 6 | P5 | Mobile view, "Show on page", Copy fix, Share | Pəncərə həmişə geri qayıdır |
| 7 | P6 | Settings, EN + AZ (hər yoxlamanın why və fix mətni ilə) | |
| 8 | P7 | Audit PDF, welcome, uninstall | |
| 9 | P9 | Store paketi | `store/foldline/` |
| 10 | P10 | 3 real landing səhifəsində QA | |

### 6B. Landing (`/foldline`)
1. `design/foldline/Landing.dc.html` → route + `src/content/foldline/`.
2. Hero, "27 checks on every page" marquee, tab showcase, FAQ (`FAQPage`).
3. **`#calculator` aləti:** 27 checkbox, core-dakı eyni siyahı və çəkilərlə, default skor 50. Kalkulyator və core eyni skoru verir (unit test).
4. Status `soon` ilə tez açılır, `/foldline/uninstalled`.

**Ardıcıllıq:** 6A 1–4 → 6B → 6A 5–10.

---

## Faza 7: Markline (paket hazır, limit gözləyir)

SPEC: `docs/markline-SPEC.md`. Dizayn: `design/markline/`. Popup və redaktor tabı, feedback screenshot.

### 7A. Extension
| Addım | SPEC | Nə | Hazırdır |
|---|---|---|---|
| 1 | P0 | API yoxlaması: popup activeTab, `captureVisibleTab` limiti, `OffscreenCanvas` ilə birləşdirmə, IndexedDB ilə ötürmə, `clipboard.write`, `file://` | Hamısı "pass" və ya sual |
| 2 | P1 | Scaffold: popup, redaktor, welcome, `Alt+Shift+M` | Popup və boş redaktor açılır |
| 3 | P2 | Markline tema, Glyph, `report`-a `imageWithList` | Digər PDF-lər dəyişmir |
| 4 | P3 | Blur matcher, annotate modeli və `render`, `probe.js`, `fullpage.js`; Bramble fixture | 4 hədəf, `Shot` ilə uyğun |
| 5 | P4 | Popup, Capturing, Restricted, 4 çəkmə rejimi, overlay | SPEC §12 ölçüləri |
| 6 | P5 | Redaktor: alətlər, rənglər, zoom, qeydlər, blur, undo və redo | Artboardlara uyğundur |
| 7 | P6 | Export: PNG, şəkli və qeydləri kopyalama, yükləmə | PNG 1920 x 2512 |
| 8 | P7 | Feedback PDF, Settings, EN + AZ, welcome, uninstall | |
| 9 | P9 | Store paketi | `store/markline/` |
| 10 | P10 | Uzun səhifələr, sticky header, səhv blur testi | |

### 7B. Landing (`/markline`)
1. `design/markline/Landing.dc.html` → route + `src/content/markline/`.
2. Hero mock animasiyası, marquee, tab showcase, FAQ.
3. **`#annotate` aləti:** core-dakı annotate modeli və `render` ilə: şəkli at, yapışdır və ya seç; alətlər, undo; PNG yüklə və ya kopyala. Bramble nümunə şəkli ilə açılır, toxunma ilə də işləyir.
4. Status `soon` ilə tez açılır, `/markline/uninstalled`.

**Ardıcıllıq:** 7A 1–4 → 7B → 7A 5–10.

---

## Faza 8: Limit artımı, buraxılış və ölçmə

1. Hitline və Serpline yayımlanandan sonra ilk istifadəçiləri və reytinqləri gözlə.
2. Developer dashboard-dan limit artımını istə (3 yer: Rivaline, Foldline, Markline).
3. Hər yayımda `tools.json`-da status `live` olur və `storeUrl` doldurulur.
4. Store listingində homepage `getlineapps.com/<slug>`, privacy `getlineapps.com/privacy/<slug>`.
5. Ölçmə: Store linklərinə UTM əlavə olunur. Funnel: landing → "Add to Chrome" klik → install. Sayt analitikası yalnız consent-dən sonra yüklənir; extension-larda analitika yoxdur.
6. A/B testlər trafik yarandıqdan sonra başlayır, variant edge-də seçilir.

---

## Extension-u öz Chrome-unda yoxlamaq (hər tool-un panel addımlarından sonra)

1. Agent `apps/<tool>/extension/.output/chrome-mv3` qovluğunun yerini deyir.
2. Chrome-da `chrome://extensions` aç, "Developer mode"-u yandır, "Load unpacked" bas və həmin qovluğu seç.
3. İstənilən saytda ikona bas. Hitline üçün F12 ilə DevTools-u aç və Hitline tabına keç.
4. Yeni versiyadan sonra extension kartındakı yeniləmə ikonuna bas.

## Web Store-a yükləmə

1. `chrome.google.com/webstore/devconsole` → "New item" → `store/<tool>/<tool>-x.y.z.zip`.
2. Mətnlər `docs/<tool>/STORE-LISTING.md`-dən, şəkillər `store/<tool>/`-dan götürülür.
3. "Submit for review" bas. Təsdiqdən sonra listing linkini agentə yaz.

## Açıq suallar

1. Hər tool üçün QA-da istifadə ediləcək 3 real sayt.
2. Hub, privacy və landinglərin AZ mətnləri: agent yazır, sən yoxlayırsan.
3. Privacy səhifəsində "Last updated" tarixi (buraxılış günü).
