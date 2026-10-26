// Ajánlatmotor — munkatársi felület (belső bejelentkezés). Kód: lib/ajanlatmotor/routes-staff.ts
import { handle } from "hono/cloudflare-pages";
import { staff } from "../../../lib/ajanlatmotor/routes-staff";

export const onRequest = handle(staff);
