# Hitline fixtures

- `lumo.ts`: the Lumo shop scenarios (runs `events`, `consent`, `journey`), the 8-event tracking plan and `sessionFromScenario()`. One source for the core tests and for the shop in `apps/fixture`.
- `gtm-K7P2QX.js`: a fake GTM container in public gtm.js format (data only, loads and sends nothing).
- `load.ts`: Node helper for tests (`lumoSession(run)` with the container body).

Lumo, example.com, pay.example.net and every id here are fictional. See `docs/hitline/PLAN.md`.
