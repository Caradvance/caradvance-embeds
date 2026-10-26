# Assumptions and decisions

## Sourcing
- No direct scraping of mobile.de from the Worker (bot protection, terms of use). Sources are the
  official Search API (dealer credentials), an Apify actor as fallback, manual links, and the
  Chrome extension acting in a real user's browser session on click.
- The Search API and Apify field mappings are tolerant guesses; verify against real responses
  once credentials exist (`src/lib/sources/index.ts`).
- mobile.de search URL parameters (`ms`, `fr`, `ml`, `p`, `ft`, `tr`, `c`) follow the public URL
  format; check one generated URL in a browser before relying on it.
- Test mode uses nine fictional listings and generated images labelled TESZTKÉP.

## Pricing
- Budget is compared with the **delivered total in Budapest** unless the request says otherwise.
- Hard budget filter allows 3% over budget (a slightly-over car can still be worth offering).
- Margin = max(3% of vehicle price, 390 000 Ft) as a placeholder until confirmed.
- Customer total is rounded up to 10 000 Ft; customer lines are rounded to 1 000 Ft and the
  service line absorbs the difference. The margin is bundled into "Teljes körű ügyintézés és
  szolgáltatási díj" and never shown on its own, nor present in the page source.
- Expected Hungarian registration month = next month (drives the regadó age discount).
- Default NAV column: electric → exempt, hybrid/PHEV → column 1; Euro 6/5/4 → columns 2/3/4 are
  flagged as assumed; admin picks the exact column per car.
- Company buyer + "MwSt. ausweisbar" → net price path, with a warning that Hungarian VAT is
  handled separately. ≤6 months or ≤6 000 km triggers a new-vehicle VAT warning.
- An admin override of a cost line counts as a human-confirmed value.

## Workflow
- Publishing requires: 3 locked cars, descriptions for all 3, and no unconfirmed rate.
- The module lives inside belső: requests are belső Import deals, published offers are crm_offers
  rows, the customer's choice uses belső's statuses (Ajánlat elfogadva / Ajánlat módosítva).
- Queues are not used; the pipeline runs inline (a demo request finishes in well under a second).
  Add Queues when real API sources add latency.
- Costs are recomputed live in the admin from listing + overrides + current rate version, and
  frozen into the offer snapshot at publish. The snapshot's public part is the only thing the
  customer page renders.
- Images are copied into D1 (am_images, base64, max 15 per car) at publish because R2 is not enabled
  on the account. Move to R2 + Image Transformations (AVIF/WebP) when R2 is enabled.
- Offer validity: 7 days. Expired offers show a contact page; the daily cron marks them EXPIRED.
- Contact person on offers: Vadnai Zsombor, +36 30 233 6060 (WhatsApp), editable in settings.
- Customer page UI strings exist in Hungarian and German; SK/CZ/PL/EN fall back to Hungarian.
  The template description fallback is Hungarian only; other languages need the Claude API.
- Staff auth is belső's own login (ca_session cookie, users/sessions tables); the same role rule as
  belső decides which deals a user sees. CSRF: same-origin check on every POST.
- Extension tokens belong to a belső user, are shown once (handed over through a 2-minute cache
  entry bound to that user, never in a URL), stored as SHA-256, revocable.

## Not done yet
- Notion push dropped: belső is the CRM now (the adatlap shows the offer and the choice).
- Daily re-check of published listings against the live source (needs a live source).
- PIN protection for offer links (optional per spec).
- GDPR retention job and delete-customer action.
- Real mobile.de HTML fixtures for the parser tests (save by hand, see `extension/fixtures/README.md`).
- Vite/crxjs build for the extension: the test build is plain JS, loadable unpacked as-is.
