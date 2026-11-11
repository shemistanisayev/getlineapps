/**
 * One wording per issue for every surface (panel cards, popup list, audit PDF):
 * title (what happens), why (why it matters) and fix (what to change).
 */
import type { Issue } from '@line/core/hitline';
import { joinList, type T } from './i18n/index.ts';
import { platformName } from './ui.tsx';

export interface IssueText {
  title: string;
  why: string;
  fix: string;
}

const pixel = (p: string) =>
  p === 'meta' ? 'Meta Pixel' : p === 'tiktok' ? 'TikTok Pixel' : platformName(p);

export function issueText(i: Issue, t: T, all: Issue[] = [i]): IssueText {
  const p = String(i.data.platform ?? '');
  const event = String(i.data.event ?? '');
  switch (i.id) {
    case 'CONSENT_BEFORE':
      return {
        title: t('report.i.before.lead', { platform: pixel(p) }),
        why: t('why.consent'),
        fix: t('report.i.before.text'),
      };
    case 'CONSENT_AFTER_REJECT':
      return {
        title: t('report.i.after.lead', { platform: pixel(p) }),
        why: t('why.consent'),
        fix: all.some((x) => x.id === 'CONSENT_BEFORE' && x.data.platform !== p)
          ? t('report.i.after.same', { platform: platformName(p) })
          : t('report.i.before.text'),
      };
    case 'UNWANTED_REFERRAL':
      return {
        title: t('report.i.referral.lead'),
        why: t('why.referral'),
        fix: t('report.i.referral.text', { host: String(i.data.host) }),
      };
    case 'XDOMAIN_BREAK':
      return {
        title: t('report.i.break.lead', { host: String(i.data.host) }),
        why: t('why.break'),
        fix: t('report.i.break.text'),
      };
    case 'VALUE_MISSING': {
      const missing = i.data.missing as string[];
      const key =
        missing.length > 1
          ? 'report.i.value.both'
          : missing[0] === 'currency'
            ? 'report.i.value.currency'
            : 'report.i.value.value';
      return {
        title: t(key, { platform: platformName(p), event }),
        why: t('why.value'),
        fix: t('report.i.value.text'),
      };
    }
    case 'PLAN_MISSING': {
      const events = (i.data.events as string[] | undefined) ?? [event];
      return {
        title: t(events.length > 1 ? 'report.i.missing.many' : 'report.i.missing.one', {
          events: joinList(events, t),
        }),
        why: t('why.plan'),
        fix: t('report.i.missing.text'),
      };
    }
    case 'PLAN_PARAMS': {
      const empty = i.data.empty as string[];
      const missing = i.data.missing as string[];
      return empty.length && !missing.length
        ? {
            title: t('report.i.empty.lead', { event, params: joinList(empty, t) }),
            why: t('why.plan'),
            fix: t('report.i.empty.text', { params: joinList(empty, t) }),
          }
        : {
            title: t('report.i.params.lead', { event, params: joinList(missing, t) }),
            why: t('why.plan'),
            fix: t('report.i.params.text', { params: joinList(missing, t) }),
          };
    }
    case 'PII_EMAIL':
      return {
        title: t('issue.pii.title', { platform: platformName(p), field: String(i.data.field) }),
        why: t('why.pii'),
        fix: t('issue.pii.fix'),
      };
    case 'DUPLICATE_EVENT':
      return {
        title: t('issue.dup.title', { platform: platformName(p), event }),
        why: t('why.dup'),
        fix: t('issue.dup.fix'),
      };
    case 'PURCHASE_NO_ID':
      return { title: t('issue.noId.title'), why: t('why.noId'), fix: t('issue.noId.fix') };
    case 'MULTIPLE_GA4':
      return {
        title: t('issue.multi.title', { ids: joinList((i.data.ids as string[]) ?? [], t) }),
        why: t('why.multi'),
        fix: t('issue.multi.fix'),
      };
    case 'BROWSER_ONLY':
      return {
        title: t('sgtm.browserOnly.title', {
          server: joinList(
            ((i.data.server as string[]) ?? []).map((x) => platformName(x)),
            t,
          ),
        }),
        why: t('sgtm.browserOnly.text', {
          browser: joinList(
            ((i.data.browser as string[]) ?? []).map((x) => platformName(x)),
            t,
          ),
        }),
        fix: '',
      };
    default:
      return { title: t('report.i.none.lead'), why: '', fix: '' };
  }
}
