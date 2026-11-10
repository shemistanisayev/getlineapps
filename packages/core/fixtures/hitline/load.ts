/** Node-only helpers for tests: the scenarios as sessions, with the fake GTM container. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LUMO_SCENARIOS, sessionFromScenario, type RunId } from './lumo.ts';

export const GTM_BODY = readFileSync(
  fileURLToPath(new URL('./gtm-K7P2QX.js', import.meta.url)),
  'utf8',
);

export function lumoSession(run: RunId) {
  return sessionFromScenario(LUMO_SCENARIOS[run], GTM_BODY);
}
