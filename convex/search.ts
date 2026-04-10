import { v } from "convex/values";
import { action, internalAction, query } from "./_generated/server";
import { ActionCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { embedText } from "./actions/embeddings";
import { Doc } from "./_generated/dataModel";

export const semanticSearch = action({
  args: { q: v.string() },
  handler: async (ctx: ActionCtx, { q }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const embedding = await embedText(q);

    const results = await ctx.vectorSearch("items", "by_embedding", {
      vector: embedding,
      limit: 20,
      filter: (f) => f.eq("userId", userId),
    });

    const items = await Promise.all(
      results.map((r) =>
        ctx.runQuery(internal.items.getInternal, { id: r._id, userId })
      )
    );

    return items
      .map((item, i) => (item ? { ...item, _score: results[i]._score } : null))
      .filter(Boolean);
  },
});

// Internal version for HTTP API (receives userId from API key auth)
export const semanticSearchInternal = internalAction({
  args: { q: v.string(), userId: v.id("users") },
  handler: async (ctx: ActionCtx, { q, userId }) => {
    const embedding = await embedText(q);

    const results = await ctx.vectorSearch("items", "by_embedding", {
      vector: embedding,
      limit: 20,
      filter: (f) => f.eq("userId", userId),
    });

    const items = await Promise.all(
      results.map((r) =>
        ctx.runQuery(internal.items.getInternal, { id: r._id, userId })
      )
    );

    return items
      .map((item, i) => (item ? { ...item, _score: results[i]._score } : null))
      .filter(Boolean);
  },
});

export const moreLikeThis = query({
  args: { id: v.id("items") },
  handler: async (ctx: QueryCtx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId || !item.embedding) return [];

    const results = await ctx.vectorSearch("items", "by_embedding", {
      vector: item.embedding,
      limit: 6,
      filter: (f) => f.eq("userId", userId),
    });

    const related = results.filter((r) => r._id !== id).slice(0, 5);

    const docs = await Promise.all(related.map((r) => ctx.db.get(r._id)));
    return docs.filter((d): d is Doc<"items"> => d !== null && d.userId === userId);
  },
});
