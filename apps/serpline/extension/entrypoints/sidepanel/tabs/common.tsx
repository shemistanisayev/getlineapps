/** Pieces shared by the panel tabs: status pills, issue copy and the issue card. */
import type { Audit, Heading, Issue } from '@line/core/serpline';
import { Pill, type PillIcon } from '@line/ui';
import type { ReactNode } from 'react';
import type { MessageKey, T } from '../../../src/i18n/index.ts';
import { en } from '../../../src/i18n/en.ts';

export type Tone = 'ok' | 'warn' | 'bad' | 'mute';

const PILL: Record<Tone, { tone: 'ok' | 'warning' | 'problem' | 'neutral'; icon: PillIcon }> = {
  ok: { tone: 'ok', icon: 'check' },
  warn: { tone: 'warning', icon: 'alert' },
  bad: { tone: 'problem', icon: 'alert' },
  mute: { tone: 'neutral', icon: 'dash' },
};

/** Status pill, always with its icon (status colors rule). */
export function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon?: PillIcon;
  children: ReactNode;
}) {
  const p = PILL[tone];
  return (
    <Pill tone={p.tone} icon={icon ?? p.icon}>
      {children}
    </Pill>
  );
}

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

/** Issue card (design: Links): icon, title, one-line explanation, "Fix:" line. */
export function IssueCard({ issue, t }: { issue: Issue; t: T }) {
  const low = issue.severity === 'low';
  return (
    <section className={`sl-card sp-issue ${low ? 'sp-issue--low' : ''}`}>
      <span className="sp-issue-ic" aria-hidden="true">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M12 6v8M12 18.5h.01" />
        </svg>
      </span>
      <div className="sp-issue-x">
        <h3>{issueTitle(t, issue)}</h3>
        <span>{issueText(t, issue)}</span>
        <span className="sp-issue-fix">
          <b>{t('fix')}</b> {issueFix(t, issue)}
        </span>
      </div>
    </section>
  );
}

/** A heading that exists only after JavaScript (not in the raw HTML at the same level). */
export function jsOnlyHeadings(audit: Audit): Set<Heading> {
  if (!audit.raw) return new Set();
  const raw = new Set(audit.raw.headings.map((h) => `${h.level}:${h.text}`));
  return new Set(audit.rendered.headings.filter((h) => !raw.has(`${h.level}:${h.text}`)));
}

/** Local time of the check, hh:mm. */
export const clock = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
