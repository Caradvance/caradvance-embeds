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
 *   META_PIXEL_ID        — a pixel azonosítója                          (opcionális)
 *   META_CAPI_TOKEN      — Conversions API token                        (opcionális, TITKOS)
 *   META_TEST_CODE       — csak teszteléshez, Events Manager → Test events
 *
 * Titok soha nem kerül a válaszba és nem jut ki a böngészőbe.
 */

const MAX_BODY = 64 * 1024;
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
    fbp: String(data.fbp || ''),
    fbc: String(data.fbc || ''),
    attr: data.ca_attr && typeof data.ca_attr === 'object' ? data.ca_attr : {},
    received_at: new Date().toISOString()
  };

  // A továbbítandó rekord: az űrlap minden mezője + a kampányadatok.
  const record = { ...stripInternal(data), ...flattenAttr(meta.attr), event_id: meta.event_id, beerkezett: meta.received_at, forras_oldal: meta.page };

  // Captcha-ellenőrzés még a kézbesítés előtt, hogy robot ne kerüljön a Notionbe.
  const guard = await verifyTurnstile(env, data.turnstile_token, meta.ip);
  if (guard.blocked) {
    return json({ ok: false, error: 'captcha_failed' }, 403);
  }

  const results = await Promise.allSettled([
    createNotionLead(env, data, contact, meta),
    sendEmail(env, record, contact),
    forwardWebhook(env, record),
    sendMetaCapi(env, contact, meta)
  ]);

  const [notion, mail, hook, capi] = results.map(describe);
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
    capi: capi.status
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
    'Címkék': { multi_select: [{ name: 'Autóimport' }] },
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
  const skip = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token']);
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

async function sendEmail(env, record, contact) {
  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL_TO) return { status: 'skipped' };
  const rows = Object.entries(record)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`)
    .join('');
  const title = [contact.name || contact.company, contact.phone, contact.email].filter(Boolean).join(' · ');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.LEAD_EMAIL_FROM || 'CarAdvance <lead@caradvance.hu>',
      to: String(env.LEAD_EMAIL_TO).split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: contact.email || undefined,
      subject: 'Új import-érdeklődés — ' + (title || 'weboldal'),
      html: `<div style="font:14px/1.5 Arial,sans-serif;color:#111">
        <h2 style="margin:0 0 4px">Új import-érdeklődés</h2>
        <p style="margin:0 0 14px;color:#666">Válaszidő-vállalás: <b>1 óra munkaidőben</b>.</p>
        <table style="border-collapse:collapse">${rows}</table></div>`
    })
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return { status: 'sent' };
}

async function sendMetaCapi(env, contact, meta) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return { status: 'skipped' };
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

function pick(obj, keys) {
  for (const k of keys) if (obj[k]) return String(obj[k]);
  return '';
}
function stripInternal(data) {
  const out = {};
  const skip = new Set(['event_id', 'ca_attr', 'fbp', 'fbc', 'page', 'user_agent', 'website', 'url_field', 'turnstile_token']);
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
