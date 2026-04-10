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
- Surface items related to your current reading (e.g. "more like this")
- Cross-topic discovery: "LLM memory" might surface both AI papers and Zettelkasten notes

## Technical approach

### Embeddings

Each item gets a vector embedding generated from its `title + summary + notes + topics`.
When a user searches, the query is embedded and nearest-neighbour retrieved.

**Model options:**
- `text-embedding-3-small` (OpenAI, cheap, 1536d)
- Convex has no native vector index yet → need external store or use Convex's upcoming vector support
- Alternative: use Convex's `vectorSearch` when available in preview

### Architecture options

**Option A: External vector store (Pinecone / Qdrant)**
- Store item ID + vector in external DB
- On item create/update, call embedding API + upsert vector
- On search, embed query → query vector store → fetch full items from Convex by ID
- Pro: battle-tested, fast
- Con: another service to manage, cost

**Option B: Convex native vector search (in preview)**
- Convex supports vector fields and HNSW index as of late 2024
- `defineTable({ embedding: v.optional(v.array(v.float64())) })`
- `.vectorSearch("embedding", queryEmbedding, { limit: 10 })`
- Pro: no extra service, consistent auth model
- Con: still in preview, embedding generation needs to be triggered externally

**Option C: Store embeddings in Convex, use cosine similarity in query**
- Convex JS queries can compute dot products
- Works for small libraries (< 10k items), too slow at scale
- Not recommended

**Recommendation:** Start with Option B (Convex native vector search).
If it's too limited or slow, migrate to Pinecone.

### Embedding generation

Two triggers:
1. Item created → schedule background action to generate embedding
2. Item updated (title/summary/notes changed) → regenerate embedding

Use Convex Actions (can call external APIs) scheduled via `ctx.scheduler.runAfter`.

```ts
// convex/actions/embeddings.ts
export const generateEmbedding = internalAction({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.runQuery(internal.items.getInternal, { itemId });
    const text = [item.title, item.summary, item.notes, ...item.topics].join(" ");
    const embedding = await callOpenAI(text); // float64[]
    await ctx.runMutation(internal.items.setEmbedding, { itemId, embedding });
  },
});
```

### Schema change needed

```ts
items: defineTable({
  // existing fields...
  embedding: v.optional(v.array(v.float64())),
}).vectorIndex("by_embedding", { vectorField: "embedding", dimensions: 1536 })
```

### Search flow

```
User types query
  → embed query (OpenAI API call from Convex Action)
  → vectorSearch("by_embedding", queryEmbedding, { limit: 20 })
  → filter by userId
  → return items sorted by relevance score
```

### UI integration

- Replace (or augment) the keyword search input in the Explore page
- Show relevance score subtly (dot opacity / match label)
- Allow hybrid: vector search + keyword rerank
- "More like this" button on ContentPreview → search by item's embedding

## Cost estimate

- text-embedding-3-small: $0.02 / 1M tokens
- Average item text: ~200 tokens
- 1000 items: ~200K tokens → ~$0.004 total to embed library
- Per search query: 1 embedding call, negligible

## What to build first

1. Schema + vector index migration (non-breaking, embedding is optional)
2. Background action to embed items on create/update
3. Backfill action for existing items
4. Search endpoint in HTTP API (`GET /api/items/search?q=...`)
5. UI: update Explore page to use semantic search
6. "More like this" on ContentPreview

The feature can ship incrementally — items without embeddings fall back to keyword search.
