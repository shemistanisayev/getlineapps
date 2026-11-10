/** dataLayer helpers: gtag() commands arrive as arrays (or array-like Arguments objects). */
import type { ConsentValue, DataLayerEntry } from './types.ts';

/** ['consent', 'update', {...}] or {0: 'consent', 1: 'update', 2: {...}} -> array, else null. */
export function asCommand(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && '0' in value) {
    const o = value as Record<string, unknown>;
    const out: unknown[] = [];
    for (let i = 0; String(i) in o; i++) out.push(o[String(i)]);
    return out;
  }
  return null;
}

export interface ConsentCommand {
  time: number;
  kind: 'default' | 'update';
  values: Record<string, ConsentValue>;
}

export function consentCommands(entries: DataLayerEntry[]): ConsentCommand[] {
  const out: ConsentCommand[] = [];
  for (const e of entries) {
    const cmd = asCommand(e.value);
    if (!cmd || cmd[0] !== 'consent') continue;
    const kind = cmd[1];
    if (kind !== 'default' && kind !== 'update') continue;
    const raw = cmd[2];
    if (!raw || typeof raw !== 'object') continue;
    const values: Record<string, ConsentValue> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === 'granted' || v === 'denied') values[k] = v;
    }
    out.push({ time: e.time, kind, values });
  }
  return out.sort((a, b) => a.time - b.time);
}

/** server_container_url from gtag('config', 'G-...', { server_container_url }). */
export function serverContainerUrlFrom(entries: DataLayerEntry[]): string | undefined {
  for (const e of entries) {
    const cmd = asCommand(e.value);
    if (!cmd || cmd[0] !== 'config') continue;
    const opts = cmd[2] as { server_container_url?: unknown } | undefined;
    if (opts && typeof opts.server_container_url === 'string') return opts.server_container_url;
  }
  return undefined;
}
