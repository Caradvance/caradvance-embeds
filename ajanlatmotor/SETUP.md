# Setup – test environment on Cloudflare

Everything below targets `--env test` (Worker `caradvance-offers-test`). Production gets its own
block later, behind Cloudflare Access on `ajanlat.caradvance.hu`.

## 1. Resources

```bash
npx wrangler login
npx wrangler d1 create caradvance-offers-test          # copy database_id into wrangler.toml [env.test]
npx wrangler kv namespace create KV --env test         # copy id into wrangler.toml
npx wrangler r2 bucket create caradvance-offers-test-images
npm run db:migrate:test
```

## 2. Secrets (test)

```bash
npx wrangler secret put ADMIN_PASSWORD --env test      # HTTP Basic for /admin on workers.dev
npx wrangler secret put TOKEN_PEPPER --env test        # random string, hashes extension tokens
# optional
npx wrangler secret put ANTHROPIC_API_KEY --env test   # real extraction + descriptions
npx wrangler secret put ORS_API_KEY --env test         # road distances (openrouteservice.org, free tier)
npx wrangler secret put NOTION_TOKEN --env test        # CRM push (use a test database first)
```

Set `PUBLIC_BASE_URL` in `wrangler.toml` to the workers.dev URL, then:

```bash
npm run deploy:test
```

## 3. Inbound email (keeps Google Workspace untouched)

`info@caradvance.hu` stays on Google Workspace. Mail reaches the Worker through a subdomain:

1. Cloudflare dashboard → caradvance.hu → **Email → Email Routing** → add subdomain `in.caradvance.hu`
   (Cloudflare adds MX + SPF records for the subdomain only; the root MX records do not change).
2. Routing rule: `intake@in.caradvance.hu` → **Send to a Worker** → `caradvance-offers-test`.
3. Gmail (info@) → Settings → Forwarding → add `intake@in.caradvance.hu`, confirm the code
   (the confirmation mail lands in the Worker; read it in `email_log` or temporarily route to a mailbox).
4. Gmail filter: e.g. `to:info@caradvance.hu -from:caradvance.hu` → **Forward to** `intake@in.caradvance.hu`.
   The Worker classifies; non-car mail is stored as REJECTED so nothing is lost.

For outbound admin notifications, verify `info@caradvance.hu` as a destination in Email Routing and
uncomment the `send_email` block in `wrangler.toml`.

## 4. Chrome extension (test)

1. Admin → **Chrome bővítmény** → create a token per person.
2. `chrome://extensions` → Developer mode → **Load unpacked** → the `extension/` folder.
3. Extension options: server URL (workers.dev URL) + token → *Mentés és ellenőrzés*.
4. Open a mobile.de listing → **Küldés az ajánlatba**, or tick **+** on a search page.

Production distribution: unlisted Chrome Web Store item (`npm run ext:zip`) or force-install via
Google Workspace Admin → Devices → Chrome → Apps & extensions, for `@caradvance.hu` users.

## 5. Production checklist (later)

- `[env.production]` block, route `ajanlat.caradvance.hu/*`, separate D1/KV/R2
- Cloudflare Access application on `ajanlat.caradvance.hu/admin/*` (Google, `@caradvance.hu` only);
  set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` → the Worker verifies the JWT itself
- `EXTENSION_ID` set to the published extension ID (CORS)
- all values in `RATES.md` confirmed in the admin
- mobile.de Search API credentials (Caradvance GmbH dealer account) → `MOBILE_DE_SOURCE=searchapi`
