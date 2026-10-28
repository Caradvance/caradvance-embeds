# Ajánlatmotor (offer engine) — inside belső

When a car request arrives (email to info@, phone, WhatsApp), the Ajánlatmotor finds the three best matching
cars on mobile.de, prices each one delivered in Budapest (distance, logistics, regadó, illeték, fees, margin),
and publishes a private premium offer page. The customer picks a car with one click.

It runs **inside the belső system**:

| Where | What |
|---|---|
| `/belso/ajanlatmotor/` | Staff UI: requests, top-3 review, cost overrides, lock, descriptions, preview, publish. Rates (admin), Chrome extension tokens. Same `ca_session` login and deal visibility as belső (admin sees all, others only their assigned deals). |
| `/belso/` nav → **Ajánlatmotor** | Link into the module. The ügyfél adatlap of every **Import** deal has an "Ajánlatmotor megnyitása" button. |
| belső `deals` + `crm_cards` | Every request is a belső Import deal with an adatlap card: *Ajánlatra vár* → *Ajánlat kiküldve* → *Ajánlat elfogadva* / *Ajánlat módosítva*. |
| belső `crm_offers` | A published offer is a normal `crm_offers` row (3 items, customer answer), so the adatlap lists it and `/ajanlat/valasz/?t=` works too. |
| `/ajanlat/auto/<token>/` | Premium customer page (BMW-style editorial, comparison, price breakdown, choose / "egyik sem"). Margin never appears. |
| `/api/ajanlatmotor/*` | Chrome extension API (per-user token) + parser config. |
| `ajanlatmotor/src/index.ts` | Email intake Worker: Cloudflare Email Routing → creates the deal + request in the same D1. Daily 08:00 Budapest: EUR/HUF refresh, offer expiry. |
| `ajanlatmotor/extension/` | Chrome extension "Caradvance Sourcing" (side panel, sends a mobile.de listing into a deal). Download zip: `/belso/ajanlatmotor-bovitmeny.zip`. |

Code: `caradvance-astro/lib/ajanlatmotor/` (TypeScript, shared by the Pages Functions and the intake Worker).
New tables (created on first use, prefix `am_`): `am_requests`, `am_candidates`, `am_offers`, `am_rates`,
`am_settings`, `am_ext_tokens`, `am_events`, `am_cache`, `am_images`. Existing belső tables are only read
or written through their normal fields.

## Test environment (branch `ajanlatmotor-teszt`)

- Website preview: `https://ajanlatmotor-teszt.caradvance-astro.pages.dev/belso/ajanlatmotor/`
- Pages **Preview** environment binds `DB` → **`caradvance-offers-test`** (separate D1) and `AM_TEST_MODE=1`.
  Production (`main`, www.caradvance.hu) keeps `caradvance-belso-db` and has no Ajánlatmotor until this branch is merged.
- Test logins (admin + sales manager) are created by `migrations-test/0001_belso_core_test.sql` in the test DB only;
  passwords are in `TEST-CREDENTIALS.md` (not in git).
- Listings are fictional (`AM_SOURCE=mock`, TESZTKÉP images); fees are placeholders flagged ELLENŐRIZNI 2026 (`RATES.md`).
- Car-photo filter: every listing that enters a slot is checked by Workers AI (`AI` binding, model `@cf/moondream/moondream3.1-9B-A2B`);
  dealer logos, banners, team photos and text graphics are removed. Publishing is blocked until all three cars are checked
  ("Fotók szűrése" on the card re-runs it). Production needs the same `AI` binding on the Pages project.
- Customer emails follow belső's test rule: they go to marc.nemethy@bhgeu.com, never to the customer
  (and only when `RESEND_API_KEY` exists in the environment; the preview has none, so links are copied by hand).

- Intake Worker `ajanlatmotor-intake-test`: Workers Builds from this repo, branch `ajanlatmotor-teszt`, root `/ajanlatmotor`,
  build `npm test`, deploy `npm run deploy` (applies `migrations-test` to the test DB, then deploys). No public URL.

## Run locally

```bash
cd ajanlatmotor && npm install && npm test          # 25 unit tests
cd ../caradvance-astro && npm install
P=/tmp/am && (cd ../ajanlatmotor && npx wrangler d1 migrations apply caradvance-offers-test --local --persist-to $P)
../ajanlatmotor/node_modules/.bin/wrangler pages dev public --port 8788 --persist-to $P \
  --d1 DB=c9e957c3-d388-4eca-bdef-73183fffe620 --binding AM_TEST_MODE=1
# http://127.0.0.1:8788/belso/  → log in with a test user → Ajánlatmotor → "Demó e-mail szimulálása"
```

## Live (since 2026-10-28)

- **www.caradvance.hu/belso/ajanlatmotor/** runs on the live belső database (`caradvance-belso-db`); the `am_*` tables are created on first use. Pages Production has the `DB` and `AI` bindings.
- mobile.de source: **manual** until Search API credentials exist (`MOBILE_DE_API_USERNAME` / `MOBILE_DE_API_PASSWORD` switch it to `searchapi` automatically). Staff open the prefilled search with „mobile.de keresés ↗” and send cars with the Chrome extension.
- Chrome extension 0.5.0 („Caradvance Sourcing”) points to www.caradvance.hu and uses the belső login (no token). Unpacked installs update themselves when newer files are in their folder.
- Publishing stays blocked until every fee in *Díjak és beállítások* is confirmed (`RATES.md`) and every car's photos are checked.
- Still on the test setup: the email intake Worker (`intake@in.caradvance.hu` → test DB). Production intake: bind `caradvance-belso-db` without the test migration, then a Gmail filter on info@.
- The test site (branch `ajanlatmotor-teszt`, preview DB `caradvance-offers-test`) keeps working for experiments.
