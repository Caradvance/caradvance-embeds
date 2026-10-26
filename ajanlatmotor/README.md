# Caradvance Ajánlatmotor (Offer Engine) – TESZT

Cloudflare Worker that turns a car request email into a private, three-car offer page.

```
info@ (Gmail filter) → intake@in.caradvance.hu → Email Worker → requirement extraction
  → mobile.de source (mock | searchapi | apify) + Chrome extension → score → top 3
  → admin review: distance, logistics, regadó, illeték, fees, margin → lock → descriptions
  → publish → /o/<token> (customer) → "Ezt választom" → admin email + Notion
```

## Run locally (test environment)

```bash
npm install
npm run db:migrate:local
npm run dev                      # http://localhost:8787/admin  (open on localhost, no password)
```

In the admin, **„Demó e-mail szimulálása”** runs a realistic BMW i5 Touring request through the
whole pipeline with fictional mock listings. Then: generate descriptions → confirm the yellow
rates in *Díjak és beállítások* → lock the three cars → publish → open the customer link.

A raw email can also be posted to the local email handler:

```bash
curl -X POST "http://localhost:8787/cdn-cgi/handler/email?from=a@example.com&to=intake@in.caradvance.hu" --data-binary @mail.eml
```

## Tests

```bash
npm test          # 25 tests: NAV regadó reference case, costs, status machine, extraction, scoring, parser layers
npm run typecheck
```

## What is in the test build

| Area | State |
|---|---|
| Email intake (Email Worker, postal-mime, Message-ID idempotency) | done |
| Requirement extraction | Claude tool-use when `ANTHROPIC_API_KEY` is set, deterministic Hungarian heuristic otherwise |
| mobile.de sources | `mock` working; `searchapi` and `apify` adapters written, field mapping to verify with real credentials |
| Chrome extension | MV3, side panel, 3-layer parser, per-user tokens, batch send from search pages |
| Scoring + top 3 | hard filters on delivered total, weighted score, diversity rule, positioning labels |
| Costs | NAV 2026.01.01 regadó table (verified), all other fees placeholders flagged ELLENŐRIZNI 2026 |
| Distance | OpenRouteService with `ORS_API_KEY`, otherwise haversine × 1.25 (flagged) |
| EUR/HUF | ECB via Frankfurter, cron 08:00 Budapest (DST-safe), KV cache + last-good fallback |
| Admin | inbox, request detail, overrides, lock, replace from runner-ups or link, description editor, preview, publish, settings with versioned rates, extension tokens |
| Customer page | editorial layout, comparison table, price breakdown (margin never shown), choose + "egyik sem" flows, lightbox, view analytics, expiry |
| Notifications | logged to `email_log`; sent when the `send_email` binding is enabled |
| Notion | pushes a deal page when `NOTION_TOKEN` is set (property mapping to confirm) |

See `SETUP.md` to deploy the test environment to Cloudflare, `ASSUMPTIONS.md` for every decision
made without input, and `RATES.md` for the values a human must confirm before go-live.

## Layout

```
src/index.ts              fetch / email / scheduled entry
src/routes/               admin, public (offer page, images), ext (extension API)
src/lib/engine.ts         pipeline: search → evaluate → score → slots
src/lib/costs.ts          cost calculator (regadó, illeték, fees, logistics, margin)
src/lib/rates.ts          versioned rate config + verification flags
src/lib/sources/          mock, Search API, Apify adapters + normalisation/validation
src/lib/ai/               Claude extraction + descriptions with deterministic fallbacks
src/views/                admin + customer HTML (server-rendered, no framework)
extension/                Chrome extension (load unpacked)
migrations/               D1 schema
test/                     vitest
qa/                       screenshots (offer 375 / 768 / 1440 px, admin)
```
