# Core Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix language across the app, wire up all stubbed UI actions (contextual status labels, favorites, delete, notes), add manual Add Content flow, and implement the missing filtered views (Unread, Favorites, Articles, Videos, Audio).

**Architecture:** Schema gets one new field (`isFavorite`). Backend gets two new public mutations (`toggleFavorite`, `updateNotes`) and an extended `list` query supporting `isFavorite` and `contentType` filters. UI changes are isolated to existing pages plus five new thin filter-view pages that reuse `ContentCard`. `Add Content` is a modal, not a new page.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS v3 + Convex (`convex-dev/auth`, `convex/react`) + Vitest (`convex-test`).

---

## File Map

**Modified:**
- `convex/schema.ts` — add `isFavorite: v.optional(v.boolean())` to items table
- `convex/items.ts` — add `toggleFavorite`, extend `list`/`listInternal` with `isFavorite`/`contentType` filters
- `convex/items.test.ts` — add tests for new mutations and filters
- `src/pages/ContentPreview.tsx` — wire up all 4 action buttons + notes persistence, contextual labels
- `src/pages/MainLibrary.tsx` — wire Add Content button to modal
- `src/components/TopBar.tsx` — wire Add Content button to modal
- `src/App.tsx` — add routes for 5 new pages
- `src/components/Sidebar.tsx` — no changes needed (links already exist)

**Created:**
- `src/components/AddContentModal.tsx` — modal for manually saving a URL with metadata
- `src/pages/Favorites.tsx` — items where `isFavorite === true`
- `src/pages/UnreadItems.tsx` — items where `status === "saved"`
- `src/pages/FilteredItems.tsx` — reusable page for articles/videos/audio content-type filters

---

## Task 1: Language Audit — Fix All Copy

**Files:**
- Modify: `src/pages/ContentPreview.tsx`
- Modify: `src/pages/HistoryArchive.tsx`
- Modify: `src/pages/MainLibrary.tsx`
- Modify: `src/components/TopBar.tsx`
- Modify: `src/components/Sidebar.tsx`

The agreed naming from the design:
- "Mark as Consumed" → contextual based on contentType: **"Mark as Read"** (article/newsletter/tweet), **"Mark as Watched"** (video), **"Mark as Listened"** (podcast/audio). Default: "Mark as Read".
- The backend status field stays `"done"` — no backend changes.
- "Add Content" stays as-is (correct).
- "The Gallery" in TopBar stays (it's the subtitle branding, not the app name).
- "Archive" in sidebar/HistoryArchive stays (it's the history of done items).
- "Favorite Item" → "Save to Favorites" (clearer action verb).

- [ ] **Step 1: Fix ContentPreview button labels**

Open `src/pages/ContentPreview.tsx`. Replace the hardcoded "Mark as Consumed" with a helper and update "Favorite Item":

```tsx
// Add this helper above the return statement (after const savedDaysAgo line):
const consumedLabel =
  item.contentType === "video"
    ? "Mark as Watched"
    : item.contentType === "podcast"
      ? "Mark as Listened"
      : "Mark as Read";
```

Then replace the button text in the Actions aside:
```tsx
// Line ~162: change "Mark as Consumed" to:
<span className="text-sm font-medium">{consumedLabel}</span>

// Line ~168: change "Favorite Item" to:
<span className="text-sm font-medium">Save to Favorites</span>
```

- [ ] **Step 2: Verify no other wrong copy**

Check `HistoryArchive.tsx`, `MainLibrary.tsx`, `TopBar.tsx`, `Sidebar.tsx` for any "consumed" text. There is none — only ContentPreview had it.

- [ ] **Step 3: Run the app and visually confirm**

```bash
npm run dev
```

Navigate to any item preview. For an article item, the button should say "Mark as Read". No test needed for copy changes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ContentPreview.tsx
git commit -m "fix: contextual consumed label (read/watched/listened by content type)"
```

---

## Task 2: Schema — Add `isFavorite` Field

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/items.test.ts`

- [ ] **Step 1: Write failing test**

In `convex/items.test.ts`, add after the existing tests:

```typescript
test("toggleFavorite: marks item as favorite", async () => {
  const t = convexTest(schema);
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Test", email: "t@t.com" });
  });
  const id = await t.run(async (ctx) => {
    return await ctx.db.insert("items", {
      userId,
      url: "https://example.com",
      status: "saved",
      topicIds: [],
      isFavorite: false,
    });
  });

  // Toggle on
  await t.mutation(internal.items.toggleFavoriteInternal, { id, userId });
  const after = await t.run(async (ctx) => ctx.db.get(id));
  expect(after?.isFavorite).toBe(true);

  // Toggle off
  await t.mutation(internal.items.toggleFavoriteInternal, { id, userId });
  const after2 = await t.run(async (ctx) => ctx.db.get(id));
  expect(after2?.isFavorite).toBe(false);
});

test("listInternal: filters by isFavorite", async () => {
  const t = convexTest(schema);
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Test", email: "t@t.com" });
  });
  await t.run(async (ctx) => {
    await ctx.db.insert("items", { userId, url: "https://a.com", status: "saved", topicIds: [], isFavorite: true });
    await ctx.db.insert("items", { userId, url: "https://b.com", status: "saved", topicIds: [], isFavorite: false });
  });

  const favs = await t.query(internal.items.listInternal, { userId, isFavorite: true });
  expect(favs).toHaveLength(1);
  expect(favs[0].url).toBe("https://a.com");
});

test("listInternal: filters by contentType", async () => {
  const t = convexTest(schema);
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Test", email: "t@t.com" });
  });
  await t.run(async (ctx) => {
    await ctx.db.insert("items", { userId, url: "https://v.com", status: "saved", topicIds: [], contentType: "video" });
    await ctx.db.insert("items", { userId, url: "https://a.com", status: "saved", topicIds: [], contentType: "article" });
  });

  const videos = await t.query(internal.items.listInternal, { userId, contentType: "video" });
  expect(videos).toHaveLength(1);
  expect(videos[0].url).toBe("https://v.com");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: 3 new tests fail with "toggleFavoriteInternal is not a function" and type errors.

- [ ] **Step 3: Update schema**

In `convex/schema.ts`, add `isFavorite` to the items table definition:

```typescript
// In the items defineTable, add after topicIds:
isFavorite: v.optional(v.boolean()),
```

The full items table should look like:
```typescript
items: defineTable({
  userId: v.id("users"),
  url: v.string(),
  title: v.optional(v.string()),
  summary: v.optional(v.string()),
  contentType: v.optional(v.union(
    v.literal("article"),
    v.literal("video"),
    v.literal("podcast"),
    v.literal("tweet"),
    v.literal("newsletter"),
  )),
  sourceName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  status: v.union(v.literal("saved"), v.literal("in_progress"), v.literal("done")),
  notes: v.optional(v.string()),
  topicIds: v.array(v.id("topics")),
  isFavorite: v.optional(v.boolean()),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"]),
```

- [ ] **Step 4: Update items.ts — add toggleFavoriteInternal and extend list/listInternal**

In `convex/items.ts`:

**Add to internal exports:**
```typescript
export const toggleFavoriteInternal = internalMutation({
  args: { id: v.id("items"), userId: v.id("users") },
  handler: async (ctx, { id, userId }) => {
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { isFavorite: !(item.isFavorite ?? false) });
  },
});
```

**Add public mutation:**
```typescript
export const toggleFavorite = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { isFavorite: !(item.isFavorite ?? false) });
  },
});
```

**Add public mutation for notes persistence:**
```typescript
export const saveNotes = mutation({
  args: { id: v.id("items"), notes: v.string() },
  handler: async (ctx, { id, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { notes });
  },
});
```

**Extend `listInternal` to support `isFavorite` and `contentType` filters** (add these args and filter logic to the existing handler):

The updated `listInternal` args:
```typescript
args: {
  userId: v.id("users"),
  status: v.optional(v.union(v.literal("saved"), v.literal("in_progress"), v.literal("done"))),
  topicId: v.optional(v.id("topics")),
  q: v.optional(v.string()),
  isFavorite: v.optional(v.boolean()),
  contentType: v.optional(v.union(
    v.literal("article"), v.literal("video"), v.literal("podcast"),
    v.literal("tweet"), v.literal("newsletter"),
  )),
},
```

In the handler, after existing filters add:
```typescript
if (args.isFavorite !== undefined) {
  items = items.filter((i) => (i.isFavorite ?? false) === args.isFavorite);
}
if (args.contentType !== undefined) {
  items = items.filter((i) => i.contentType === args.contentType);
}
```

**Extend public `list` query** with same `isFavorite` and `contentType` args and the same filter logic, so the React app can use them directly.

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: All 3 new tests pass. All existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/items.ts convex/items.test.ts
git commit -m "feat: add isFavorite field, toggleFavorite/saveNotes mutations, contentType/isFavorite list filters"
```

---

## Task 3: Wire Up ContentPreview Actions

**Files:**
- Modify: `src/pages/ContentPreview.tsx`

Wire up the four stubbed buttons: Mark as Read/Watched/Listened, Save to Favorites, Delete, and Notes persistence.

- [ ] **Step 1: Import mutations**

At the top of `src/pages/ContentPreview.tsx`, add to the convex/react import:
```tsx
import { useQuery, useMutation } from "convex/react";
```
(replace the current `useQuery` only import)

And import the mutations:
```tsx
// after existing imports
```

The full imports block should be:
```tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import TagChip from "../components/TagChip";
```

- [ ] **Step 2: Add mutation hooks and notes sync**

After `const [notes, setNotes] = useState(item?.notes ?? "");`, add:

```tsx
const updateStatus = useMutation(api.items.update);
const toggleFavorite = useMutation(api.items.toggleFavorite);
const saveNotes = useMutation(api.items.saveNotes);
const removeItem = useMutation(api.items.remove);

// Sync notes state when item loads
useEffect(() => {
  setNotes(item?.notes ?? "");
}, [item?.notes]);
```

- [ ] **Step 3: Add handler functions**

After the `useEffect`, add:

```tsx
async function handleMarkDone() {
  if (!item || !id) return;
  const newStatus = item.status === "done" ? "saved" : "done";
  await updateStatus({ id: id as Id<"items">, status: newStatus });
}

async function handleToggleFavorite() {
  if (!id) return;
  await toggleFavorite({ id: id as Id<"items"> });
}

async function handleDelete() {
  if (!id) return;
  if (!confirm("Delete this item from your library?")) return;
  await removeItem({ id: id as Id<"items"> });
  navigate("/");
}

async function handleSaveNotes() {
  if (!id) return;
  await saveNotes({ id: id as Id<"items">, notes });
}
```

- [ ] **Step 4: Wire up buttons in JSX**

Replace the three action buttons (lines ~157–173 in the aside) with:

```tsx
{/* Actions */}
<div className="bg-surface-container-lowest rounded-xl editorial-shadow divide-y divide-outline-variant/20">
  <button
    onClick={handleMarkDone}
    className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl text-left"
  >
    <span
      className="material-symbols-outlined text-primary-container"
      style={{ fontVariationSettings: item?.status === "done" ? "'FILL' 1" : "'FILL' 0" }}
    >
      check_circle
    </span>
    <span className="text-sm font-medium">
      {item?.status === "done" ? "Marked as " + consumedLabel.replace("Mark as ", "") : consumedLabel}
    </span>
  </button>
  <button
    onClick={handleToggleFavorite}
    className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors text-left"
  >
    <span
      className="material-symbols-outlined text-on-surface-variant"
      style={{ fontVariationSettings: item?.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
    >
      star
    </span>
    <span className="text-sm font-medium">
      {item?.isFavorite ? "Saved to Favorites" : "Save to Favorites"}
    </span>
  </button>
  <button
    onClick={handleDelete}
    className="w-full flex items-center gap-3 px-5 py-4 text-error hover:bg-error-container/20 transition-colors rounded-b-xl text-left"
  >
    <span className="material-symbols-outlined text-error">delete</span>
    <span className="text-sm font-medium">Delete from Library</span>
  </button>
</div>
```

- [ ] **Step 5: Wire up notes save**

Add a save button below the textarea in the Private Notes card:

```tsx
{/* Private Notes */}
<div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
  <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-3">Private Notes</p>
  <textarea
    className="w-full text-sm text-on-surface-variant bg-transparent border border-outline-variant/40 rounded-lg p-3 min-h-[96px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
    placeholder="Add your reflections or context here..."
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
  />
  {notes !== (item?.notes ?? "") && (
    <button
      onClick={handleSaveNotes}
      className="mt-2 text-[0.6875rem] font-bold uppercase tracking-wider text-primary-container hover:opacity-80"
    >
      Save Notes
    </button>
  )}
</div>
```

- [ ] **Step 6: Run dev and test manually**

```bash
npm run dev
```

Open any item preview. Verify:
- "Mark as Read" (or Watched/Listened) toggles to "Read"/"Watched"/"Listened" state when clicked
- Star icon fills/unfills on favorite toggle
- Delete navigates back to gallery
- Notes show a "Save Notes" button when changed, disappears after save

- [ ] **Step 7: Commit**

```bash
git add src/pages/ContentPreview.tsx
git commit -m "feat: wire up mark as done, favorite, delete, and notes persistence in ContentPreview"
```

---

## Task 4: Add Content Modal

**Files:**
- Create: `src/components/AddContentModal.tsx`
- Modify: `src/components/TopBar.tsx`
- Modify: `src/pages/MainLibrary.tsx`

A modal overlay with a URL field and optional metadata. On submit it calls `api.items.create`.

- [ ] **Step 1: Create AddContentModal component**

Create `src/components/AddContentModal.tsx`:

```tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  onClose: () => void;
}

const CONTENT_TYPES = [
  { value: "", label: "Auto-detect" },
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "podcast", label: "Podcast" },
  { value: "newsletter", label: "Newsletter" },
  { value: "tweet", label: "Tweet" },
] as const;

export default function AddContentModal({ onClose }: Props) {
  const createItem = useMutation(api.items.create);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [contentType, setContentType] = useState("");
  const [topicNames, setTopicNames] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createItem({
        url: url.trim(),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        contentType: (contentType || undefined) as any,
        topicIds: [], // topics added later in ContentPreview
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-container-lowest rounded-2xl editorial-shadow w-full max-w-lg mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-headline font-light text-on-surface">Add to Library</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use the page title"
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface focus:outline-none focus:border-primary-container"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you saving this?"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border border-outline-variant
                         text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant
                         hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || saving}
              className="flex-1 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                         text-[0.6875rem] font-bold uppercase tracking-wider
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save to Library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire modal into TopBar**

In `src/components/TopBar.tsx`, add modal state and import:

```tsx
import { useState } from "react";
import AddContentModal from "./AddContentModal";
```

Add state in the component:
```tsx
const [showAdd, setShowAdd] = useState(false);
```

Wire the "Add Content" button's `onClick`:
```tsx
<button onClick={() => setShowAdd(true)} ...>
  Add Content
</button>
```

Add modal at bottom of return:
```tsx
{showAdd && <AddContentModal onClose={() => setShowAdd(false)} />}
```

- [ ] **Step 3: Wire modal into MainLibrary**

In `src/pages/MainLibrary.tsx`, import and add the same modal wiring to the "Add Content" button (if it exists there — check the file). The TopBar already has it, so just ensure there's no duplicate.

- [ ] **Step 4: Run dev and test**

```bash
npm run dev
```

Click "Add Content" in the top bar. Verify:
- Modal opens with backdrop blur
- URL field is auto-focused
- Submitting a valid URL creates an item and closes modal
- Item appears in gallery

- [ ] **Step 5: Commit**

```bash
git add src/components/AddContentModal.tsx src/components/TopBar.tsx src/pages/MainLibrary.tsx
git commit -m "feat: Add Content modal for manually saving URLs"
```

---

## Task 5: Filtered Views — Favorites, Unread, Articles, Videos, Audio

**Files:**
- Create: `src/pages/Favorites.tsx`
- Create: `src/pages/UnreadItems.tsx`
- Create: `src/pages/FilteredItems.tsx`
- Modify: `src/App.tsx`

These are thin wrappers around `api.items.list` with different filter args, sharing the same layout as MainLibrary.

- [ ] **Step 1: Create FilteredItems.tsx (reusable base)**

Create `src/pages/FilteredItems.tsx`:

```tsx
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import ContentCard from "../components/ContentCard";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

interface Props {
  title: string;
  subtitle: string;
  filter: Parameters<typeof api.items.list>[0] extends { args: infer A } ? never : Record<string, unknown>;
}

// We'll pass filter as a plain object compatible with api.items.list args
export default function FilteredItems({
  title,
  subtitle,
  filter,
}: {
  title: string;
  subtitle: string;
  filter: { status?: "saved" | "in_progress" | "done"; contentType?: "article" | "video" | "podcast" | "tweet" | "newsletter"; isFavorite?: boolean };
}) {
  const navigate = useNavigate();
  const items = useQuery(api.items.list, filter);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar />
        <main className="p-8">
          <div className="mb-8">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              {subtitle}
            </p>
            <h2 className="text-4xl font-headline font-light text-on-surface">{title}</h2>
          </div>

          {items === undefined && (
            <div className="flex items-center justify-center py-24">
              <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
            </div>
          )}

          {items?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-4">inbox</span>
              <p className="text-on-surface-variant text-sm">Nothing here yet.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items?.map((item) => (
              <ContentCard
                key={item._id}
                item={item}
                onClick={() => navigate(`/preview/${item._id}`)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Favorites.tsx**

Create `src/pages/Favorites.tsx`:

```tsx
import FilteredItems from "./FilteredItems";

export default function Favorites() {
  return (
    <FilteredItems
      title="Favorites"
      subtitle="Saved"
      filter={{ isFavorite: true }}
    />
  );
}
```

- [ ] **Step 3: Create UnreadItems.tsx**

Create `src/pages/UnreadItems.tsx`:

```tsx
import FilteredItems from "./FilteredItems";

export default function UnreadItems() {
  return (
    <FilteredItems
      title="Unread"
      subtitle="Queue"
      filter={{ status: "saved" }}
    />
  );
}
```

- [ ] **Step 4: Add routes in App.tsx**

In `src/App.tsx`, import and add routes:

```tsx
import Favorites from "./pages/Favorites";
import UnreadItems from "./pages/UnreadItems";
import FilteredItems from "./pages/FilteredItems";
```

Add these routes inside the AuthGate wrapper, alongside the existing routes:

```tsx
<Route path="/favorites" element={<Favorites />} />
<Route path="/unread" element={<UnreadItems />} />
<Route path="/articles" element={
  <FilteredItems title="Articles" subtitle="Format" filter={{ contentType: "article" }} />
} />
<Route path="/videos" element={
  <FilteredItems title="Videos" subtitle="Format" filter={{ contentType: "video" }} />
} />
<Route path="/audio" element={
  <FilteredItems title="Audio" subtitle="Format" filter={{ contentType: "podcast" }} />
} />
```

- [ ] **Step 5: Check ContentCard onClick prop**

The inventory noted ContentCard may have a broken `handleClick`. Open `src/components/ContentCard.tsx` and verify the `onClick` prop is used. If it has an internal `handleClick` that navigates to `/preview` without the ID, fix it to accept and use the `onClick` prop passed by FilteredItems.

The component should accept `{ item, onClick }` and call `onClick` (or `onClick?.()`) on click. Do not add navigation logic inside ContentCard — that belongs in the parent.

- [ ] **Step 6: Run dev and test**

```bash
npm run dev
```

Click each sidebar link: Unread, Favorites, Articles, Videos, Audio. Each should show a filtered list (or empty state). Clicking an item should navigate to its preview page.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Favorites.tsx src/pages/UnreadItems.tsx src/pages/FilteredItems.tsx src/App.tsx src/components/ContentCard.tsx
git commit -m "feat: Favorites, Unread, Articles, Videos, Audio filtered views"
```

---

## Task 6: Deploy to Production

**Files:** none changed

- [ ] **Step 1: Deploy Convex schema + functions**

```bash
npx convex deploy --env-file /tmp/env_prod.local
```

Wait for: `✔ Deployed Convex functions to https://colorful-beagle-698.convex.cloud`

- [ ] **Step 2: Deploy Vercel frontend**

```bash
npx vercel --prod
```

Wait for: `Aliased: https://the-library-sigma.vercel.app`

- [ ] **Step 3: Smoke test production**

Open `https://the-library-sigma.vercel.app` and verify:
- Sidebar links all work (Favorites, Unread, Articles, Videos, Audio)
- Add Content modal opens from TopBar
- ContentPreview actions work (mark done, favorite, delete, notes)
- Language is correct (Read/Watched/Listened)

- [ ] **Step 4: Commit if any final tweaks needed**

```bash
git add -p
git commit -m "fix: production smoke test fixes"
```
