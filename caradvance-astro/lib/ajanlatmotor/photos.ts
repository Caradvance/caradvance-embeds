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
/** Categorical question: the model names what it sees, we decide. Yes/no prompts proved unreliable for interiors. */
const QUESTION =
  "Classify this image with exactly one word from this list: exterior, interior, wheel, engine, trunk, detail, logo, banner, text, people, building, other. " +
  "exterior = outside of a car; interior = inside of a car (seats, dashboard, steering wheel, screen); detail = close-up of a car part. " +
  "Use logo, banner or text if the image is mainly a logo, an advertisement, a dealer graphic or written text. Answer with the one word only.";
/** Second question for car photos: dealer branding (logo backdrop, name banner, price/ad text) disqualifies the photo. */
const BRANDING_Q =
  "Does this image show a large company logo, a dealer name, a banner or advertising text (not counting the car's own badge and number plate)? Answer only yes or no.";
const CAR = /^(exterior|interior|wheel|wheels|engine|trunk|boot|detail|car|seat|seats|dashboard)\b/;
const NOT_CAR = /^(logo|banner|text|people|person|building|other|advertisement|document|map)\b/;

type Verdict = "car" | "other" | "error";
type Seen = { v: Verdict; c?: string };

/** Smaller mobile.de rendition is enough for the check. */
function checkUrl(u: string) {
  return /classistatic\.de/.test(u) ? u.replace(/rule=mo-\d+\.jpg/, "rule=mo-640.jpg") : u;
}

async function verdict(env: Env, url: string): Promise<Seen> {
  const key = "photo4:" + url.replace(/\?.*$/, "");
  const hit = await cacheGet<Seen>(env, key);
  if (hit) return hit;
  try {
    const { text } = await ask(env, url);
    const a = text.trim().toLowerCase().replace(/^[^a-z]+/, "");
    let v: Verdict = CAR.test(a) ? "car" : NOT_CAR.test(a) ? "other" : "error";
    if (v === "error") lastPhotoError = "unexpected answer: " + text.slice(0, 200);
    let c = a.split(/[^a-z]/)[0];
    if (v === "car") {
      const b = (await ask(env, url, BRANDING_Q)).text.trim().toLowerCase().replace(/^[^a-z]+/, "");
      if (/^yes\b/.test(b)) { v = "other"; c = "branded"; }
      else if (!/^no\b/.test(b)) { v = "error"; lastPhotoError = "unexpected branding answer: " + b.slice(0, 100); }
    }
    if (v !== "error") await cachePut(env, key, { v, c }, 60 * 60 * 24 * 90);
    return { v, c };
  } catch (e: any) {
    lastPhotoError = String(e?.message || e).slice(0, 300);
    return { v: "error" };
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
 * Moondream with the image bytes (it cannot fetch mobile.de URLs itself), then LLaVA as fallback.
 * The first non-empty answer wins; `trace` explains each attempt for diagnostics.
 */
async function ask(env: Env, url: string, question = QUESTION): Promise<{ text: string; trace: string[] }> {
  const ai = env.AI as AI;
  const trace: string[] = [];
  const mq = (image: string) => ({ task: "query", image, question, reasoning: false, stream: false, temperature: 0, max_tokens: 20 });
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
  let text = "";
  let img: { bytes: Uint8Array; type: string } | null = null;
  try { img = await imageBytes(url); } catch (e: any) { trace.push(String(e?.message || e)); }
  if (!img) throw new Error(trace.join(" | "));
  text = await attempt("moondream-bytes", () => ai.run(PHOTO_MODEL, mq(dataUri(img!))));
  if (text) return { text, trace };
  text = await attempt("llava", () => ai.run(FALLBACK_MODEL, { image: [...img!.bytes], prompt: question, max_tokens: 10 }));
  if (text) return { text, trace };
  throw new Error(trace.join(" | "));
}

/** Diagnostics (test environment only). */
export async function debugPhoto(env: Env, url: string) {
  try {
    const r = await ask(env, url);
    const b = await ask(env, url, BRANDING_Q);
    return { ok: true, ...r, branding: b.text, branding_trace: b.trace };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export interface PhotoCheck { images: string[]; tags: string[]; removed: string[]; checked: boolean }

export async function filterCarPhotos(env: Env, images: string[]): Promise<PhotoCheck> {
  if (!env.AI || !images.length) return { images, tags: [], removed: [], checked: false };
  const head = images.slice(0, MAX_IMAGES);
  const seen = await Promise.all(head.map((u) => verdict(env, u)));
  const kept = head.map((u, i) => ({ u, s: seen[i] })).filter((x) => x.s.v !== "other");
  const removed = head.filter((_, i) => seen[i].v === "other");
  // the cover (first photo) should show the car from outside
  const ext = kept.findIndex((x) => x.s.c === "exterior");
  if (ext > 0) kept.unshift(...kept.splice(ext, 1));
  const keep = kept.map((x) => x.u);
  const tags = kept.map((x) => x.s.c || "");
  // a failed check keeps the image but the listing counts as unchecked
  const checked = !seen.some((x) => x.v === "error");
  return { images: keep, tags, removed, checked };
}

/** Returns a copy of the listing with only car photos and the check flag set. */
export async function withCarPhotos(env: Env, l: Listing): Promise<Listing & { photos_checked?: boolean; photos_removed?: number; photo_tags?: string[] }> {
  if (l.url.startsWith("mock://")) return { ...l, photos_checked: true, photos_removed: 0 };
  const r = await filterCarPhotos(env, l.images);
  return { ...l, images: r.images, photo_tags: r.tags, photos_checked: r.checked, photos_removed: r.removed.length };
}

/** Which photo categories suit each description section, best first. */
const SECTION_TAGS: Record<string, string[]> = {
  design: ["exterior", "detail"],
  interior: ["interior", "dashboard", "seats", "seat"],
  performance: ["wheel", "wheels", "engine", "exterior"],
  technology: ["interior", "dashboard", "detail"],
  condition: ["exterior", "trunk", "boot", "detail"],
};

/**
 * Gives every section a fitting photo (interior text → interior photo), without repeats and
 * never the cover photo. Sections keep their index when the listing has no photo categories.
 */
export function pickSectionImages<S extends { key: string; image_index: number }>(sections: S[], images: string[], tags?: string[]): S[] {
  if (!tags?.length || tags.length !== images.length) return sections;
  const used = new Set<number>([0]);
  return sections.map((sec) => {
    const want = SECTION_TAGS[sec.key] || [];
    let idx = -1;
    for (const t of want) { idx = tags.findIndex((x, i) => x === t && !used.has(i)); if (idx >= 0) break; }
    if (idx < 0) idx = tags.findIndex((_, i) => !used.has(i));
    if (idx < 0) return sec;
    used.add(idx);
    return { ...sec, image_index: idx };
  });
}
