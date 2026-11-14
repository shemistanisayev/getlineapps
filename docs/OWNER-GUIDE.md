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

Hər alət ayrıca fazadır (`docs/line-family-PLAN.md`). Yeni söhbət aç və o fazanın promptunu yapışdır. Hitline, Serpline və Rivaline hazırdır, növbəti Foldline-dır:

```
Start Foldline. Read CLAUDE.md, docs/foldline-SPEC.md, the family docs and Faza 6 of docs/line-family-PLAN.md.
Follow the family docs where the SPEC disagrees. Reuse packages/ui, packages/report, packages/site-kit and the fixtures.
Do step 1 (SPEC Phase 0) and stop. After each step: checks for all apps, commit, push, short report in Azerbaijani, wait for me.
```

Agent Hitline, Serpline və Rivaline-da qurulan hissələri (loqolar, PDF, sayt, test mağazası, Store skripti, side panel testləri) yenidən istifadə edəcək.

## 8. Serpline

Yuxarıdakı 2-4-cü bölmələr Serpline üçün də eynidir: "Hitline" sözünü "Serpline" ilə əvəz et (Store paketi `store/serpline/`, mətnlər `docs/serpline/STORE-LISTING.md`, rəy səhifəsi `getlineapps.com/serpline/uninstalled`).

**Öz Chrome-unda yoxlamaq**

1. Agentə yaz: `Build Serpline.` Sonra `chrome://extensions` aç, **Developer mode**-u yandır, **Load unpacked** bas və `apps\serpline\extension\.output\chrome-mv3` qovluğunu seç.
2. İstənilən saytı aç və Serpline ikonuna bas (və ya `Alt+Shift+S`). Sağda yan panel açılır, səhifəni yoxlayır.
3. Başqa səhifəyə keçəndə panel "Yeni səhifə açmısan" yazır. "Bu səhifəni yoxla" bas. Başqa sayta keçmisənsə, ikona yenidən bas. Chrome bəzən "bu sayta giriş verilsin?" soruşur: bu, Chrome-un öz pəncərəsidir, Serpline yalnız həmin bir saytı soruşur.
4. Links tabında "52 daxili linki yoxla" kimi düymə linkləri saytın özündən, sənin brauzerindən yoxlayır. Başqa heç yerə sorğu getmir.

**Real saytlarda yoxlama (QA)**

İstədiyin saytları agentə ver:

```
Run Serpline QA on <url1> <url2> <url3> and tell me about any false positives.
```

Agent `scripts/qa-serpline.ts` ilə hər saytı açır, link yoxlamasını edir və hər tabın şəklini çəkir. Nəticələr `docs/serpline/QA.md` faylına yazılır.

**Bir problem səhv görünürsə**

Paneldə yanlış problem görsən (məsələn sayt düzgündür, amma Serpline "kəsilir" deyir), səhifənin linkini agentə ver:

```
Serpline shows <problem> on <url>, but I think it is wrong. Check it and fix it if Serpline is wrong.
```

## 9. Rivaline

Yuxarıdakı 2-5-ci bölmələr Rivaline üçün də eynidir: "Hitline" sözünü "Rivaline" ilə əvəz et (Store paketi `store/rivaline/`, mətnlər `docs/rivaline/STORE-LISTING.md`, rəy səhifəsi `getlineapps.com/rivaline/uninstalled`, rəy e-poçtunun mövzusu `Rivaline feedback: <səbəb>`). Rivaline Store-a üçüncü extension yeri açılanda yüklənir, o vaxta qədər landingdə "Tezliklə" yazılır.

**1.1 versiyasında nə var:** Stack (təxminən 160 alət, yerli alətlər daxil), **Təklif** tabı (aksiyalar, promo kodlar, qiymətlər, sosial profillər, tətbiqlər, bazarlar, müştəri məlumatını necə topladıqları), Ads, Brand, başlıqdakı **Müqayisə** düyməsi (oxunmuş iki tabı yan-yana qoyur) və hamısını birləşdirən PDF hesabatı. Store-a ilk dəfə 1.1.0 yüklənəcək.

**Yeni versiya buraxmaq**

1. Agentə yaz: `Release Rivaline 1.1.1: <nə dəyişdi>. Bump the version, run all checks, rebuild store/rivaline and push.`
2. `chrome.google.com/webstore/devconsole` aç, Rivaline-ı seç, **Package** bölməsində **Upload new package** bas və `store/rivaline/rivaline-1.1.1.zip` faylını seç.
3. **Submit for review** bas.

**Domeni dəyişmək**

5-ci bölmədəki prompt Rivaline-ı da əhatə edir. Rivaline-ın Settings-dəki linkləri (privacy, digər alətlər) və silinmə səhifəsi yalnız yeni versiya ilə dəyişir, ona görə domendən sonra Rivaline üçün də yeni versiya burax.

**Öz Chrome-unda yoxlamaq**

1. Agentə yaz: `Build Rivaline.` Sonra `chrome://extensions` aç, **Developer mode**-u yandır, **Load unpacked** bas və `apps\rivaline\extension\.output\chrome-mv3` qovluğunu seç.
2. Rəqibin saytını aç və Rivaline ikonuna bas (və ya `Alt+Shift+V`). Sağda yan panel açılır: Stack, Ads və Brand tabları.
3. Başqa taba keçəndə panel "Bu tab oxunsun?" soruşur: ikona yenidən bas. Rivaline səhifəni yalnız sən basanda oxuyur.
4. Saytda cookie banneri varsa, bəzi alətlər yalnız razılıqdan sonra yüklənir. Banneri qəbul et və **Səhifəni yenidən oxu** bas.

**Yeni alət tanıtmaq (detection qaydası)**

Rivaline bir aləti tanımırsa (məsələn sayt yeni bir çat və ya CRM işlədir), saytın linkini agentə ver:

```
Rivaline does not find <alətin adı> on <url>. Add a detection rule with a test and push.
```

Qaydalar `packages/core/src/rivaline/rules/` qovluğundadır, hər qayda testlə yoxlanır. Yeni qayda yeni versiya ilə istifadəçilərə çatır.

**Bir tapıntı səhv görünürsə**

Rivaline saytda olmayan bir alət göstərirsə və ya rəng rolu səhvdirsə:

```
Rivaline shows <tapıntı> on <url>, but I think it is wrong. Check the evidence and fix it if Rivaline is wrong.
```

Paneldə hər alətə bassan, "Rivaline bunu necə tapdı" bölməsində sübutu (skript, sorğu, cookie) görürsən. Onu da agentə yapışdıra bilərsən.

**Real saytlarda yoxlama (QA)**

```
Run Rivaline QA on <url1> <url2> <url3> and tell me about any false positives.
```

Agent `scripts/qa-rivaline.ts` ilə hər saytı açır, Stack, Ads və Brand tablarının şəklini çəkir. Nəticələr `docs/rivaline/QA.md` faylına yazılır.

**Rəy e-poçtları**

Rivaline-ı silən adam `getlineapps.com/rivaline/uninstalled` səhifəsində rəy yazsa, sənə 4-cü bölmədəki kimi e-poçt gəlir. Rəydə "bu aləti tapmadı" kimi bir şey yazılıbsa, mətni agentə yapışdır:

```
A Rivaline user wrote: <rəy>. Find out if a detection rule is missing or wrong and fix it.
```

## 10. Bir şey sınanda

- GitHub-da **Actions** tabında qırmızı X görsən, agentə yaz: `CI failed on main, find out why and fix it.`
- Sayt açılmırsa, Cloudflare Pages-də son deploy-a bax və ya agentə yaz: `getlineapps.com is down, check the last deploy.`
- Extension Store-da rədd olunsa, Google-un məktubunu agentə yapışdır: `The Web Store rejected Hitline with this message: <mətn>. Fix it and prepare a new package.`
