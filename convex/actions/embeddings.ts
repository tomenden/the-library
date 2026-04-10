import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

declare const process: { env: Record<string, string | undefined> };

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in Convex environment");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

function itemToText(item: {
  title?: string;
  summary?: string;
  notesList?: string[];
  sourceName?: string;
}): string {
  return [item.title, item.summary, ...(item.notesList ?? []), item.sourceName]
    .filter(Boolean)
    .join(" ");
}

export const generateEmbedding = internalAction({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.runQuery(internal.items.getForEmbedding, { itemId });
    if (!item) return;

    const text = itemToText(item);
    if (!text.trim()) return;

    const embedding = await embedText(text);
    await ctx.runMutation(internal.items.setEmbedding, { itemId, embedding });
  },
});

export const backfillEmbeddings = internalAction({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.runQuery(internal.items.listWithoutEmbedding, {});
    for (const item of items) {
      await ctx.scheduler.runAfter(0, internal.actions.embeddings.generateEmbedding, {
        itemId: item._id,
      });
    }
    return { queued: items.length };
  },
});
