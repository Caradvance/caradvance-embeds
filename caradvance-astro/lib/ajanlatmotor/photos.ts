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
    const { text } = await ask(env, url);
    const a = text.trim().toLowerCase().replace(/^[^a-z]+/, "");
    const v: Verdict = /^(yes|igen|ja)\b/.test(a) ? "car" : /^(no|nem|nein)\b/.test(a) ? "other" : "error";
    if (v === "error") lastPhotoError = "unexpected answer: " + text.slice(0, 200);
    if (v !== "error") await cachePut(env, key, { v }, 60 * 60 * 24 * 90);
    return v;
  } catch (e: any) {
    lastPhotoError = String(e?.message || e).slice(0, 300);
    return "error";
  }
}

export let lastPhotoError = "";

type AI = { run(model: string, input: unknown): Promise<any> };
export const FALLBACK_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

/** Workers AI answers come as plain objects, strings or (streamed) SSE bodies, depending on the model. */
export async function answerText(r: any): Promise<string> {
  if (r == null) return "";
  if (typeof ReadableStream !== "undefined" && r instanceof ReadableStream) r = await new Response(r).text();
  else if (typeof Response !== "undefined" && r instanceof Response) r = await r.text();
  if (typeof r === "string") {
    if (/^data:/m.test(r)) {
      return r.split(/\n/).filter((l) => l.startsWith("data:") && !l.includes("[DONE]")).map((l) => {
        try { const j = JSON.parse(l.slice(5)); return j.answer ?? j.response ?? j.token ?? j.text ?? ""; } catch { return ""; }
      }).join("");
    }
    if (/^\s*[{\[]/.test(r)) { try { return answerText(JSON.parse(r)); } catch { /* plain text */ } }
    return r;
  }
  const v = r.answer ?? r.response ?? r.description ?? r.caption ?? r.result?.answer ?? r.result?.response ?? r.result?.description ?? r.output_text;
  return typeof v === "string" ? v : "";
}

async function imageBytes(url: string) {
  const res = await fetch(checkUrl(url), { headers: { "User-Agent": "Mozilla/5.0 (Caradvance Ajanlatmotor)", Accept: "image/*", Referer: "https://suchen.mobile.de/" } });
  if (!res.ok) throw new Error(`image fetch ${res.status}`);
  return { bytes: new Uint8Array(await res.arrayBuffer()), type: res.headers.get("content-type") || "image/jpeg" };
}

function dataUri(b: { bytes: Uint8Array; type: string }) {
  let bin = "";
  for (let i = 0; i < b.bytes.length; i += 0x8000) bin += String.fromCharCode(...b.bytes.subarray(i, i + 0x8000));
  return `data:${b.type};base64,${btoa(bin)}`;
}

/**
 * 1) Moondream with the public URL, 2) Moondream with the image bytes, 3) LLaVA with the bytes.
 * The first non-empty answer wins; `trace` explains each attempt for diagnostics.
 */
async function ask(env: Env, url: string): Promise<{ text: string; trace: string[] }> {
  const ai = env.AI as AI;
  const trace: string[] = [];
  const mq = (image: string) => ({ task: "query", image, question: QUESTION, reasoning: false, stream: false, temperature: 0, max_tokens: 20 });
  const attempt = async (label: string, fn: () => Promise<any>) => {
    try {
      const raw = await fn();
      const text = await answerText(raw);
      trace.push(`${label}: ${text ? JSON.stringify(text.slice(0, 60)) : "empty " + Object.prototype.toString.call(raw) + " keys=" + Object.keys(raw || {}).join(",")}`);
      return text;
    } catch (e: any) {
      trace.push(`${label}: error ${String(e?.message || e).slice(0, 160)}`);
      return "";
    }
  };
  let text = await attempt("moondream-url", () => ai.run(PHOTO_MODEL, mq(checkUrl(url))));
  if (text) return { text, trace };
  let img: { bytes: Uint8Array; type: string } | null = null;
  try { img = await imageBytes(url); } catch (e: any) { trace.push(String(e?.message || e)); }
  if (!img) throw new Error(trace.join(" | "));
  text = await attempt("moondream-bytes", () => ai.run(PHOTO_MODEL, mq(dataUri(img!))));
  if (text) return { text, trace };
  text = await attempt("llava", () => ai.run(FALLBACK_MODEL, { image: [...img!.bytes], prompt: QUESTION, max_tokens: 10 }));
  if (text) return { text, trace };
  throw new Error(trace.join(" | "));
}

/** Diagnostics (test environment only). */
export async function debugPhoto(env: Env, url: string) {
  try {
    const r = await ask(env, url);
    return { ok: true, ...r };
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
