/** CarAdvance — közös ország/munkatársi-süti ellenőrzés (middleware + /api/sheet). */
export const PRICE_COUNTRIES = new Set(['HU', 'US']);
export const T_HASH = '28004958fcb7c6f1faa0a117fcbed939b6b179d8bed59bac59fc8881c0f6c9f1'; // sha256(kód)
const K_HASH = 'c01599517cb081668c4d7693c5c1c87c3dd2ea3344dbebf8b2b684d0a58f3ea3'; // sha256(sha256(kód+'|cookie'))
export const COOKIE = 'ca_pv';

export async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

export async function priceAllowed(request) {
  const country = (request.cf && request.cf.country) || '';
  if (PRICE_COUNTRIES.has(country)) return true;
  const ck = getCookie(request, COOKIE);
  return !!ck && (await sha(ck)) === K_HASH;
}

