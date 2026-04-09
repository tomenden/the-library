import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

async function hashKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `lib_${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

// ── Public (session auth) ──────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    // Strip keyHash before sending to client
    return keys.map(({ keyHash: _kh, ...k }) => k);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return createHandler(ctx, { userId, name });
  },
});

export const revoke = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    await revokeHandler(ctx, { id, userId });
  },
});

// ── Internal ───────────────────────────────────────────────────────────────

export const createKeyInternal = internalMutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, args) => createHandler(ctx, args),
});

export const revokeInternal = internalMutation({
  args: { id: v.id("apiKeys"), userId: v.id("users") },
  handler: async (ctx, args) => revokeHandler(ctx, args),
});

export const getByHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) =>
    ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first(),
});

export const touchLastUsed = internalMutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { lastUsedAt: Date.now() });
  },
});

// ── Shared logic ───────────────────────────────────────────────────────────

async function createHandler(
  ctx: any,
  { userId, name }: { userId: Id<"users">; name: string }
): Promise<string> {
  const rawKey = generateRawKey();
  const keyHash = await hashKey(rawKey);
  await ctx.db.insert("apiKeys", { userId, name, keyHash });
  return rawKey;
}

async function revokeHandler(
  ctx: any,
  { id, userId }: { id: Id<"apiKeys">; userId: Id<"users"> }
): Promise<void> {
  const key = await ctx.db.get(id);
  if (!key || key.userId !== userId) throw new Error("Not found");
  await ctx.db.delete(id);
}
