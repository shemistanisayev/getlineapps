/**
 * Summarizes the QA sessions written by scripts/qa-hitline.ts: what the panel and the popup would
 * show for each site, so false positives and missed platforms can be checked by hand.
 *   pnpm exec tsx scripts/qa-hitline-report.ts <outDir> [site ...]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  analyze,
  analyzePopup,
  type PopupProbe,
  type SessionInput,
} from '../packages/core/src/hitline/index.ts';

const [outDir = 'qa-out', ...only] = process.argv.slice(2);
const sites = only.length ? only : ['irshad', 'kontakt', 'umico', 'misli', 'birbank'];
const out: string[] = [];
const p = (s = '') => out.push(s);

for (const site of sites) {
  const file = join(outDir, `${site}.session.json`);
  if (!existsSync(file)) continue;
  const session = JSON.parse(readFileSync(file, 'utf8')) as SessionInput;
  const a = analyze(session, { other: true });
  p(`## ${site}`);
  p(`pages: ${a.pages.join(' | ')}`);
  p(
    `requests kept: ${session.requests.length}, snapshots: ${session.snapshots.length}, gtm scripts: ${session.gtmScripts?.map((g) => g.id).join(',') || '-'}`,
  );
  p(`globals: ${[...new Set(session.snapshots.flatMap((s) => s.globals ?? []))].join(', ')}`);
  p(
    `cmp: ${a.consent.model.cmp.join(', ') || '-'}, consent active: ${a.consent.model.active}, choice: ${a.consent.model.choice?.kind ?? '-'}`,
  );
  p(
    `sgtm: ${a.sgtm.detected} ${a.sgtm.host ?? ''} signals ${a.sgtm.signals
      .filter((s) => s.found)
      .map((s) => s.id)
      .join(',')}`,
  );
  p('platforms:');
  for (const x of a.platforms)
    p(
      `  ${x.platform} events=${x.events} ids=${x.accounts.join(',')}${x.loadedOnly ? ' (loaded only)' : ''}`,
    );
  const byEvent = new Map<string, number>();
  for (const h of a.events)
    byEvent.set(`${h.platform} ${h.event}`, (byEvent.get(`${h.platform} ${h.event}`) ?? 0) + 1);
  p('events:');
  for (const [k, n] of [...byEvent].sort()) p(`  ${k} x${n}`);
  const other = a.events.filter((h) => h.platform === 'other');
  if (other.length) {
    p('other requests:');
    for (const h of other.slice(0, 15)) p(`  ${h.method} ${h.url.slice(0, 160)}`);
  }
  for (const g of a.gtm) {
    p(
      `gtm ${g.container.id}${g.container.estimated ? ' (estimated)' : ''}: ${g.tags.length} tags, ${g.events.length} events`,
    );
    for (const t of g.tags.slice(0, 60))
      p(
        `  [${t.status}] ${t.name} | ${t.type} | ${t.trigger.slice(0, 90)}${t.consent.length ? ` | consent ${t.consent.join(',')}` : ''}`,
      );
    const fired = g.events.filter((e) => e.tags.some((x) => x.fires === 'yes'));
    p(
      `  events with firing tags: ${fired.map((e) => `${e.hit.event}(${e.tags.filter((x) => x.fires === 'yes').length})`).join(' ')}`,
    );
  }
  p('issues:');
  for (const i of a.issues)
    p(
      `  [${i.severity}] ${i.key} ${JSON.stringify(i.data).slice(0, 160)} evidence=${i.evidence.length}`,
    );
  const pf = join(outDir, `${site}.popup.json`);
  if (existsSync(pf)) {
    const s = analyzePopup(JSON.parse(readFileSync(pf, 'utf8')) as PopupProbe);
    p(
      `popup: host=${s.host} requests=${s.requests} bufferFull=${s.bufferFull} noTracking=${s.noTracking}`,
    );
    p(
      `  platforms: ${s.platforms.map((x) => `${x.platform}:${x.loadedOnly ? 'loaded' : x.events}`).join(' ')}`,
    );
    p(`  issues: ${s.issues.map((i) => i.key).join(' ') || '-'}`);
  }
  p();
}
writeFileSync(join(outDir, 'summary.txt'), out.join('\n'));
console.log(out.join('\n'));
