# Hitline: Chrome Web Store-a yükləmə

Bu qovluqda yükləməli olduğun hər şey var. Mətnlər `docs/hitline/STORE-LISTING.md` faylındadır.

| Fayl                                            | Hara                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `hitline-1.0.0.zip`                             | "New item" düyməsindən sonra açılan yükləmə pəncərəsinə |
| `screenshots/1-popup.png` ... `5-audit-pdf.png` | Store listing: Screenshots (ardıcıllıq 1-dən 5-ə)       |
| `promo-small-440x280.png`                       | Store listing: Small promo tile                         |
| `promo-marquee-1400x560.png`                    | Store listing: Marquee promo tile                       |

## 3 addım

1. `chrome.google.com/webstore/devconsole` aç, **New item** bas və `hitline-1.0.0.zip` faylını seç.
2. **Store listing**, **Privacy practices** və **Distribution** tablarını `docs/hitline/STORE-LISTING.md` faylındakı mətnlərlə doldur, şəkilləri bu qovluqdan yüklə.
3. **Submit for review** bas. Təsdiq gələndə listing linkini mənə yaz.

Ekran şəkilləri xəyali Lumo mağazasından çəkilib, real sayt deyil. Yeniləmək üçün: `pnpm store:hitline`.
