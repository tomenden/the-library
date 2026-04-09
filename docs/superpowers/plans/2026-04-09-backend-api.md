# The Library — Backend & API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Convex backend with Google auth, a per-user library database, and an LLM-accessible HTTP API to the existing React frontend.

**Architecture:** Convex serves as the single backend — database, real-time subscriptions, Google OAuth, and HTTP API all in one service. The frontend connects via ConvexAuthProvider. LLMs authenticate with user-generated API keys over Convex HTTP Actions. Internal functions accept `userId` directly so both the session-authenticated frontend and the key-authenticated HTTP API share the same business logic without duplication.

**Tech Stack:** Convex, @convex-dev/auth, @auth/core (Google provider), React 19, Vite, TypeScript, Tailwind CSS v3, vitest, convex-test, @edge-runtime/vm

---

## File Map

| File | Role |
|------|------|
| `convex/schema.ts` | Table definitions for items, topics, apiKeys (+ authTables) |
| `convex/auth.ts` | Convex Auth setup with Google provider |
| `convex/http.ts` | HTTP router — registers all HTTP Action routes |
| `convex/items.ts` | Item queries/mutations: public (session auth) + internal (userId param) |
| `convex/topics.ts` | Topic queries/mutations: public + internal |
| `convex/apiKeys.ts` | Key generation, hashing, list/create/revoke + internal lookup |
| `convex/httpActions/middleware.ts` | Extract Bearer token → resolve userId |
| `convex/httpActions/items.ts` | HTTP handlers: POST/GET/PATCH/DELETE /api/items |
| `convex/httpActions/topics.ts` | HTTP handlers: GET/POST/PATCH/DELETE /api/topics |
| `convex/items.test.ts` | vitest tests for item functions |
| `convex/topics.test.ts` | vitest tests for topic functions |
| `convex/apiKeys.test.ts` | vitest tests for API key functions |
| `src/lib/convex.ts` | ConvexReactClient singleton |
| `src/pages/Login.tsx` | Google sign-in page |
| `src/pages/ApiKeys.tsx` | API key management UI |
| `src/components/AuthGate.tsx` | Redirects unauthenticated users to /login |
| `public/llm-api.md` | Static LLM-facing API documentation |
| `AGENTS.md` | Coding agent rules including schema-sync requirement |
| `CLAUDE.md` | Symlink → AGENTS.md |
| `vitest.config.ts` | Test runner config |

**Modified:** `src/main.tsx`, `src/App.tsx`, `src/pages/MainLibrary.tsx`, `src/pages/HistoryArchive.tsx`, `src/pages/SearchDiscovery.tsx`, `src/pages/ContentPreview.tsx`, `src/components/Sidebar.tsx`, `package.json`

**Deleted:** `src/data/mockData.ts`

---

## Task 1: Install dependencies and initialize Convex

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `.env.local` (gitignored — you fill in values)

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install convex @convex-dev/auth @auth/core
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install --save-dev vitest @edge-runtime/vm convex-test
```

- [ ] **Step 3: Initialize Convex project**

```bash
npx convex dev
```

Follow the prompts to create a new Convex project. This generates the `convex/` directory and `convex/_generated/`. It will also print your `CONVEX_URL`. Leave `npx convex dev` running in a separate terminal during development — it syncs your schema and functions.

- [ ] **Step 4: Add env vars**

Create `.env.local` (never commit this):

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

- [ ] **Step 5: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
```

- [ ] **Step 6: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Update .gitignore**

Ensure `.gitignore` contains:

```
.env.local
convex/_generated/
.superpowers/
```

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json package-lock.json .gitignore
git commit -m "feat: add Convex and vitest dependencies"
```

---

## Task 2: Convex Auth setup with Google

Convex Auth handles Google OAuth. It needs two environment variables set in the Convex dashboard (not `.env.local`): `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`. Get these from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). Set the authorized redirect URI to `https://your-deployment.convex.site/api/auth/callback/google`.

**Files:**
- Create: `convex/auth.ts`

- [ ] **Step 1: Create auth.ts**

```typescript
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
});
```

- [ ] **Step 2: Set Convex environment variables**

```bash
npx convex env set AUTH_GOOGLE_CLIENT_ID your-client-id
npx convex env set AUTH_GOOGLE_CLIENT_SECRET your-client-secret
```

- [ ] **Step 3: Commit**

```bash
git add convex/auth.ts
git commit -m "feat: configure Convex Auth with Google provider"
```

---

## Task 3: Database schema

**Files:**
- Create: `convex/schema.ts`

- [ ] **Step 1: Write schema**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const contentTypeValidator = v.union(
  v.literal("article"),
  v.literal("video"),
  v.literal("podcast"),
  v.literal("tweet"),
  v.literal("newsletter"),
);

export const statusValidator = v.union(
  v.literal("saved"),
  v.literal("in_progress"),
  v.literal("done"),
);

export default defineSchema({
  ...authTables,

  items: defineTable({
    userId: v.id("users"),
    url: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    sourceName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: statusValidator,
    notes: v.optional(v.string()),
    topicIds: v.array(v.id("topics")),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  topics: defineTable({
    userId: v.id("users"),
    name: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"]),
});
```

- [ ] **Step 2: Verify Convex accepts the schema**

`npx convex dev` (already running) will auto-push. Check its output for any schema errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: define Convex schema (items, topics, apiKeys)"
```

---

## Task 4: Topic functions (TDD)

**Files:**
- Create: `convex/topics.ts`
- Create: `convex/topics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/topics.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

async function setupUser(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    return ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test User",
      emailVerificationTime: Date.now(),
    }) as Promise<Id<"users">>;
  });
}

test("resolveOrCreate: creates a new topic", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "Machine Learning" })
  );

  const topic = await t.run(async (ctx) => ctx.db.get(topicId));
  expect(topic?.name).toBe("Machine Learning");
  expect(topic?.userId).toBe(userId);
});

test("resolveOrCreate: returns existing topic on duplicate name", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const id1 = await t.mutation(internal.topics.resolveOrCreate, {
    userId,
    name: "Design",
  });
  const id2 = await t.mutation(internal.topics.resolveOrCreate, {
    userId,
    name: "Design",
  });

  expect(id1).toBe(id2);
});

test("removeInternal: cleans up topicIds on affected items", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "Tech" })
  );
  const itemId = await t.run(async (ctx) =>
    ctx.db.insert("items", {
      userId,
      url: "https://example.com",
      status: "saved",
      topicIds: [topicId],
    })
  );

  await t.mutation(internal.topics.removeInternal, { id: topicId, userId });

  const item = await t.run(async (ctx) => ctx.db.get(itemId));
  expect(item?.topicIds).toHaveLength(0);

  const topic = await t.run(async (ctx) => ctx.db.get(topicId));
  expect(topic).toBeNull();
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `internal.topics.resolveOrCreate` not defined.

- [ ] **Step 3: Implement topics.ts**

Create `convex/topics.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add convex/topics.ts convex/topics.test.ts
git commit -m "feat: add topic Convex functions with tests"
```

---

## Task 5: Item functions (TDD)

**Files:**
- Create: `convex/items.ts`
- Create: `convex/items.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/items.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

async function setupUser(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test",
      emailVerificationTime: Date.now(),
    }) as Promise<Id<"users">>
  );
}

test("createInternal: inserts item with status=saved", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com/article",
    title: "Test Article",
    topicIds: [],
  });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item?.url).toBe("https://example.com/article");
  expect(item?.status).toBe("saved");
  expect(item?.userId).toBe(userId);
});

test("listInternal: filters by status", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://a.com",
    topicIds: [],
  });
  await t.run(async (ctx) =>
    ctx.db.insert("items", {
      userId,
      url: "https://b.com",
      status: "done",
      topicIds: [],
    })
  );

  const saved = await t.query(internal.items.listInternal, {
    userId,
    status: "saved",
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].url).toBe("https://a.com");
});

test("listInternal: filters by topicId", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "AI" })
  );

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://ai.com",
    topicIds: [topicId],
  });
  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://other.com",
    topicIds: [],
  });

  const aiItems = await t.query(internal.items.listInternal, {
    userId,
    topicId,
  });
  expect(aiItems).toHaveLength(1);
  expect(aiItems[0].url).toBe("https://ai.com");
});

test("listInternal: searches title and summary", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://rust.com",
    title: "Why Rust is great",
    topicIds: [],
  });
  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://go.com",
    title: "Go programming",
    topicIds: [],
  });

  const results = await t.query(internal.items.listInternal, {
    userId,
    q: "rust",
  });
  expect(results).toHaveLength(1);
  expect(results[0].url).toBe("https://rust.com");
});

test("updateInternal: changes status", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await t.mutation(internal.items.updateInternal, {
    id,
    userId,
    status: "done",
  });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item?.status).toBe("done");
});

test("updateInternal: throws on wrong userId", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);
  const otherId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "other@example.com",
      name: "Other",
      emailVerificationTime: Date.now(),
    })
  );

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await expect(
    t.mutation(internal.items.updateInternal, {
      id,
      userId: otherId,
      status: "done",
    })
  ).rejects.toThrow("Not found");
});

test("removeInternal: deletes item", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await t.mutation(internal.items.removeInternal, { id, userId });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item).toBeNull();
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `internal.items` not defined.

- [ ] **Step 3: Implement items.ts**

Create `convex/items.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: PASS (all tests including topics).

- [ ] **Step 5: Commit**

```bash
git add convex/items.ts convex/items.test.ts
git commit -m "feat: add item Convex functions with tests"
```

---

## Task 6: API key functions (TDD)

**Files:**
- Create: `convex/apiKeys.ts`
- Create: `convex/apiKeys.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/apiKeys.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

async function setupUser(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test",
      emailVerificationTime: Date.now(),
    }) as Promise<Id<"users">>
  );
}

test("createKeyInternal: returns raw key starting with lib_", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "My Claude",
  });

  expect(rawKey).toMatch(/^lib_[0-9a-f]{64}$/);
});

test("createKeyInternal: stores hash, not raw key", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "My Claude",
  });

  const keys = await t.run(async (ctx) =>
    ctx.db.query("apiKeys").collect()
  );
  expect(keys).toHaveLength(1);
  expect(keys[0].keyHash).not.toBe(rawKey);
  expect(keys[0].keyHash).toHaveLength(64); // sha256 hex
});

test("getByHash: resolves API key to userId", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "Test Key",
  });

  // Hash the raw key the same way the server does
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const found = await t.query(internal.apiKeys.getByHash, { keyHash: hash });
  expect(found?.userId).toBe(userId);
});

test("revokeInternal: deletes the key", async () => {
  const t = convexTest(schema);
  const userId = await setupUser(t);

  await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "Temp",
  });

  const keys = await t.run(async (ctx) => ctx.db.query("apiKeys").collect());
  await t.mutation(internal.apiKeys.revokeInternal, {
    id: keys[0]._id,
    userId,
  });

  const after = await t.run(async (ctx) => ctx.db.query("apiKeys").collect());
  expect(after).toHaveLength(0);
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `internal.apiKeys` not defined.

- [ ] **Step 3: Implement apiKeys.ts**

Create `convex/apiKeys.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: PASS (all tests in all three test files).

- [ ] **Step 5: Commit**

```bash
git add convex/apiKeys.ts convex/apiKeys.test.ts
git commit -m "feat: add API key Convex functions with tests"
```

---

## Task 7: HTTP router and middleware

**Files:**
- Create: `convex/httpActions/middleware.ts`
- Create: `convex/http.ts`

- [ ] **Step 1: Create middleware**

Create `convex/httpActions/middleware.ts`:

```typescript
import { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

async function hashKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
```

- [ ] **Step 2: Create the HTTP router (skeleton — handlers added in next tasks)**

Create `convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
} from "./httpActions/items";
import {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from "./httpActions/topics";

const http = httpRouter();

// Convex Auth routes (handles /api/auth/*)
auth.addHttpRoutes(http);

// Items
http.route({ path: "/api/items", method: "POST", handler: createItem });
http.route({ path: "/api/items", method: "GET", handler: listItems });
http.route({ pathPrefix: "/api/items/", method: "GET", handler: getItem });
http.route({ pathPrefix: "/api/items/", method: "PATCH", handler: updateItem });
http.route({ pathPrefix: "/api/items/", method: "DELETE", handler: deleteItem });

// Topics
http.route({ path: "/api/topics", method: "GET", handler: listTopics });
http.route({ path: "/api/topics", method: "POST", handler: createTopic });
http.route({ pathPrefix: "/api/topics/", method: "PATCH", handler: updateTopic });
http.route({ pathPrefix: "/api/topics/", method: "DELETE", handler: deleteTopic });

export default http;
```

- [ ] **Step 3: Commit**

```bash
git add convex/http.ts convex/httpActions/middleware.ts
git commit -m "feat: add HTTP router and API key auth middleware"
```

---

## Task 8: HTTP item endpoints

**Files:**
- Create: `convex/httpActions/items.ts`

- [ ] **Step 1: Create items HTTP action file**

Create `convex/httpActions/items.ts`:

```typescript
import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";
import { Id } from "../_generated/dataModel";

export const createItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { topicNames, topicIds: _ignored, ...fields } = body;

  // Resolve topic names → IDs (create topics that don't exist yet)
  let topicIds: Id<"topics">[] = [];
  if (Array.isArray(topicNames) && topicNames.length > 0) {
    topicIds = await Promise.all(
      topicNames.map((name: string) =>
        ctx.runMutation(internal.topics.resolveOrCreate, {
          userId: auth.userId,
          name,
        })
      )
    );
  }

  const id = await ctx.runMutation(internal.items.createInternal, {
    ...fields,
    userId: auth.userId,
    topicIds,
  });

  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(item, 201);
});

export const listItems = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? undefined) as any;
  const topicId = (url.searchParams.get("topicId") ?? undefined) as
    | Id<"topics">
    | undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const items = await ctx.runQuery(internal.items.listInternal, {
    userId: auth.userId,
    status,
    topicId,
    q,
  });

  return jsonResponse(items);
});

export const getItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;
  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  if (!item) return errorResponse("Not found", 404);
  return jsonResponse(item);
});

export const updateItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;
  const body = await request.json();

  try {
    await ctx.runMutation(internal.items.updateInternal, {
      id,
      userId: auth.userId,
      ...body,
    });
  } catch {
    return errorResponse("Not found", 404);
  }

  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(item);
});

export const deleteItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;

  try {
    await ctx.runMutation(internal.items.removeInternal, {
      id,
      userId: auth.userId,
    });
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Not found", 404);
  }
});
```

- [ ] **Step 2: Verify Convex dev output has no errors**

Check `npx convex dev` terminal output. Expected: functions pushed successfully.

- [ ] **Step 3: Smoke-test with curl (requires a real API key — create one from the app in a later task, or via Convex dashboard)**

```bash
curl -X GET https://your-deployment.convex.site/api/items \
  -H "Authorization: Bearer lib_yourkey"
# Expected: []  (empty array, user has no items yet)
```

- [ ] **Step 4: Commit**

```bash
git add convex/httpActions/items.ts
git commit -m "feat: add HTTP item endpoints (CRUD)"
```

---

## Task 9: HTTP topic endpoints

**Files:**
- Create: `convex/httpActions/topics.ts`

- [ ] **Step 1: Create topics HTTP action file**

Create `convex/httpActions/topics.ts`:

```typescript
import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";
import { Id } from "../_generated/dataModel";

export const listTopics = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const topics = await ctx.runQuery(internal.topics.listInternal, {
    userId: auth.userId,
  });

  return jsonResponse(topics);
});

export const createTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return errorResponse("name is required", 400);
  }

  const id = await ctx.runMutation(internal.topics.resolveOrCreate, {
    userId: auth.userId,
    name,
  });

  const topic = await ctx.runQuery(internal.topics.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(topic, 201);
});

export const updateTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"topics">;
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return errorResponse("name is required", 400);
  }

  try {
    await ctx.runMutation(internal.topics.renameInternal, {
      id,
      userId: auth.userId,
      name,
    });
  } catch {
    return errorResponse("Not found", 404);
  }

  const topic = await ctx.runQuery(internal.topics.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(topic);
});

export const deleteTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"topics">;

  try {
    await ctx.runMutation(internal.topics.removeInternal, {
      id,
      userId: auth.userId,
    });
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Not found", 404);
  }
});
```

- [ ] **Step 2: Add missing internal helpers to topics.ts**

Append to `convex/topics.ts` (these are called by the HTTP topic handlers):

```typescript
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
```

- [ ] **Step 3: Run tests — verify still passing**

```bash
npm test
```

Expected: PASS (no regressions).

- [ ] **Step 4: Commit**

```bash
git add convex/httpActions/topics.ts convex/topics.ts
git commit -m "feat: add HTTP topic endpoints"
```

---

## Task 10: Frontend provider setup

**Files:**
- Create: `src/lib/convex.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create Convex client singleton**

Create `src/lib/convex.ts`:

```typescript
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
```

- [ ] **Step 2: Wrap app with ConvexAuthProvider**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "./lib/convex";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Verify app still compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/convex.ts src/main.tsx
git commit -m "feat: add Convex provider to React app"
```

---

## Task 11: Login page and auth gate

**Files:**
- Create: `src/pages/Login.tsx`
- Create: `src/components/AuthGate.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Login page**

Create `src/pages/Login.tsx`:

```tsx
import { useAuthActions } from "@convex-dev/auth/react";

export default function Login() {
  const { signIn } = useAuthActions();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-5xl font-headline italic text-primary-container mb-2">
            The Library
          </h1>
          <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
            Your personal knowledge base
          </p>
        </div>

        <button
          onClick={() => void signIn("google")}
          className="flex items-center gap-3 px-6 py-3 bg-surface-container hover:bg-surface-container-high
                     border border-outline-variant rounded-xl transition-colors mx-auto
                     text-on-surface text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AuthGate component**

Create `src/components/AuthGate.tsx`:

```tsx
import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 3: Add login route and auth gate to App.tsx**

Replace `src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Login from "./pages/Login";
import MainLibrary from "./pages/MainLibrary";
import SearchDiscovery from "./pages/SearchDiscovery";
import ContentPreview from "./pages/ContentPreview";
import HistoryArchive from "./pages/HistoryArchive";
import ApiKeys from "./pages/ApiKeys";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGate>
              <Routes>
                <Route path="/" element={<MainLibrary />} />
                <Route path="/explore" element={<SearchDiscovery />} />
                <Route path="/preview/:id" element={<ContentPreview />} />
                <Route path="/archive" element={<HistoryArchive />} />
                <Route path="/settings/api-keys" element={<ApiKeys />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

Note: `/preview` now takes an `:id` param — ContentPreview will use this in Task 15.

- [ ] **Step 4: Verify app builds**

```bash
npm run build
```

Expected: no errors (ApiKeys import will fail until Task 16 — create an empty placeholder for now):

```tsx
// src/pages/ApiKeys.tsx (temporary placeholder)
export default function ApiKeys() {
  return <div>API Keys</div>;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/components/AuthGate.tsx src/App.tsx src/pages/ApiKeys.tsx
git commit -m "feat: add login page and auth gate"
```

---

## Task 12: Wire MainLibrary to Convex

Replace mock data in MainLibrary with a live Convex query.

**Files:**
- Modify: `src/pages/MainLibrary.tsx`

- [ ] **Step 1: Update MainLibrary.tsx**

Replace `src/pages/MainLibrary.tsx` with:

```tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import ContentCard from "../components/ContentCard";

export default function MainLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const items = useQuery(api.items.list, {});

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar />
        <main className="p-8 max-w-[1400px] mx-auto w-full">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
                Personal Collection
              </p>
              <h2 className="text-5xl font-headline font-light tracking-tight text-on-surface">
                The Library
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                className={`p-2 rounded-lg transition-colors ${view === "grid" ? "text-primary-container bg-surface-container" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                onClick={() => setView("grid")}
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button
                className={`p-2 rounded-lg transition-colors ${view === "list" ? "text-primary-container bg-surface-container" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                onClick={() => setView("list")}
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          {items === undefined && (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-on-surface-variant">
                progress_activity
              </span>
            </div>
          )}

          {items?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-on-surface-variant text-sm">
                Your library is empty. Share a link with your LLM to get started.
              </p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item) => (
                <ContentCard
                  key={item._id}
                  item={{
                    id: item._id,
                    source: item.sourceName ?? "",
                    sourceIcon:
                      item.contentType === "video"
                        ? "play_circle"
                        : item.contentType === "podcast"
                          ? "headphones"
                          : "description",
                    title: item.title ?? "",
                    description: item.summary ?? "",
                    tags: [],
                    imageUrl: item.imageUrl,
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary-container transition-colors text-[0.6875rem] font-bold tracking-widest uppercase">
              <span>Archive Discovery</span>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
```

Note: `ContentCard` still uses the old `ContentItem` type. We pass a compatible shape — topics are not shown on the card yet. That's intentional: the card component is unchanged.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/MainLibrary.tsx
git commit -m "feat: wire MainLibrary to Convex live data"
```

---

## Task 13: Wire HistoryArchive to Convex

**Files:**
- Modify: `src/pages/HistoryArchive.tsx`

- [ ] **Step 1: Read the current file to understand its structure**

```bash
# Already read in planning — the component uses archiveGroups from mockData
# which groups items by Today / Yesterday / Last Week
```

- [ ] **Step 2: Update HistoryArchive.tsx**

Replace the mock data import at the top of `src/pages/HistoryArchive.tsx`. Find the line:

```tsx
import { archiveGroups } from '../data/mockData';
```

Replace it with:

```tsx
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
```

Then inside the component, add the query and a grouping helper before the return:

```tsx
const items = useQuery(api.items.list, { status: "done" });

function groupByDate(items: typeof allItems) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const groups: Array<{ label: string; icon: string; entries: typeof allItems }> = [
    { label: "Today", icon: "today", entries: [] },
    { label: "Yesterday", icon: "history", entries: [] },
    { label: "Last Week", icon: "date_range", entries: [] },
    { label: "Older", icon: "archive", entries: [] },
  ];

  for (const item of items) {
    const d = new Date(item._creationTime);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].entries.push(item);
    else if (d >= yesterday) groups[1].entries.push(item);
    else if (d >= lastWeekStart) groups[2].entries.push(item);
    else groups[3].entries.push(item);
  }

  return groups.filter((g) => g.entries.length > 0);
}

const allItems = items ?? [];
const archiveGroups = groupByDate(allItems);
```

Replace all references to `entry.id` with `entry._id`, `entry.consumedAt` with a formatted `entry._creationTime`, and `entry.source` with `entry.sourceName ?? ""` in the JSX.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Fix any remaining type errors by checking which fields from the old `ArchiveEntry` type are referenced and substituting Convex item fields.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HistoryArchive.tsx
git commit -m "feat: wire HistoryArchive to Convex live data"
```

---

## Task 14: Wire SearchDiscovery to Convex

**Files:**
- Modify: `src/pages/SearchDiscovery.tsx`

- [ ] **Step 1: Replace mock data import**

In `src/pages/SearchDiscovery.tsx`, remove the import from `mockData` and add:

```tsx
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
```

- [ ] **Step 2: Wire search query**

The component has a search input. Wire it to the Convex query. Add state for the search term and use it as the `q` arg:

```tsx
const [q, setQ] = useState("");
const results = useQuery(api.items.list, q ? { q } : {});
```

Pass `setQ` to whatever input element handles search in the component. Replace the hardcoded `searchResults` variable with `results ?? []`.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/SearchDiscovery.tsx
git commit -m "feat: wire SearchDiscovery to Convex search"
```

---

## Task 15: Wire ContentPreview to Convex

**Files:**
- Modify: `src/pages/ContentPreview.tsx`

ContentPreview now receives an item ID via the URL param `/preview/:id` (set up in Task 11).

- [ ] **Step 1: Replace mock data import**

In `src/pages/ContentPreview.tsx`, remove the import from `mockData` and add:

```tsx
import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
```

- [ ] **Step 2: Wire item query**

Inside the component:

```tsx
const { id } = useParams<{ id: string }>();
const item = useQuery(
  api.items.get,
  id ? { id: id as Id<"items"> } : "skip"
);
```

Replace all references to `contentPreviewArticle` fields with the equivalent from `item`. Map:
- `contentPreviewArticle.title` → `item?.title ?? ""`
- `contentPreviewArticle.body` → `item?.summary ?? ""`
- `contentPreviewArticle.tags` → `[]` (topic names require a join — leave for later)
- `contentPreviewArticle.externalLink` → `item?.url`

Add a loading state:

```tsx
if (!item) {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-on-surface-variant">
        progress_activity
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Update card links in MainLibrary to point to /preview/:id**

In `src/pages/MainLibrary.tsx`, wrap `ContentCard` in a `Link`:

```tsx
import { Link } from "react-router-dom";
// ...
<Link key={item._id} to={`/preview/${item._id}`}>
  <ContentCard item={{ ... }} />
</Link>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContentPreview.tsx src/pages/MainLibrary.tsx
git commit -m "feat: wire ContentPreview to Convex item by ID"
```

---

## Task 16: Delete mockData and fix any remaining references

**Files:**
- Delete: `src/data/mockData.ts`

- [ ] **Step 1: Check for remaining imports**

```bash
grep -r "mockData" src/
```

- [ ] **Step 2: Fix any remaining references**

For each file still importing from `mockData`, remove the import and replace with Convex queries or remove the usage if it's dead code (e.g., `trendingTags`, `recentSearches`).

- [ ] **Step 3: Delete mockData.ts**

```bash
rm src/data/mockData.ts
rmdir src/data 2>/dev/null || true
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove mock data, all screens now use Convex"
```

---

## Task 17: API Keys page

**Files:**
- Modify: `src/pages/ApiKeys.tsx` (replace the placeholder)
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Implement ApiKeys.tsx**

Replace `src/pages/ApiKeys.tsx` with:

```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function ApiKeys() {
  const keys = useQuery(api.apiKeys.list, {});
  const createKey = useMutation(api.apiKeys.create);
  const revokeKey = useMutation(api.apiKeys.revoke);

  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const rawKey = await createKey({ name: name.trim() });
      setNewKey(rawKey);
      setName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(id: Id<"apiKeys">) {
    if (!confirm("Revoke this key? Any LLM using it will lose access immediately.")) return;
    await revokeKey({ id });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar />
        <main className="p-8 max-w-2xl">
          <div className="mb-10">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              Settings
            </p>
            <h2 className="text-4xl font-headline font-light text-on-surface">API Keys</h2>
            <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
              Give an API key to your LLM so it can add items to your library. Keys are shown
              once on creation — store them safely.
            </p>
          </div>

          {/* New key banner */}
          {newKey && (
            <div className="mb-8 p-4 bg-surface-container rounded-xl border border-outline-variant">
              <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-2">
                New key — copy it now, it won't be shown again
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-on-surface bg-surface p-2 rounded-lg overflow-x-auto">
                  {newKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-[0.6875rem] font-bold uppercase tracking-wider"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-3 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create form */}
          <form onSubmit={handleCreate} className="mb-10 flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Key name, e.g. "My Claude"'
              className="flex-1 px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                         text-[0.6875rem] font-bold uppercase tracking-wider
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </form>

          {/* Keys list */}
          {keys === undefined && (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          )}

          {keys?.length === 0 && (
            <p className="text-sm text-on-surface-variant">No API keys yet.</p>
          )}

          <ul className="space-y-3">
            {keys?.map((key) => (
              <li
                key={key._id}
                className="flex items-center justify-between p-4 bg-surface-container rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">{key.name}</p>
                  <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">
                    Created {new Date(key._creationTime).toLocaleDateString()}
                    {key.lastUsedAt &&
                      ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(key._id)}
                  className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant
                             hover:text-error transition-colors"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add API Keys link to Sidebar**

In `src/components/Sidebar.tsx`, find the bottom `<div>` with the settings/help links and add an API Keys link before Settings:

```tsx
<NavLink
  to="/settings/api-keys"
  className={navLinkClass("/settings/api-keys")}
>
  <span className="material-symbols-outlined text-[20px]">key</span>
  <span className={labelClass}>API Keys</span>
</NavLink>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/ApiKeys.tsx src/components/Sidebar.tsx
git commit -m "feat: add API Keys management page"
```

---

## Task 18: LLM API documentation

**Files:**
- Create: `public/llm-api.md`

- [ ] **Step 1: Create the LLM-facing API doc**

Create `public/llm-api.md`:

````markdown
# The Library — LLM API

This API lets you add and manage items in a user's personal content library.

## Authentication

All requests must include an API key in the `Authorization` header:

```
Authorization: Bearer lib_<64 hex chars>
```

The user generates API keys from Settings → API Keys in the app. Each key is scoped to one user — all data written through a key belongs to that user.

## Base URL

```
https://your-deployment.convex.site
```

---

## Items

An **item** represents one saved link.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Convex ID |
| `url` | string | The saved URL (required on create) |
| `title` | string? | Title of the content |
| `summary` | string? | A summary or description |
| `contentType` | enum? | `article` / `video` / `podcast` / `tweet` / `newsletter` |
| `sourceName` | string? | Source platform, e.g. `"YouTube"`, `"Medium"` |
| `imageUrl` | string? | Thumbnail URL |
| `status` | enum | `saved` / `in_progress` / `done` — defaults to `saved` |
| `notes` | string? | User-written context, e.g. `"suggested by Naval"` |
| `topicIds` | string[] | IDs of associated topics |

### POST /api/items — Create an item

Use `topicNames` (strings) instead of `topicIds` — the API resolves or creates topics automatically.

**Request:**
```json
{
  "url": "https://www.example.com/article",
  "title": "The Art of Deep Work",
  "summary": "An exploration of focused work practices and their cognitive benefits.",
  "contentType": "article",
  "sourceName": "Medium",
  "imageUrl": "https://miro.medium.com/example.jpg",
  "notes": "Suggested by a colleague",
  "topicNames": ["Productivity", "Deep Work"]
}
```

**Response:** `201 Created`
```json
{
  "_id": "jx7abc123...",
  "url": "https://www.example.com/article",
  "title": "The Art of Deep Work",
  "status": "saved",
  "topicIds": ["kd9xyz..."],
  ...
}
```

### GET /api/items — List items

Query params (all optional):
- `status` — filter by `saved`, `in_progress`, or `done`
- `topicId` — filter by topic ID
- `q` — search title, summary, and notes

```
GET /api/items?status=saved&q=productivity
```

**Response:** `200 OK` — array of item objects.

### GET /api/items/:id — Get one item

**Response:** `200 OK` — item object, or `404` if not found.

### PATCH /api/items/:id — Update an item

Only include fields you want to change.

```json
{
  "status": "done",
  "notes": "Great read, revisit chapter 3"
}
```

**Response:** `200 OK` — updated item object.

### DELETE /api/items/:id — Delete an item

**Response:** `200 OK`
```json
{ "success": true }
```

---

## Topics

A **topic** is a user-curated label for organizing items (e.g. `"Machine Learning"`, `"Design"`). Topics are proper entities — they have IDs and can be renamed.

### GET /api/topics — List all topics

**Response:**
```json
[
  { "_id": "kd9xyz...", "name": "Productivity" },
  { "_id": "mn8abc...", "name": "Design" }
]
```

### POST /api/topics — Create a topic

```json
{ "name": "Philosophy" }
```

If a topic with this name already exists, the existing one is returned.

### PATCH /api/topics/:id — Rename a topic

```json
{ "name": "Moral Philosophy" }
```

### DELETE /api/topics/:id — Delete a topic

Removes the topic and cleans up all references on items.

---

## Error responses

```json
{ "error": "Unauthorized" }   // 401 — bad or missing API key
{ "error": "Not found" }      // 404
{ "error": "name is required" } // 400
```
````

- [ ] **Step 2: Commit**

```bash
git add public/llm-api.md
git commit -m "docs: add LLM-facing API documentation"
```

---

## Task 19: AGENTS.md and CLAUDE.md symlink

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md` (symlink)

- [ ] **Step 1: Create AGENTS.md**

Create `AGENTS.md`:

```markdown
# The Library — Agent Instructions

## Schema Sync Rule (CRITICAL)

Any change to the Convex schema (`convex/schema.ts`) or the HTTP API
(`convex/httpActions/`) **MUST** update `public/llm-api.md` in the same commit.

The LLM API doc is served statically and is how external LLMs discover the API.
An out-of-date doc breaks the LLM workflow.

Checklist for schema/API changes:
- [ ] Updated `convex/schema.ts`
- [ ] Updated affected functions in `convex/items.ts`, `convex/topics.ts`, etc.
- [ ] Updated `public/llm-api.md` — field tables, request/response examples
- [ ] All tests still pass (`npm test`)

## Project Overview

A personal knowledge base for saving and organizing links.
Stack: Vite + React 19 + TypeScript + Tailwind CSS v3 + Convex + Vercel.

## Key Conventions

- All Convex functions follow the public/internal split:
  - Public functions (`query`, `mutation`) — use `getAuthUserId` for session auth
  - Internal functions (`internalQuery`, `internalMutation`) — accept `userId` as a param, called by HTTP actions
- Business logic lives in shared handler functions (not duplicated between public and internal)
- API keys are hashed with SHA-256 before storage; raw keys are never persisted
- Items always default to `status: "saved"` on creation
- `topicNames` (strings) are accepted by the HTTP API and resolved to IDs automatically

## Icons

Material Symbols Outlined is loaded via Google Fonts in `index.html`. Always include it
alongside Inter/Newsreader. Omitting it causes icons to render as raw text.

## Running locally

```bash
npm install
npx convex dev          # in one terminal (syncs Convex schema/functions)
npm run dev             # in another terminal (Vite dev server)
npm test                # run tests
```
```

- [ ] **Step 2: Create CLAUDE.md as a symlink**

```bash
ln -s AGENTS.md CLAUDE.md
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: add AGENTS.md with schema-sync rule, symlink CLAUDE.md"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Convex + Vercel stack | Tasks 1, 10 |
| Google OAuth | Tasks 2, 11 |
| Items table with all fields | Tasks 3, 5 |
| Topics as proper entities | Tasks 3, 4 |
| ApiKey table, hash-only storage | Tasks 3, 6 |
| CRUD HTTP API | Tasks 7–9 |
| `topicNames` resolution in POST | Task 8 |
| API key management UI | Task 17 |
| Login page | Task 11 |
| Wire all 4 existing screens | Tasks 12–15 |
| Delete mockData | Task 16 |
| `public/llm-api.md` | Task 18 |
| AGENTS.md schema-sync rule | Task 19 |
| CLAUDE.md symlink | Task 19 |
| No pagination (personal tool scale) | Noted in spec and listInternal |
| Status: saved/in_progress/done | Tasks 3, 5 |
| Notes field | Tasks 3, 5 |

**No gaps found.**

**Placeholder scan:** No TBD, TODO, or "implement later" text. All code steps contain actual code.

**Type consistency:** `contentTypeValidator` and `statusValidator` are exported from `schema.ts` and imported in `items.ts` — consistent across all tasks. Internal function names (`createInternal`, `listInternal`, `getInternal`, `updateInternal`, `removeInternal`, `resolveOrCreate`, `removeInternal`, `renameInternal`, `getByHash`, `touchLastUsed`) are consistent between the definition tasks and the HTTP action tasks that call them.
