/** Consent Mode v2 (docs/hitline-SPEC.md §4.3). */
import { consentCommands, type ConsentCommand } from './datalayer.ts';
import type { ConsentValue, DataLayerEntry, Hit, Platform } from './types.ts';

export const CONSENT_SIGNALS = [
  'ad_storage',
  'analytics_storage',
  'ad_user_data',
  'ad_personalization',
] as const;

export const KNOWN_CMPS = [
  'Cookiebot',
  'OneTrust',
  'Usercentrics',
  'CookieYes',
  'Didomi',
  'Complianz',
  'iubenda',
] as const;

export type ChoiceKind = 'reject' | 'accept' | 'custom';
export type ConsentState = Record<string, ConsentValue>;

export interface Choice {
  kind: ChoiceKind;
  time: number;
}

/** gcs "G1xy": x = ad_storage, y = analytics_storage (1 granted, 0 denied). */
export function decodeGcs(
  gcs: string | undefined,
): { ad_storage: ConsentValue; analytics_storage: ConsentValue } | null {
  const m = /^G1([01])([01])$/.exec(gcs ?? '');
  if (!m) return null;
  const v = (c: string): ConsentValue => (c === '1' ? 'granted' : 'denied');
  return { ad_storage: v(m[1]!), analytics_storage: v(m[2]!) };
}

export interface GcdSignal {
  /** Final value Google used, or undefined when not set. */
  value?: ConsentValue;
  /** True when an update command changed or confirmed the signal. */
  updated: boolean;
}

const GCD_LETTERS: Record<string, GcdSignal> = {
  l: { updated: false },
  p: { value: 'denied', updated: false },
  q: { value: 'denied', updated: true },
  t: { value: 'granted', updated: false },
  r: { value: 'granted', updated: true },
  m: { value: 'denied', updated: true },
  n: { value: 'granted', updated: true },
  u: { value: 'denied', updated: true },
  v: { value: 'granted', updated: true },
  e: { value: 'granted', updated: true },
};

/** gcd "13r3r3r3r5l1": letters at 2, 4, 6, 8 are ad_storage, analytics_storage, ad_user_data, ad_personalization. */
export function decodeGcd(gcd: string | undefined): Record<string, GcdSignal> | null {
  if (!gcd || !/^1\d[a-z]\d[a-z]\d[a-z]\d[a-z]/i.test(gcd)) return null;
  const out: Record<string, GcdSignal> = {};
  CONSENT_SIGNALS.forEach((name, i) => {
    const letter = gcd[2 + i * 2]!.toLowerCase();
    out[name] = GCD_LETTERS[letter] ?? { updated: false };
  });
  return out;
}

export interface ConsentModel {
  commands: ConsentCommand[];
  defaults: ConsentState;
  /** Defaults merged with every update. */
  afterChoice: ConsentState;
  choice: Choice | null;
  bannerFound: boolean;
  cmp: string[];
  /** Consent Mode is in use (at least one default or update). */
  active: boolean;
}

export function choiceKind(values: ConsentState): ChoiceKind {
  const four = CONSENT_SIGNALS.map((s) => values[s]);
  if (four.every((v) => v === 'denied')) return 'reject';
  if (four.every((v) => v === 'granted')) return 'accept';
  return 'custom';
}

export function buildConsent(entries: DataLayerEntry[], cmp: string[] = []): ConsentModel {
  const commands = consentCommands(entries);
  const defaults: ConsentState = {};
  for (const c of commands) if (c.kind === 'default') Object.assign(defaults, c.values);
  const afterChoice: ConsentState = { ...defaults };
  for (const c of commands) if (c.kind === 'update') Object.assign(afterChoice, c.values);
  const first = commands.find((c) => c.kind === 'update');
  const choice: Choice | null = first
    ? { kind: choiceKind({ ...defaults, ...first.values }), time: first.time }
    : null;
  return {
    commands,
    defaults,
    afterChoice,
    choice,
    bannerFound: cmp.length > 0 || Boolean(first),
    cmp,
    active: commands.length > 0,
  };
}

/** Consent state in force at `time`: defaults plus every update up to that moment. */
export function stateAt(model: ConsentModel, time: number): ConsentState {
  const state: ConsentState = {};
  for (const c of model.commands) {
    if (c.time > time) break;
    Object.assign(state, c.values);
  }
  return state;
}

export type HitConsentStatus =
  | 'granted'
  | 'cookieless'
  | 'before_consent'
  | 'after_reject'
  | 'mismatch'
  | 'no_signal'
  | 'not_loaded'
  | 'unknown';

export const MARKETING: Platform[] = ['meta', 'tiktok'];

/** Which signal a non-Google platform must respect. */
export function requiredSignal(platform: Platform): string | null {
  if (MARKETING.includes(platform)) return 'ad_storage';
  if (platform === 'hotjar') return 'analytics_storage';
  return null;
}

/** OK / problem status for one hit, as in the Consent timeline and the Events detail card. */
export function hitConsentStatus(model: ConsentModel, hit: Hit): HitConsentStatus {
  if (!model.active) return 'unknown';
  const state = stateAt(model, hit.time);
  if (hit.platform === 'ga4' || hit.platform === 'ads') {
    const gcs = decodeGcs(hit.gcs);
    if (!gcs) return 'no_signal';
    const key = hit.platform === 'ga4' ? 'analytics_storage' : 'ad_storage';
    const expected = state[key];
    if (expected && expected !== gcs[key]) return 'mismatch';
    return gcs.ad_storage === 'granted' || gcs.analytics_storage === 'granted'
      ? 'granted'
      : 'cookieless';
  }
  const signal = requiredSignal(hit.platform);
  if (!signal) return 'unknown';
  if (state[signal] !== 'denied') return state[signal] === 'granted' ? 'granted' : 'unknown';
  return model.choice && hit.time >= model.choice.time ? 'after_reject' : 'before_consent';
}

export function isBadConsent(s: HitConsentStatus): boolean {
  return s === 'before_consent' || s === 'after_reject' || s === 'mismatch';
}
