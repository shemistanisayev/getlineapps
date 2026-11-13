# Rivaline: Chrome Web Store-a yükləmə

Bu qovluqda yükləməli olduğun hər şey var. Mətnlər `docs/rivaline/STORE-LISTING.md` faylındadır.

**Vaxt:** Rivaline üçüncü extension-dur. Web Store hesabında 2 yer var (Hitline və Serpline), ona görə Rivaline-ı limit artandan sonra yüklə (`docs/line-family-PLAN.md`, Faza 8). O vaxta qədər landing "Coming soon" göstərir.

| Fayl                                         | Hara                                              |
| -------------------------------------------- | ------------------------------------------------- |
| `rivaline-1.0.0.zip`                         | New item: paketi yüklə                            |
| `screenshots/1-stack.png` ... `5-report.png` | Store listing: Screenshots (ardıcıllıq 1-dən 5-ə) |
| `promo-small-440x280.png`                    | Store listing: Small promo tile                   |
| `promo-marquee-1400x560.png`                 | Store listing: Marquee promo tile                 |

## İlk yükləmə (limit artandan sonra)

1. `chrome.google.com/webstore/devconsole` aç, **New item** bas və `rivaline-1.0.0.zip` faylını seç.
2. **Store listing**, **Privacy** və **Distribution** tablarını `docs/rivaline/STORE-LISTING.md`-dəki mətnlərlə doldur, şəkilləri bu qovluqdan yüklə.
3. **Submit for review** bas. Təsdiqdən sonra listing linkini agentə yaz.

Ekran şəkilləri xəyali Kova mağazasından çəkilib, real sayt deyil. Yeniləmək üçün: `pnpm store:rivaline`.
