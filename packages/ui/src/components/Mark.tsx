import { MARKS, type MarkName } from '../marks.ts';

export interface MarkProps {
  name: MarkName;
  size?: number;
  /** Accessible name. Defaults to the platform name. Pass null for decorative use. */
  title?: string | null;
}

/** Platform mark on its light tint square (design/rivaline/Mark.dc.html, design/serpline/Mark.dc.html). */
export function Mark({ name, size = 22, title }: MarkProps) {
  const m = MARKS[name];
  const label = title === undefined ? m.title : title;
  const glyph = Math.round(size * 0.62);
  const paint = m.fill
    ? { fill: m.fill }
    : {
        fill: 'none',
        stroke: m.stroke,
        strokeWidth: 2.2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
      };
  return (
    <span
      className="line-glyph"
      title={label ?? undefined}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        background: m.tint,
        boxShadow: m.ring ? 'inset 0 0 0 1px rgba(16,24,40,.08)' : 'none',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={glyph}
        height={glyph}
        aria-hidden="true"
        {...paint}
        dangerouslySetInnerHTML={{ __html: m.svg }}
      />
    </span>
  );
}
