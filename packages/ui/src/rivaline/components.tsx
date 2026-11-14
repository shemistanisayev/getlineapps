/**
 * Rivaline side panel building blocks (design/rivaline: PanelHeader, Main, StackDetail, Ads,
 * Brand, BrandExport). Every text comes in through props, so the extension feeds them from its
 * EN / AZ dictionaries. Styles: ./rivaline.css (classes `rv-*`).
 */
import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { Pill } from '../components/Base.tsx';
import { Glyph } from '../components/Glyph.tsx';
import { Logo } from '../components/Logo.tsx';
import { Mark } from '../components/Mark.tsx';
import type { RivalineGlyph } from '../glyphs.ts';
import type { MarkName } from '../marks.ts';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* Icons used by the panel (stroke icons from the artboards). */
const PATHS = {
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  external: (
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  /* Two columns side by side (Compare, Rivaline 1.1). */
  compare: (
    <>
      <rect x="3.5" y="4.5" width="7" height="15" rx="1.5" />
      <rect x="13.5" y="4.5" width="7" height="15" rx="1.5" />
    </>
  ),
};

export type RvIconName = keyof typeof PATHS;

export function RvIcon({
  name,
  size = 14,
  stroke = 2.2,
}: {
  name: RvIconName;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* Buttons. */

export type RvButtonVariant = 'primary' | 'secondary' | 'ink';

export function RvButton({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: {
  variant?: RvButtonVariant;
  size?: 'md' | 'lg';
  icon?: RvIconName;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx('rv-btn', `rv-btn--${variant}`, size === 'lg' && 'rv-btn--lg', className)}
      {...rest}
    >
      {icon && <RvIcon name={icon} size={14} />}
      {children}
    </button>
  );
}

/* A tool's icon: its brand mark when there is one, else its category glyph (SPEC §4.2). */

export type ToolIcon = { mark: MarkName } | { glyph: RivalineGlyph };

export function ToolIconView({
  icon,
  size = 28,
  title = null,
}: {
  icon: ToolIcon;
  size?: number;
  title?: string | null;
}) {
  return 'mark' in icon ? (
    <Mark name={icon.mark} size={size} title={title} />
  ) : (
    <Glyph set="rivaline" kind={icon.glyph} size={size} title={title} />
  );
}

/* Panel header: logo, Read the page again, Settings, Report PDF, then the tabs (PanelHeader). */

export interface RvTab<Id extends string> {
  id: Id;
  label: string;
  count?: number;
  /** Accessible text for the count ("13 tools"). */
  countLabel?: string;
}

export interface PanelHeaderProps<Id extends string> {
  readAgainLabel: string;
  settingsLabel: string;
  pdfLabel: string;
  onReadAgain?: () => void;
  onSettings?: () => void;
  onPdf?: () => void;
  /** No page read yet, Access, Restricted: Read again and Report PDF are off. */
  readDisabled?: boolean;
  pdfDisabled?: boolean;
  settingsPressed?: boolean;
  /** Compare two read sites (Rivaline 1.1); the button shows only when both are given. */
  compareLabel?: string;
  onCompare?: () => void;
  tabsLabel: string;
  tabs: RvTab<Id>[];
  /** null: no tab is current and counts are hidden (Access, Restricted). */
  active: Id | null;
  onSelect: (id: Id) => void;
  panelId?: string;
}

export function PanelHeader<Id extends string>(p: PanelHeaderProps<Id>) {
  return (
    <header className="rv-head">
      <div className="rv-head-row">
        <Logo brand="rivaline" theme="light" size={24} word />
        <span className="rv-grow" />
        <button
          type="button"
          className="rv-ib"
          aria-label={p.readAgainLabel}
          title={p.readAgainLabel}
          disabled={p.readDisabled}
          onClick={p.onReadAgain}
        >
          <RvIcon name="refresh" size={15} stroke={2} />
        </button>
        {p.compareLabel && p.onCompare ? (
          <button
            type="button"
            className="rv-ib"
            aria-label={p.compareLabel}
            title={p.compareLabel}
            onClick={p.onCompare}
          >
            <RvIcon name="compare" size={16} stroke={2} />
          </button>
        ) : null}
        <button
          type="button"
          className="rv-ib"
          aria-label={p.settingsLabel}
          title={p.settingsLabel}
          aria-pressed={p.settingsPressed}
          onClick={p.onSettings}
        >
          <RvIcon name="settings" size={16} stroke={2} />
        </button>
        <button
          type="button"
          className="rv-pdf"
          disabled={p.pdfDisabled || p.readDisabled}
          onClick={p.onPdf}
        >
          <RvIcon name="download" />
          <span className="rv-pdf-label">{p.pdfLabel}</span>
        </button>
      </div>
      <PanelTabs
        label={p.tabsLabel}
        tabs={p.tabs}
        active={p.active}
        onSelect={p.onSelect}
        panelId={p.panelId}
      />
    </header>
  );
}

export function PanelTabs<Id extends string>({
  tabs,
  active,
  onSelect,
  label,
  panelId,
}: {
  tabs: RvTab<Id>[];
  active: Id | null;
  onSelect: (id: Id) => void;
  label: string;
  panelId?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    const to =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (i + step + tabs.length) % tabs.length;
    e.preventDefault();
    onSelect(tabs[to]!.id);
    refs.current[to]?.focus();
  };
  const focusable = active ?? tabs[0]?.id;
  return (
    <div className="rv-tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`rv-tab-${t.id}`}
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={t.id === focusable ? 0 : -1}
            className={cx('rv-tab', on && 'rv-tab--on')}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
            {active !== null && t.count !== undefined ? (
              <span className="rv-badge" aria-label={t.countLabel}>
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* Cards and section titles. */

export function RvCard({
  children,
  className,
  id,
  label,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  label?: string;
}) {
  return (
    <section className={cx('rv-card', className)} id={id} aria-label={label}>
      {children}
    </section>
  );
}

export function CardHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rv-cardhead">
      <h2 className="rv-eyebrow">{title}</h2>
      {note && <span className="rv-note">{note}</span>}
    </div>
  );
}

/* Stack hero (Main): host and page, "<N> tools in <M> categories", the summary line, marks. */

export function StackHero({
  host,
  page,
  title,
  subline,
  icons,
  more,
  moreLabel,
}: {
  host: string;
  page: string;
  title: string;
  subline?: string;
  icons: Array<{ key: string; icon: ToolIcon; title: string }>;
  /** Tools not shown in the marks row ("+6"). */
  more?: number;
  moreLabel?: string;
}) {
  return (
    <div className="rv-hero">
      <div className="rv-hero-top">
        <span className="rv-hero-host">{host}</span>
        <span>{page}</span>
      </div>
      <div className="rv-hero-main">
        <h1 className="rv-hero-title">{title}</h1>
        {subline && <p className="rv-hero-sub">{subline}</p>}
      </div>
      {icons.length > 0 && (
        <ul className="rv-hero-marks">
          {icons.map((m) => (
            <li key={m.key}>
              <ToolIconView icon={m.icon} size={26} title={m.title} />
            </li>
          ))}
          {more ? (
            <li className="rv-more" aria-label={moreLabel}>
              +{more}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

/* Gap strip: "3 gaps: server-side tracking, consent banner, CRM" (Warning with an icon). */

export function GapStrip({
  count,
  list,
  href = '#gaps',
  onClick,
}: {
  count: string;
  list: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a className="rv-gapstrip" href={href} onClick={onClick}>
      <RvIcon name="alert" size={18} />
      <span className="rv-grow">
        <b>{count}</b>
        <span className="rv-gapstrip-list">: {list}</span>
      </span>
      <RvIcon name="chevron" size={14} stroke={2.4} />
    </a>
  );
}

/* Category chips: All first, horizontal scroll with a fade (Main, StackDetail). */

export function CategoryChips<Id extends string>({
  label,
  chips,
  active,
  onSelect,
}: {
  label: string;
  chips: Array<{ id: Id; label: string; count: number }>;
  active: Id;
  onSelect: (id: Id) => void;
}) {
  return (
    <div className="rv-chips" role="group" aria-label={label}>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          className={cx('rv-chip', c.id === active && 'rv-chip--on')}
          aria-pressed={c.id === active}
          onClick={() => onSelect(c.id)}
        >
          {c.label} <b>{c.count}</b>
        </button>
      ))}
    </div>
  );
}

/* Grouped tool list (Main) with in-place detail (StackDetail). */

export function ToolGroup({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="rv-group" role="group" aria-label={name}>
      <div className="rv-group-head">
        <span className="rv-eyebrow">{name}</span>
        <span className="rv-group-count">{count}</span>
      </div>
      {children}
    </div>
  );
}

export function ToolRow({
  icon,
  name,
  id,
  expanded,
  onToggle,
  detailId,
  children,
}: {
  icon: ToolIcon;
  name: string;
  /** ID or kind label, shown in mono ("GTM-N4KV8R", "chat"). */
  id?: string;
  expanded?: boolean;
  onToggle?: () => void;
  detailId?: string;
  /** The expanded part: evidence and actions. */
  children?: ReactNode;
}) {
  return (
    <div className={cx('rv-tool', expanded && 'rv-tool--open')}>
      <button
        type="button"
        className="rv-trow"
        aria-expanded={expanded}
        aria-controls={expanded ? detailId : undefined}
        onClick={onToggle}
      >
        <ToolIconView icon={icon} />
        <span className="rv-trow-text">
          <span className="rv-trow-name">{name}</span>
          {id && <span className="rv-trow-id rv-mono">{id}</span>}
        </span>
        <RvIcon name={expanded ? 'chevronDown' : 'chevron'} size={14} />
      </button>
      {expanded && children && (
        <div className="rv-tdetail" id={detailId}>
          {children}
        </div>
      )}
    </div>
  );
}

/** "How Rivaline found it": kind pill + mono value, max 4 rows (SPEC §4.2). */
export function EvidenceList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ kind: string; value: string }>;
}) {
  return (
    <div className="rv-evidence">
      <span className="rv-evidence-title">{title}</span>
      <dl>
        {rows.slice(0, 4).map((r, i) => (
          <div key={i} className="rv-ev">
            <dt className="rv-evk">{r.kind}</dt>
            <dd className="rv-mono" title={r.value}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Not found card: gaps with the lime CTA (StackDetail). */

export function NotFoundCard({
  title,
  gaps,
  cta,
}: {
  title: string;
  gaps: Array<{ title: string; text: string }>;
  cta?: { text: string; label: string; href: string };
}) {
  return (
    <section id="gaps" className="rv-card rv-notfound" aria-label={title}>
      <h2 className="rv-eyebrow rv-warn-eyebrow">
        <RvIcon name="alert" size={13} />
        {title}
      </h2>
      <ul>
        {gaps.map((g) => (
          <li key={g.title}>
            <span className="rv-gi">
              <RvIcon name="alert" size={15} />
            </span>
            <span className="rv-gtext">
              <b>{g.title}</b>
              <span>{g.text}</span>
            </span>
          </li>
        ))}
      </ul>
      {cta && <LimeCta {...cta} />}
    </section>
  );
}

export function LimeCta({ text, label, href }: { text: string; label: string; href: string }) {
  return (
    <div className="rv-lime">
      <span>{text}</span>
      <a className="rv-btn rv-btn--ink" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  );
}

/* Ads tab: fields and library rows. */

export function RvField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('rv-field', className)}>
      {label}
      {children}
    </label>
  );
}

export function LibraryRow({
  icon,
  name,
  desc,
  href,
  openLabel,
  query,
  status,
  highlighted,
}: {
  icon: ToolIcon;
  name: string;
  desc: string;
  href: string;
  openLabel: string;
  query: string;
  status: { found: boolean; label: string };
  highlighted?: boolean;
}) {
  return (
    <li className={cx('rv-lib', highlighted && 'rv-lib--on')}>
      <div className="rv-lib-top">
        <ToolIconView icon={icon} size={30} />
        <span className="rv-lib-text">
          <span className="rv-lib-name">{name}</span>
          <span className="rv-lib-desc">{desc}</span>
        </span>
        <a
          className="rv-btn rv-btn--secondary rv-go"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={openLabel}
          title={openLabel}
        >
          <RvIcon name="external" size={15} />
        </a>
      </div>
      <div className="rv-lib-pills">
        <span className="rv-q">
          <RvIcon name="search" size={11} stroke={2.4} />
          <span className="rv-mono">{query}</span>
        </span>
        <Pill tone={status.found ? 'ok' : 'neutral'}>{status.label}</Pill>
      </div>
    </li>
  );
}

/* Brand tab. */

export function LogoBox({ children }: { children: ReactNode }) {
  return <div className="rv-logobox">{children}</div>;
}

export function Swatch({
  role,
  hex,
  copyLabel,
  onCopy,
}: {
  role: string;
  hex: string;
  /** "Copy #2F5D46" */
  copyLabel: string;
  onCopy?: () => void;
}) {
  return (
    // The name is the visible role and hex (WCAG 2.5.3), the copy hint is the tooltip.
    <button type="button" className="rv-sw" title={copyLabel} onClick={onCopy}>
      <i style={{ background: hex }} />
      <span className="rv-sw-role">{role}</span>
      <span className="rv-sw-hex rv-mono">{hex}</span>
    </button>
  );
}

export function FontRow({
  role,
  name,
  detail,
  source,
}: {
  role: string;
  name: string;
  detail: string;
  source: string;
}) {
  return (
    <div className="rv-frow">
      <span className="rv-frow-role">{role}</span>
      <span className="rv-frow-font">
        <b>{name}</b>
        <span>{detail}</span>
      </span>
      <Pill tone="neutral" noIcon>
        {source}
      </Pill>
    </div>
  );
}

/** The page's main button drawn with its own values (SPEC §6), and the values next to it. */
export function ButtonPreview({
  label,
  style,
  spec,
}: {
  label: string;
  style: CSSProperties;
  spec: string[];
}) {
  return (
    <div className="rv-btnprev">
      <span className="rv-btnprev-btn" style={style} title={label}>
        <span className="rv-btnprev-label">{label}</span>
      </span>
      <span className="rv-btnprev-spec rv-mono">
        {spec.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </div>
  );
}

/* Export sheet (BrandExport). */

export function Segmented<Id extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: Id; label: string }>;
  value: Id;
  onChange: (id: Id) => void;
}) {
  return (
    <div className="rv-seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          className={cx(o.id === value && 'rv-seg--on')}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CodeBlock({ code, label }: { code: string; label: string }) {
  // Keys of CSS variables and JSON are tinted like the design.
  const parts = code.split(/(--[\w-]+|"[\w-]+"(?=:))/g);
  return (
    <pre className="rv-code" tabIndex={0} aria-label={label}>
      {parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}
    </pre>
  );
}

export function Sheet({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="rv-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="rv-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="rv-sheet-head">
          <h2>{title}</h2>
          <button type="button" className="rv-ib" aria-label={closeLabel} onClick={onClose}>
            <RvIcon name="close" size={14} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/** Dark pill toast, role=status (SPEC §7: 2.5 seconds, the caller removes it). */
export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="rv-toast" role="status">
      <RvIcon name="check" size={14} stroke={2.6} />
      {children}
    </div>
  );
}
