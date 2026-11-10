# Getlineapps: Line ailəsi

Bu qovluq Line ailəsinin (Hitline, Serpline, Rivaline, Foldline, Markline) və getlineapps.com saytının başlanğıc reposudur. Claude Code-u bu qovluqda açırsan və o, burada monorepo qurur.

**Başlamaq üçün:** `docs/line-family-PLAN.md` faylında "Başlanğıc" bölməsini oxu.

## İçindəkilər

```
Getlineapps/
  README.md                      bu fayl (sənin üçün)
  CLAUDE.md                      Claude Code-un qaydaları: stek, struktur, məcburi qaydalar, iş üslubu
  docs/
    line-family-PLAN.md          fazalı plan, hər faza üçün prompt
    line-family-domains.md       domen, URL-lər, sayt, privacy (SPEC-lərdən üstündür)
    line-family-colors.md        rənglər və loqo qaydaları (SPEC-lərdən üstündür)
    hitline-SPEC.md
    serpline-SPEC.md
    rivaline-SPEC.md
    foldline-SPEC.md
    markline-SPEC.md
  design/
    hub/                         hub (/), privacy (/privacy/<tool>), Line apps loqosu
    hitline/ serpline/ rivaline/ foldline/ markline/   extension ekranları + landing
```

## Sənədlər bir-biri ilə ziddiyyət təşkil edəndə

Üstünlük sırası: `CLAUDE.md` və iki family faylı (domains, colors) → tool-un SPEC-i → dizayn.

SPEC-lərdə köhnə domenlər, köhnə rənglər və ayrıca saytlar hələ yazılıb. Onların yerinə family fayllarındakı qaydalar keçərlidir. Hitline SPEC-inin əvvəlinə bunu xatırladan qeyd əlavə olunub.

## Dizaynlara canlı baxmaq

| Kanvas                            | Link                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| getlineapps.com: hub və privacy   | https://claude.ai/artifact/3Z9kNah6K3wp6pj5mhTVFA                    |
| Hitline                           | https://claude.ai/code/artifact/6987e0b7-b1f7-489d-88e7-40513ec92dda |
| Serpline                          | https://claude.ai/code/artifact/7a3a8959-edd5-49f7-8d98-6ef88a7c8501 |
| Rivaline                          | https://claude.ai/code/artifact/9b7b1f50-c085-49bd-bba7-acb04636d43d |
| Foldline                          | https://claude.ai/code/artifact/e6d03b52-f741-47cb-8f3e-77ad34d24188 |
| Markline                          | https://claude.ai/code/artifact/411c2906-e052-4723-88bc-f357a1162e8a |
| Lead Magnet Extensions (təqdimat) | https://claude.ai/code/artifact/38fec844-1af0-4bb1-8a73-126133f976ab |

Kanvasda dəyişiklik etsən, həmin tool-un `design/<tool>/` qovluğunu da yenilə, yoxsa agent köhnə versiya ilə işləyəcək.

## Bilərəkdən daxil edilməyənlər

- **"Line ailəsi: loqolar və üslub" kanvası:** orada köhnə rənglər var.
- **6 noyabr tarixli köhnə Hitline, Foldline və Markline artifaktları:** onları "ekranlar və landing" kanvasları əvəz edir.
- **Əvvəlki `hitline-kit.zip`:** onun SPEC-i burada `docs/hitline-SPEC.md` kimi var. CLAUDE.md-si isə ailə üçün ortaq `CLAUDE.md` ilə əvəz olunub. O arxivi istifadə etmə.
- **Ekranların PNG şəkilləri:** dizayn sonradan dəyişdiyi üçün köhnə şəkillər yanlış olardı. Agent `.dc.html` mənbəyindən işləyir.
