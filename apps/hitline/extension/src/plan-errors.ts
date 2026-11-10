import type { PlanError } from '@line/core/hitline';
import type { T } from './i18n/index.ts';

/** A tracking plan file error, in the UI language (panel PlanSetup and popup Settings). */
export function planErrorText(e: PlanError, t: T): string {
  if (e.code === 'row') return t(`plan.error.row.${e.reason}`, { line: e.line });
  return t(`plan.error.${e.code}`);
}
