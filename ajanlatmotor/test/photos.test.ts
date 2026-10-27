import { describe, expect, it } from "vitest";
import { filterCarPhotos } from "../../caradvance-astro/lib/ajanlatmotor/photos";

/** Minimal D1 stand-in for am_cache. */
function fakeDb() {
  const m = new Map<string, string>();
  return {
    prepare(sql: string) {
      return {
        bind(...a: any[]) {
          return {
            async first() { return /SELECT v, exp FROM am_cache/.test(sql) && m.has(a[0]) ? { v: m.get(a[0]), exp: null } : null; },
            async run() { if (/INSERT INTO am_cache/.test(sql)) m.set(a[0], a[1]); return {}; },
          };
        },
      };
    },
  } as any;
}

const img = (n: string) => `https://img.classistatic.de/api/v1/mo-prod/images/aa/${n}?rule=mo-1024.jpg`;

describe("car-photo filter", () => {
  const realFetch = globalThis.fetch;
  const fetched: string[] = [];
  // image bytes = the file name, so the fake model can "see" what the picture is
  const stubFetch = () => { globalThis.fetch = (async (u: string) => { fetched.push(String(u)); return new Response(String(u).match(/images\/aa\/(\w+)/)![1], { headers: { "content-type": "image/jpeg" } }); }) as any; };
  const seen = (dataUri: string) => atob(dataUri.split(",")[1]);

  it("removes logos and banners, keeps exterior and interior photos, uses the small rendition", async () => {
    stubFetch();
    const AI = { async run(_m: string, i: any) {
      const n = seen(i.image);
      if (/company logo/.test(i.question)) return { answer: n === "branded" ? "Yes" : "No." }; // dealer branding check
      return { answer: n === "banner" ? "Banner" : n === "logo" ? "logo." : n === "interior" ? "Interior" : "exterior" };
    } };
    const r = await filterCarPhotos({ DB: fakeDb(), AI } as any, [img("banner"), img("interior"), img("logo"), img("branded"), img("front")]);
    globalThis.fetch = realFetch;
    expect(r.images).toEqual([img("front"), img("interior")]); // exterior photo becomes the cover; branded car photo removed
    expect(r.removed.length).toBe(3);
    expect(r.checked).toBe(true);
    expect(fetched.every((u) => u.includes("rule=mo-640.jpg"))).toBe(true);
  });

  it("keeps images but stays unchecked when the model fails", async () => {
    stubFetch();
    const AI = { async run() { throw new Error("down"); } };
    const r = await filterCarPhotos({ DB: fakeDb(), AI } as any, [img("a"), img("b")]);
    globalThis.fetch = realFetch;
    expect(r.images.length).toBe(2);
    expect(r.checked).toBe(false);
  });

  it("is unchecked without the AI binding", async () => {
    const r = await filterCarPhotos({ DB: fakeDb() } as any, [img("a")]);
    expect(r.checked).toBe(false);
  });
});

import { answerText } from "../../caradvance-astro/lib/ajanlatmotor/photos";
describe("answerText", () => {
  it("reads objects, strings, JSON and SSE", async () => {
    expect(await answerText({ answer: "Yes" })).toBe("Yes");
    expect(await answerText({ description: " No." })).toBe(" No.");
    expect(await answerText('{"result":{"response":"yes"}}')).toBe("yes");
    expect(await answerText('data: {"response":"Y"}\ndata: {"response":"es"}\ndata: [DONE]\n')).toBe("Yes");
    expect(await answerText(new Response('{"answer":"no"}').body)).toBe("no");
  });
});

import { pickSectionImages } from "../../caradvance-astro/lib/ajanlatmotor/photos";
describe("section photos", () => {
  it("puts an interior photo next to the interior text and never reuses the cover", () => {
    const imgs = ["a", "b", "c", "d"];
    const tags = ["exterior", "exterior", "interior", "wheel"];
    const secs = ["design", "interior", "performance"].map((key) => ({ key, image_index: 0 }));
    expect(pickSectionImages(secs, imgs, tags).map((s) => s.image_index)).toEqual([1, 2, 3]);
    expect(pickSectionImages(secs, imgs, undefined)).toBe(secs);
  });
});
