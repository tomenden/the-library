import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { contentTypeValidator, statusValidator } from "./schema";

// ── Public (session auth) ──────────────────────────────────────────────────

export const list = query({
  args: {
    status: v.optional(statusValidator),
    topicId: v.optional(v.id("topics")),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return listHandler(ctx, { ...args, userId });
  },
});

export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) return null;
    return item;
  },
});

export const create = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    sourceName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return createHandler(ctx, { ...args, userId, topicIds: args.topicIds ?? [] });
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.optional(statusValidator),
    notes: v.optional(v.string()),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    await updateHandler(ctx, { id, userId, ...fields });
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    await removeHandler(ctx, { id, userId });
  },
});

// ── Internal (called by HTTP actions with userId from API key) ─────────────

export const createInternal = internalMutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    sourceName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    topicIds: v.array(v.id("topics")),
  },
  handler: async (ctx, args) => createHandler(ctx, args),
});

export const listInternal = internalQuery({
  args: {
    userId: v.id("users"),
    status: v.optional(statusValidator),
    topicId: v.optional(v.id("topics")),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => listHandler(ctx, args),
});

export const getInternal = internalQuery({
  args: { id: v.id("items"), userId: v.id("users") },
  handler: async (ctx, { id, userId }) => {
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) return null;
    return item;
  },
});

export const updateInternal = internalMutation({
  args: {
    id: v.id("items"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.optional(statusValidator),
    notes: v.optional(v.string()),
    topicIds: v.optional(v.array(v.id("topics"))),
  },
  handler: async (ctx, { id, userId, ...fields }) =>
    updateHandler(ctx, { id, userId, ...fields }),
});

export const removeInternal = internalMutation({
  args: { id: v.id("items"), userId: v.id("users") },
  handler: async (ctx, args) => removeHandler(ctx, args),
});

// ── Shared logic ───────────────────────────────────────────────────────────

async function createHandler(ctx: any, args: any): Promise<Id<"items">> {
  const { userId, topicIds = [], ...rest } = args;
  return ctx.db.insert("items", { ...rest, userId, status: "saved", topicIds });
}

async function listHandler(ctx: any, args: any): Promise<any[]> {
  const { userId, status, topicId, q } = args;
  let items = await ctx.db
    .query("items")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  if (status) items = items.filter((i: any) => i.status === status);
  if (topicId) items = items.filter((i: any) => i.topicIds.includes(topicId));
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter(
      (i: any) =>
        i.title?.toLowerCase().includes(lower) ||
        i.summary?.toLowerCase().includes(lower) ||
        i.notes?.toLowerCase().includes(lower)
    );
  }
  return items;
}

async function updateHandler(ctx: any, { id, userId, ...fields }: any): Promise<void> {
  const item = await ctx.db.get(id);
  if (!item || item.userId !== userId) throw new Error("Not found");
  const patch = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  await ctx.db.patch(id, patch);
}

async function removeHandler(ctx: any, { id, userId }: any): Promise<void> {
  const item = await ctx.db.get(id);
  if (!item || item.userId !== userId) throw new Error("Not found");
  await ctx.db.delete(id);
}
