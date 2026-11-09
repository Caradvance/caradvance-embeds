// Ajánlatmotor — munkatársi felület (/admin/ajanlatmotor/*, belső bejelentkezés). Kód: lib/ajanlatmotor/routes-staff.ts
// A régi /belso/ajanlatmotor/* címet a _middleware.js 301-gyel ide irányítja.
import { handle } from "hono/cloudflare-pages";
import { staff } from "../../../lib/ajanlatmotor/routes-staff";

export const onRequest = handle(staff);
