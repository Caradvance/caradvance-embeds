/**
 * Only real car photos reach the customer: dealer logos, banners, team photos, price boards and
 * text graphics are removed with a Workers AI vision model (binding `AI`).
 * Verdicts are cached per image URL. Without the binding nothing is removed and the listing is
 * marked unchecked, which blocks publishing (see engine.publishBlockers).
 */
import type { Env, Listing } from "./types";
import { cacheGet, cachePut } from "./am";

export const PHOTO_MODEL = "@cf/moondream/moondream3.1-9B-A2B";
const MAX_IMAGES = 12;
const QUESTION =
  "Is this a real photograph of a car or of part of a car (exterior, interior, seats, dashboard, steering wheel, wheels, boot or engine bay)? " +
  "Answer no if the image is mainly a logo, a banner, an advertisement, a text or price graphic, a document, a map, people or a building. Answer only yes or no.";

type Verdict = "car" | "other" | "error";

/** Smaller mobile.de rendition is enough for the check. */
function checkUrl(u: string) {
  return /classistatic\.de/.test(u) ? u.replace(/rule=mo-\d+\.jpg/, "rule=mo-640.jpg") : u;
}

async function verdict(env: Env, url: string): Promise<Verdict> {
  const key = "photo:" + url.replace(/\?.*$/, "");
  const hit = await cacheGet<{ v: Verdict }>(env, key);
  if (hit) return hit.v;
  try {
    const r = await ask(env, url);
    const a = String(r?.answer ?? r?.response ?? r?.result?.answer ?? "").trim().toLowerCase();
    const v: Verdict = /^(yes|igen|ja)\b/.test(a) ? "car" : /^(no|nem|nein)\b/.test(a) ? "other" : "error";
    if (v === "error") lastPhotoError = "unexpected answer: " + JSON.stringify(r).slice(0, 300);
    if (v !== "error") await cachePut(env, key, { v }, 60 * 60 * 24 * 90);
    return v;
  } catch (e: any) {
    lastPhotoError = String(e?.message || e).slice(0, 300);
    return "error";
  }
}

export let lastPhotoError = "";

/** The model fetches public URLs itself; if the image host refuses it, the bytes are sent as a data URI. */
async function ask(env: Env, url: string): Promise<any> {
  const ai = env.AI as { run(model: string, input: unknown): Promise<any> };
  const input = (image: string) => ({ task: "query", image, question: QUESTION, reasoning: false, temperature: 0, max_tokens: 5 });
  try {
    return await ai.run(PHOTO_MODEL, input(checkUrl(url)));
  } catch (first) {
    const res = await fetch(checkUrl(url), { headers: { "User-Agent": "Mozilla/5.0 (Caradvance Ajanlatmotor)", Accept: "image/*", Referer: "https://suchen.mobile.de/" } });
    if (!res.ok) throw new Error(`model: ${String((first as any)?.message || first).slice(0, 150)} · image fetch ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return await ai.run(PHOTO_MODEL, input(`data:${res.headers.get("content-type") || "image/jpeg"};base64,${btoa(bin)}`));
  }
}

/** Raw model call for diagnostics (test environment only). */
export async function debugPhoto(env: Env, url: string) {
  try {
    const ai = env.AI as { run(model: string, input: unknown): Promise<any> };
    let direct: any;
    try { direct = await ai.run(PHOTO_MODEL, { task: "query", image: checkUrl(url), question: QUESTION, reasoning: false, temperature: 0, max_tokens: 5 }); }
    catch (e: any) { direct = { error: String(e?.message || e) }; }
    return { ok: true, direct, viaAsk: await ask(env, url).catch((e: any) => ({ error: String(e?.message || e) })) };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export interface PhotoCheck { images: string[]; removed: string[]; checked: boolean }

export async function filterCarPhotos(env: Env, images: string[]): Promise<PhotoCheck> {
  if (!env.AI || !images.length) return { images, removed: [], checked: false };
  const head = images.slice(0, MAX_IMAGES);
  const verdicts = await Promise.all(head.map((u) => verdict(env, u)));
  const keep = head.filter((_, i) => verdicts[i] !== "other");
  const removed = head.filter((_, i) => verdicts[i] === "other");
  // a failed check keeps the image but the listing counts as unchecked
  const checked = !verdicts.includes("error");
  return { images: keep.length ? keep : [], removed, checked };
}

/** Returns a copy of the listing with only car photos and the check flag set. */
export async function withCarPhotos(env: Env, l: Listing): Promise<Listing & { photos_checked?: boolean; photos_removed?: number }> {
  if (l.url.startsWith("mock://")) return { ...l, photos_checked: true, photos_removed: 0 };
  const r = await filterCarPhotos(env, l.images);
  return { ...l, images: r.images, photos_checked: r.checked, photos_removed: r.removed.length };
}
