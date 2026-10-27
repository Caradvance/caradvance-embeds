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
  it("removes logos and banners, keeps car photos, checks the small rendition", async () => {
    const seen: string[] = [];
    const AI = { async run(_m: string, i: any) { seen.push(i.image); return { answer: /banner|logo/.test(i.image) ? "No" : "Yes." }; } };
    const r = await filterCarPhotos({ DB: fakeDb(), AI } as any, [img("banner"), img("front"), img("logo"), img("interior")]);
    expect(r.images).toEqual([img("front"), img("interior")]);
    expect(r.removed.length).toBe(2);
    expect(r.checked).toBe(true);
    expect(seen.every((u) => u.includes("rule=mo-640.jpg"))).toBe(true);
  });

  it("keeps images but stays unchecked when the model fails", async () => {
    const AI = { async run() { throw new Error("down"); } };
    const r = await filterCarPhotos({ DB: fakeDb(), AI } as any, [img("a"), img("b")]);
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
