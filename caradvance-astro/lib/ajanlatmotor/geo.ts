import type { Env, Listing } from "./types";
import type { RateConfig } from "./rates";
import { cacheGet, cachePut, DEPOT } from "./am";

export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road distance seller → depot. OpenRouteService when a key is set, otherwise haversine × 1.25. */
export async function distanceToDepot(env: Env, l: Listing): Promise<{ km: number; method: "ors" | "estimate"; fallback: boolean }> {
  const depot: [number, number] = [DEPOT.lat, DEPOT.lon];
  const lat = l.seller.lat, lon = l.seller.lon;
  if (lat == null || lon == null) return { km: 900, method: "estimate", fallback: true };
  const key = `dist:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = await cacheGet<{ km: number; method: "ors" }>(env, key);
  if (cached) return { ...cached, fallback: false };
  if (env.ORS_API_KEY) {
    try {
      const r = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: { Authorization: env.ORS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: [[lon, lat], [depot[1], depot[0]]] }),
      });
      if (r.ok) {
        const j: any = await r.json();
        const km = Math.round(j.routes[0].summary.distance / 1000);
        await cachePut(env, key, { km, method: "ors" }, 60 * 60 * 24 * 90);
        return { km, method: "ors", fallback: false };
      }
    } catch { /* fall through */ }
  }
  return { km: Math.round(haversineKm([lat, lon], depot) * 1.25), method: "estimate", fallback: true };
}

/** EUR→HUF (ECB via Frankfurter), cached 36 h in am_cache; the intake Worker refreshes it at 08:00 Budapest. */
export async function getFx(env: Env, rates: RateConfig): Promise<{ rate: number; date: string; fallback: boolean }> {
  const cur = await cacheGet<{ rate: number; date: string }>(env, "fx:EURHUF");
  if (cur) return { ...cur, fallback: false };
  const fresh = await refreshFx(env);
  if (fresh) return { ...fresh, fallback: false };
  return { rate: rates.fx_fallback.v, date: "tartalék", fallback: true };
}

export async function refreshFx(env: Env): Promise<{ rate: number; date: string } | null> {
  const urls = [
    "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF",
    "https://api.frankfurter.app/latest?from=EUR&to=HUF",
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { Accept: "application/json" } });
      if (!r.ok) continue;
      const j: any = await r.json();
      const rate = Number(j?.rates?.HUF);
      if (rate > 200 && rate < 700) {
        const v = { rate, date: String(j.date) };
        await cachePut(env, "fx:EURHUF", v, 60 * 60 * 36);
        await cachePut(env, "fx:EURHUF:lastgood", v);
        return v;
      }
    } catch { /* try next */ }
  }
  const last = await cacheGet<{ rate: number; date: string }>(env, "fx:EURHUF:lastgood");
  return last;
}
