/**
 * CarAdvance — lead-fogadó végpont (Cloudflare Pages Function)
 * Útvonal:  POST /api/lead
 *
 * Mit csinál:
 *   1. Fogadja az /auto-rendeles/ űrlap adatait (a lap saját SEARCH_ENDPOINT hívásából).
 *   2. Létrehoz egy sort a Notion "Ügyfelek" adatbázisban (Státusz: Új érdeklődő,
 *      Címke: Autóimport), a teljes űrlapot a lap törzsébe írva.
 *   3. E-mail értesítést küld a kereskedelmi címre.
 *   4. Opcionálisan továbbít egy webhookra (Apps Script / Make / Zapier).
 *   5. Elküldi a Meta Conversions API "Lead" eseményét, ugyanazzal az event_id-vel,
 *      amit a böngészőben a pixel is használ — így nem lesz dupla számolás.
 *
 * Környezeti változók (Cloudflare Pages → Settings → Environment variables):
 *   TURNSTILE_SECRET     — Cloudflare Turnstile titkos kulcs               (TITKOS)
 *   TURNSTILE_MODE       — "enforce" (alapértelmezés) vagy "monitor"
 *   NOTION_TOKEN         — Notion integrációs token                      (TITKOS)
 *   NOTION_DB_ID         — az "Ügyfelek" adatbázis azonosítója
 *   NOTION_OWNER         — alapértelmezett felelős: Marc | Károly | Zsombor | Zsófia
 *   LEAD_WEBHOOK_URL     — ide POST-oljuk a leadet JSON-ként            (opcionális)
 *   LEAD_WEBHOOK_TOKEN   — a webhook token mezője                       (opcionális)
 *   RESEND_API_KEY       — e-mail értesítéshez, resend.com              (opcionális)
 *   LEAD_EMAIL_TO        — pl. "sales@caradvance.hu,import@caradvance.hu"
 *   LEAD_EMAIL_FROM      — pl. "CarAdvance <lead@caradvance.hu>"        (visszaigazolt domain)
 *   LEAD_EMAIL_TO_SK     — szlovák oldalak (/sk/) címzettje, alapból info@caradvance.sk
 *   LEAD_EMAIL_TO_CZ     — cseh oldalak (/cs/) címzettje, alapból info@caradvance.cz
 *   META_PIXEL_ID        — a pixel azonosítója                          (opcionális)
 *   META_CAPI_TOKEN      — Conversions API token                        (opcionális, TITKOS)
 *   META_TEST_CODE       — csak teszteléshez, Events Manager → Test events
 *
 * Titok soha nem kerül a válaszba és nem jut ki a böngészőbe.
 */

const MAX_BODY = 8 * 1024 * 1024; // csatolmánnyal (base64) együtt
const MAX_ATTACH = 5 * 1024 * 1024;
const META_API = 'v21.0';

export async function onRequestPost(context) {
  const { request, env } = context;

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: 'unreadable_body' }, 400);
  }
  if (!raw || raw.length > MAX_BODY) {
    return json({ ok: false, error: 'bad_size' }, 400);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_json' }, 400);

  // Csatolmány (pl. kész specifikáció) — nem kerül a Notionbe / webhookba, csak a belső e-mailbe.
  let attachment = null;
  if (data._attachment && typeof data._attachment === 'object') {
    const a = data._attachment;
    const content = String(a.content || '');
    if (content && content.length * 0.75 <= MAX_ATTACH) {
      attachment = { filename: String(a.filename || 'specifikacio').slice(0, 120), content };
      data['Csatolmány'] = attachment.filename;
    }
  }
  delete data._attachment;

  // Árak: mindig egyértelmű legyen, hogy nettó vagy bruttó (régi kliensek / egyéb űrlapok esetén is)
  for (const key of ['Becsült havidíj', 'Ár (tájékoztató)']) {
    const v = data[key];
    if (typeof v === 'string' && /\d/.test(v) && /(Ft|€)/.test(v) && !/nettó|bruttó/i.test(v)) data[key] = 'nettó ' + v.trim() + ' + áfa';
  }

  // Mézesbödön: ha ez ki van töltve, robot küldte. Csendben elfogadjuk.
  if (data.website || data.url_field) return json({ ok: true, skipped: true });

  const contact = {
    name: pick(data, ['Név', 'Kapcsolattartó', 'name']),
    email: String(pick(data, ['E-mail', 'email']) || '').trim().toLowerCase(),
    phone: normalizePhone(pick(data, ['Telefon', 'phone'])),
    company: pick(data, ['Cégnév', 'company']),
    city: pick(data, ['Város', 'Székhely', 'city'])
  };
  if (!contact.email && !contact.phone) {
    return json({ ok: false, error: 'no_contact' }, 422);
  }

  const meta = {
    event_id: String(data.event_id || crypto.randomUUID()),
    page: String(data.page || request.headers.get('referer') || ''),
    ua: String(data.user_agent || request.headers.get('user-agent') || ''),
    ip: request.headers.get('cf-connecting-ip') || '',
    country: (request.cf && request.cf.country) || request.headers.get('cf-ipcountry') || '',
    fbp: String(data.fbp || ''),
    fbc: String(data.fbc || ''),
    mkt: data.mkt_consent === true || data.mkt_consent === 'true',
    attr: data.ca_attr && typeof data.ca_attr === 'object' ? data.ca_attr : {},
    received_at: new Date().toISOString()
  };

  // A továbbítandó rekord: az űrlap minden mezője + a kampányadatok.
  const record = { ...stripInternal(data), ...flattenAttr(meta.attr), event_id: meta.event_id, beerkezett: meta.received_at, forras_oldal: meta.page, 'Ország (IP alapján)': meta.country };

  // Captcha-ellenőrzés még a kézbesítés előtt, hogy robot ne kerüljön a Notionbe.
  const guard = await verifyTurnstile(env, data.turnstile_token, meta.ip);
  if (guard.blocked) {
    return json({ ok: false, error: 'captcha_failed' }, 403);
  }

  // Szlovák / cseh oldalról érkező lead: a saját országos postafiókba megy (nem az info@caradvance.hu-ra).
  const region = regionOf(meta.page, data);
  // SK / CZ: a régi (magyar) belső űrlap-értékek a piac nyelvén mennek tovább (e-mail, Notion, webhook) — Mr. JOB SK, 2026-10-26
  if (REGIONS[region]) { localizeVals(data, REGIONS[region].lang); localizeVals(record, REGIONS[region].lang); }

  const results = await Promise.allSettled([
    createNotionLead(env, data, contact, meta),
    sendEmail(env, record, contact, attachment, region),
    forwardWebhook(env, record),
    sendMetaCapi(env, contact, meta)
  ]);

  const [notion, mail, hook, capi] = results.map(describe);

  // Automatikus visszaigazolás az ügyfélnek (csak ha a belső kézbesítés sikerült).
  let confirm = { status: 'skipped' };
  if ((notion.ok || mail.ok || hook.ok) && contact.email) {
    try { confirm = await sendCustomerConfirm(env, data, contact, meta.page, region, request.headers.get('origin') || ''); } catch (e) { confirm = { status: 'error: ' + String(e && e.message || e).slice(0, 120) }; }
  }
  const delivered = notion.ok || mail.ok || hook.ok;
  const configured = [notion, mail, hook].some((c) => c.status !== 'skipped');

  if (!configured) {
    // Nincs beállítva egyetlen kézbesítési csatorna sem — ezt nem szabad elnyelni.
    return json({ ok: false, error: 'no_delivery_channel_configured' }, 501);
  }
  if (!delivered) {
    return json({ ok: false, error: 'delivery_failed' }, 502);
  }
  return json({
    ok: true,
    event_id: meta.event_id,
    captcha: guard.status,
    notion: notion.status,
    email: mail.status,
    webhook: hook.status,
    capi: capi.status,
    confirm: confirm.status
  });
}

export async function onRequestGet() {
  return json({ ok: true, service: 'caradvance-lead', method: 'POST' });
}

/* ------------------------- captcha ------------------------- */

/**
 * Turnstile-ellenőrzés.
 *   nincs titkos kulcs        → kimarad
 *   TURNSTILE_MODE="monitor"  → csak jelez, a leadet átengedi (első hétre ajánlott)
 *   egyébként                 → hibás vagy hiányzó tokennél elutasít
 */
async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return { status: 'skipped', blocked: false };
  const monitor = String(env.TURNSTILE_MODE || 'enforce').toLowerCase() === 'monitor';

  if (!token) return { status: monitor ? 'monitor-missing' : 'missing', blocked: !monitor };

  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token) });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const j = await r.json();
    if (j && j.success) return { status: 'ok', blocked: false };
    return { status: monitor ? 'monitor-failed' : 'failed', blocked: !monitor };
  } catch {
    // Ha maga az ellenőrzés nem érhető el, nem dobjuk el a valódi érdeklődőt.
    return { status: 'verify-unavailable', blocked: false };
  }
}

/* ------------------------- kézbesítés ------------------------- */

const NOTION_VERSION = '2022-06-28';

async function createNotionLead(env, data, contact, meta) {
  if (!env.NOTION_TOKEN || !env.NOTION_DB_ID) return { status: 'skipped' };

  const title = contact.name || contact.company || contact.phone || contact.email || 'Névtelen érdeklődő';
  const wanted = [
    pick(data, ['Márka']), pick(data, ['Modell']), pick(data, ['Típusjel'])
  ].filter(Boolean).join(' ');
  const details = [
    pick(data, ['Évjárat']) && 'évjárat: ' + pick(data, ['Évjárat']),
    pick(data, ['Futásteljesítmény']),
    pick(data, ['Üzemanyag']), pick(data, ['Váltó']), pick(data, ['Karosszéria'])
  ].filter(Boolean).join(' · ');

  const budget = await parseBudget(pick(data, ['Költségkeret (max)']));
  const campaign = [
    meta.attr.utm_source && 'forrás: ' + meta.attr.utm_source,
    meta.attr.utm_campaign && 'kampány: ' + meta.attr.utm_campaign,
    meta.attr.gclid && 'gclid: ' + meta.attr.gclid,
    meta.attr.fbclid && 'fbclid: ' + meta.attr.fbclid
  ].filter(Boolean).join(' · ');

  const note = [
    pick(data, ['Vásárlás módja (ÁFA)']) && 'ÁFA: ' + pick(data, ['Vásárlás módja (ÁFA)']),
    pick(data, ['Fizetés']) && 'fizetés: ' + pick(data, ['Fizetés']),
    pick(data, ['Mikorra kell']) && 'mikorra: ' + pick(data, ['Mikorra kell']),
    pick(data, ['Megjegyzés']),
    budget.note,
    campaign
  ].filter(Boolean).join(' | ').slice(0, 1900);

  const props = {
    'Név': { title: [{ text: { content: String(title).slice(0, 200) } }] },
    'Státusz': { select: { name: 'Új érdeklődő' } },
    'Címkék': { multi_select: [{ name: leadKind(data).tag }] },
    'Forrás': { select: { name: sourceFromAttr(meta.attr) } },
    'Következő lépés': { date: { start: meta.received_at.slice(0, 10) } }
  };
  if (contact.email) props['Email'] = { email: contact.email };
  if (contact.phone) props['Telefon'] = { phone_number: '+' + contact.phone };
  if (wanted || details) {
    props['Keresett autó / igény'] = {
      rich_text: [{ text: { content: [wanted, details].filter(Boolean).join(' — ').slice(0, 1900) } }]
    };
  }
  if (note) props['Megjegyzés'] = { rich_text: [{ text: { content: note } }] };
  if (budget.huf != null) props['Költségkeret (Ft)'] = { number: budget.huf };
  if (env.NOTION_OWNER) props['Felelős'] = { select: { name: env.NOTION_OWNER } };

  const r = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.NOTION_TOKEN,
      'Notion-Version': env.NOTION_VERSION || NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: env.NOTION_DB_ID },
      properties: props,
      children: notionBlocks(data, meta)
    })
  });
  if (!r.ok) throw new Error('notion ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return { status: 'sent' };
}

/** Az űrlap teljes tartalma a Notion-lap törzsébe, hogy semmi ne vesszen el. */
function notionBlocks(data, meta) {
  const skip = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token', 'mkt_consent']);
  const items = Object.entries(data)
    .filter(([k, v]) => !skip.has(k) && v != null && v !== '' && typeof v !== 'object')
    .slice(0, 90)
    .map(([k, v]) => bullet(k + ': ' + v));

  const attrLines = Object.entries(flattenAttr(meta.attr)).map(([k, v]) => bullet(k + ': ' + v));

  const blocks = [heading('Az űrlap adatai'), ...items];
  if (attrLines.length) blocks.push(heading('Honnan érkezett'), ...attrLines);
  blocks.push(bullet('Oldal: ' + (meta.page || '—')));
  return blocks.slice(0, 100);
}
function heading(t) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: t } }] } };
}
function bullet(t) {
  return {
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: String(t).slice(0, 1900) } }] }
  };
}
function sourceFromAttr(attr) {
  const s = String(attr.utm_source || '').toLowerCase();
  if (/facebook|^fb$/.test(s)) return 'Facebook';
  if (/instagram|^ig$/.test(s)) return 'Instagram';
  if (/tiktok/.test(s)) return 'TikTok';
  return 'Weboldal';
}
/** "25 000 000 HUF" vagy "70 000 EUR" → forint. EUR-nál élő árfolyammal. */
async function parseBudget(raw) {
  const txt = String(raw || '');
  const digits = txt.replace(/[^\d]/g, '');
  if (!digits) return { huf: null, note: '' };
  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0) return { huf: null, note: '' };
  if (!/eur|€/i.test(txt)) return { huf: amount, note: '' };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch('https://open.er-api.com/v6/latest/EUR', { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    const rate = j && j.rates && j.rates.HUF;
    if (rate) return { huf: Math.round(amount * rate), note: 'keret: ' + amount + ' EUR (' + rate.toFixed(1) + ' Ft/€)' };
  } catch { /* árfolyam nem elérhető */ }
  return { huf: null, note: 'keret: ' + amount + ' EUR (árfolyam nem volt elérhető)' };
}

async function forwardWebhook(env, record) {
  if (!env.LEAD_WEBHOOK_URL) return { status: 'skipped' };
  const body = env.LEAD_WEBHOOK_TOKEN
    ? { token: env.LEAD_WEBHOOK_TOKEN, action: 'add_lead', item: record }
    : { action: 'add_lead', item: record };
  const r = await fetch(env.LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('webhook ' + r.status);
  return { status: 'sent' };
}

async function sendEmail(env, record, contact, attachment, region) {
  const R = REGIONS[region];
  if (!env.RESEND_API_KEY || (!R && !env.LEAD_EMAIL_TO)) return { status: 'skipped' };
  const to = String(R ? (env['LEAD_EMAIL_TO_' + R.tag] || R.to) : env.LEAD_EMAIL_TO).split(',').map((s) => s.trim()).filter(Boolean);
  // Az országos csapat a saját nyelvén kapja a mezőneveket és a gyakori értékeket.
  const I = R ? INTERNAL_TXT[R.lang] : null;
  const LBL = R ? Object.assign({}, INTL_CONFIRM[R.lang].labels, INTL_LABELS[R.lang], I.labels) : {};
  const VAL = R ? INTL_VALUES[R.lang] : {};
  const tv = (v) => R ? String(v).split(' · ').map((x) => VAL[x.trim()] || x).join(' · ') : String(v);
  const choiceTxt = I ? I.choice : 'Megnyitás a Choice fleetshopban →';
  const rows = Object.entries(record)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap">${esc(LBL[k] || k)}</td><td style="padding:4px 0">${/^https:\/\/fleetshop\.choice\.de\//.test(String(v)) ? `<a href="${esc(String(v))}" style="color:#e2001a;font-weight:bold">${choiceTxt}</a>` : `<b>${esc(tv(v))}</b>`}</td></tr>`)
    .join('');
  const kindKey = leadKind(record).key;
  const car = pick(record, ['Autó', 'car']) || [pick(record, ['Márka']), pick(record, ['Modell'])].filter(Boolean).join(' ');
  const heading = I ? I.kinds[kindKey] + (car ? ' · ' + car : '') : leadKind(record).internal;
  const title = [contact.name || contact.company, contact.phone, contact.email].filter(Boolean).join(' · ');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
      to,
      reply_to: contact.email || undefined,
      subject: (R ? '[' + R.tag + '] ' : '') + heading + ' — ' + (title || (I ? I.web : 'weboldal')),
      attachments: attachment ? [attachment] : undefined,
      html: `<div style="font:14px/1.5 Arial,sans-serif;color:#111">
        <h2 style="margin:0 0 4px">${esc(heading)}</h2>
        <p style="margin:0 0 14px;color:#666">${I ? I.sla : 'Válaszidő-vállalás: <b>1 óra munkaidőben</b>.'}</p>
        <table style="border-collapse:collapse">${rows}</table></div>`
    })
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return { status: 'sent' };
}

async function sendMetaCapi(env, contact, meta) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return { status: 'skipped' };
  // GDPR: a Meta felé csak marketing-hozzájárulás esetén küldünk adatot.
  if (!meta.mkt) return { status: 'skipped_no_consent' };
  const user_data = {};
  if (contact.email) user_data.em = [await sha256(contact.email)];
  if (contact.phone) user_data.ph = [await sha256(contact.phone)];
  if (meta.fbp) user_data.fbp = meta.fbp;
  if (meta.fbc) user_data.fbc = meta.fbc;
  if (meta.ip) user_data.client_ip_address = meta.ip;
  if (meta.ua) user_data.client_user_agent = meta.ua;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: meta.event_id,
      event_source_url: meta.page || undefined,
      action_source: 'website',
      user_data,
      custom_data: { content_name: 'auto-rendeles', currency: 'HUF', value: 1 }
    }]
  };
  if (env.META_TEST_CODE) payload.test_event_code = env.META_TEST_CODE;

  const r = await fetch(
    `https://graph.facebook.com/${META_API}/${encodeURIComponent(env.META_PIXEL_ID)}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  if (!r.ok) throw new Error('capi ' + r.status);
  return { status: 'sent' };
}

/* ------------------------- segédek ------------------------- */

/** A lead típusa: belső tárgy, Notion-címke és az ügyfélnek szóló szöveg. */
function leadKind(data) {
  const t = String(pick(data, ['Típus', 'type', 'form']) || '').toLowerCase();
  const car = pick(data, ['Autó', 'car']) || [pick(data, ['Márka']), pick(data, ['Modell'])].filter(Boolean).join(' ');
  if (/bérl|berl|abo/.test(t)) return { key: 'berles', tag: 'Bérlés', internal: 'Új bérlési igény' + (car ? ' · ' + car : ''), subj: 'Megkaptuk a bérlési igényed' + (car ? ' — ' + car : ''), what: 'bérlési igényedet' + (car ? ' (' + car + ')' : '') };
  if (/rendel|order|egyedi/.test(t)) return { key: 'rendeles', tag: 'Egyedi rendelés', internal: 'Új autórendelés' + (car ? ' · ' + car : ''), subj: 'Megkaptuk az autórendelési igényed' + (car ? ' — ' + car : ''), what: 'autórendelési igényedet' + (car ? ' (' + car + ')' : '') };
  if (/bizom|eladás|eladas|eladom/.test(t)) return { key: 'eladas', tag: 'Bizományos értékesítés', internal: 'Új autóeladási ajánlat' + (car ? ' · ' + car : ''), subj: 'Megkaptuk az autód adatait' + (car ? ' — ' + car : ''), what: 'az autód eladásával kapcsolatos megkeresésedet' + (car ? ' (' + car + ')' : '') };
  return { key: 'import', tag: 'Autóimport', internal: 'Új import-érdeklődés', subj: 'Megkaptuk az autókeresési kérésed' + (car ? ' — ' + car : ''), what: 'autókeresési / import kérésedet' + (car ? ' (' + car + ')' : '') };
}

/** Visszaigazoló e-mail az ügyfélnek: köszönet + a beküldött adatok összefoglalója. */
/** caradvance.pl (vagy a caradvance.hu/pl/ előnézet) → 'pl' / 'en' / 'de', különben null */
function plLangOf(page, origin) {
  const s = String(page || '') + ' ' + String(origin || '');
  if (!/caradvance\.pl\b|(?:^|\s|https?:\/\/[^/\s]+)\/pl(?:\/|$)/.test(s)) return null;
  const m = String(page || '').match(/^(?:https?:\/\/[^/]+)?(?:\/pl)?\/(en|de)\//);
  return m ? m[1] : 'pl';
}
async function sendCustomerConfirm(env, data, contact, page, region, origin) {
  if (!env.RESEND_API_KEY || env.CUSTOMER_CONFIRM === 'off') return { status: 'skipped' };
  const k = leadKind(data);
  // Idegen nyelvű oldalakról érkező megkeresés: angol (német oldalról német) visszaigazolás.
  // A lefordított tükör-oldalak (/en/ /de/ /fr/ /uk/ /zh/) magyar űrlapjai nem küldenek Nyelv mezőt: az oldal URL-jéből vesszük.
  const pm = String(page || '').match(/^(?:https?:\/\/[^/]+)?\/(en|de|fr|uk|zh)\//);
  // Szlovák / cseh oldal: szlovák / cseh visszaigazolás, a válaszcím az országos postafiók.
  if (REGIONS[region]) return sendIntlConfirm(env, data, contact, REGIONS[region].lang, region);
  // caradvance.pl: a magyar csapat kezeli (region üres), a visszaigazolás lengyelül (az angol / német oldalról angolul / németül)
  { const pl = plLangOf(page, origin); if (pl) return sendIntlConfirm(env, data, contact, pl, undefined, 'pl'); }
  const L = String(data['Nyelv'] || (pm && pm[1]) || 'HU').toLowerCase();
  if (L !== 'hu') return sendIntlConfirm(env, data, contact, INTL_CONFIRM[L] ? L : 'en');
  const skip = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token', 'mkt_consent', 'Típus', 'type', 'form', 'Csatolmány', 'Vezetéknév', 'Keresztnév', 'consent', 'Ország (IP alapján)', 'beerkezett', 'forras_oldal', 'event_id', 'Choice link']);
  const rows = Object.entries(data)
    .filter(([key, v]) => !skip.has(key) && v != null && v !== '' && typeof v !== 'object')
    .slice(0, 40)
    .map(([key, v]) => `<tr><td style="padding:5px 14px 5px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(key)}</td><td style="padding:5px 0;color:#111"><b>${esc(String(v))}</b></td></tr>`)
    .join('');
  const first = String(pick(data, ['Keresztnév']) || String(contact.name || '').split(' ').slice(-1)[0] || '').trim();
  const hello = first ? 'Kedves ' + esc(first) + '!' : 'Kedves Érdeklődő!';
  const phone = env.CONTACT_PHONE || '+36 30 233 6060';
  const replyTo = env.CUSTOMER_REPLY_TO || 'info@caradvance.hu';
  const html = `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="https://www.caradvance.hu/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:24px">
      <p style="margin:0 0 12px">${hello}</p>
      <p style="margin:0 0 12px">Köszönjük, megkaptuk a ${esc(k.what)}. Kollégánk <b>a lehető leghamarabb</b> felveszi veled a kapcsolatot a részletekkel és a személyre szabott ajánlattal.</p>
      ${rows ? `<p style="margin:18px 0 6px;font-weight:bold">A beküldött adatok</p><table style="border-collapse:collapse;font-size:14px">${rows}</table>` : ''}
      ${k.key === 'berles' ? `<p style="margin:14px 0 0;font-size:13.5px;color:#4b5563;background:#f4f7fb;border-radius:10px;padding:10px 12px">A havidíjak <b>nettó</b> árak: cégként erre jön az áfa, magánszemélyként a díj <b>19% német áfával</b> értendő. A bérelt autók <b>német rendszámmal</b> közlekednek. A kaució áfamentes, és a bérlés végén visszajár.</p>` : k.key === 'rendeles' ? `<p style="margin:14px 0 0;font-size:13.5px;color:#4b5563;background:#f4f7fb;border-radius:10px;padding:10px 12px">A feltüntetett árak <b>nettó</b> (áfa nélküli) tájékoztató árak. Magánszemélyként akár 19% német áfával vásárolhatsz a Caradvance GmbH-n keresztül.</p>` : ''}
      <p style="margin:18px 0 0">Ha sürgős, hívj minket bátran: <a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" style="color:#e2001a;font-weight:bold;text-decoration:none">${esc(phone)}</a>, vagy egyszerűen válaszolj erre az e-mailre.</p>
      <p style="margin:18px 0 0">Üdvözlettel,</p><p style="margin:6px 0 0;line-height:1.45"><b>Tóth Károly</b><br><span style="color:#6b7280">Kereskedelmi Vezető</span><br>CarAdvance · Caradvance GmbH<br><a href="tel:+36302146989" style="color:#141519;text-decoration:none">+36 30 214 6989</a> · <a href="mailto:info@caradvance.hu" style="color:#141519;text-decoration:none">info@caradvance.hu</a></p>
    </div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">Caradvance GmbH</b> · Bgm-Graf-Ring 21 · D-82538 Geretsried · Németország<br>Tel.: +49 89 1894141-0 · info@caradvance.de · <a href="https://www.caradvance.hu" style="color:#6b7280">caradvance.hu</a><br>Amtsgericht München, HRB 151009 · USt-IdNr.: DE232664616<br>Ügyvezetők: Peter van den Berg, Dr. Alexander Röther<br><br>Ezt az üzenetet azért kaptad, mert kitöltötted az űrlapunkat a caradvance.hu oldalon. Az elküldés nem végleges megrendelés.</div>
  </div></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
      to: [contact.email],
      reply_to: replyTo,
      subject: k.subj + ' | CarAdvance',
      html
    })
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return { status: 'sent' };
}

const INTL_CONFIRM = {
  pl: { perMonth: '/mies.', months: 'mies.', subjs: { berles: 'Otrzymaliśmy Twoje zapytanie o wynajem', rendeles: 'Otrzymaliśmy Twoje zamówienie samochodu', eladas: 'Otrzymaliśmy dane Twojego samochodu', import: 'Otrzymaliśmy Twoją prośbę o wyszukanie samochodu' }, bodies: { berles: 'dziękujemy za zapytanie o wynajem. Członek naszego zespołu skontaktuje się z Tobą <b>jak najszybciej</b> ze szczegółami i indywidualną ofertą.', rendeles: 'dziękujemy za zamówienie samochodu. Członek naszego zespołu skontaktuje się z Tobą <b>jak najszybciej</b> ze szczegółami i indywidualną ofertą.', eladas: 'dziękujemy za przesłanie danych samochodu. <b>Jak najszybciej</b> odezwiemy się z realną wyceną.', import: 'dziękujemy za prośbę o wyszukanie samochodu. <b>Jak najszybciej</b> skontaktujemy się z Tobą z odpowiednimi ofertami z rynku niemieckiego.' }, subj: 'Otrzymaliśmy Twoje zapytanie', hello: (n) => n ? 'Dzień dobry, ' + n + ',' : 'Dzień dobry,', body: 'dziękujemy za wiadomość. Członek naszego zespołu skontaktuje się z Tobą <b>jak najszybciej</b> ze szczegółami i indywidualną ofertą.',
        data: 'Twoje zapytanie', urgent: 'W pilnej sprawie zadzwoń do nas:', or: 'lub po prostu odpowiedz na tego e-maila.', bye: 'Z poważaniem', role: 'Dyrektor handlowy', country: 'Niemcy', rep: 'Pośrednik handlowy dla Polski: Mr.JOB POLAND Sp. z o.o. · ul. Pory 78, 02-757 Warszawa, Polska · NIP 5213804274 · REGON 368854599',
        labels: { 'Név': 'Imię i nazwisko', 'E-mail': 'E-mail', 'Telefon': 'Telefon', 'Üzenet': 'Wiadomość', 'Nyelv': 'Język', 'Oldal': 'Strona', 'Típus': 'Zapytanie' } },
  en: { perMonth: '/month', months: 'months', subjs: { berles: 'We received your rental request', rendeles: 'We received your car order request', eladas: 'We received your car details', import: 'We received your car search request' }, bodies: { berles: 'thank you for your rental request. A member of our team will contact you <b>as soon as possible</b> with the details and a personal offer.', rendeles: 'thank you for your car order request. A member of our team will contact you <b>as soon as possible</b> with the details and a personal offer.', eladas: 'thank you for sending us your car details. We will get back to you <b>as soon as possible</b> with a realistic price estimate.', import: 'thank you for your car search request. We will contact you <b>as soon as possible</b> with suitable offers from the German market.' }, subj: 'We received your request', hello: (n) => n ? 'Dear ' + n + ',' : 'Hello,', body: 'thank you for your message. A member of our team will contact you <b>as soon as possible</b> with the details and a personal offer.',
        data: 'Your request', urgent: 'If it is urgent, call us on', or: 'or simply reply to this e-mail.', bye: 'Kind regards,', role: 'Head of Sales', country: 'Germany', rep: 'Hungarian representative: BH Group Zrt.',
        labels: { 'Név': 'Name', 'E-mail': 'E-mail', 'Telefon': 'Phone', 'Üzenet': 'Message', 'Nyelv': 'Language', 'Oldal': 'Page', 'Típus': 'Request' } },
  de: { perMonth: '/Monat', months: 'Monate', subjs: { berles: 'Wir haben Ihre Mietanfrage erhalten', rendeles: 'Wir haben Ihre Bestellanfrage erhalten', eladas: 'Wir haben die Daten Ihres Autos erhalten', import: 'Wir haben Ihren Suchauftrag erhalten' }, bodies: { berles: 'vielen Dank für Ihre Mietanfrage. Ein Mitglied unseres Teams meldet sich <b>so bald wie möglich</b> mit den Details und einem persönlichen Angebot.', rendeles: 'vielen Dank für Ihre Bestellanfrage. Ein Mitglied unseres Teams meldet sich <b>so bald wie möglich</b> mit den Details und einem persönlichen Angebot.', eladas: 'vielen Dank für die Daten Ihres Autos. Wir melden uns <b>so bald wie möglich</b> mit einer realistischen Preiseinschätzung.', import: 'vielen Dank für Ihren Suchauftrag. Wir melden uns <b>so bald wie möglich</b> mit passenden Angeboten vom deutschen Markt.' }, subj: 'Wir haben Ihre Anfrage erhalten', hello: (n) => n ? 'Hallo ' + n + ',' : 'Guten Tag,', body: 'vielen Dank für Ihre Nachricht. Ein Mitglied unseres Teams meldet sich <b>so bald wie möglich</b> mit den Details und einem persönlichen Angebot.',
        data: 'Ihre Anfrage', urgent: 'Wenn es eilt, rufen Sie uns an:', or: 'oder antworten Sie einfach auf diese E-Mail.', bye: 'Mit freundlichen Grüßen', role: 'Vertriebsleiter', country: 'Deutschland', rep: 'Vertretung in Ungarn: BH Group Zrt.',
        labels: { 'Név': 'Name', 'E-mail': 'E-Mail', 'Telefon': 'Telefon', 'Üzenet': 'Nachricht', 'Nyelv': 'Sprache', 'Oldal': 'Seite', 'Típus': 'Anfrage' } },
  fr: { perMonth: '/mois', months: 'mois', subjs: { berles: 'Nous avons bien reçu votre demande de location', rendeles: 'Nous avons bien reçu votre demande de commande', eladas: 'Nous avons bien reçu les informations de votre voiture', import: 'Nous avons bien reçu votre demande de recherche' }, bodies: { berles: 'merci pour votre demande de location. Un membre de notre équipe vous contactera <b>dans les plus brefs délais</b> avec les détails et une offre personnalisée.', rendeles: 'merci pour votre demande de commande. Un membre de notre équipe vous contactera <b>dans les plus brefs délais</b> avec les détails et une offre personnalisée.', eladas: 'merci pour les informations sur votre voiture. Nous revenons vers vous <b>dans les plus brefs délais</b> avec une estimation de prix réaliste.', import: 'merci pour votre demande de recherche. Nous vous contacterons <b>dans les plus brefs délais</b> avec des offres adaptées du marché allemand.' }, subj: 'Nous avons bien reçu votre demande', hello: (n) => n ? 'Bonjour ' + n + ',' : 'Bonjour,', body: 'merci pour votre message. Un membre de notre équipe vous contactera <b>dans les plus brefs délais</b> avec les détails et une offre personnalisée.',
        data: 'Votre demande', urgent: 'En cas d’urgence, appelez-nous au', or: 'ou répondez simplement à cet e-mail.', bye: 'Cordialement,', role: 'Directeur commercial', country: 'Allemagne', rep: 'Représentant en Hongrie : BH Group Zrt.',
        labels: { 'Név': 'Nom', 'E-mail': 'E-mail', 'Telefon': 'Téléphone', 'Üzenet': 'Message', 'Nyelv': 'Langue', 'Oldal': 'Page', 'Típus': 'Demande' } },
  uk: { perMonth: '/міс.', months: 'міс.', subjs: { berles: 'Ми отримали ваш запит на оренду', rendeles: 'Ми отримали ваш запит на замовлення авто', eladas: 'Ми отримали дані вашого авто', import: 'Ми отримали ваш запит на пошук авто' }, bodies: { berles: 'Дякуємо за запит на оренду. Наш співробітник зв’яжеться з вами <b>найближчим часом</b> з деталями та персональною пропозицією.', rendeles: 'Дякуємо за запит на замовлення авто. Наш співробітник зв’яжеться з вами <b>найближчим часом</b> з деталями та персональною пропозицією.', eladas: 'Дякуємо, що надіслали дані вашого авто. Ми зв’яжемося з вами <b>найближчим часом</b> з реалістичною оцінкою ціни.', import: 'Дякуємо за запит на пошук авто. Ми зв’яжемося з вами <b>найближчим часом</b> з відповідними пропозиціями з німецького ринку.' }, subj: 'Ми отримали ваш запит', hello: (n) => n ? 'Вітаємо, ' + n + '!' : 'Вітаємо!', body: 'Дякуємо за ваше повідомлення. Наш співробітник зв’яжеться з вами <b>найближчим часом</b> з деталями та персональною пропозицією.',
        data: 'Ваш запит', urgent: 'Якщо питання термінове, зателефонуйте нам:', or: 'або просто дайте відповідь на цей лист.', bye: 'З повагою,', role: 'Комерційний директор', country: 'Німеччина', rep: 'Представник в Угорщині: BH Group Zrt.',
        labels: { 'Név': 'Ім’я', 'E-mail': 'E-mail', 'Telefon': 'Телефон', 'Üzenet': 'Повідомлення', 'Nyelv': 'Мова', 'Oldal': 'Сторінка', 'Típus': 'Запит' } },
  zh: { perMonth: '/月', months: '个月', subjs: { berles: '我们已收到您的租赁申请', rendeles: '我们已收到您的订车申请', eladas: '我们已收到您的车辆信息', import: '我们已收到您的寻车申请' }, bodies: { berles: '感谢您的租赁申请。我们的团队成员将<b>尽快</b>与您联系，为您提供详细信息和个性化报价。', rendeles: '感谢您的订车申请。我们的团队成员将<b>尽快</b>与您联系，为您提供详细信息和个性化报价。', eladas: '感谢您提交车辆信息。我们将<b>尽快</b>与您联系，提供切合实际的估价。', import: '感谢您的寻车申请。我们将<b>尽快</b>与您联系，提供德国市场上的合适车源。' }, subj: '我们已收到您的咨询', hello: (n) => n ? n + '，您好：' : '您好：', body: '感谢您的留言。我们的团队成员将<b>尽快</b>与您联系，为您提供详细信息和个性化报价。',
        data: '您的咨询', urgent: '如有急事，请致电', or: '或直接回复此邮件。', bye: '此致敬礼', role: '销售总监', country: '德国', rep: '匈牙利代表：BH Group Zrt.',
        labels: { 'Név': '姓名', 'E-mail': '电子邮箱', 'Telefon': '电话', 'Üzenet': '留言', 'Nyelv': '语言', 'Oldal': '页面', 'Típus': '咨询类型' } },
  sk: { perMonth: '/mes.', months: 'mes.', subjs: { berles: 'Prijali sme vašu žiadosť o prenájom', rendeles: 'Prijali sme vašu objednávku auta', eladas: 'Prijali sme údaje o vašom aute', import: 'Prijali sme vašu požiadavku na vyhľadanie auta' }, bodies: { berles: 'ďakujeme za vašu žiadosť o prenájom. Člen nášho tímu vás bude <b>čo najskôr</b> kontaktovať s podrobnosťami a osobnou ponukou.', rendeles: 'ďakujeme za vašu objednávku auta. Člen nášho tímu vás bude <b>čo najskôr</b> kontaktovať s podrobnosťami a osobnou ponukou.', eladas: 'ďakujeme, že ste nám poslali údaje o svojom aute. <b>Čo najskôr</b> sa vám ozveme s reálnym odhadom ceny.', import: 'ďakujeme za vašu požiadavku na vyhľadanie auta. <b>Čo najskôr</b> vás budeme kontaktovať s vhodnými ponukami z nemeckého trhu.' }, subj: 'Prijali sme vašu požiadavku', hello: (n) => n ? 'Dobrý deň, ' + n + ',' : 'Dobrý deň,', body: 'ďakujeme za vašu správu. Člen nášho tímu vás bude <b>čo najskôr</b> kontaktovať s podrobnosťami a osobnou ponukou.',
        data: 'Vaša požiadavka', urgent: 'Ak je to naliehavé, zavolajte nám na', or: 'alebo jednoducho odpovedzte na tento e-mail.', bye: 'S pozdravom', role: 'Obchodný riaditeľ', country: 'Nemecko', rep: 'Zastúpenie na Slovensku: Mr. JOB SK s.r.o. · Cesta na Senec 2/A, 821 04 Bratislava',
        labels: { 'Név': 'Meno', 'E-mail': 'E-mail', 'Telefon': 'Telefón', 'Üzenet': 'Správa', 'Nyelv': 'Jazyk', 'Oldal': 'Stránka', 'Típus': 'Požiadavka' } },
  cs: { perMonth: '/měs.', months: 'měs.', subjs: { berles: 'Obdrželi jsme vaši žádost o pronájem', rendeles: 'Obdrželi jsme vaši objednávku vozu', eladas: 'Obdrželi jsme údaje o vašem voze', import: 'Obdrželi jsme váš požadavek na vyhledání vozu' }, bodies: { berles: 'děkujeme za vaši žádost o pronájem. Člen našeho týmu vás bude <b>co nejdříve</b> kontaktovat s podrobnostmi a osobní nabídkou.', rendeles: 'děkujeme za vaši objednávku vozu. Člen našeho týmu vás bude <b>co nejdříve</b> kontaktovat s podrobnostmi a osobní nabídkou.', eladas: 'děkujeme, že jste nám poslali údaje o svém voze. <b>Co nejdříve</b> se vám ozveme s reálným odhadem ceny.', import: 'děkujeme za váš požadavek na vyhledání vozu. <b>Co nejdříve</b> vás budeme kontaktovat s vhodnými nabídkami z německého trhu.' }, subj: 'Obdrželi jsme váš požadavek', hello: (n) => n ? 'Dobrý den, ' + n + ',' : 'Dobrý den,', body: 'děkujeme za vaši zprávu. Člen našeho týmu vás bude <b>co nejdříve</b> kontaktovat s podrobnostmi a osobní nabídkou.',
        data: 'Váš požadavek', urgent: 'Pokud je to naléhavé, zavolejte nám na', or: 'nebo jednoduše odpovězte na tento e-mail.', bye: 'S pozdravem', role: 'Obchodní ředitel', country: 'Německo', rep: 'Zastoupení pro Česko a Slovensko: Mr. JOB SK s.r.o. · Cesta na Senec 2/A, 821 04 Bratislava',
        labels: { 'Név': 'Jméno', 'E-mail': 'E-mail', 'Telefon': 'Telefon', 'Üzenet': 'Zpráva', 'Nyelv': 'Jazyk', 'Oldal': 'Stránka', 'Típus': 'Požadavek' } },
};

const INTL_LABELS = {
  pl: { 'Kívánt átvétel': 'Planowany początek najmu', 'Autó': 'Samochód', 'Becsült havidíj': 'Szacunkowa opłata miesięczna', 'Német rendszám': 'Niemieckie tablice rejestracyjne', 'Elérhetőség': 'Dostępność', 'Felszereltség': 'Wyposażenie', 'Futamidő': 'Okres najmu', 'Kaució': 'Kaucja', 'Km-keret': 'Limit kilometrów', 'Konstrukció': 'Rodzaj umowy', 'Megjegyzés': 'Uwagi', 'Szín': 'Kolor', 'Üzemanyag': 'Paliwo', 'Vásárló': 'Typ klienta', 'Cégnév': 'Nazwa firmy', 'Adószám': 'NIP', 'Finanszírozás': 'Finansowanie', 'Fizetés': 'Płatność', 'Vásárlás módja': 'Sposób zakupu', 'Kapcsolattartó': 'Osoba kontaktowa', 'Márka': 'Marka', 'Modell': 'Model', 'Évjárat': 'Rocznik', 'Kilométer': 'Przebieg', 'Futás': 'Przebieg', 'Ár': 'Cena', 'Kért ár': 'Oczekiwana cena', 'Költségkeret': 'Budżet', 'Város': 'Miasto', 'Székhely': 'Siedziba' },
  en: { 'Kívánt átvétel': 'Requested start date', 'Autó': 'Car', 'Becsült havidíj': 'Estimated monthly fee', 'Német rendszám': 'German licence plate', 'Elérhetőség': 'Availability', 'Felszereltség': 'Equipment', 'Futamidő': 'Term', 'Kaució': 'Deposit', 'Km-keret': 'Mileage allowance', 'Konstrukció': 'Contract type', 'Megjegyzés': 'Note', 'Szín': 'Colour', 'Üzemanyag': 'Fuel', 'Vásárló': 'Customer type', 'Cégnév': 'Company name', 'Adószám': 'Tax number', 'Finanszírozás': 'Financing', 'Fizetés': 'Payment', 'Vásárlás módja': 'Purchase method', 'Kapcsolattartó': 'Contact person', 'Márka': 'Make', 'Modell': 'Model', 'Évjárat': 'Year', 'Kilométer': 'Mileage', 'Futás': 'Mileage', 'Ár': 'Price', 'Kért ár': 'Asking price', 'Költségkeret': 'Budget', 'Város': 'City', 'Székhely': 'Registered office' },
  de: { 'Kívánt átvétel': 'Gewünschter Mietbeginn', 'Autó': 'Auto', 'Becsült havidíj': 'Geschätzte Monatsrate', 'Német rendszám': 'Deutsches Kennzeichen', 'Elérhetőség': 'Verfügbarkeit', 'Felszereltség': 'Ausstattung', 'Futamidő': 'Laufzeit', 'Kaució': 'Kaution', 'Km-keret': 'Kilometerpaket', 'Konstrukció': 'Vertragsart', 'Megjegyzés': 'Bemerkung', 'Szín': 'Farbe', 'Üzemanyag': 'Kraftstoff', 'Vásárló': 'Kundentyp', 'Cégnév': 'Firmenname', 'Adószám': 'Steuernummer', 'Finanszírozás': 'Finanzierung', 'Fizetés': 'Zahlung', 'Vásárlás módja': 'Kaufart', 'Kapcsolattartó': 'Ansprechpartner', 'Márka': 'Marke', 'Modell': 'Modell', 'Évjárat': 'Baujahr', 'Kilométer': 'Kilometerstand', 'Futás': 'Kilometerstand', 'Ár': 'Preis', 'Kért ár': 'Preisvorstellung', 'Költségkeret': 'Budget', 'Város': 'Stadt', 'Székhely': 'Firmensitz' },
  fr: { 'Kívánt átvétel': 'Date de début souhaitée', 'Autó': 'Voiture', 'Becsült havidíj': 'Loyer mensuel estimé', 'Elérhetőség': 'Disponibilité', 'Felszereltség': 'Équipement', 'Futamidő': 'Durée', 'Kaució': 'Dépôt de garantie', 'Km-keret': 'Kilométrage', 'Konstrukció': 'Type de contrat', 'Megjegyzés': 'Remarque', 'Szín': 'Couleur', 'Üzemanyag': 'Carburant', 'Vásárló': 'Type de client', 'Cégnév': 'Société', 'Adószám': 'Numéro fiscal', 'Finanszírozás': 'Financement', 'Fizetés': 'Paiement', 'Vásárlás módja': 'Mode d’achat', 'Kapcsolattartó': 'Contact', 'Márka': 'Marque', 'Modell': 'Modèle', 'Évjárat': 'Année', 'Kilométer': 'Kilométrage', 'Futás': 'Kilométrage', 'Ár': 'Prix', 'Kért ár': 'Prix demandé', 'Költségkeret': 'Budget', 'Város': 'Ville', 'Székhely': 'Siège' },
  uk: { 'Kívánt átvétel': 'Бажана дата початку', 'Autó': 'Авто', 'Becsült havidíj': 'Орієнтовний щомісячний платіж', 'Elérhetőség': 'Наявність', 'Felszereltség': 'Комплектація', 'Futamidő': 'Термін', 'Kaució': 'Застава', 'Km-keret': 'Ліміт пробігу', 'Konstrukció': 'Тип договору', 'Megjegyzés': 'Примітка', 'Szín': 'Колір', 'Üzemanyag': 'Пальне', 'Vásárló': 'Тип клієнта', 'Cégnév': 'Назва компанії', 'Adószám': 'Податковий номер', 'Finanszírozás': 'Фінансування', 'Fizetés': 'Оплата', 'Vásárlás módja': 'Спосіб купівлі', 'Kapcsolattartó': 'Контактна особа', 'Márka': 'Марка', 'Modell': 'Модель', 'Évjárat': 'Рік', 'Kilométer': 'Пробіг', 'Futás': 'Пробіг', 'Ár': 'Ціна', 'Kért ár': 'Бажана ціна', 'Költségkeret': 'Бюджет', 'Város': 'Місто', 'Székhely': 'Юридична адреса' },
  zh: { 'Kívánt átvétel': '期望起租日期', 'Autó': '车辆', 'Becsült havidíj': '预估月租', 'Elérhetőség': '供货情况', 'Felszereltség': '配置', 'Futamidő': '租期', 'Kaució': '押金', 'Km-keret': '里程额度', 'Konstrukció': '合同类型', 'Megjegyzés': '备注', 'Szín': '颜色', 'Üzemanyag': '燃料', 'Vásárló': '客户类型', 'Cégnév': '公司名称', 'Adószám': '税号', 'Finanszírozás': '融资', 'Fizetés': '付款方式', 'Vásárlás módja': '购买方式', 'Kapcsolattartó': '联系人', 'Márka': '品牌', 'Modell': '车型', 'Évjárat': '年份', 'Kilométer': '里程', 'Futás': '里程', 'Ár': '价格', 'Kért ár': '期望价格', 'Költségkeret': '预算', 'Város': '城市', 'Székhely': '注册地址' },
  sk: { 'Kívánt átvétel': 'Požadovaný začiatok prenájmu', 'Autó': 'Auto', 'Becsült havidíj': 'Odhadovaná mesačná splátka', 'Német rendszám': 'Nemecké EČV', 'Elérhetőség': 'Dostupnosť', 'Felszereltség': 'Výbava', 'Futamidő': 'Doba prenájmu', 'Kaució': 'Kaucia', 'Km-keret': 'Limit km', 'Konstrukció': 'Typ zmluvy', 'Megjegyzés': 'Poznámka', 'Szín': 'Farba', 'Üzemanyag': 'Palivo', 'Vásárló': 'Typ zákazníka', 'Cégnév': 'Názov firmy', 'Adószám': 'DIČ', 'Finanszírozás': 'Financovanie', 'Fizetés': 'Platba', 'Vásárlás módja': 'Spôsob kúpy', 'Kapcsolattartó': 'Kontaktná osoba', 'Márka': 'Značka', 'Modell': 'Model', 'Évjárat': 'Rok výroby', 'Kilométer': 'Najazdené km', 'Futás': 'Najazdené km', 'Ár': 'Cena', 'Kért ár': 'Požadovaná cena', 'Költségkeret': 'Rozpočet', 'Város': 'Mesto', 'Székhely': 'Sídlo' },
  cs: { 'Kívánt átvétel': 'Požadovaný začátek pronájmu', 'Autó': 'Vůz', 'Becsült havidíj': 'Odhadovaná měsíční splátka', 'Német rendszám': 'Německá SPZ', 'Elérhetőség': 'Dostupnost', 'Felszereltség': 'Výbava', 'Futamidő': 'Doba pronájmu', 'Kaució': 'Kauce', 'Km-keret': 'Limit km', 'Konstrukció': 'Typ smlouvy', 'Megjegyzés': 'Poznámka', 'Szín': 'Barva', 'Üzemanyag': 'Palivo', 'Vásárló': 'Typ zákazníka', 'Cégnév': 'Název firmy', 'Adószám': 'DIČ', 'Finanszírozás': 'Financování', 'Fizetés': 'Platba', 'Vásárlás módja': 'Způsob koupě', 'Kapcsolattartó': 'Kontaktní osoba', 'Márka': 'Značka', 'Modell': 'Model', 'Évjárat': 'Rok výroby', 'Kilométer': 'Najeto km', 'Futás': 'Najeto km', 'Ár': 'Cena', 'Kért ár': 'Požadovaná cena', 'Költségkeret': 'Rozpočet', 'Város': 'Město', 'Székhely': 'Sídlo' },
};
const INTL_VALUES = {
  pl: { 'Magánszemély': 'Osoba prywatna', 'Magánszemélyként': 'Osoba prywatna', 'Cég': 'Firma', 'Cégként': 'Firma', 'Benzin': 'Benzyna', 'Dízel': 'Diesel', 'Elektromos': 'Elektryczny', 'Hibrid': 'Hybryda', 'Plug-in hibrid': 'Hybryda plug-in', 'Bérlés': 'Wynajem', 'Bérlés-vétel': 'Wynajem z wykupem', 'Azonnal': 'Od zaraz', 'Azonnal elérhető': 'Dostępny od zaraz', 'Készpénz': 'Gotówka', 'Lízing': 'Leasing', 'Hitel': 'Kredyt', 'Igen': 'Tak', 'Nem': 'Nie' },
  en: { 'Magánszemély': 'Private individual', 'Magánszemélyként': 'Private individual', 'Cég': 'Company', 'Cégként': 'Company', 'Benzin': 'Petrol', 'Dízel': 'Diesel', 'Elektromos': 'Electric', 'Hibrid': 'Hybrid', 'Plug-in hibrid': 'Plug-in hybrid', 'Bérlés': 'Rental', 'Bérlés-vétel': 'Rent-to-own', 'Azonnal': 'Immediately', 'Azonnal elérhető': 'Available immediately', 'Készpénz': 'Cash', 'Lízing': 'Leasing', 'Hitel': 'Loan', 'Igen': 'Yes', 'Nem': 'No' },
  de: { 'Magánszemély': 'Privatperson', 'Magánszemélyként': 'Privatperson', 'Cég': 'Unternehmen', 'Cégként': 'Unternehmen', 'Benzin': 'Benzin', 'Dízel': 'Diesel', 'Elektromos': 'Elektro', 'Hibrid': 'Hybrid', 'Plug-in hibrid': 'Plug-in-Hybrid', 'Bérlés': 'Miete', 'Bérlés-vétel': 'Mietkauf', 'Azonnal': 'Sofort', 'Azonnal elérhető': 'Sofort verfügbar', 'Készpénz': 'Barzahlung', 'Lízing': 'Leasing', 'Hitel': 'Kredit', 'Igen': 'Ja', 'Nem': 'Nein' },
  fr: { 'Magánszemély': 'Particulier', 'Magánszemélyként': 'Particulier', 'Cég': 'Entreprise', 'Cégként': 'Entreprise', 'Benzin': 'Essence', 'Dízel': 'Diesel', 'Elektromos': 'Électrique', 'Hibrid': 'Hybride', 'Plug-in hibrid': 'Hybride rechargeable', 'Bérlés': 'Location', 'Bérlés-vétel': 'Location avec option d’achat', 'Azonnal': 'Immédiatement', 'Azonnal elérhető': 'Disponible immédiatement', 'Készpénz': 'Comptant', 'Lízing': 'Leasing', 'Hitel': 'Crédit', 'Igen': 'Oui', 'Nem': 'Non' },
  uk: { 'Magánszemély': 'Приватна особа', 'Magánszemélyként': 'Приватна особа', 'Cég': 'Компанія', 'Cégként': 'Компанія', 'Benzin': 'Бензин', 'Dízel': 'Дизель', 'Elektromos': 'Електро', 'Hibrid': 'Гібрид', 'Plug-in hibrid': 'Плагін-гібрид', 'Bérlés': 'Оренда', 'Bérlés-vétel': 'Оренда з викупом', 'Azonnal': 'Одразу', 'Azonnal elérhető': 'Доступно одразу', 'Készpénz': 'Готівка', 'Lízing': 'Лізинг', 'Hitel': 'Кредит', 'Igen': 'Так', 'Nem': 'Ні' },
  zh: { 'Magánszemély': '个人', 'Magánszemélyként': '个人', 'Cég': '公司', 'Cégként': '公司', 'Benzin': '汽油', 'Dízel': '柴油', 'Elektromos': '纯电动', 'Hibrid': '混合动力', 'Plug-in hibrid': '插电式混合动力', 'Bérlés': '租赁', 'Bérlés-vétel': '以租代购', 'Azonnal': '立即', 'Azonnal elérhető': '可立即提车', 'Készpénz': '现金', 'Lízing': '融资租赁', 'Hitel': '贷款', 'Igen': '是', 'Nem': '否' },
  sk: { 'Magánszemély': 'Súkromná osoba', 'Magánszemélyként': 'Súkromná osoba', 'Cég': 'Firma', 'Cégként': 'Firma', 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Elektromos': 'Elektrické', 'Hibrid': 'Hybrid', 'Plug-in hibrid': 'Plug-in hybrid', 'Bérlés': 'Prenájom', 'Bérlés-vétel': 'Prenájom s odkúpením', 'Azonnal': 'Ihneď', 'Azonnal elérhető': 'Dostupné ihneď', 'Készpénz': 'Hotovosť', 'Lízing': 'Lízing', 'Hitel': 'Úver', 'Igen': 'Áno', 'Nem': 'Nie' },
  cs: { 'Magánszemély': 'Soukromá osoba', 'Magánszemélyként': 'Soukromá osoba', 'Cég': 'Firma', 'Cégként': 'Firma', 'Benzin': 'Benzín', 'Dízel': 'Diesel', 'Elektromos': 'Elektrický', 'Hibrid': 'Hybrid', 'Plug-in hibrid': 'Plug-in hybrid', 'Bérlés': 'Pronájem', 'Bérlés-vétel': 'Pronájem s odkupem', 'Azonnal': 'Ihned', 'Azonnal elérhető': 'Dostupné ihned', 'Készpénz': 'Hotovost', 'Lízing': 'Leasing', 'Hitel': 'Úvěr', 'Igen': 'Ano', 'Nem': 'Ne' },
};

/* ---------- SK / CZ: belső (magyar) értékek → piaci nyelv ---------- */
const VAL_EXTRA = {
  sk: { 'Cég': 'Firma s IČ DPH', 'Cégként': 'Firma s IČ DPH', 'Dízel': 'Nafta', 'Saját finanszírozás': 'Vlastné financovanie', 'Bérlés (Auto-Abo)': 'Prenájom (Auto-Abo)', 'Nettó EUR, Németországból (Caradvance GmbH)': 'Bez DPH, z Nemecka (Caradvance GmbH)', 'Finanszírozással': 'S financovaním', 'Egy összegben': 'Jednorazovo', 'Még nem tudom': 'Ešte neviem' },
  cs: { 'Dízel': 'Nafta', 'Saját finanszírozás': 'Vlastní financování', 'Bérlés (Auto-Abo)': 'Pronájem (Auto-Abo)', 'Nettó EUR, Németországból (Caradvance GmbH)': 'Bez DPH, z Německa (Caradvance GmbH)', 'Finanszírozással': 'S financováním', 'Egy összegben': 'Jednorázově', 'Még nem tudom': 'Ještě nevím' }
};
const VAL_RE = {
  sk: [[/\bBMW (\d)-(?:es|as|ös|os) /g, 'BMW rad $1 '], [/\bBMW (\d)-(?:es|as|ös|os)$/g, 'BMW rad $1'], [/trieda ([A-Z]+) Limuzin(?![\p{L}])/gu, 'triedy $1 Limuzína'], [/Limuzin(?![\p{L}])/gu, 'Limuzína'], [/ hónap(?![\p{L}])/gu, ' mesiacov'], [/ km \/ hó(?![\p{L}])/gu, ' km / mes.']],
  cs: [[/\bBMW (\d)-(?:es|as|ös|os) /g, 'BMW řady $1 '], [/\bBMW (\d)-(?:es|as|ös|os)$/g, 'BMW řady $1'], [/třída ([A-Z]+) Limuzin(?![\p{L}])/gu, 'třídy $1 Limuzína'], [/Limuzin(?![\p{L}])/gu, 'Limuzína'], [/ hónap(?![\p{L}])/gu, ' měsíců'], [/ km \/ hó(?![\p{L}])/gu, ' km / měs.']]
};
const SKIP_LOC = /^(Típus|type|form|Nyelv|E-mail|email|Telefon|phone|Név|name|Cégnév|company|Vezetéknév|Keresztnév|Megjegyzés|Üzenet|message|forras_oldal|page|event_id|beerkezett|turnstile_token|fbp|fbc|user_agent)$/i;
function localizeVals(obj, lang) {
  const V = Object.assign({}, INTL_VALUES[lang] || {}, VAL_EXTRA[lang] || {}), R = VAL_RE[lang] || [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v !== 'string' || !v || SKIP_LOC.test(k)) continue;
    let o = v.split(' · ').map((x) => V[x.trim()] || x).join(' · ');
    if (V[o]) o = V[o];
    for (const [a, b] of R) o = o.replace(a, b);
    obj[k] = o;
  }
}

/* ---------- országos postafiókok (SK / CZ) ---------- */
const REGIONS = {
  sk: { tag: 'SK', lang: 'sk', to: 'info@caradvance.sk', reply: 'info@caradvance.sk', phone: '+421 915 410 555' },
  cz: { tag: 'CZ', lang: 'cs', to: 'info@caradvance.cz', reply: 'info@caradvance.cz', phone: '+420 604 313 136' }
};
/** Melyik országos csapathoz tartozik a lead: az oldal útvonala (/sk/, /cs/), a domain vagy a Nyelv mező alapján. */
function regionOf(page, data) {
  const pg = String(page || '');
  const m = pg.match(/^(?:https?:\/\/[^/]+)?\/(sk|cs)(?:[/?#]|$)/);
  const host = (pg.match(/^https?:\/\/([^/:]+)/) || [])[1] || '';
  const lang = String((data && data['Nyelv']) || '').toLowerCase();
  if ((m && m[1] === 'sk') || /(^|\.)caradvance\.sk$/i.test(host) || lang === 'sk') return 'sk';
  if ((m && m[1] === 'cs') || /(^|\.)caradvance\.cz$/i.test(host) || lang === 'cs' || lang === 'cz') return 'cz';
  return '';
}
const INTERNAL_TXT = {
  sk: { kinds: { berles: 'Nová žiadosť o prenájom', rendeles: 'Nová objednávka auta', eladas: 'Nová ponuka auta na predaj', import: 'Nový dopyt – dovoz auta' }, sla: 'Čas odozvy: <b>1 hodina v pracovnom čase</b>.', choice: 'Otvoriť vo Choice fleetshope →', web: 'webstránka',
        labels: { 'beerkezett': 'Prijaté', 'forras_oldal': 'Stránka', 'Ország (IP alapján)': 'Krajina (podľa IP)', 'Vezetéknév': 'Priezvisko', 'Keresztnév': 'Krstné meno', 'Adatkezelés': 'Súhlas so spracovaním údajov', 'consent': 'Súhlas', 'Csatolmány': 'Príloha', 'belepo_oldal': 'Vstupná stránka', 'hivatkozo': 'Odkazujúca stránka' } },
  cs: { kinds: { berles: 'Nová žádost o pronájem', rendeles: 'Nová objednávka vozu', eladas: 'Nová nabídka vozu k prodeji', import: 'Nová poptávka – dovoz vozu' }, sla: 'Doba odezvy: <b>1 hodina v pracovní době</b>.', choice: 'Otevřít ve Choice fleetshopu →', web: 'web',
        labels: { 'beerkezett': 'Přijato', 'forras_oldal': 'Stránka', 'Ország (IP alapján)': 'Země (podle IP)', 'Vezetéknév': 'Příjmení', 'Keresztnév': 'Křestní jméno', 'Adatkezelés': 'Souhlas se zpracováním údajů', 'consent': 'Souhlas', 'Csatolmány': 'Příloha', 'belepo_oldal': 'Vstupní stránka', 'hivatkozo': 'Odkazující stránka' } }
};
/* caradvance.pl (angol / német oldal is): a lengyel kereskedelmi képviselő a levél láblécében */
const PL_REP = {
  pl: 'Pośrednik handlowy dla Polski: Mr.JOB POLAND Sp. z o.o. · ul. Pory 78, 02-757 Warszawa, Polska · NIP 5213804274 · REGON 368854599',
  en: 'Commercial agent for Poland: Mr.JOB POLAND Sp. z o.o. · ul. Pory 78, 02-757 Warsaw, Poland · NIP 5213804274 · REGON 368854599',
  de: 'Handelsvertreter für Polen: Mr.JOB POLAND Sp. z o.o. · ul. Pory 78, 02-757 Warschau, Polen · NIP 5213804274 · REGON 368854599'
};
async function sendIntlConfirm(env, data, contact, lang, region, mkt) {
  const T = mkt === 'pl' ? Object.assign({}, INTL_CONFIRM[lang], { rep: PL_REP[lang] || PL_REP.en }) : INTL_CONFIRM[lang];
  const R = REGIONS[region];
  // A beküldött adatok összefoglalója — minden mező, a mezőnevek és a gyakori értékek a vevő nyelvén
  const skipI = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token', 'mkt_consent', 'Típus', 'type', 'form', 'Csatolmány', 'Vezetéknév', 'Keresztnév', 'consent', 'Adatkezelés', 'Ország (IP alapján)', 'beerkezett', 'forras_oldal', 'Nyelv', 'Choice link']);
  const L = INTL_LABELS[lang] || {};
  const V = INTL_VALUES[lang] || {};
  const tv = (v) => String(v).split(' · ').map((x) => V[x.trim()] || x).join(' · ').replace(/\/hó(?![\wáéíóöőúüű])/g, T.perMonth || '/month').replace(/(\d) hó(?![\wáéíóöőúüű])/g, '$1 ' + (T.months || 'months'));
  const rows = Object.entries(data)
    .filter(([key, v]) => !skipI.has(key) && v != null && v !== '' && typeof v !== 'object')
    .slice(0, 40)
    .map(([key, v]) => `<tr><td style="padding:5px 14px 5px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(L[key] || T.labels[key] || key)}</td><td style="padding:5px 0;color:#111"><b>${esc(tv(v))}</b></td></tr>`).join('');
  const kind = leadKind(data).key;
  const body = (T.bodies && T.bodies[kind]) || T.body;
  const subj = (T.subjs && T.subjs[kind]) || T.subj;
  const first = String(contact.name || '').trim().split(' ')[0] || '';
  const phone = R ? R.phone : (env.CONTACT_PHONE || '+36 30 233 6060');
  const sigPhone = R ? R.phone : '+36 30 214 6989';
  const sigMail = R ? R.reply : 'info@caradvance.hu';
  const replyTo = R ? (env['CUSTOMER_REPLY_TO_' + R.tag] || R.reply) : (env.CUSTOMER_REPLY_TO || 'info@caradvance.hu');
  const html = `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="https://www.caradvance.hu/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:24px">
      <p style="margin:0 0 12px">${esc(T.hello(first))}</p>
      <p style="margin:0 0 12px">${body}</p>
      ${rows ? `<p style="margin:18px 0 6px;font-weight:bold">${T.data}</p><table style="border-collapse:collapse;font-size:14px">${rows}</table>` : ''}
      <p style="margin:18px 0 0">${T.urgent} <a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}" style="color:#e2001a;font-weight:bold;text-decoration:none">${esc(phone)}</a> ${T.or}</p>
      <p style="margin:18px 0 0">${T.bye}</p><p style="margin:6px 0 0;line-height:1.45"><b>Tóth Károly</b><br><span style="color:#6b7280">${T.role}</span><br>CarAdvance · Caradvance GmbH<br><a href="tel:${esc(sigPhone.replace(/[^\d+]/g, ''))}" style="color:#141519;text-decoration:none">${esc(sigPhone)}</a> · <a href="mailto:${esc(sigMail)}" style="color:#141519;text-decoration:none">${esc(sigMail)}</a></p>
    </div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">Caradvance GmbH</b> · Bgm-Graf-Ring 21 · D-82538 Geretsried · ${T.country}<br>Amtsgericht München, HRB 151009 · USt-IdNr.: DE232664616<br>${T.rep}</div>
  </div></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CUSTOMER_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>', to: [contact.email], reply_to: replyTo, subject: subj + ' | CarAdvance', html })
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return { status: 'sent-' + lang };
}

function pick(obj, keys) {
  for (const k of keys) if (obj[k]) return String(obj[k]);
  return '';
}
function stripInternal(data) {
  const out = {};
  const skip = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token', 'mkt_consent']);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k)) continue;
    if (typeof v === 'object') continue;
    out[k] = v;
  }
  return out;
}
function flattenAttr(attr) {
  const out = {};
  for (const k of ['gclid', 'gbraid', 'wbraid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    if (attr[k]) out[k] = String(attr[k]);
  }
  if (attr.landing) out.belepo_oldal = String(attr.landing);
  if (attr.referrer) out.hivatkozo = String(attr.referrer);
  return out;
}
function normalizePhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('06')) d = '36' + d.slice(2);
  if (d.length === 9 && /^(20|30|31|50|70)/.test(d)) d = '36' + d;
  return d;
}
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s).trim().toLowerCase()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function describe(r) {
  if (r.status === 'fulfilled') return { ok: r.value.status === 'sent', status: r.value.status };
  return { ok: false, status: 'error' };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
