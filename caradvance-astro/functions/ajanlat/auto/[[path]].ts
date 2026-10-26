// Ajánlatmotor — az ügyfél prémium ajánlatoldala (/ajanlat/auto/<token>/). Kód: lib/ajanlatmotor/routes-public.ts
import { handle } from "hono/cloudflare-pages";
import { pub } from "../../../lib/ajanlatmotor/routes-public";

export const onRequest = handle(pub);
