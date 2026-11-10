# Line ailəsi: sahibin bələdçisi

Bu bələdçi sənin üçündür: kod yazmadan Line alətlərini necə idarə edəcəyini göstərir. Hər addımda ən sadə yol: Claude Code-da bu qovluğu aç və aşağıdakı qısa promptu yaz. Agent qalanını özü edir.

## 1. Saytı dəyişmək (getlineapps.com)

- Mətnlər `apps/site/src/content/` qovluğundakı JSON fayllarındadır. Məsələn Hitline landingi: `hitline/en.json` və `hitline/az.json`.
- GitHub-da faylı aç, qələm ikonuna bas, mətni dəyiş, **Commit changes** bas. Sayt bir neçə dəqiqəyə özü yenilənir.
- Səhv bir şey yazsan (məsələn mötərizəni silsən), yoxlama səhvi tutur və sayt dəyişmir. Onda agentə yaz: `Fix the last site edit, the build failed.`

## 2. Store linki gələndə

Google extension-u təsdiq edəndə agentə yaz:

```
Hitline is live: <listing linki>. Set it live in tools.json and push.
```

Saytdakı bütün "Chrome-a əlavə et" düymələri o linkə gedəcək.

## 3. Yeni versiya buraxmaq (məsələn Hitline 1.0.1)

1. Agentə yaz: `Release Hitline 1.0.1: <nə dəyişdi>. Bump the version, run all checks, rebuild store/hitline and push.`
2. `chrome.google.com/webstore/devconsole` aç, Hitline-ı seç, **Package** bölməsində **Upload new package** bas və `store/hitline/hitline-1.0.1.zip` faylını seç.
3. **Submit for review** bas. İstifadəçilərdə yeni versiya təsdiqdən sonra özü yenilənir.

## 4. Rəy e-poçtları

- Kimsə extension-u siləndə `getlineapps.com/hitline/uninstalled` açılır. Orada rəy yazsa, sənə Resend ilə e-poçt gəlir.
- Mövzu belədir: `Hitline feedback: <seçdiyi səbəb>`. İçində səbəb, mətn, extension versiyası və səhifə var.
- E-poçt ünvanını yazıbsa, "Reply" ilə birbaşa ona cavab verə bilərsən.
- E-poçt gəlmirsə: Cloudflare-də `RESEND_API_KEY` və `FEEDBACK_TO` sirlərinin qurulduğunu yoxlamaq üçün agentə yaz: `Check that the feedback function can send email.`

## 5. Domeni dəyişmək

Bütün linklər bir yerdən qurulur: `packages/core/src/site.ts` faylındakı `LINE_SITE_URL`. Domeni dəyişmək istəsən agentə yaz:

```
Move the site to <yeni domen>: change LINE_SITE_URL and the site config, attach the domain in Cloudflare Pages, and release new versions of the extensions.
```

Extension-ların içindəki linklər (privacy, silinmə səhifəsi, digər alətlər) yalnız yeni versiya ilə dəyişir, ona görə hər extension üçün yeni versiya lazım olacaq.

## 6. Extension-u öz Chrome-unda yoxlamaq

1. Agentə yaz: `Build Hitline.` Sonra `chrome://extensions` aç, **Developer mode**-u yandır, **Load unpacked** bas və `apps\hitline\extension\.output\chrome-mv3` qovluğunu seç.
2. İstənilən saytda ikona bas (popup), F12 bas və **Hitline** tabını aç, sonra "Səhifəni yenilə" bas.
3. Test mağazası ilə görmək üçün: `pnpm --filter @line/fixture open:hitline` (agent də işə sala bilər). Bu, saxta Lumo mağazasını extension ilə açır. Heç bir əsl tracking sorğusu getmir.

## 7. Növbəti Line alətinə başlamaq

Hər alət ayrıca fazadır (`docs/line-family-PLAN.md`). Yeni söhbət aç və o fazanın promptunu yapışdır. Məsələn Serpline üçün:

```
Start Serpline. Read CLAUDE.md, docs/serpline-SPEC.md, the family docs and Faza 4 of docs/line-family-PLAN.md.
Follow the family docs where the SPEC disagrees. Reuse packages/ui, packages/report, packages/site-kit and the Lumo fixture.
Do step 1 (SPEC Phase 0) and stop. After each step: checks for all apps, commit, push, short report in Azerbaijani, wait for me.
```

Agent Hitline-da qurulan hissələri (loqolar, PDF, sayt, test mağazası, Store skripti) yenidən istifadə edəcək.

## 8. Bir şey sınanda

- GitHub-da **Actions** tabında qırmızı X görsən, agentə yaz: `CI failed on main, find out why and fix it.`
- Sayt açılmırsa, Cloudflare Pages-də son deploy-a bax və ya agentə yaz: `getlineapps.com is down, check the last deploy.`
- Extension Store-da rədd olunsa, Google-un məktubunu agentə yapışdır: `The Web Store rejected Hitline with this message: <mətn>. Fix it and prepare a new package.`
