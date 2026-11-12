/**
 * "Reading the page" steps, shown until data arrives or the wait is over, so an empty screen
 * never looks like a broken one. Shared by the popup and the DevTools panel.
 */
import { useEffect, useState } from 'react';
import { Icon } from './ui.tsx';

export type StepState = 'done' | 'busy' | 'wait';

export interface ScanStep {
  label: string;
  state: StepState;
  /** Short text at the end of the row (seconds left). */
  end?: string;
}

/** Re-renders every `ms` while `on`, for countdowns. */
export function useTick(on: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return undefined;
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [on, ms]);
  return now;
}

/** Steps plus a bar that fills over the wait; `progress` is 0..1, or null before the wait starts. */
export function ScanSteps({
  steps,
  progress,
  label,
  className = '',
}: {
  steps: ScanStep[];
  progress: number | null;
  label: string;
  className?: string;
}) {
  return (
    <div className={`scan ${className}`} role="status" aria-live="polite" aria-label={label}>
      {steps.map((s) => (
        <div key={s.label} className={`scan-step is-${s.state}`}>
          <span className="scan-ic" aria-hidden="true">
            {s.state === 'done' ? (
              <Icon name="check" size={14} stroke={3} />
            ) : s.state === 'busy' ? (
              <span className="scan-spin" />
            ) : (
              <span className="scan-ring" />
            )}
          </span>
          <span className="scan-t">{s.label}</span>
          {s.end && <span className="mono scan-end">{s.end}</span>}
        </div>
      ))}
      <div className="scan-bar" aria-hidden="true">
        <i
          className={progress === null ? 'is-idle' : ''}
          style={progress === null ? undefined : { width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Grey shimmering block standing in for content that is on its way. */
export function Skeleton({ w, h, r }: { w?: number | string; h: number; r?: number }) {
  return (
    <span className="sk" aria-hidden="true" style={{ width: w, height: h, borderRadius: r }} />
  );
}
