/**
 * Hitline DevTools panel (Faza 3, step 4) on the Lumo "events" run.
 * Playwright cannot open DevTools, so the panel page is opened directly and replays the recorded
 * session (window.__HITLINE_REPLAY__). Live capture itself is covered by src/capture/devtools.test.ts.
 */
import { expect, test, type Page } from '@playwright/test';
import { lumoSession } from '../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV } from '../packages/core/fixtures/hitline/lumo.ts';
import { parsePlanCsv } from '../packages/core/src/hitline/index.ts';
import { loadExtension, requireBuilt, type LoadedExtension } from './extension.ts';

const SHOTS = process.env.SHOTS_DIR;

test.describe('hitline panel', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: LoadedExtension;

  test.beforeAll(async () => {
    requireBuilt('hitline');
    ext = await loadExtension('hitline');
    const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
    if (!parsed.ok) throw new Error('plan');
    await ext.worker.evaluate((plans) => chrome.storage.local.set({ plans }), {
      'example.com': parsed.plan,
    });
  });
  test.afterAll(async () => {
    test.setTimeout(60_000);
    await ext?.close();
  });

  async function openReplay(run: 'events' | 'consent' | 'journey'): Promise<Page> {
    const page = await ext.context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    (page as unknown as { errors: string[] }).errors = errors;
    await page.addInitScript((s) => {
      (window as unknown as { __HITLINE_REPLAY__: unknown }).__HITLINE_REPLAY__ = s;
    }, lumoSession(run));
    await page.setViewportSize({ width: 1440, height: 660 });
    await page.goto(ext.url('devtools-panel.html'));
    return page;
  }

  test('header counts and the Events tab match the design', async () => {
    const page = await openReplay('events');
    await expect(page.getByRole('tab', { name: /Events/ })).toContainText('14');
    await expect(page.getByRole('tab', { name: /GTM/ })).toContainText('8');
    await expect(page.getByRole('tab', { name: /Plan/ })).toContainText('4');

    const chips = page.getByRole('group', { name: 'Filter by platform' }).getByRole('button');
    await expect(chips).toHaveText([
      /^All\s*14$/,
      /^GA4\s*5$/,
      /^Meta\s*3$/,
      /^TikTok\s*2$/,
      /^Google Ads\s*1$/,
      /^dataLayer\s*3$/,
    ]);

    const rows = page.getByRole('option');
    await expect(rows).toHaveCount(14);
    await expect(rows.nth(0)).toContainText('42:18.204');
    await expect(rows.nth(0)).toContainText('page_view');
    await expect(rows.nth(0)).toContainText('sGTM');
    await expect(rows.nth(8)).toContainText('AddToCart');
    await expect(rows.nth(8)).toContainText('No value');

    // The design's selected row: GA4 add_to_cart, linked to Meta AddToCart without a value.
    const selected = page.getByRole('option', { selected: true });
    await expect(selected).toContainText('add_to_cart');
    await expect(selected).toContainText('GA4');
    const detail = page.locator('.ev-detail');
    await expect(detail).toContainText('10:42:31.950');
    await expect(detail.locator('.code')).toContainText('POST');
    await expect(detail.locator('.code b')).toHaveText('data.example.com');
    await expect(detail.locator('.prow')).toHaveText([
      'currencyUSD',
      'value89.90',
      'items[0].item_idLUMO-PRO-X',
      'items[0].item_nameWireless Headphones Pro X',
      'items[0].price89.90',
      'items[0].quantity1',
    ]);
    await expect(detail.locator('.ccard')).toContainText('Consent granted');
    await expect(detail.locator('.ccard')).toContainText('ad_storage, analytics_storage, gcs G111');
    await expect(detail.locator('.icard')).toContainText(
      'The same click sends Meta AddToCart without a value',
    );
    await expect(detail.locator('.icard')).toContainText('GA4 gets $89.90, Meta gets no value.');
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-events.png` });
    expect((page as unknown as { errors: string[] }).errors).toEqual([]);
    await page.close();
  });

  test('filter, search and keyboard selection', async () => {
    const page = await openReplay('events');
    await page.getByRole('button', { name: /^Meta/ }).click();
    await expect(page.getByRole('option')).toHaveCount(3);
    await page.getByRole('button', { name: /^All/ }).click();
    await page.getByRole('searchbox', { name: 'Search events or parameters' }).fill('lumo-pro');
    // Hits that carry the item id: GA4 3 + dataLayer 3 ecommerce events, Meta 2, TikTok AddToCart 1.
    await expect(page.getByRole('option')).toHaveCount(9);
    await page.getByRole('searchbox').fill('');
    await page.getByRole('option').first().click();
    await page.getByRole('listbox').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { selected: true })).toContainText('PageView');
    await expect(page.locator('.ev-detail .code')).toContainText('facebook.com/tr/');
    await page.close();
  });

  test('GTM tab: tags with status, sGTM with 4 signals, browser-only warning, CTA', async () => {
    const page = await openReplay('events');
    await page.getByRole('tab', { name: /GTM/ }).click();
    await expect(page.locator('.stat .cid')).toHaveText('GTM-K7P2QX');
    const tagRows = page.locator('.tags .row');
    await expect(tagRows).toHaveCount(8);
    await expect(tagRows.nth(4)).toContainText('Meta AddToCart');
    await expect(tagRows.nth(4)).toContainText('Missing value');
    await expect(tagRows.nth(5)).toContainText('No consent check');
    await expect(tagRows.nth(6)).toContainText('Waiting for consent');
    await expect(tagRows.nth(7)).toContainText('Not fired yet');
    await expect(page.locator('.hero')).toContainText('Detected');
    await expect(page.locator('.signals li')).toHaveText([
      /Requests go to the site.s own subdomain\s*data\.example\.com/,
      /Path uses the GA4 format\s*\/g\/collect/,
      /Google Tag sets server_container_url\s*https:\/\/data\.example\.com/,
      /FPID cookie set by the server\s*HttpOnly, 400 days/,
    ]);
    await expect(page.locator('.warncard')).toContainText('Only GA4 goes server-side');
    await expect(page.locator('.warncard')).toContainText(
      'Meta and TikTok still send from the browser',
    );
    await expect(page.locator('.cta')).toContainText('Move Meta and TikTok server-side too?');
    await expect(page.getByRole('link', { name: 'Get in touch' })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=panel_cta',
    );
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-gtm.png` });
    await page.close();
  });

  test('consent run marks the Meta and TikTok rows', async () => {
    const page = await openReplay('consent');
    await expect(page.getByRole('tab', { name: /Consent/ })).toContainText('2');
    await expect(page.getByRole('option').filter({ hasText: 'PageView' })).toContainText(
      'Before consent',
    );
    await expect(page.getByRole('option').filter({ hasText: 'ViewContent' })).toContainText(
      'After rejection',
    );
    await page.close();
  });

  test('first open without data, and the language switch', async () => {
    const page = await ext.context.newPage();
    await page.setViewportSize({ width: 1440, height: 660 });
    await page.goto(ext.url('devtools-panel.html'));
    await expect(
      page.getByRole('heading', { name: 'Reload the page to start recording' }),
    ).toBeVisible();
    await expect(page.locator('.watches .w-row')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'Audit PDF' })).toBeDisabled();
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-empty.png` });
    await page.evaluate(() => chrome.storage.local.set({ lang: 'az' }));
    await expect(
      page.getByRole('heading', { name: 'Yazmağa başlamaq üçün səhifəni yenilə' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /Eventlər/ })).toBeVisible();
    await page.evaluate(() => chrome.storage.local.remove('lang'));
    await page.close();
  });

  test('Consent tab on the "consent" run matches the design', async () => {
    const page = await openReplay('consent');
    await page.getByRole('tab', { name: /Consent/ }).click();
    const hero = page.locator('.hero');
    await expect(hero).toContainText('Cookie banner');
    await expect(hero).toContainText('Found');
    await expect(hero).toContainText('Reject all');
    await expect(page.locator('.sigs .row')).toHaveText([
      /ad_storage\s*denied\s*denied/,
      /analytics_storage\s*denied\s*denied/,
      /ad_user_data\s*denied\s*denied/,
      /ad_personalization\s*denied\s*denied/,
    ]);
    await expect(page.locator('.note.ok')).toContainText('Google tags are set up correctly.');
    await expect(page.locator('.tl-row')).toHaveText([
      /10:41:02\.118\s*GA4\s*page_view\s*Cookieless ping, G100/,
      /10:41:02\.240\s*Meta\s*PageView\s*Sent before any consent/,
      /10:41:09\.513\s*GA4\s*view_item\s*Cookieless ping, G100/,
      /10:41:09\.602\s*TikTok\s*ViewContent\s*Sent after rejection/,
      /Hotjar\s*script\s*Not loaded, correct/,
    ]);
    await expect(page.locator('.tl-choice')).toContainText('Visitor clicks "Reject all"');
    await expect(page.locator('.tl-choice')).toContainText('10:41:09.480');
    await expect(page.locator('.fix')).toContainText(
      'In GTM, add "Additional consent checks" to the Meta Pixel Base and TikTok Pixel tags',
    );
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-consent.png` });
    await page.close();
  });

  test('Attribution tab on the "journey" run matches the design', async () => {
    const page = await openReplay('journey');
    await expect(page.getByRole('tab', { name: /Attribution/ })).toContainText('1');
    await page.getByRole('tab', { name: /Attribution/ }).click();
    await expect(page.locator('.at-head')).toContainText('Visit path: 5 pages');
    await expect(page.locator('.step')).toHaveText([
      /1\s*Landing\s*\/campaign\/fall-sale\?utm_source=google.*UTM and gclid/,
      /2\s*Product\s*\/products\/wireless-headphones-pro-x\s*Saved in _gcl_aw/,
      /3\s*Cart\s*\/cart\s*google \/ cpc/,
      /4\s*Payment\s*pay\.example\.net\/checkout\s*_gl not passed/,
      /5\s*Confirmation\s*\/order\/confirmation\s*example\.net \/ referral/,
    ]);
    await expect(page.locator('.at-table .row')).toHaveText([
      /utm_source, utm_medium\s*present\s*in session\s*in session\s*lost\s*referral/,
      /gclid\s*present\s*in cookie\s*in cookie\s*lost\s*in cookie/,
      /GA4 client_id\s*created\s*same\s*same\s*new\s*same/,
    ]);
    await expect(page.locator('.icard')).toContainText(
      'The sale is credited to the payment site, not the ad',
    );
    await expect(page.locator('.icard')).toContainText(
      'Add pay.example.net to "Unwanted referrals" in GA4.',
    );
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-attribution.png` });
    await page.close();
  });

  test('Plan tab compares the "events" run with the Lumo plan', async () => {
    const page = await openReplay('events');
    await page.getByRole('tab', { name: /Plan/ }).click();
    await expect(page.locator('.pl-name')).toContainText('lumo-tracking-plan.csv, 8 events');
    await expect(page.locator('.pl-count')).toHaveText([
      /4\s*match/,
      /2\s*missing/,
      /2\s*wrong parameters/,
    ]);
    await expect(page.locator('.pl-rows .row')).toHaveText([
      /generate_lead\s*GA4\s*form_id\s*Never arrived in this session\s*Missing/,
      /begin_checkout\s*GA4\s*currency, value, items\s*In the dataLayer, no GA4 event\s*Missing/,
      /AddToCart\s*Meta\s*value, currency, content_ids\s*Only content_ids arrived\s*Wrong parameters/,
      /sign_up\s*GA4\s*method\s*method arrives empty\s*Wrong parameters/,
      /page_view\s*GA4\s*page_location\s*Same as plan\s*Match/,
      /view_item\s*GA4\s*currency, value, items\s*Same as plan\s*Match/,
      /add_to_cart\s*GA4\s*currency, value, items\s*Same as plan\s*Match/,
      /ViewContent\s*Meta\s*content_ids, value\s*Same as plan\s*Match/,
    ]);
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-plan.png` });
    await page.close();
  });

  test('PlanSetup: sample CSV, draft from the session, bad file, upload, remove', async () => {
    const page = await openReplay('events');
    await page.getByRole('tab', { name: /Plan/ }).click();
    await page.getByRole('button', { name: 'Change plan' }).click();
    await expect(page.getByRole('heading', { name: 'Drop your tracking plan here' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel-plansetup.png` });

    const [sample] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download sample CSV' }).click(),
    ]);
    expect(sample.suggestedFilename()).toBe('hitline-sample-plan.csv');

    const [draft] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Create plan from this session' }).click(),
    ]);
    expect(draft.suggestedFilename()).toBe('hitline-plan-example.com.csv');
    const text = await (await draft.createReadStream()).toArray();
    const csv = Buffer.concat(text as Buffer[]).toString('utf8');
    expect(csv.split('\n')[0]).toBe('event,platform,parameters');
    expect(csv).toContain('add_to_cart,GA4,"currency,value,items"');
    expect(csv).toContain('AddToCart,Meta,"content_ids,content_type"');

    const file = page.locator('input[type=file]');
    await file.setInputFiles({
      name: 'bad.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('event,platform,parameters\npurchase,Snapchat,"value"\n'),
    });
    await expect(page.getByRole('alert')).toHaveText(
      /Line 2: platform must be GA4, Meta, TikTok or Google Ads\./,
    );

    await file.setInputFiles({
      name: 'small.json',
      mimeType: 'application/json',
      buffer: Buffer.from('[{"event":"purchase","platform":"GA4","parameters":["value"]}]'),
    });
    await expect(page.locator('.pl-name')).toContainText('small.json, 1 events');
    await expect(page.locator('.pl-rows .row')).toHaveText([
      /purchase\s*GA4\s*value\s*Never arrived/,
    ]);

    await page.getByRole('button', { name: 'Remove plan' }).click();
    await expect(page.getByRole('heading', { name: 'Drop your tracking plan here' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Plan/ })).toContainText('0');
    await page.close();
  });
});
