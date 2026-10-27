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
    const ai = env.AI as { run(model: string, input: unknown): Promise<any> };
    const r = await ai.run(PHOTO_MODEL, { task: "query", image: checkUrl(url), question: QUESTION, reasoning: false, temperature: 0, max_tokens: 5 });
    const a = String(r?.answer ?? r?.response ?? r?.result?.answer ?? "").trim().toLowerCase();
    const v: Verdict = /^(yes|igen|ja)\b/.test(a) ? "car" : /^(no|nem|nein)\b/.test(a) ? "other" : "error";
    if (v !== "error") await cachePut(env, key, { v }, 60 * 60 * 24 * 90);
    return v;
  } catch {
    return "error";
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
