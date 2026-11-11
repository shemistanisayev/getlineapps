import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { StatusTone } from '../brand.ts';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* Button */

export type ButtonVariant = 'accent' | 'lime' | 'white' | 'ghost' | 'secondary';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the arrow that slides on hover. */
  arrow?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const ArrowIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    className="line-btn-arrow"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function buttonClass(variant: ButtonVariant, size: ButtonSize, extra?: string) {
  return cx('line-btn', `line-btn--${variant}`, size !== 'lg' && `line-btn--${size}`, extra);
}

export function Button({
  variant = 'accent',
  size = 'lg',
  arrow,
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
      {arrow && <ArrowIcon />}
    </button>
  );
}

export function LinkButton({
  variant = 'accent',
  size = 'lg',
  arrow,
  icon,
  children,
  className,
  ...rest
}: ButtonOwnProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
      {arrow && <ArrowIcon />}
    </a>
  );
}

/* Pill */

const STATUS_ICONS: Record<StatusTone, ReactNode> = {
  ok: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  problem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 10v4M12 17.2h.01" />
    </>
  ),
  neutral: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </>
  ),
};

/** Extra shapes for status pills whose meaning is clearer with them ("Blocked", "Not used"). */
const EXTRA_ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <path d="M12 6v8M12 18.5h.01" />,
  x: <path d="M7 7l10 10M17 7L7 17" />,
  dash: <path d="M6 12h12" />,
};
export type PillIcon = keyof typeof EXTRA_ICONS;

export function StatusIcon({
  tone,
  icon,
  size = 12,
}: {
  tone: StatusTone;
  icon?: PillIcon;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon ? EXTRA_ICONS[icon] : STATUS_ICONS[tone]}
    </svg>
  );
}

export type PillTone = StatusTone | 'brand';

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone: PillTone;
  /** The label. Status pills always show an icon and a label. */
  children: ReactNode;
  /** Hide the status icon (only for compact severity labels like "High" next to a list). */
  noIcon?: boolean;
  size?: 'md' | 'lg';
  /** Another icon shape for the same status color (for example x for "Blocked"). */
  icon?: PillIcon;
}

export function Pill({ tone, children, noIcon, size = 'md', icon, className, ...rest }: PillProps) {
  const showIcon = tone !== 'brand' && !noIcon;
  return (
    <span
      className={cx('line-pill', `line-pill--${tone}`, size === 'lg' && 'line-pill--lg', className)}
      {...rest}
    >
      {showIcon && <StatusIcon tone={tone} icon={icon} />}
      {children}
    </span>
  );
}

export function HeroPill({ children }: { children: ReactNode }) {
  return (
    <span className="line-hero-pill">
      <span className="line-live-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/* Card */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'translucent';
  interactive?: boolean;
}

export function Card({ variant = 'default', interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'line-card',
        variant !== 'default' && `line-card--${variant}`,
        interactive && 'line-card--interactive',
        className,
      )}
      {...rest}
    />
  );
}

/* Table */

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  mono?: boolean;
}

export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  caption?: string;
}) {
  return (
    <table className="line-table">
      {caption && <caption className="line-sr-only">{caption}</caption>}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={rowKey(r, i)}>
            {columns.map((c) => (
              <td key={c.key} className={c.mono ? 'line-mono' : undefined}>
                {c.cell(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Key/value table like the Report's "Setup" section. */
export function KeyValueTable({
  rows,
  caption,
}: {
  rows: Array<{ k: ReactNode; v: ReactNode; id?: string }>;
  caption?: string;
}) {
  return (
    <table className="line-table line-table--kv">
      {caption && <caption className="line-sr-only">{caption}</caption>}
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i}>
            <th scope="row">{r.k}</th>
            <td>{r.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* CTA band */

export interface CtaBandProps {
  title: ReactNode;
  sub?: ReactNode;
  href: string;
  label: ReactNode;
  size?: 'md' | 'lg';
  headingLevel?: 2 | 3 | 4;
}

/** Dark band with the lime contact button. Only contact CTAs use lime. */
export function CtaBand({ title, sub, href, label, size = 'md', headingLevel = 3 }: CtaBandProps) {
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <div className={cx('line-cta', size === 'lg' && 'line-cta--lg')}>
      <div>
        <H className="line-cta-title">{title}</H>
        {sub && <p className="line-cta-sub">{sub}</p>}
      </div>
      <LinkButton
        variant="lime"
        size={size === 'lg' ? 'lg' : 'xs'}
        href={href}
        target="_blank"
        rel="noopener"
        arrow={size === 'lg'}
      >
        {label}
      </LinkButton>
    </div>
  );
}
