/** Small building blocks of the Hitline panel (design/hitline/*.dc.html: .pf, .pill, icons). */
import { MARKS, type MarkName } from '@line/ui/marks';
import type { Platform } from '@line/core/hitline';
import type { ReactNode } from 'react';

export const PLATFORM_NAME: Record<Platform, string> = {
  ga4: 'GA4',
  ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok',
  hotjar: 'Hotjar',
  gtm: 'GTM',
  datalayer: 'dataLayer',
};

const MARK: Record<Platform, MarkName> = {
  ga4: 'googleanalytics',
  ads: 'googleads',
  meta: 'meta',
  tiktok: 'tiktok',
  hotjar: 'hotjar',
  gtm: 'googletagmanager',
  datalayer: 'googletagmanager',
};

/** Tinted square with the brand mark (Simple Icons, CC0), then the label. */
export function PlatformBadge({ platform, label }: { platform: Platform; label?: ReactNode }) {
  const m = MARKS[MARK[platform]];
  return (
    <span className="pf">
      <i style={{ background: m.tint }}>
        <svg
          viewBox="0 0 24 24"
          width="62%"
          height="62%"
          fill={m.fill ?? 'none'}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: m.svg }}
        />
      </i>
      {label === undefined ? PLATFORM_NAME[platform] : label}
    </span>
  );
}

export type Tone = 'ok' | 'bad' | 'warn' | 'mute' | 'pur';

const ICON = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 6v8" />
      <path d="M12 18.5h.01" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </>
  ),
  dash: <path d="M7 12h10" />,
  x: <path d="M7 7l10 10M17 7L7 17" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  click: (
    <>
      <path d="M9 11l-4 9 3-1 2 3 3-7" />
      <path d="M14 4l1.5 4.5L20 10l-4.5 1.5L14 16l-1.5-4.5L8 10l4.5-1.5z" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
} as const;
export type IconName = keyof typeof ICON;

export function Icon({
  name,
  size = 12,
  stroke = 3,
}: {
  name: IconName;
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
      {ICON[name]}
    </svg>
  );
}

/** Status pill: color plus an icon plus a label (status colors are never shown alone). */
export function Pill({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span className={`pill ${tone}`}>
      {icon && <Icon name={icon} stroke={icon === 'server' ? 2.6 : 3} />}
      {children}
    </span>
  );
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Events table time: mm:ss.mmm. Detail time: hh:mm:ss.mmm (design/hitline/Events.dc.html). */
export function fmtTime(ms: number, full = false): string {
  const d = new Date(ms);
  const tail = `${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  return full ? `${pad(d.getHours())}:${tail}` : tail;
}

const CURRENCY: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', AZN: '₼', TRY: '₺' };

export function money(value: string | undefined, currency: string | undefined): string {
  if (!value) return '';
  const sym = currency ? CURRENCY[currency.toUpperCase()] : undefined;
  return sym ? `${sym}${value}` : `${value}${currency ? ` ${currency}` : ''}`;
}
