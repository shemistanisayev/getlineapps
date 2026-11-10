import { MARK_DATA } from './marks.generated.ts';

export type MarkName = keyof typeof MARK_DATA;
export interface MarkDef {
  title: string;
  tint: string;
  fill?: string;
  stroke?: string;
  svg: string;
  ring?: boolean;
}
export const MARKS = MARK_DATA as unknown as Record<MarkName, MarkDef>;
export const MARK_NAMES = Object.keys(MARKS) as MarkName[];
