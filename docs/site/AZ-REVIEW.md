# getlineapps.com: Azərbaycanca mətnlərin yoxlanması

Saytın bütün AZ mətnlərini agent yazıb. Səndən xahiş: oxu və düzəlişləri birbaşa fayllarda et (GitHub-da faylı aç, qələm ikonuna bas, dəyiş, "Commit changes"). Hər push saytı avtomatik yeniləyir. Struktur sınsa (məsələn, dırnaq silinsə), build dayanır və sayt köhnə versiyada qalır.

Canlı baxmaq: `https://getlineapps.com/az` və `https://getlineapps.com/az/privacy/hitline` (domen hələ qoşulmayıbsa: `https://getlineapps.pages.dev/az`).

## Fayllar

| Fayl | Nə var |
| --- | --- |
| `apps/site/src/content/shared/az.json` | Header, footer, cookie banner, 404 |
| `apps/site/src/content/hub/az.json` | Ana səhifə: hero, alətlər, "Bir səhifə, beş sual", söz, veb alətlər, suallar, haqqında |
| `apps/site/src/content/privacy/page.az.json` | Məxfilik səhifəsinin ortaq hissəsi (başlıq, bölmə adları, "Bu sayt", "Dəyişikliklər") |
| `apps/site/src/content/privacy/<tool>.az.json` | Hər alətin öz məxfilik mətni (5 fayl) |

İngiliscə əsli eyni adlı `en.json` fayllarındadır. AZ faylında açarlar və siyahıların uzunluğu EN ilə eyni qalmalıdır (test bunu yoxlayır).

## Xüsusi baxmağa dəyən yerlər

1. **Terminlər.** Bunları ingiliscə saxladım, çünki marketoloqlar belə işlədir: tracking, event, teq, crawler, stack, landing, fold, scroll, popup, cookie, footer, server-side GTM, Consent Mode. Hansının azərbaycancasını istəsən, de, hamısında dəyişim.
2. **"Genişlənmə"** sözünü "extension" üçün işlətdim (hero: "5 pulsuz Chrome genişlənməsi"). Alternativ: "əlavə" və ya sadəcə "extension".
3. **Hero başlığı:** "İstənilən saytın **içini görmək** üçün pulsuz Chrome alətləri". Rəngli xətt "içini görmək" altındadır.
4. **CTA:** "Görüş təyin et" (EN: "Book a call"). Alternativ: "Zəng sifariş et", "Danış".
5. **Rol düymələri:** "Performans marketoloqu", "SEO mütəxəssisi", "Agentlik", "Dizayner və ya QA", "Satış".
6. **Məxfilik səhifəsində** extension-dakı düymə adları ingiliscə qalıb ("Check links", "Check this page", "Mobile görünüşü"), çünki extension hələ yoxdur və düymələrin AZ adları extension qurulanda bəlli olacaq. Extension fazalarında bu sətirləri onların AZ adları ilə uyğunlaşdıracağam.
7. **Ad:** AZ mətnlərdə "Şəmistan İsayev", EN-də "Shamistan Isayev".
8. **Son yenilənmə tarixi:** hər iki dildə "10 noyabr 2026" yazılıb (`privacy/page.*.json`, `updated`). Buraxılış günü dəyişmək lazımdır.
