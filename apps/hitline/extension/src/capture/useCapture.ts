/**
 * Panel state: one SessionStore, fed by DevTools (inside DevTools) or by a replay
 * (window.__HITLINE_REPLAY__, used by tests and store screenshots when the panel page
 * is opened outside DevTools). The audit is recomputed at most every 250 ms.
 */
import {
  analyze,
  registrableDomain,
  type Audit,
  type CustomRule,
  type Plan,
  type SessionInput,
} from '@line/core/hitline';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { readRules } from '../storage.ts';
import { DevtoolsSource, type DevtoolsLike } from './devtools.ts';
import { SessionStore, type CaptureStatus } from './session.ts';

declare global {
  interface Window {
    __HITLINE_REPLAY__?: SessionInput;
  }
}

interface Settings {
  domains: string[];
  plans: Record<string, Plan>;
  rules: CustomRule[];
}

function useSettings(): Settings {
  const [s, setS] = useState<Settings>({ domains: [], plans: {}, rules: [] });
  useEffect(() => {
    const read = () =>
      void browser.storage.local.get(['domains', 'plans', 'customRules']).then((r) =>
        setS({
          domains: Array.isArray(r.domains) ? (r.domains as string[]) : [],
          plans: r.plans && typeof r.plans === 'object' ? (r.plans as Record<string, Plan>) : {},
          rules: readRules(r.customRules),
        }),
      );
    read();
    const onChange = (_c: unknown, area: string) => area === 'local' && read();
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, []);
  return s;
}

/** Inspected tab id (inside DevTools), used for the popup's "show this event" hand-off. */
export function inspectedTabId(): number | undefined {
  return (browser as unknown as { devtools?: DevtoolsLike }).devtools?.inspectedWindow.tabId;
}

export function useCapture() {
  const storeRef = useRef<SessionStore>(null);
  storeRef.current ??= new SessionStore();
  const store = storeRef.current;
  const sourceRef = useRef<DevtoolsSource | null>(null);
  const settings = useSettings();
  const domainsRef = useRef<string[]>([]);
  domainsRef.current = settings.domains;
  store.options = { rules: settings.rules, other: true };

  useEffect(() => {
    const devtools = (browser as unknown as { devtools?: DevtoolsLike }).devtools;
    if (devtools?.network) {
      const src = new DevtoolsSource(store, devtools, { ownDomains: () => domainsRef.current });
      sourceRef.current = src;
      src.start();
      return () => src.stop();
    }
    if (window.__HITLINE_REPLAY__) store.load(window.__HITLINE_REPLAY__);
    else {
      store.setReady('har');
      store.setReady('poll');
      store.setLoadedAt(0);
    }
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

  const first = store.session.navigations[0]?.url ?? '';
  const site = registrableDomain(settings.domains[0] ?? first);
  // One plan per site domain, plus a "default" plan (docs/hitline-SPEC.md §4.5).
  const planKey = settings.plans[site]
    ? site
    : settings.plans.default
      ? 'default'
      : site || 'default';
  const plan = settings.plans[planKey] ?? null;

  const audit: Audit = useMemo(() => {
    void version;
    return analyze(store.session, {
      domains: settings.domains,
      plan,
      rules: settings.rules,
      other: true,
    });
  }, [store, version, settings, plan]);

  const savePlans = (plans: Record<string, Plan>) => void browser.storage.local.set({ plans });
  const status: CaptureStatus = store.status;

  return {
    audit,
    plan,
    status,
    savePlan: (p: Plan) => savePlans({ ...settings.plans, [site || 'default']: p }),
    removePlan: () => {
      const next = { ...settings.plans };
      delete next[planKey];
      savePlans(next);
    },
    empty: store.empty,
    live: Boolean(sourceRef.current),
    reload: () => sourceRef.current?.reload(),
    clear: () => (sourceRef.current ? sourceRef.current.clear() : store.clear()),
    setPaused: (p: boolean) =>
      sourceRef.current ? sourceRef.current.setPaused(p) : store.setPaused(p),
  };
}
