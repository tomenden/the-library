import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ── Public (session auth) ──────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("topics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return resolveOrCreateHandler(ctx, userId, name);
  },
});

export const rename = mutation({
  args: { id: v.id("topics"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const topic = await ctx.db.get(id);
    if (!topic || topic.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { name });
  },
});

export const update = mutation({
  args: { id: v.id("topics"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const topic = await ctx.db.get(args.id);
    if (!topic || topic.userId !== userId) throw new Error("Topic not found");
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    await removeTopicHandler(ctx, id, userId);
  },
});

// ── Internal (called by HTTP actions with userId from API key) ─────────────

export const resolveOrCreate = internalMutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, { userId, name }) =>
    resolveOrCreateHandler(ctx, userId, name),
});

export const removeInternal = internalMutation({
  args: { id: v.id("topics"), userId: v.id("users") },
  handler: async (ctx, { id, userId }) => removeTopicHandler(ctx, id, userId),
});

// ── Shared logic ───────────────────────────────────────────────────────────

async function resolveOrCreateHandler(
  ctx: any,
  userId: Id<"users">,
  name: string
): Promise<Id<"topics">> {
  const existing = await ctx.db
    .query("topics")
    .withIndex("by_user_name", (q: any) =>
      q.eq("userId", userId).eq("name", name)
    )
    .first();
  if (existing) return existing._id;
  return ctx.db.insert("topics", { userId, name });
}

async function removeTopicHandler(
  ctx: any,
  id: Id<"topics">,
  userId: Id<"users">
): Promise<void> {
  const topic = await ctx.db.get(id);
  if (!topic || topic.userId !== userId) throw new Error("Not found");

  const items = await ctx.db
    .query("items")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  for (const item of items) {
    if (item.topicIds.includes(id)) {
      await ctx.db.patch(item._id, {
        topicIds: item.topicIds.filter((tid: Id<"topics">) => tid !== id),
      });
    }
  }

  await ctx.db.delete(id);
}

export const listInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query("topics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
});

export const getInternal = internalQuery({
  args: { id: v.id("topics"), userId: v.id("users") },
  handler: async (ctx, { id, userId }) => {
    const topic = await ctx.db.get(id);
    if (!topic || topic.userId !== userId) return null;
    return topic;
  },
});

export const renameInternal = internalMutation({
  args: { id: v.id("topics"), userId: v.id("users"), name: v.string() },
  handler: async (ctx, { id, userId, name }) => {
    const topic = await ctx.db.get(id);
    if (!topic || topic.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { name });
  },
});
