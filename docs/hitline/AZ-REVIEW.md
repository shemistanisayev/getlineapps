# Hitline: Azərbaycanca mətnlərin yoxlanması

Agent yazıb, sən yoxlayırsan. Dəyişmək istədiyin sətri burada və ya `apps/hitline/extension/src/i18n/az.ts` faylında düzəlt (və ya agentə yaz). Tool, event və parametr adları (GA4, page_view, consent) tərcümə olunmur.

## Extension (addım 2: skelet)

| Açar | English | Azərbaycanca |
|---|---|---|
| `popup.settings` | Settings | Ayarlar |
| `popup.f12Hint` | Full analysis in DevTools: press F12, open the Hitline tab | Tam analiz DevTools-dadır: F12 bas, Hitline tabını aç |
| `panel.tabsLabel` | Hitline sections | Hitline bölmələri |
| `panel.tab.events` | Events | Eventlər |
| `panel.tab.gtm` | GTM | GTM |
| `panel.tab.consent` | Consent | Consent |
| `panel.tab.attribution` | Attribution | Atribusiya |
| `panel.tab.plan` | Plan | Plan |
| `panel.recording` | Recording | Yazılır |
| `panel.clear` | Clear | Təmizlə |
| `panel.auditPdf` | Audit PDF | Audit PDF |
| `panel.empty.title` | Reload the page to start recording | Yazmağa başlamaq üçün səhifəni yenilə |
| `panel.empty.text` | Hitline records tracking requests while DevTools is open. Reload once to catch everything the page sends on load, including page_view and consent defaults. | Hitline DevTools açıq olanda tracking sorğularını yazır. Səhifənin yüklənəndə göndərdiyi hər şeyi, page_view və consent default-ları da daxil, tutmaq üçün bir dəfə yenilə. |
| `panel.empty.reload` | Reload page | Səhifəni yenilə |
| `welcome.title` | Hitline is ready. Every hit, in plain sight. | Hitline hazırdır. Hər hit göz önündə. |
| `welcome.lead` | Three steps and you will see every event your site sends, where it goes and whether it respects consent. | Üç addım və saytının göndərdiyi hər eventi, hara getdiyini və consent-ə əməl edib-etmədiyini görəcəksən. |

Sonrakı addımlarda yeni sətirlər bu cədvələ əlavə olunacaq.
