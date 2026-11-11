/** Issue copy from the dictionaries (panel cards and the audit PDF). */
import type { Issue } from '@line/core/serpline';
import { en } from './i18n/en.ts';
import type { MessageKey, T } from './i18n/index.ts';

const hasKey = (k: string): k is MessageKey => k in en;

/** Issue title: the singular variant (title1) when the count is 1 and one exists. */
export function issueTitle(t: T, issue: Issue): string {
  const one = issue.id === 'AI_SEARCH_BLOCKED' ? issue.params.more === 0 : issue.params.count === 1;
  const k1 = `issue.${issue.id}.title1`;
  const key = one && hasKey(k1) ? k1 : (`issue.${issue.id}.title` as MessageKey);
  return t(key, issue.params);
}

export const issueText = (t: T, issue: Issue) =>
  t(`issue.${issue.id}.text` as MessageKey, issue.params);
export const issueFix = (t: T, issue: Issue) =>
  t(`issue.${issue.id}.fix` as MessageKey, issue.params);
