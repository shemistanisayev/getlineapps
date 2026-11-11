/** AI tab (design/serpline/Ai.dc.html): allowed count, bots by group, files for crawlers. */
import type { Audit, BotGroup, BotOwner, BotStatus } from '@line/core/serpline';
import { BotRow, HeroCard, LimeCta, PanelCard } from '@line/ui/serpline';
import { useState } from 'react';
import type { T } from '../../../src/i18n/index.ts';
import { StatusPill, issueTitle } from './common.tsx';

/**
 * Bots shown before "N more bots" (design: Ai, PLAN decision 3). A blocked bot is always shown.
 * Order inside a group follows the config (design order).
 */
const PRIMARY = new Set([
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'CCBot',
]);

/** Answer engine names for the hero line (product names, never translated). */
const ENGINE: Partial<Record<BotOwner, string>> = {
  openai: 'ChatGPT',
  anthropic: 'Claude',
  perplexity: 'Perplexity',
};

function BotStatusPill({ b, robotsFound, t }: { b: BotStatus; robotsFound: boolean; t: T }) {
  if (b.state === 'blocked')
    return (
      <StatusPill tone="bad" icon="x">
        {t('ai.blocked')}
      </StatusPill>
    );
  if (b.state === 'allowed') return <StatusPill tone="ok">{t('ai.allowed')}</StatusPill>;
  return (
    <StatusPill tone="mute" icon="check">
      {robotsFound ? t('ai.allowedStar') : t('ai.noRule')}
    </StatusPill>
  );
}

export function AiTab({ audit, cta, t }: { audit: Audit; cta: string; t: T }) {
  const [more, setMore] = useState(false);
  const { bots, robots, diff } = audit;
  const blockedSearch = bots.filter((b) => b.group === 'search' && b.state === 'blocked');
  const issue = audit.issues.find((i) => i.id === 'AI_SEARCH_BLOCKED');
  const heavy = diff && diff.needsJs >= 0.5;
  const words = diff ? { raw: diff.rawWords, rendered: diff.renderedWords } : null;

  let title: string;
  let text: string;
  if (issue) {
    const first = blockedSearch[0]!;
    const who = ENGINE[first.owner] ?? first.userAgent;
    text =
      blockedSearch.length === 1
        ? t('ai.cantCite', { engine: who })
        : t('ai.cantCiteMany', { n: blockedSearch.length });
    const othersAllowed = bots.some((b) => b.group === 'search' && b.state !== 'blocked');
    if (othersAllowed && heavy && words) text += ` ${t('ai.othersRead', words)}`;
    title = issueTitle(t, issue);
  } else {
    title = t('ai.allSearchAllowed');
    text = !robots.found
      ? t('ai.noRobots')
      : heavy && words
        ? t('ai.readOnly', words)
        : t('ai.readsText');
  }

  const visible = (b: BotStatus) => more || PRIMARY.has(b.userAgent) || b.state === 'blocked';
  const hidden = bots.filter((b) => !visible(b)).length;
  const groups: { id: BotGroup; label: string }[] = [
    { id: 'search', label: t('ai.group.search') },
    { id: 'training', label: t('ai.group.training') },
  ];
  const host = (() => {
    try {
      return new URL(audit.url).host;
    } catch {
      return audit.host;
    }
  })();

  return (
    <>
      <HeroCard className="sp-ai-hero">
        <span
          className="sp-ai-count"
          aria-label={t('ai.countAria', { n: audit.botsAllowed, total: bots.length })}
        >
          <b>
            {audit.botsAllowed}/{bots.length}
          </b>
          <span>{t('ai.allowedShort')}</span>
        </span>
        <div className="sp-hero-x">
          <span className="sp-hero-h sp-ai-h">{title}</span>
          <span className="sl-soft">{text}</span>
        </div>
      </HeroCard>

      <PanelCard
        title={t('ai.bots')}
        aside={<span className="mono sp-robots-url">{host}/robots.txt</span>}
        className="sp-bots"
      >
        {groups.map((g) => (
          <div key={g.id}>
            <h3 className="sl-group">{g.label}</h3>
            {bots
              .filter((b) => b.group === g.id && visible(b))
              .map((b) => (
                <BotRow
                  key={b.userAgent}
                  owner={b.owner}
                  userAgent={b.userAgent}
                  shownAs={b.shownAs}
                  rule={b.state === 'blocked' ? b.rule : undefined}
                  status={<BotStatusPill b={b} robotsFound={robots.found} t={t} />}
                />
              ))}
          </div>
        ))}
        {(hidden > 0 || more) && (
          <button
            type="button"
            className="sp-more"
            aria-expanded={more}
            onClick={() => setMore((m) => !m)}
          >
            <span>{more ? t('ai.fewer') : t('ai.more', { n: hidden })}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: more ? 'rotate(180deg)' : undefined }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </PanelCard>

      <LimeCta text={t('cta.ai')} label={t('cta.contact')} href={cta} />

      <PanelCard title={t('ai.files')}>
        <div className="sl-row">
          <span className="mono">robots.txt</span>
          {robots.found ? (
            <StatusPill tone="ok">{t('ai.robotsFound', { n: robots.lineCount })}</StatusPill>
          ) : robots.status === 404 || robots.status === 410 ? (
            <StatusPill tone="mute">{t('ai.notFound')}</StatusPill>
          ) : (
            <StatusPill tone="warn">
              {robots.status ? t('ai.httpStatus', { status: robots.status }) : t('ai.unread')}
            </StatusPill>
          )}
        </div>
        <div className="sl-row">
          <span className="mono">sitemap.xml</span>
          {robots.sitemaps.length ? (
            <StatusPill tone="ok">{t('ai.sitemapListed')}</StatusPill>
          ) : (
            <StatusPill tone="mute">{t('ai.sitemapNotListed')}</StatusPill>
          )}
        </div>
        <div className="sl-row">
          <span className="mono">llms.txt</span>
          {audit.llms === 'found' ? (
            <StatusPill tone="ok">{t('ai.llmsFound')}</StatusPill>
          ) : (
            <StatusPill tone="mute">{t('ai.llmsMissing')}</StatusPill>
          )}
        </div>
      </PanelCard>
    </>
  );
}
