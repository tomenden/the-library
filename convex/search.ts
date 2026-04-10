import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { ActionCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { embedText } from "./actions/embeddings";
import { Doc } from "./_generated/dataModel";

type ItemWithScore = Doc<"items"> & { _score: number };

export const semanticSearch = action({
  args: { q: v.string() },
  handler: async (ctx: ActionCtx, { q }): Promise<ItemWithScore[]> => {
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
      .map((item, i): ItemWithScore | null =>
        item ? { ...item, _score: results[i]._score } : null
      )
      .filter((x): x is ItemWithScore => x !== null);
  },
});

// Internal version for HTTP API (receives userId from API key auth)
export const semanticSearchInternal = internalAction({
  args: { q: v.string(), userId: v.id("users") },
  handler: async (ctx: ActionCtx, { q, userId }): Promise<ItemWithScore[]> => {
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
      .map((item, i): ItemWithScore | null =>
        item ? { ...item, _score: results[i]._score } : null
      )
      .filter((x): x is ItemWithScore => x !== null);
  },
});

// moreLikeThis uses stored embeddings — no OpenAI call needed.
// Must be an action because ctx.vectorSearch is only available on ActionCtx.
export const moreLikeThis = action({
  args: { id: v.id("items") },
  handler: async (ctx: ActionCtx, { id }): Promise<Doc<"items">[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const item = await ctx.runQuery(internal.items.getInternal, { id, userId });
    if (!item || !item.embedding) return [];

    const results = await ctx.vectorSearch("items", "by_embedding", {
      vector: item.embedding,
      limit: 6,
      filter: (f) => f.eq("userId", userId),
    });

    const related = results.filter((r) => r._id !== id).slice(0, 5);

    const docs = await Promise.all(
      related.map((r) => ctx.runQuery(internal.items.getInternal, { id: r._id, userId }))
    );
    return docs.filter((d): d is Doc<"items"> => d !== null);
  },
});
