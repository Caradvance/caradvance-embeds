// CarAdvance /belso auth + data API
// Route: www.caradvance.hu/api/belso/*
// D1 binding name expected: DB

const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000;
const KEY_LEN = 32;

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}
function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomHex(nBytes) {
  const arr = new Uint8Array(nBytes);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

async function pbkdf2Hex(password, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER }, keyMaterial, KEY_LEN * 8);
  return bytesToHex(new Uint8Array(bits));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach(p => {
    const idx = p.indexOf('=');
    if (idx === -1) return;
    out[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
  });
  return out;
}

function sessionCookieHeader(token, maxAgeSeconds) {
  return `ca_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
function clearSessionCookieHeader() {
  return `ca_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function getSessionUser(request, env) {
  const cookies = parseCookies(request);
  const token = cookies['ca_session'];
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  ).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at + 'Z').getTime() < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

// ---------- Auth ----------

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) return json({ error: 'Hiányzó email vagy jelszó.' }, 400);

  const user = await env.DB.prepare(
    `SELECT id, email, name, role, salt_hex, hash_hex FROM users WHERE email = ?`
  ).bind(email).first();
  if (!user) return json({ error: 'Hibás e-mail vagy jelszó.' }, 401);

  const computedHex = await pbkdf2Hex(password, user.salt_hex);
  if (!timingSafeEqual(computedHex, user.hash_hex)) {
    return json({ error: 'Hibás e-mail vagy jelszó.' }, 401);
  }

  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString().slice(0, 19);
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(token, user.id, expiresAt).run();

  return json({ user: publicUser(user) }, 200, {
    'Set-Cookie': sessionCookieHeader(token, SESSION_DAYS * 86400)
  });
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request);
  const token = cookies['ca_session'];
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookieHeader() });
}

async function handleMe(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  return json({ user });
}

// ---------- Deals ----------

async function handleGetDeals(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const rows = user.role === 'admin'
    ? await env.DB.prepare(`SELECT * FROM deals ORDER BY id DESC`).all()
    : await env.DB.prepare(`SELECT * FROM deals WHERE assigned_to = ? ORDER BY id DESC`).bind(user.id).all();
  return json({ deals: rows.results });
}

async function handleCreateDeal(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const b = await request.json().catch(() => ({}));
  const assignedTo = user.role === 'admin' ? (b.assigned_to ?? null) : user.id;
  const res = await env.DB.prepare(
    `INSERT INTO deals (line,stage,ch,name,phone,email,car,price,note,when_text,assigned_to)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    b.line || '', b.stage || '', b.ch || 'Kézi', b.name || '', b.phone || '', b.email || '',
    b.car || '', b.price || 0, b.note || '', b.when_text || 'most', assignedTo
  ).run();
  return json({ id: res.meta.last_row_id });
}

async function handleUpdateDeal(request, env, id) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const deal = await env.DB.prepare(`SELECT * FROM deals WHERE id = ?`).bind(id).first();
  if (!deal) return json({ error: 'Nem található.' }, 404);
  if (user.role !== 'admin' && deal.assigned_to !== user.id) return json({ error: 'Nincs jogosultság.' }, 403);

  const b = await request.json().catch(() => ({}));
  const fields = ['stage', 'note', 'price', 'car', 'name', 'phone', 'email'];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(b, f)) { sets.push(`${f} = ?`); vals.push(b[f]); }
  }
  if (user.role === 'admin' && Object.prototype.hasOwnProperty.call(b, 'assigned_to')) {
    sets.push('assigned_to = ?'); vals.push(b.assigned_to);
  }
  if (!sets.length) return json({ ok: true });
  vals.push(id);
  await env.DB.prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

// ---------- Geocode (distance from Budapest for import candidates) ----------
// Nominatim (OpenStreetMap) lookup runs server-side so we can send a proper
// identifying User-Agent (required by Nominatim's usage policy) and keep the
// caradvance-mobilede-extension itself free of any external API host
// permissions — it only needs to read the listing's postal code / country
// off the page. Requires a logged-in session but no particular role.
const BUDAPEST_LAT = 47.4979;
const BUDAPEST_LON = 19.0402;
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
async function handleGeocode(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const url = new URL(request.url);
  const postal = (url.searchParams.get('postal') || '').trim();
  const country = (url.searchParams.get('country') || 'DE').trim().toLowerCase();
  const q = (url.searchParams.get('q') || '').trim();
  if (!postal && !q) return json({ error: 'Hiányzó cím.' }, 400);

  const params = new URLSearchParams({ format: 'json', limit: '1' });
  if (postal) { params.set('postalcode', postal); params.set('country', country); }
  else { params.set('q', q); }

  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'CarAdvance-CRM/1.0 (info@caradvance.hu, internal import tool)',
        'Accept-Language': 'hu,de,en'
      }
    });
    if (!resp.ok) return json({ error: 'Geokódolás sikertelen.' }, 502);
    const rows = await resp.json().catch(() => []);
    if (!rows || !rows.length) return json({ error: 'Cím nem található.' }, 404);
    const lat = parseFloat(rows[0].lat), lon = parseFloat(rows[0].lon);
    const distanceKm = Math.round(haversineKm(BUDAPEST_LAT, BUDAPEST_LON, lat, lon));
    return json({ lat, lon, distanceKm });
  } catch (e) {
    return json({ error: 'Geokódolási hiba.' }, 502);
  }
}

// ---------- Clients ----------

async function handleGetClients(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const rows = user.role === 'admin'
    ? await env.DB.prepare(`SELECT * FROM clients ORDER BY id DESC`).all()
    : await env.DB.prepare(`SELECT * FROM clients WHERE assigned_to = ? ORDER BY id DESC`).bind(user.id).all();
  return json({ clients: rows.results });
}

async function handleCreateClient(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const b = await request.json().catch(() => ({}));
  const assignedTo = user.role === 'admin' ? (b.assigned_to ?? null) : user.id;
  const res = await env.DB.prepare(
    `INSERT INTO clients (name,type,phone,email,country,assigned_to) VALUES (?,?,?,?,?,?)`
  ).bind(b.name || '', b.type || '', b.phone || '', b.email || '', b.country || 'Magyarország', assignedTo).run();
  return json({ id: res.meta.last_row_id });
}

async function handleUpdateClient(request, env, id) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const client = await env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(id).first();
  if (!client) return json({ error: 'Nem található.' }, 404);
  if (user.role !== 'admin' && client.assigned_to !== user.id) return json({ error: 'Nincs jogosultság.' }, 403);

  const b = await request.json().catch(() => ({}));
  const fields = ['name', 'type', 'phone', 'email', 'country'];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(b, f)) { sets.push(`${f} = ?`); vals.push(b[f]); }
  }
  if (user.role === 'admin' && Object.prototype.hasOwnProperty.call(b, 'assigned_to')) {
    sets.push('assigned_to = ?'); vals.push(b.assigned_to);
  }
  if (!sets.length) return json({ ok: true });
  vals.push(id);
  await env.DB.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

// ---------- Todos ----------

async function handleGetTodos(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const rows = user.role === 'admin'
    ? await env.DB.prepare(`SELECT * FROM todos ORDER BY id DESC`).all()
    : await env.DB.prepare(`SELECT * FROM todos WHERE assigned_to = ? OR assigned_to IS NULL ORDER BY id DESC`).bind(user.id).all();
  return json({ todos: rows.results });
}

async function handleCreateTodo(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const b = await request.json().catch(() => ({}));
  const assignedTo = user.role === 'admin' ? (b.assigned_to ?? null) : user.id;
  const res = await env.DB.prepare(`INSERT INTO todos (t,done,assigned_to) VALUES (?,0,?)`)
    .bind(b.t || '', assignedTo).run();
  return json({ id: res.meta.last_row_id });
}

async function handleUpdateTodo(request, env, id) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const todo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(id).first();
  if (!todo) return json({ error: 'Nem található.' }, 404);
  if (user.role !== 'admin' && todo.assigned_to !== null && todo.assigned_to !== user.id) {
    return json({ error: 'Nincs jogosultság.' }, 403);
  }
  const b = await request.json().catch(() => ({}));
  await env.DB.prepare(`UPDATE todos SET done = ? WHERE id = ?`).bind(b.done ? 1 : 0, id).run();
  return json({ ok: true });
}

async function handleDeleteTodo(request, env, id) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Nincs bejelentkezve.' }, 401);
  const todo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(id).first();
  if (!todo) return json({ error: 'Nem található.' }, 404);
  if (user.role !== 'admin' && todo.assigned_to !== null && todo.assigned_to !== user.id) {
    return json({ error: 'Nincs jogosultság.' }, 403);
  }
  await env.DB.prepare(`DELETE FROM todos WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

// ---------- Admin: user management ----------

async function requireAdmin(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return { error: json({ error: 'Nincs bejelentkezve.' }, 401) };
  if (user.role !== 'admin') return { error: json({ error: 'Csak admin jogosultsággal.' }, 403) };
  return { user };
}

async function handleAdminListUsers(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const rows = await env.DB.prepare(`SELECT id, email, name, role, created_at FROM users ORDER BY id`).all();
  return json({ users: rows.results });
}

async function handleAdminCreateUser(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const b = await request.json().catch(() => ({}));
  const email = (b.email || '').trim().toLowerCase();
  const name = b.name || '';
  const role = b.role === 'admin' ? 'admin' : 'sales_manager';
  const password = b.password || '';
  if (!email || !name || !password) return json({ error: 'Hiányzó adat.' }, 400);

  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
  if (existing) return json({ error: 'Ez az e-mail már foglalt.' }, 409);

  const saltHex = randomHex(16);
  const hashHex = await pbkdf2Hex(password, saltHex);
  const res = await env.DB.prepare(
    `INSERT INTO users (email, name, role, salt_hex, hash_hex) VALUES (?,?,?,?,?)`
  ).bind(email, name, role, saltHex, hashHex).run();
  return json({ id: res.meta.last_row_id });
}

async function handleAdminResetPassword(request, env, id) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const b = await request.json().catch(() => ({}));
  const password = b.password || '';
  if (!password || password.length < 8) return json({ error: 'A jelszó legyen legalább 8 karakter.' }, 400);
  const saltHex = randomHex(16);
  const hashHex = await pbkdf2Hex(password, saltHex);
  await env.DB.prepare(`UPDATE users SET salt_hex = ?, hash_hex = ? WHERE id = ?`)
    .bind(saltHex, hashHex, id).run();
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id).run();
  return json({ ok: true });
}

async function handleAdminDeleteUser(request, env, id) {
  const { error, user } = await requireAdmin(request, env);
  if (error) return error;
  if (String(user.id) === String(id)) return json({ error: 'Saját fiók nem törölhető.' }, 400);
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id).run();
  await env.DB.prepare(`UPDATE deals SET assigned_to = NULL WHERE assigned_to = ?`).bind(id).run();
  await env.DB.prepare(`UPDATE clients SET assigned_to = NULL WHERE assigned_to = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

async function handleAdminAssign(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const b = await request.json().catch(() => ({}));
  const type = b.type;
  const id = b.id;
  const assignedTo = b.assigned_to === '' || b.assigned_to == null ? null : b.assigned_to;
  if (!['deal', 'client'].includes(type) || !id) return json({ error: 'Hibás kérés.' }, 400);
  const table = type === 'deal' ? 'deals' : 'clients';
  await env.DB.prepare(`UPDATE ${table} SET assigned_to = ? WHERE id = ?`).bind(assignedTo, id).run();
  return json({ ok: true });
}

// ---------- OAuth integrations (Gmail / Outlook / Google Calendar) ----------
// Requires Cloudflare Pages encrypted env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID. Until those are set, the /oauth/* and
// /mail and /calendar endpoints return a clear "not configured" error instead of failing oddly.

function oauthStateCookie(state) {
  return `ca_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}
function clearOauthStateCookie() {
  return `ca_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function ensureFreshToken(env, account) {
  const now = Date.now();
  const expiresAt = account.expires_at ? new Date(account.expires_at + 'Z').getTime() : 0;
  if (expiresAt - now > 60000) return account.access_token;
  if (account.provider === 'google') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token, grant_type: 'refresh_token'
      })
    });
    const j = await res.json();
    if (!res.ok) throw new Error('Google token megújítás sikertelen: ' + JSON.stringify(j));
    const newExpires = new Date(Date.now() + (j.expires_in || 3600) * 1000).toISOString().slice(0, 19);
    await env.DB.prepare(`UPDATE oauth_accounts SET access_token = ?, expires_at = ? WHERE id = ?`)
      .bind(j.access_token, newExpires, account.id).run();
    return j.access_token;
  }
  if (account.provider === 'microsoft') {
    const res = await fetch(`https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET,
        refresh_token: account.refresh_token, grant_type: 'refresh_token',
        scope: 'offline_access Mail.Read Calendars.Read User.Read'
      })
    });
    const j = await res.json();
    if (!res.ok) throw new Error('Microsoft token megújítás sikertelen: ' + JSON.stringify(j));
    const newExpires = new Date(Date.now() + (j.expires_in || 3600) * 1000).toISOString().slice(0, 19);
    if (j.refresh_token) {
      await env.DB.prepare(`UPDATE oauth_accounts SET access_token = ?, refresh_token = ?, expires_at = ? WHERE id = ?`)
        .bind(j.access_token, j.refresh_token, newExpires, account.id).run();
    } else {
      await env.DB.prepare(`UPDATE oauth_accounts SET access_token = ?, expires_at = ? WHERE id = ?`)
        .bind(j.access_token, newExpires, account.id).run();
    }
    return j.access_token;
  }
  throw new Error('Ismeretlen szolgáltató.');
}

async function handleGoogleStart(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'A Google integráció nincs beállítva (hiányzó GOOGLE_CLIENT_ID).' }, 500);
  const state = randomHex(16);
  const redirectUri = new URL(request.url).origin + '/api/belso/oauth/google/callback';
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${state}`;
  return new Response(null, { status: 302, headers: { Location: authUrl, 'Set-Cookie': oauthStateCookie(state) } });
}

async function handleGoogleCallback(request, env) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== 'admin') return json({ error: 'Csak admin jogosultsággal.' }, 403);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request);
  if (!code || !state || state !== cookies['ca_oauth_state']) return json({ error: 'Érvénytelen OAuth állapot.' }, 400);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: 'A Google integráció nincs beállítva.' }, 500);
  const redirectUri = url.origin + '/api/belso/oauth/google/callback';
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  });
  const tokenJ = await tokenRes.json();
  if (!tokenRes.ok) return json({ error: 'Google token csere sikertelen.', detail: tokenJ }, 500);
  const uiRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + tokenJ.access_token } });
  const uiJ = await uiRes.json();
  const email = (uiJ.email || '').toLowerCase();
  if (!email) return json({ error: 'Nem sikerült lekérni az e-mail címet.' }, 500);
  const expiresAt = new Date(Date.now() + (tokenJ.expires_in || 3600) * 1000).toISOString().slice(0, 19);
  const existing = await env.DB.prepare(`SELECT id, refresh_token FROM oauth_accounts WHERE provider = 'google' AND email = ?`).bind(email).first();
  const refreshToken = tokenJ.refresh_token || (existing && existing.refresh_token) || null;
  if (existing) {
    await env.DB.prepare(`UPDATE oauth_accounts SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?, connected_by = ? WHERE id = ?`)
      .bind(tokenJ.access_token, refreshToken, expiresAt, tokenJ.scope || '', user.id, existing.id).run();
  } else {
    await env.DB.prepare(`INSERT INTO oauth_accounts (provider,email,access_token,refresh_token,expires_at,scope,connected_by) VALUES ('google',?,?,?,?,?,?)`)
      .bind(email, tokenJ.access_token, refreshToken, expiresAt, tokenJ.scope || '', user.id).run();
  }
  return new Response(null, { status: 302, headers: { Location: '/belso/?integracio=google_ok', 'Set-Cookie': clearOauthStateCookie() } });
}

async function handleMicrosoftStart(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  if (!env.MS_CLIENT_ID || !env.MS_TENANT_ID) return json({ error: 'A Microsoft integráció nincs beállítva (hiányzó MS_CLIENT_ID / MS_TENANT_ID).' }, 500);
  const state = randomHex(16);
  const redirectUri = new URL(request.url).origin + '/api/belso/oauth/microsoft/callback';
  const scope = encodeURIComponent('offline_access Mail.Read Calendars.Read User.Read');
  const authUrl = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(env.MS_CLIENT_ID)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  return new Response(null, { status: 302, headers: { Location: authUrl, 'Set-Cookie': oauthStateCookie(state) } });
}

async function handleMicrosoftCallback(request, env) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== 'admin') return json({ error: 'Csak admin jogosultsággal.' }, 403);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request);
  if (!code || !state || state !== cookies['ca_oauth_state']) return json({ error: 'Érvénytelen OAuth állapot.' }, 400);
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET || !env.MS_TENANT_ID) return json({ error: 'A Microsoft integráció nincs beállítva.' }, 500);
  const redirectUri = url.origin + '/api/belso/oauth/microsoft/callback';
  const tokenRes = await fetch(`https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code', scope: 'offline_access Mail.Read Calendars.Read User.Read' })
  });
  const tokenJ = await tokenRes.json();
  if (!tokenRes.ok) return json({ error: 'Microsoft token csere sikertelen.', detail: tokenJ }, 500);
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: 'Bearer ' + tokenJ.access_token } });
  const meJ = await meRes.json();
  const email = (meJ.mail || meJ.userPrincipalName || '').toLowerCase();
  if (!email) return json({ error: 'Nem sikerült lekérni az e-mail címet.' }, 500);
  const expiresAt = new Date(Date.now() + (tokenJ.expires_in || 3600) * 1000).toISOString().slice(0, 19);
  const existing = await env.DB.prepare(`SELECT id, refresh_token FROM oauth_accounts WHERE provider = 'microsoft' AND email = ?`).bind(email).first();
  const refreshToken = tokenJ.refresh_token || (existing && existing.refresh_token) || null;
  if (existing) {
    await env.DB.prepare(`UPDATE oauth_accounts SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?, connected_by = ? WHERE id = ?`)
      .bind(tokenJ.access_token, refreshToken, expiresAt, tokenJ.scope || '', user.id, existing.id).run();
  } else {
    await env.DB.prepare(`INSERT INTO oauth_accounts (provider,email,access_token,refresh_token,expires_at,scope,connected_by) VALUES ('microsoft',?,?,?,?,?,?)`)
      .bind(email, tokenJ.access_token, refreshToken, expiresAt, tokenJ.scope || '', user.id).run();
  }
  return new Response(null, { status: 302, headers: { Location: '/belso/?integracio=microsoft_ok', 'Set-Cookie': clearOauthStateCookie() } });
}

async function handleListIntegrations(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const rows = await env.DB.prepare(`SELECT id, provider, email, created_at FROM oauth_accounts ORDER BY id`).all();
  return json({ accounts: rows.results });
}

async function handleDeleteIntegration(request, env, id) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  await env.DB.prepare(`DELETE FROM oauth_accounts WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

async function handleGetMail(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const accounts = (await env.DB.prepare(`SELECT * FROM oauth_accounts WHERE provider IN ('google','microsoft')`).all()).results;
  if (!accounts.length) return json({ mail: [], connected: [] });
  const all = [];
  for (const acc of accounts) {
    try {
      const token = await ensureFreshToken(env, acc);
      if (acc.provider === 'google') {
        const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX', { headers: { Authorization: 'Bearer ' + token } });
        const listJ = await listRes.json();
        if (!listRes.ok) throw new Error('Gmail lista hiba: ' + JSON.stringify(listJ));
        for (const m of (listJ.messages || [])) {
          const mr = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: { Authorization: 'Bearer ' + token } });
          const mj = await mr.json();
          const headers = {};
          ((mj.payload && mj.payload.headers) || []).forEach(h => { headers[h.name] = h.value; });
          all.push({ account: acc.email, provider: 'google', id: m.id, from: headers.From || '', subject: headers.Subject || '(nincs tárgy)', snippet: mj.snippet || '', date: headers.Date || '' });
        }
      } else if (acc.provider === 'microsoft') {
        const listRes = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=20&$select=from,subject,bodyPreview,receivedDateTime', { headers: { Authorization: 'Bearer ' + token } });
        const listJ = await listRes.json();
        if (!listRes.ok) throw new Error('Outlook lista hiba: ' + JSON.stringify(listJ));
        (listJ.value || []).forEach(m => {
          all.push({ account: acc.email, provider: 'microsoft', id: m.id, from: (m.from && m.from.emailAddress && m.from.emailAddress.address) || '', subject: m.subject || '(nincs tárgy)', snippet: m.bodyPreview || '', date: m.receivedDateTime || '' });
        });
      }
    } catch (e) {
      all.push({ account: acc.email, provider: acc.provider, error: String((e && e.message) || e) });
    }
  }
  all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return json({ mail: all, connected: accounts.map(a => ({ provider: a.provider, email: a.email })) });
}

async function handleGetCalendar(request, env) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const accounts = (await env.DB.prepare(`SELECT * FROM oauth_accounts WHERE provider = 'google'`).all()).results;
  if (!accounts.length) return json({ events: [], connected: [] });
  const events = [];
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
  for (const acc of accounts) {
    try {
      const token = await ensureFreshToken(env, acc);
      const calUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const r = await fetch(calUrl, { headers: { Authorization: 'Bearer ' + token } });
      const j = await r.json();
      if (!r.ok) throw new Error('Calendar hiba: ' + JSON.stringify(j));
      (j.items || []).forEach(ev => {
        events.push({
          account: acc.email, id: ev.id, summary: ev.summary || '(nincs cím)',
          start: (ev.start && (ev.start.dateTime || ev.start.date)) || '',
          end: (ev.end && (ev.end.dateTime || ev.end.date)) || '',
          allDay: !!(ev.start && ev.start.date)
        });
      });
    } catch (e) {
      events.push({ account: acc.email, error: String((e && e.message) || e) });
    }
  }
  events.sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));
  return json({ events, connected: accounts.map(a => ({ provider: a.provider, email: a.email })) });
}

// ---------- Router (Cloudflare Pages Function) ----------

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  let path = url.pathname;
  const prefix = '/api/belso';
  if (path.startsWith(prefix)) path = path.slice(prefix.length) || '/';
  const method = request.method;

  try {
      if (path === '/login' && method === 'POST') return await handleLogin(request, env);
      if (path === '/logout' && method === 'POST') return await handleLogout(request, env);
      if (path === '/me' && method === 'GET') return await handleMe(request, env);

      if (path === '/deals' && method === 'GET') return await handleGetDeals(request, env);
      if (path === '/deals' && method === 'POST') return await handleCreateDeal(request, env);
      let m = path.match(/^\/deals\/(\d+)$/);
      if (m && method === 'PATCH') return await handleUpdateDeal(request, env, m[1]);

      if (path === '/clients' && method === 'GET') return await handleGetClients(request, env);
      if (path === '/clients' && method === 'POST') return await handleCreateClient(request, env);
      m = path.match(/^\/clients\/(\d+)$/);
      if (m && method === 'PATCH') return await handleUpdateClient(request, env, m[1]);

      if (path === '/todos' && method === 'GET') return await handleGetTodos(request, env);
      if (path === '/todos' && method === 'POST') return await handleCreateTodo(request, env);
      m = path.match(/^\/todos\/(\d+)$/);
      if (m && method === 'PATCH') return await handleUpdateTodo(request, env, m[1]);
      if (m && method === 'DELETE') return await handleDeleteTodo(request, env, m[1]);

      if (path === '/admin/users' && method === 'GET') return await handleAdminListUsers(request, env);
      if (path === '/admin/users' && method === 'POST') return await handleAdminCreateUser(request, env);
      m = path.match(/^\/admin\/users\/(\d+)\/reset-password$/);
      if (m && method === 'POST') return await handleAdminResetPassword(request, env, m[1]);
      m = path.match(/^\/admin\/users\/(\d+)$/);
      if (m && method === 'DELETE') return await handleAdminDeleteUser(request, env, m[1]);
      if (path === '/admin/assign' && method === 'POST') return await handleAdminAssign(request, env);

      if (path === '/oauth/google/start' && method === 'GET') return await handleGoogleStart(request, env);
      if (path === '/oauth/google/callback' && method === 'GET') return await handleGoogleCallback(request, env);
      if (path === '/oauth/microsoft/start' && method === 'GET') return await handleMicrosoftStart(request, env);
      if (path === '/oauth/microsoft/callback' && method === 'GET') return await handleMicrosoftCallback(request, env);
      if (path === '/integrations' && method === 'GET') return await handleListIntegrations(request, env);
      m = path.match(/^\/integrations\/(\d+)$/);
      if (m && method === 'DELETE') return await handleDeleteIntegration(request, env, m[1]);
      if (path === '/mail' && method === 'GET') return await handleGetMail(request, env);
      if (path === '/calendar' && method === 'GET') return await handleGetCalendar(request, env);

      if (path === '/geocode' && method === 'GET') return await handleGeocode(request, env);

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba', detail: String(e && e.message || e) }, 500);
  }
}
