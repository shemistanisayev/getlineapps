import { GLYPH_SETS, GLYPH_TONES, type GlyphDef, type GlyphSet } from '../glyphs.ts';

type ToneOf<S extends GlyphSet> = keyof (typeof GLYPH_TONES)[S];
type KindOf<S extends GlyphSet> = keyof (typeof GLYPH_SETS)[S];

export interface GlyphProps<S extends GlyphSet> {
  set: S;
  kind: KindOf<S>;
  tone?: ToneOf<S>;
  size?: number;
  /** Tooltip and accessible name. Defaults to the glyph title. Pass null for decorative use. */
  title?: string | null;
}

/** Tinted rounded square with a line glyph (Foldline checks, Markline tools). */
export function Glyph<S extends GlyphSet>({ set, kind, tone, size = 28, title }: GlyphProps<S>) {
  const def = (GLYPH_SETS[set] as Record<string, GlyphDef>)[kind as string];
  if (!def) return null;
  const tones = GLYPH_TONES[set] as Record<string, readonly [string, string]>;
  const fallback = set === 'markline' ? 'brand' : 'neutral';
  const [tint, ink] = tones[(tone as string | undefined) ?? fallback] ?? ['#EEEDF3', '#475467'];
  const name = title === undefined ? def.title : title;
  const glyph = Math.round(size * 0.62);
  return (
    <span
      className="line-glyph"
      title={name ?? undefined}
      role={name ? 'img' : undefined}
      aria-label={name ?? undefined}
      aria-hidden={name ? undefined : true}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        background: def.brand ? def.brand.tint : tint,
      }}
    >
      {def.brand ? (
        <svg
          viewBox="0 0 24 24"
          width={glyph}
          height={glyph}
          fill={def.brand.fill}
          aria-hidden="true"
        >
          <path d={def.d} />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width={glyph}
          height={glyph}
          fill="none"
          stroke={ink}
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={def.d} />
          {def.d2 && <path d={def.d2} strokeDasharray="2.2 3" />}
        </svg>
      )}
    </span>
  );
}
