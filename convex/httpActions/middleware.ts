import { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { hashKey } from "../lib/crypto";

export async function authenticateRequest(
  ctx: ActionCtx,
  request: Request
): Promise<{ userId: Id<"users">; apiKeyId: Id<"apiKeys"> } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7);
  const keyHash = await hashKey(rawKey);

  const apiKey = await ctx.runQuery(internal.apiKeys.getByHash, { keyHash });
  if (!apiKey) return null;

  await ctx.runMutation(internal.apiKeys.touchLastUsed, { id: apiKey._id });

  return { userId: apiKey.userId, apiKeyId: apiKey._id };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
