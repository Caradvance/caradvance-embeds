import type { Env } from "../../types";

/** Forced tool call → validated JSON. Returns null when no key is configured or the call fails. */
export async function claudeTool<T>(env: Env, opts: {
  system: string;
  user: string;
  toolName: string;
  description: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        max_tokens: opts.maxTokens ?? 2000,
        system: opts.system,
        tools: [{ name: opts.toolName, description: opts.description, input_schema: opts.schema }],
        tool_choice: { type: "tool", name: opts.toolName },
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    if (!r.ok) {
      console.error("claude error", r.status, await r.text());
      return null;
    }
    const j: any = await r.json();
    const block = (j.content || []).find((c: any) => c.type === "tool_use");
    return (block?.input as T) ?? null;
  } catch (e) {
    console.error("claude exception", e);
    return null;
  }
}
