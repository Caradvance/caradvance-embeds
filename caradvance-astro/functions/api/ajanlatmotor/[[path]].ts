// Ajánlatmotor — Chrome-bővítmény API (személyes token). Kód: lib/ajanlatmotor/routes-ext.ts
import { handle } from "hono/cloudflare-pages";
import { ext } from "../../../lib/ajanlatmotor/routes-ext";

export const onRequest = handle(ext);
