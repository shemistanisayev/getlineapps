/**
 * Serpline side panel building blocks (design/serpline: PanelHeader, Main, Headings, Links,
 * Render, Ai). Every text comes in through props, so the extension feeds them from its
 * EN / AZ dictionaries. Styles: ./serpline.css (classes `sl-*`).
 */
import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { StatusTone } from '../brand.ts';
import { Mark } from '../components/Mark.tsx';
import type { MarkName } from '../marks.ts';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* Icons used by the panel chrome (stroke icons from the artboards). */
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
  chevron: <path d="M6 9l6 6 6-6" />,
};

export function SlIcon({
  name,
  size = 14,
  stroke = 2.2,
}: {
  name: keyof typeof PATHS;
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

/* Page row: host, path, Check again, Audit PDF, Settings (PanelHeader, second row). */

export interface PageRowProps {
  host: string;
  path: string;
  checkAgainLabel: string;
  pdfLabel: string;
  settingsLabel: string;
  onCheckAgain?: () => void;
  onPdf?: () => void;
  onSettings?: () => void;
  /** Disables Check again and Audit PDF (no result yet, restricted page). */
  disabled?: boolean;
  /** Disables only Audit PDF. */
  pdfDisabled?: boolean;
  settingsPressed?: boolean;
}

export function PageRow(p: PageRowProps) {
  return (
    <div className="sl-pagerow">
      <p className="sl-pagerow-url" title={p.host + p.path}>
        <b>{p.host}</b>
        <span>{p.path}</span>
      </p>
      <button
        type="button"
        className="sl-iconbtn"
        aria-label={p.checkAgainLabel}
        title={p.checkAgainLabel}
        onClick={p.onCheckAgain}
        disabled={p.disabled}
      >
        <SlIcon name="refresh" />
      </button>
      <button
        type="button"
        className="sl-pdfbtn"
        onClick={p.onPdf}
        disabled={p.disabled || p.pdfDisabled}
      >
        {p.pdfLabel}
      </button>
      <button
        type="button"
        className="sl-iconbtn"
        aria-label={p.settingsLabel}
        title={p.settingsLabel}
        aria-pressed={p.settingsPressed}
        onClick={p.onSettings}
      >
        <SlIcon name="settings" size={15} stroke={2} />
      </button>
    </div>
  );
}

/* Tabs with red issue badges (blue on the active tab). Arrow keys move between tabs. */

export interface PanelTab<Id extends string> {
  id: Id;
  label: string;
  /** Issue count. 0 or undefined shows no badge (Summary never has one). */
  count?: number;
  /** Accessible text for the badge, for example "2 issues". */
  countLabel?: string;
}

export function PanelTabs<Id extends string>({
  tabs,
  active,
  onSelect,
  label,
  panelId,
}: {
  tabs: PanelTab<Id>[];
  active: Id;
  onSelect: (id: Id) => void;
  /** Accessible name of the tab list ("Serpline sections"). */
  label: string;
  /** id of the element the tabs control. */
  panelId?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (i + step + tabs.length) % tabs.length;
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    onSelect(tabs[to]!.id);
    refs.current[to]?.focus();
  };
  return (
    <div className="sl-tabs" role="tablist" aria-label={label}>
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
            id={`sl-tab-${t.id}`}
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            className={cx('sl-tab', on && 'sl-tab--on')}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
            {t.count ? (
              <span className="sl-badge" aria-label={t.countLabel}>
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* Footer CTAs: dark bar (Summary, Headings, Links, Stale) and lime card (Render, AI). */

export function FooterCta({ text, label, href }: { text: string; label: string; href: string }) {
  return (
    <div className="sl-footer">
      <span>{text}</span>
      <a className="sl-footer-btn" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  );
}

export function LimeCta({ text, label, href }: { text: string; label: string; href: string }) {
  return (
    <div className="sl-lime">
      <span>{text}</span>
      <a className="sl-lime-btn" href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </div>
  );
}

/* Blue hero card and the score ring. */

export function HeroCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sl-hero', className)}>{children}</div>;
}

export function ScoreRing({
  score,
  label,
  size = 60,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const r = 27;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      className="sl-ring"
    >
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#C6F36B"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${((c * v) / 100).toFixed(1)} ${Math.ceil(c)}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="38" textAnchor="middle" className="sl-ring-n">
        {v}
      </text>
    </svg>
  );
}

/* Card with an eyebrow title, and the rows inside it. */

export function PanelCard({
  title,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('sl-card', className)}>
      {title !== undefined && (
        <div className="sl-card-head">
          <h2 className="sl-eyebrow">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** One "On-page checks" row: label left, status pill right. `tone` problem tints the row. */
export function CheckRow({
  label,
  children,
  tone,
}: {
  label: ReactNode;
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <div className={cx('sl-row', tone === 'problem' && 'sl-row--bad')}>
      <span>{label}</span>
      {children}
    </div>
  );
}

/* Count tile (Headings H1..H4, Links). */

export function CountTile({
  value,
  label,
  problem,
  icon,
}: {
  value: ReactNode;
  label: ReactNode;
  problem?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className={cx('sl-tile', problem && 'sl-tile--bad')}>
      <b>{value}</b>
      <span>
        {icon}
        {label}
      </span>
    </div>
  );
}

/* Heading level chip H1..H6 and an outline row with indent. */

export function LevelChip({ level }: { level: number }) {
  const l = Math.max(1, Math.min(6, level));
  return <span className={cx('sl-lv', `sl-lv--${Math.min(l, 4)}`)}>H{l}</span>;
}

export function OutlineRow({
  level,
  text,
  depth = level - 1,
  tone,
  strong,
  children,
}: {
  level: number;
  text: ReactNode;
  /** Indent steps; defaults to level - 1 (design: 14px + 16px per step). */
  depth?: number;
  tone?: StatusTone;
  strong?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx('sl-hrow', tone === 'problem' && 'sl-row--bad')}
      style={{ paddingLeft: 14 + Math.max(0, depth) * 16 }}
    >
      <LevelChip level={level} />
      <span className={cx('sl-ht', strong && 'sl-ht--strong')}>{text}</span>
      {children}
    </div>
  );
}

/* Switch and segmented control. */

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx('sl-switch', checked && 'sl-switch--on')}
      onClick={() => onChange(!checked)}
    />
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: V; label: string }>;
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div className="sl-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={cx(o.value === value && 'sl-seg-on')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* AI crawler badge and row. */

/** Crawler owner mark: a Simple Icons brand mark, or "CC" letters for Common Crawl (no mark). */
export type CrawlerOwner =
  | Extract<
      MarkName,
      'openai' | 'anthropic' | 'perplexity' | 'google' | 'apple' | 'bytedance' | 'meta'
    >
  | 'commoncrawl';

export function CrawlerBadge({ owner, size = 20 }: { owner: CrawlerOwner; size?: number }) {
  if (owner === 'commoncrawl') {
    return (
      <span className="sl-cc" style={{ width: size, height: size }} aria-hidden="true">
        CC
      </span>
    );
  }
  return <Mark name={owner} size={size} title={null} />;
}

export function BotRow({
  owner,
  userAgent,
  shownAs,
  status,
  rule,
}: {
  owner: CrawlerOwner;
  userAgent: string;
  shownAs: string;
  /** The status pill (allowed, allowed by *, blocked). */
  status: ReactNode;
  /** The robots.txt line behind a block, shown under the name. */
  rule?: string;
}) {
  return (
    <div className={cx('sl-brow', rule && 'sl-brow--rule')}>
      <CrawlerBadge owner={owner} />
      <span className="sl-bn">
        <span>
          {userAgent}
          <em>{shownAs}</em>
        </span>
        {rule && <span className="sl-rule">{rule}</span>}
      </span>
      {status}
    </div>
  );
}

/* Google result (Main "Google preview", landing #preview). */

export interface SerpResultProps {
  siteName: string;
  /** "https://example.com › products › wireless-headph..." */
  urlLine: string;
  title: string;
  description: string;
  device: 'mobile' | 'desktop';
}

/**
 * A Google result. Desktop renders at Google's 600 px column and scales down to fit the panel,
 * so the cut points look the same as on google.com. The favicon is never loaded (no network):
 * a neutral circle with the site's first letter stands in for it.
 */
export function SerpResult({ siteName, urlLine, title, description, device }: SerpResultProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  // Scaling is applied to the DOM directly: measure now, then on every panel resize.
  useLayoutEffect(() => {
    const el = outer.current;
    const box = inner.current;
    if (!el || !box) return;
    if (device !== 'desktop') {
      box.style.transform = '';
      el.style.height = '';
      return;
    }
    const apply = () => {
      const s = Math.min(1, el.clientWidth / 600);
      box.style.transform = `scale(${s})`;
      el.style.height = `${box.offsetHeight * s}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, title, description]);

  return (
    <div ref={outer} className="sl-serp-fit">
      <div ref={inner} className={cx('sl-serp', device === 'desktop' && 'sl-serp--desktop')}>
        <div className="sl-serp-site">
          <span className="sl-serp-fav" aria-hidden="true">
            <span>{siteName.slice(0, 1).toLowerCase()}</span>
          </span>
          <span className="sl-serp-meta">
            <span className="sl-serp-name">{siteName}</span>
            <span className="sl-serp-url">{urlLine}</span>
          </span>
        </div>
        <span className="sl-serp-title">{title}</span>
        <span className="sl-serp-desc">{description}</span>
      </div>
    </div>
  );
}
