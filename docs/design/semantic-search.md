# Semantic Search — Design Notes

**Status:** Planning (not yet implemented)
**Goal:** Let users find items by meaning, not just keyword match.

---

## The problem with keyword search

Current search (`GET /api/items?q=...`) does substring matching on title, summary, and notes.
This misses:
- "machine learning" when you saved something tagged "AI"
- "stoicism" when your note says "Naval's philosophy"
- Related items across topics you haven't connected yet

## What semantic search would add

- Search "what should I read about focus?" → surfaces items about deep work, flow states, productivity
- Surface items related to your current reading ("more like this")
- Cross-topic discovery: "LLM memory" might surface both AI papers and Zettelkasten notes

## Approach: Convex native vector search

Convex has production-ready vector search built in. No external vector database needed.

**How it works:**
- Define a `vectorIndex` on the table with a `vectorField` and fixed `dimensions`
- `ctx.vectorSearch(table, index, { vector, limit, filter })` returns `{ _id, _score }[]` sorted by cosine similarity
- Results can be filtered on up to 16 additional fields pre-indexed alongside the vector
- Supports 2–4096 dimensions, up to 256 results per search
- `_score` is in the range −1 to 1 (higher = more similar)

### Schema change

```ts
// convex/schema.ts
items: defineTable({
  // ... existing fields ...
  embedding: v.optional(v.array(v.float64())),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,           // matches text-embedding-3-small
    filterFields: ["userId"],   // so search is scoped per user
  })
```

The `embedding` field is optional — items without one are simply absent from vector search results and fall back to keyword search.

### Embedding generation

Embeddings are generated in Convex Actions (which can call external APIs), triggered on item create/update:

```ts
// convex/actions/embeddings.ts
export const generateEmbedding = internalAction({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.runQuery(internal.items.getById, { itemId });
    if (!item) return;

    // Concatenate all meaningful text fields
    const text = [item.title, item.summary, ...(item.notesList ?? []), item.sourceName]
      .filter(Boolean)
      .join(" ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });
    const { data } = await res.json();
    const embedding: number[] = data[0].embedding;

    await ctx.runMutation(internal.items.setEmbedding, { itemId, embedding });
  },
});
```

Triggered from mutations via `ctx.scheduler.runAfter(0, internal.actions.embeddings.generateEmbedding, { itemId })`.

### Search flow

```ts
// convex/items.ts — vectorSearch public query
export const vectorSearch = action({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // 1. Embed the query
    const embedding = await embedText(q); // same OpenAI call

    // 2. Vector search, filtered to this user
    const results = await ctx.vectorSearch("items", "by_embedding", {
      vector: embedding,
      limit: 20,
      filter: (f) => f.eq("userId", userId),
    });

    // 3. Fetch full item documents
    const items = await ctx.runQuery(internal.items.getManyByIds, {
      ids: results.map((r) => r._id),
      userId,
    });

    // Return with scores attached
    return items.map((item, i) => ({ ...item, _score: results[i]._score }));
  },
});
```

### Hybrid fallback

Items without embeddings (just saved, or backfill not yet run) return no vector score.
The UI can show keyword results alongside vector results, or fall back gracefully.

A "hybrid" approach is possible: run both queries and merge by score, but this is an optimisation for later.

### UI integration

- Explore page: detect if the query is a natural language question vs. a keyword and route accordingly — or just always run both and merge
- Show a subtle relevance indicator on cards (filled dot = strong match)
- "More like this" button on ContentPreview: call vector search with the item's own embedding as the query vector (skip the embed step)
- Results that lack an embedding show at the bottom or are hidden from semantic results

## Cost estimate

- `text-embedding-3-small`: $0.02 / 1M tokens
- Average item text: ~200 tokens
- 1,000 items: ~$0.004 total to embed the whole library
- Per search query: one embedding call, ~$0.000004 — essentially free

## What to build

1. Add `OPENAI_API_KEY` to Convex env (prod + dev)
2. Schema: add `embedding` field + `vectorIndex` (non-breaking, field is optional)
3. `convex/actions/embeddings.ts`: `generateEmbedding` internal action
4. Wire `generateEmbedding` into `createHandler` and `updateHandler` via scheduler
5. Backfill action for existing items (one-shot mutation to queue all)
6. `vectorSearch` public action on items
7. HTTP API: `GET /api/items/search?q=...` (semantic) alongside existing `GET /api/items?q=...` (keyword)
8. UI: Explore page uses semantic search when input reads like a query; keyword otherwise
9. "More like this" on ContentPreview

Steps 1–6 are purely backend and can ship without touching the UI. Steps 7–9 are the user-visible layer.
