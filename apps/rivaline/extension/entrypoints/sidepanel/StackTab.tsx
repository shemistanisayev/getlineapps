import type { Category, FoundTool } from '@line/core/rivaline';
import { contactUrl } from '@line/core/site';
import {
  CategoryChips,
  EvidenceList,
  GapStrip,
  NotFoundCard,
  RvButton,
  RvCard,
  StackHero,
  ToolGroup,
  ToolRow,
} from '@line/ui/rivaline';
import { useState } from 'react';
import type { ScanResult } from '../../src/capture/scan.ts';
import type { MessageKey, T } from '../../src/i18n/index.ts';
import {
  TOOL_LIBRARY,
  categoryLabel,
  gapLine,
  gapShort,
  gapTitle,
  pageLabel,
  plural,
  stackSubline,
  stackTitle,
  toolIcon,
} from '../../src/stack-view.ts';

const CTA = contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'panel_cta' });

/** Stack tab (design: Main, StackDetail). */
export function StackTab({
  result,
  t,
  onCopy,
  onOpenLibrary,
}: {
  result: ScanResult;
  t: T;
  onCopy: (text: string, toast: string) => void;
  onOpenLibrary: (library: string) => void;
}) {
  const { stack } = result;
  const [chip, setChip] = useState<'all' | Category>('all');
  const [open, setOpen] = useState<string | null>(null);
  const host = new URL(result.url).host;
  const has = (c: Category) => stack.tools.some((x) => x.category === c);
  const consentWaits = has('consent') && (!has('analytics') || !has('advertising'));

  const groups = stack.groups.filter((g) => chip === 'all' || g.category === chip);
  const chips = [
    { id: 'all' as const, label: t('chips.all'), count: stack.tools.length },
    ...stack.chips.map((c) => ({
      id: c.category,
      label: categoryLabel(t, c.category),
      count: c.count,
    })),
  ];

  const detail = (tool: FoundTool) => {
    const library = TOOL_LIBRARY[tool.id];
    return (
      <>
        <EvidenceList
          title={t('detail.how')}
          rows={tool.evidence.map((e) => ({
            kind: t(`ev.${e.kind}` as MessageKey),
            value: e.value,
          }))}
        />
        {(tool.ids.length > 0 || library) && (
          <div className="rv-tdetail-actions">
            {tool.ids.length > 0 && (
              <RvButton icon="copy" onClick={() => onCopy(tool.ids.join(', '), t('detail.copied'))}>
                {t('detail.copyId')}
              </RvButton>
            )}
            {library && (
              <RvButton icon="external" onClick={() => onOpenLibrary(library)}>
                {t('detail.openIn', { library: t(`lib.${library}` as MessageKey) })}
              </RvButton>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <StackHero
        host={host}
        page={pageLabel(t, result.url)}
        title={stackTitle(t, stack)}
        subline={stackSubline(t, stack)}
        icons={stack.summary.marks.map((m) => ({ key: m.id, icon: toolIcon(m), title: m.name }))}
        more={stack.summary.more}
        moreLabel={t('stack.more', { n: stack.summary.more })}
      />
      {stack.gaps.length > 0 && (
        <GapStrip
          count={plural(t, 'gaps', stack.gaps.length)}
          list={stack.gaps.map((g) => gapShort(t, g)).join(', ')}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('gaps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
      <CategoryChips label={t('chips.label')} chips={chips} active={chip} onSelect={setChip} />
      <RvCard className="rv-tools" label={t('stack.list')}>
        {groups.map((g) => (
          <ToolGroup key={g.category} name={categoryLabel(t, g.category)} count={g.tools.length}>
            {g.tools.map((tool) => (
              <ToolRow
                key={tool.id}
                icon={toolIcon(tool)}
                name={tool.name}
                id={tool.label || undefined}
                expanded={open === tool.id}
                detailId={`rv-detail-${tool.id}`}
                onToggle={() => setOpen(open === tool.id ? null : tool.id)}
              >
                {detail(tool)}
              </ToolRow>
            ))}
          </ToolGroup>
        ))}
      </RvCard>
      {result.snapshot.resourcesFull && <p className="rp-muted">{t('stack.full')}</p>}
      {/* Many sites load tags only after consent (QA: theguardian.com): say so instead of
          letting "No analytics" read as the whole truth. */}
      {consentWaits && <p className="rp-muted">{t('stack.consentNote')}</p>}
      {stack.gaps.length > 0 && (
        <NotFoundCard
          title={t('notFound.title')}
          gaps={stack.gaps.map((g) => ({ title: gapTitle(t, g), text: gapLine(t, g) }))}
          cta={{ text: t('notFound.cta'), label: t('cta.touch'), href: CTA }}
        />
      )}
    </>
  );
}
