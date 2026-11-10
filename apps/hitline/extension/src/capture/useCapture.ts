/**
 * Panel state: one SessionStore, fed by DevTools (inside DevTools) or by a replay
 * (window.__HITLINE_REPLAY__, used by tests and store screenshots when the panel page
 * is opened outside DevTools). The audit is recomputed at most every 250 ms.
 */
import {
  analyze,
  registrableDomain,
  type Audit,
  type Plan,
  type SessionInput,
} from '@line/core/hitline';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DevtoolsSource, type DevtoolsLike } from './devtools.ts';
import { SessionStore } from './session.ts';

declare global {
  interface Window {
    __HITLINE_REPLAY__?: SessionInput;
  }
}

interface Settings {
  domains: string[];
  plans: Record<string, Plan>;
}

function useSettings(): Settings {
  const [s, setS] = useState<Settings>({ domains: [], plans: {} });
  useEffect(() => {
    const read = () =>
      void browser.storage.local.get(['domains', 'plans']).then((r) =>
        setS({
          domains: Array.isArray(r.domains) ? (r.domains as string[]) : [],
          plans: r.plans && typeof r.plans === 'object' ? (r.plans as Record<string, Plan>) : {},
        }),
      );
    read();
    const onChange = (_c: unknown, area: string) => area === 'local' && read();
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, []);
  return s;
}

export function useCapture() {
  const storeRef = useRef<SessionStore>(null);
  storeRef.current ??= new SessionStore();
  const store = storeRef.current;
  const sourceRef = useRef<DevtoolsSource | null>(null);
  const settings = useSettings();

  useEffect(() => {
    const devtools = (browser as unknown as { devtools?: DevtoolsLike }).devtools;
    if (devtools?.network) {
      const src = new DevtoolsSource(store, devtools);
      sourceRef.current = src;
      src.start();
      return () => src.stop();
    }
    if (window.__HITLINE_REPLAY__) store.load(window.__HITLINE_REPLAY__);
    return undefined;
  }, [store]);

  // Throttle: many requests can land in one burst.
  const version = useSyncExternalStore(
    (fn) => {
      let t: ReturnType<typeof setTimeout> | null = null;
      return store.subscribe(() => {
        if (t) return;
        t = setTimeout(() => {
          t = null;
          fn();
        }, 250);
      });
    },
    () => store.version,
  );

  const audit: Audit = useMemo(() => {
    void version;
    const first = store.session.navigations[0]?.url ?? '';
    const site = registrableDomain(settings.domains[0] ?? first);
    const plan = settings.plans[site] ?? settings.plans.default ?? null;
    return analyze(store.session, { domains: settings.domains, plan });
  }, [store, version, settings]);

  return {
    audit,
    empty: store.empty,
    live: Boolean(sourceRef.current),
    reload: () => sourceRef.current?.reload(),
    clear: () => (sourceRef.current ? sourceRef.current.clear() : store.clear()),
  };
}
