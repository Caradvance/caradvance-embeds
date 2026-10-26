// Packs extension/ into caradvance-astro/public/belso/ajanlatmotor-bovitmeny.zip (download link on /belso/ajanlatmotor/bovitmeny).
import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
const out = new URL("../../caradvance-astro/public/belso/ajanlatmotor-bovitmeny.zip", import.meta.url).pathname;
mkdirSync(new URL("../../caradvance-astro/public/belso/", import.meta.url).pathname, { recursive: true });
rmSync(out, { force: true });
execSync(`zip -qr "${out}" . -x 'fixtures/*' -x package.json`, { cwd: new URL("../extension/", import.meta.url).pathname, stdio: "inherit" });
console.log("written", out);
