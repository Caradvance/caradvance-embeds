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

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: 'Szerver hiba', detail: String(e && e.message || e) }, 500);
  }
}
