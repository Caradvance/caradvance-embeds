// CarAdvance — kis QR-kód kódoló (bájt mód, M hibajavítási szint, 1–13. verzió) a díjbekérők EPC (GiroCode) kódjához.
// Visszatérés: négyzetes logikai mátrix (true = sötét modul).

// M szint: [hibajavító bájt / blokk, [blokkok száma, adatbájt / blokk], …]
const ECM = [null,
  [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]], [16, [4, 27]], [18, [4, 31]],
  [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]], [30, [1, 50], [4, 51]], [22, [6, 36], [2, 37]], [22, [8, 37], [1, 38]]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62]];
const REM = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0];

// GF(256), primitív polinom 0x11d
const EXP = new Array(512), LOG = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const gmul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const r = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { r[j] ^= g[j]; r[j + 1] ^= gmul(g[j], EXP[i]); } g = r; } return g; }
function rsEc(data, n) {
  const g = rsGen(n); const r = new Array(n).fill(0);
  for (const b of data) { const f = b ^ r[0]; r.shift(); r.push(0); if (f) for (let j = 0; j < n; j++) r[j] ^= gmul(g[j + 1], f); }
  return r;
}
const dataCap = (v) => ECM[v].slice(1).reduce((a, [n, k]) => a + n * k, 0);

function utf8(s) { return Array.from(new TextEncoder().encode(String(s))); }

export function qrMatrix(text) {
  const bytes = utf8(text);
  let v = 1; for (; v < ECM.length; v++) if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= dataCap(v) * 8) break;
  if (v >= ECM.length) throw new Error('QR: túl hosszú adat');
  // bitfolyam
  const bits = []; const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); for (const b of bytes) put(b, 8);
  const cap = dataCap(v) * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let p = 0; data.length < dataCap(v); p++) data.push(p % 2 ? 0x11 : 0xec);
  // blokkok + hibajavítás, összefésülés
  const ecn = ECM[v][0]; const blocks = []; let off = 0;
  for (const [n, k] of ECM[v].slice(1)) for (let i = 0; i < n; i++) { const d = data.slice(off, off + k); off += k; blocks.push({ d, e: rsEc(d, ecn) }); }
  const cw = []; const maxK = Math.max(...blocks.map((b) => b.d.length));
  for (let i = 0; i < maxK; i++) for (const b of blocks) if (i < b.d.length) cw.push(b.d[i]);
  for (let i = 0; i < ecn; i++) for (const b of blocks) cw.push(b.e[i]);
  const stream = []; for (const c of cw) for (let i = 7; i >= 0; i--) stream.push((c >>> i) & 1); for (let i = 0; i < REM[v]; i++) stream.push(0);

  const N = 17 + 4 * v;
  const M = Array.from({ length: N }, () => new Array(N).fill(false));
  const F = Array.from({ length: N }, () => new Array(N).fill(false)); // funkciómodul (nem maszkolható)
  const set = (r, c, on) => { M[r][c] = !!on; F[r][c] = true; };
  const finder = (r0, c0) => { for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) { const rr = r0 + r, cc = c0 + c; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue; const on = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)); set(rr, cc, on); } };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
  for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = ALIGN[v];
  const last = al.length - 1;
  al.forEach((r, ri) => al.forEach((c, ci) => { if ((ri === 0 && ci === 0) || (ri === 0 && ci === last) || (ri === last && ci === 0)) return; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }));
  set(4 * v + 9, 8, true); // sötét modul
  // formátum- és verzióinformáció helyének lefoglalása
  for (let i = 0; i < 9; i++) { if (!F[8][i]) set(8, i, false); if (!F[i][8]) set(i, 8, false); }
  for (let i = 0; i < 8; i++) { set(8, N - 1 - i, false); set(N - 1 - i, 8, false); }
  if (v >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { set(i, N - 11 + j, false); set(N - 11 + j, i, false); }
  // adatmodulok (cikcakk, jobbról balra, kéthasábos sávokban)
  let k = 0;
  for (let col = N - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < N; i++) {
      const up = ((col + 1) & 2) === 0; const r = up ? N - 1 - i : i;
      for (let j = 0; j < 2; j++) { const c = col - j; if (F[r][c]) continue; M[r][c] = k < stream.length ? !!stream[k] : false; k++; }
    }
  }
  const MASKS = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  const bch = (val, poly, len) => { let x = val << len; const deg = (p) => 31 - Math.clz32(p); while (deg(x) >= deg(poly)) x ^= poly << (deg(x) - deg(poly)); return (val << len) | x; };
  const place = (A, mask) => {
    const fmt = bch((0 << 3) | mask, 0x537, 10) ^ 0x5412; // M szint = 00
    const fb = (i) => ((fmt >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) A[i][8] = fb(i);
    A[7][8] = fb(6); A[8][8] = fb(7); A[8][7] = fb(8);
    for (let i = 9; i < 15; i++) A[8][14 - i] = fb(i);
    for (let i = 0; i < 8; i++) A[8][N - 1 - i] = fb(i);
    for (let i = 8; i < 15; i++) A[N - 15 + i][8] = fb(i);
    A[N - 8][8] = true;
    if (v >= 7) { const vb = bch(v, 0x1f25, 12); for (let i = 0; i < 18; i++) { const on = ((vb >>> i) & 1) === 1; const a = Math.floor(i / 3), b = N - 11 + (i % 3); A[a][b] = on; A[b][a] = on; } }
  };
  const penalty = (A) => {
    let p = 0;
    for (let r = 0; r < N; r++) for (const line of [A[r], A.map((row) => row[r])]) {
      let run = 1; for (let i = 1; i <= N; i++) { if (i < N && line[i] === line[i - 1]) run++; else { if (run >= 5) p += run - 2; run = 1; } }
      const s = line.map((x) => (x ? 1 : 0)).join('');
      p += 40 * ((s.match(/(?=10111010000|00001011101)/g) || []).length);
    }
    for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) { const x = A[r][c]; if (x === A[r][c + 1] && x === A[r + 1][c] && x === A[r + 1][c + 1]) p += 3; }
    let dark = 0; for (const row of A) for (const x of row) if (x) dark++;
    p += Math.floor(Math.abs(dark * 20 - N * N * 10) / (N * N)) * 10;
    return p;
  };
  let best = null, bestP = Infinity;
  for (let m = 0; m < 8; m++) {
    const A = M.map((row, r) => row.map((x, c) => (F[r][c] ? x : x !== MASKS[m](r, c))));
    place(A, m); const p = penalty(A); if (p < bestP) { bestP = p; best = A; }
  }
  return best;
}

/** EPC QR (GiroCode / SEPA-átutalás) tartalma. amount: EUR. */
export function epcPayload({ bic, name, iban, amount, text }) {
  const cut = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  return ['BCD', '002', '1', 'SCT', cut(bic, 11).replace(/\s/g, ''), cut(name, 70), String(iban || '').replace(/\s/g, '').toUpperCase().slice(0, 34),
    'EUR' + (Math.round(Number(amount) * 100) / 100).toFixed(2), '', '', cut(text, 140)].join('\n');
}
