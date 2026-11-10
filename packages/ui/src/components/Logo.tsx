import type { CSSProperties } from 'react';
import {
  BRANDS,
  HUB_LOGO_PATHS,
  HUB_LOGO_STROKE,
  LOGO_GLYPHS,
  LOGO_STROKE,
  hubLogoColors,
  logoColors,
  logoMetrics,
  type LogoTheme,
  type ToolSlug,
} from '../brand.ts';

interface LogoBaseProps {
  theme?: LogoTheme;
  size?: number;
  /** Show the wordmark next to the tile. */
  word?: boolean;
  className?: string;
  /** Accessible name. Defaults to the product name. */
  label?: string;
}

const wrap = (gap: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap,
  fontFamily: "'Plus Jakarta Sans', Inter, Arial, sans-serif",
});

const tile = (size: number, radius: number, bg: string, ring = 'none'): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: radius,
  background: bg,
  boxShadow: ring,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
});

const wordStyle = (wordSize: number, color: string): CSSProperties => ({
  fontSize: wordSize,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  color,
});

export function LogoGlyph({
  brand,
  size,
  color,
}: {
  brand: ToolSlug;
  size: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={LOGO_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LOGO_GLYPHS[brand].map((p, i) =>
        p.fill ? (
          <path key={i} d={p.d} fill={color} stroke="none" />
        ) : (
          <path key={i} d={p.d} opacity={p.opacity} strokeDasharray={p.dash?.join(' ')} />
        ),
      )}
    </svg>
  );
}

/** Tool logo: rounded tile with the tool glyph, optional wordmark. design/<tool>/Logo.dc.html */
export function Logo({
  brand,
  theme = 'light',
  size = 96,
  word = true,
  className,
  label,
}: LogoBaseProps & { brand: ToolSlug }) {
  const m = logoMetrics(size);
  const c = logoColors(brand, theme);
  const b = BRANDS[brand];
  const hl = c.lineHighlight;
  return (
    <span
      className={className}
      style={wrap(m.gap)}
      // label="": decorative (the name is already visible next to it).
      role={label === '' ? undefined : 'img'}
      aria-label={label === '' ? undefined : (label ?? b.name)}
      aria-hidden={label === '' ? true : undefined}
      data-brand={brand}
      data-theme={theme}
    >
      <span style={tile(m.size, m.radius, c.tileBg)}>
        <LogoGlyph brand={brand} size={m.glyph} color={c.glyph} />
      </span>
      {word && (
        <span style={wordStyle(m.wordSize, c.wordInk)} aria-hidden="true">
          {b.first}
          <span
            style={{
              color: c.wordAccent,
              background: hl ?? 'none',
              padding: hl ? '0 0.04em' : 0,
              display: hl ? 'inline-block' : 'inline',
              lineHeight: 1,
            }}
          >
            line
          </span>
        </span>
      )}
    </span>
  );
}

/** "Line apps" hub logo: five nested lines bending into an L. design/hub/HubLogo.dc.html */
export function HubLogo({
  theme = 'light',
  size = 96,
  word = true,
  className,
  label,
}: LogoBaseProps) {
  const m = logoMetrics(size);
  const c = hubLogoColors(theme);
  return (
    <span
      className={className}
      style={wrap(m.gap)}
      role={label === '' ? undefined : 'img'}
      aria-label={label === '' ? undefined : (label ?? 'Line apps')}
      aria-hidden={label === '' ? true : undefined}
      data-theme={theme}
    >
      <span style={tile(m.size, m.radius, c.tileBg, c.ring)}>
        <svg
          width={m.glyph}
          height={m.glyph}
          viewBox="0 0 48 48"
          fill="none"
          strokeWidth={HUB_LOGO_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {HUB_LOGO_PATHS.map((d, i) => (
            <path key={d} d={d} stroke={c.lines[i]} />
          ))}
        </svg>
      </span>
      {word && (
        <span style={wordStyle(m.wordSize, c.wordInk)} aria-hidden="true">
          Line<span style={{ color: c.wordSoft, fontWeight: 600 }}>apps</span>
        </span>
      )}
    </span>
  );
}
