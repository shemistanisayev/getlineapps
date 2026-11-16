# Hitline: Chrome Web Store-a yükləmə

Bu qovluqda yükləməli olduğun hər şey var. Mətnlər `docs/hitline/STORE-LISTING.md` (EN) və `docs/hitline/STORE-LISTING-LOCALES.md` (digər dillər) fayllarındadır.

| Fayl                                            | Hara                                              |
| ----------------------------------------------- | ------------------------------------------------- |
| `hitline-1.2.2.zip`                             | Package tabı: **Upload new package**              |
| `screenshots/1-popup.png` ... `5-audit-pdf.png` | Store listing: Screenshots (ardıcıllıq 1-dən 5-ə) |
| `promo-small-440x280.png`                       | Store listing: Small promo tile                   |
| `promo-marquee-1400x560.png`                    | Store listing: Marquee promo tile                 |
| `locales/<kod>/...`                             | Eyni şəkillər, digər dillər üçün                  |

## Yeniləmə: 1.2.2, 10 dil

Bu versiya extension-a dillər əlavə edir, ona görə Store listing-də dil seçmək mümkün olur. Azərbaycan dili yoxdur: Chrome-un dil siyahısında `az` yoxdur, AZ istifadəçilər ingiliscəni görür.

1. `chrome.google.com/webstore/devconsole` aç, **Hitline**-ı seç, **Package** tabında **Upload new package** bas və `hitline-1.2.2.zip` faylını seç.
2. **Store listing** tabında dil seçicisindən hər dili aç. Hər dil üçün **Description** mətnini `docs/hitline/STORE-LISTING-LOCALES.md` faylından yapışdır, şəkilləri aşağıdakı qovluqdan yüklə. Ad və qısa təsvir paketdən avtomatik gəlir.
3. **Submit for review** bas. İcazələr dəyişmədiyi üçün yoxlama adətən 1-3 gün çəkir.

| Dil                                                                | Şəkillər                                         |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| English                                                            | bu qovluq: `screenshots/`, `promo-*.png`         |
| Türkçe, Русский, Română, Українська, Nederlands, Español, Français | `locales/tr`, `ru`, `ro`, `uk`, `nl`, `es`, `fr` |
| Português (Brasil) və Português (Portugal)                         | ikisi də `locales/pt`                            |

Hər dildə şəkil başlıqları və promo mətnləri tərcümə olunub. Şəkillərin içindəki interfeys ingiliscədir, çünki extension-un özü EN və AZ dilindədir. Store hər dil üçün ən çox 5 ekran şəkli qəbul edir.

Ekran şəkilləri xəyali Lumo mağazasından çəkilib, real sayt deyil. Yeniləmək üçün: `pnpm store:hitline`.
