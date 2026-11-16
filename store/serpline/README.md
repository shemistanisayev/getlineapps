# Serpline: Chrome Web Store-a yükləmə

Bu qovluqda yükləməli olduğun hər şey var. Mətnlər `docs/serpline/STORE-LISTING.md` (EN) və `docs/serpline/STORE-LISTING-LOCALES.md` (digər dillər) fayllarındadır.

| Fayl                                              | Hara                                              |
| ------------------------------------------------- | ------------------------------------------------- |
| `serpline-1.1.2.zip`                              | Package tabı: **Upload new package**              |
| `screenshots/1-summary.png` ... `5-audit-pdf.png` | Store listing: Screenshots (ardıcıllıq 1-dən 5-ə) |
| `promo-small-440x280.png`                         | Store listing: Small promo tile                   |
| `promo-marquee-1400x560.png`                      | Store listing: Marquee promo tile                 |
| `locales/<kod>/...`                               | Eyni şəkillər, digər dillər üçün                  |

## Yeniləmə: 1.1.2, 10 dil

Bu versiya extension-a dillər əlavə edir, ona görə Store listing-də dil seçmək mümkün olur. Azərbaycan dili yoxdur: Chrome-un dil siyahısında `az` yoxdur, AZ istifadəçilər ingiliscəni görür.

1. `chrome.google.com/webstore/devconsole` aç, **Serpline**-ı seç, **Package** tabında **Upload new package** bas və `serpline-1.1.2.zip` faylını seç.
2. **Store listing** tabında dil seçicisindən hər dili aç. Hər dil üçün **Description** mətnini `docs/serpline/STORE-LISTING-LOCALES.md` faylından yapışdır, 5 screenshot-u aşağıdakı qovluqdan yüklə. Promo şəkillər (small və marquee) dilə görə dəyişmir: dashboard onları bütün dillər üçün bir dəfə, ingiliscə götürür. Ad və qısa təsvir paketdən avtomatik gəlir.
3. **Submit for review** bas. İcazələr dəyişmədiyi üçün yoxlama adətən 1-3 gün çəkir.

| Dil                                                                | Şəkillər                                         |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| English                                                            | bu qovluq: `screenshots/`, `promo-*.png`         |
| Türkçe, Русский, Română, Українська, Nederlands, Español, Français | `locales/tr`, `ru`, `ro`, `uk`, `nl`, `es`, `fr` |
| Português (Brasil) və Português (Portugal)                         | ikisi də `locales/pt`                            |

Hər dildə screenshot başlıqları tərcümə olunub. `locales/<kod>/promo-*.png` faylları da var, amma dashboard dilə görə promo qəbul etmir, ona görə istifadə olunmur. Şəkillərin içindəki interfeys ingiliscədir, çünki extension-un özü EN və AZ dilindədir. Store hər dil üçün ən çox 5 ekran şəkli qəbul edir.

Ekran şəkilləri xəyali Lumo mağazasından çəkilib, real sayt deyil. Yeniləmək üçün: `pnpm store:serpline`.
