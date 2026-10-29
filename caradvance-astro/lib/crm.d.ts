// Type declarations for the parts of lib/crm.js that the Ajánlatmotor (TypeScript) uses.
export const SITE: string;
export const STATUSES: string[];
export function ensureCrm(env: any): Promise<void>;
export function getCard(env: any, dealId: number): Promise<any>;
export function saveCard(env: any, dealId: number, fields: Record<string, unknown>, userId: number | null): Promise<any>;
export function sendCrmMail(env: any, to: string | string[], subject: string, inner: string, attachments?: unknown[] | null, opts?: { noCopy?: boolean }): Promise<{ ok: boolean; error?: string }>;
export function notifyTo(env: any): string;
export function randomHex(n: number): string;
