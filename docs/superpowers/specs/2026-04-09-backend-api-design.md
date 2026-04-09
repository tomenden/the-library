# The Library — Backend & API Design

**Date:** 2026-04-09
**Status:** Approved

## Problem

Links accumulate from Twitter, WhatsApp, blog posts, YouTube, and elsewhere faster than they can be consumed. This app is a personal knowledge base for organizing saved links: easy to add (including via LLM), easy to browse, search, and track what's been consumed.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite (existing) | Already built |
| Hosting | Vercel | Static + edge functions if ever needed |
| Backend | Convex | Database, auth, real-time subscriptions, and HTTP API in one service — no separate backend needed |
| Auth | Google OAuth via Convex Auth | Single sign-in method, no password management |

---

## Data Model

### Item

The core entity — one saved link.

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `userId` | Convex ID → User | Owner |
| `url` | string | Required. The saved link. |
| `title` | string? | LLM-generated or user-provided; optional at creation |
| `summary` | string? | LLM-generated description; optional at creation |
| `contentType` | enum | `article` / `video` / `podcast` / `tweet` / `newsletter` |
| `sourceName` | string | e.g. "Medium", "YouTube", "Twitter" |
| `imageUrl` | string? | Optional thumbnail |
| `status` | enum | `saved` / `in_progress` / `done` |
| `notes` | string? | User-written freeform context — "suggested by Naval", personal reminders, etc. |
| `topicIds` | Convex ID[] | References to Topic records |
| `createdAt` | number | Unix timestamp |
| `updatedAt` | number | Unix timestamp |

### Topic

User-curated vocabulary for organizing items. Per-user, proper entities (not raw strings) so they can be renamed, counted, and browsed reliably.

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `userId` | Convex ID → User | Owner |
| `name` | string | Canonical label, e.g. "Machine Learning" |
| `createdAt` | number | Unix timestamp |

Topics are user-scoped — two users can both have a "Design" topic independently.

### ApiKey

Allows LLMs (or any external tool) to call the API on behalf of a user.

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `userId` | Convex ID → User | Owner |
| `name` | string | User-assigned label, e.g. "My Claude" |
| `keyHash` | string | SHA-256 hash of the raw key — never stored plaintext |
| `createdAt` | number | Unix timestamp |
| `lastUsedAt` | number? | Updated on each successful API call |

The raw key is shown to the user exactly once on creation and never retrievable again.

---

## LLM-Facing HTTP API

Implemented as **Convex HTTP Actions**. All endpoints require:

```
Authorization: Bearer <api-key>
Content-Type: application/json
```

The API key is resolved to a user server-side; all data is automatically scoped to that user.

### Items

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/items` | Create a new item |
| `GET` | `/api/items` | List items (supports `?status=`, `?topicId=`, `?q=` search). No pagination — personal tool scale. |
| `GET` | `/api/items/:id` | Get a single item |
| `PATCH` | `/api/items/:id` | Update status, notes, topics, title, summary |
| `DELETE` | `/api/items/:id` | Delete an item |

**POST /api/items body:**
```json
{
  "url": "https://...",
  "title": "optional",
  "summary": "optional",
  "contentType": "article",
  "sourceName": "Medium",
  "imageUrl": "optional",
  "notes": "optional",
  "topicNames": ["AI", "Design"]
}
```

`topicNames` is accepted as strings for convenience — the API resolves or creates the corresponding Topic records automatically. This makes it easy for an LLM to use without needing to know topic IDs upfront.

### Topics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/topics` | List all user topics |
| `POST` | `/api/topics` | Create a topic |
| `PATCH` | `/api/topics/:id` | Rename a topic |
| `DELETE` | `/api/topics/:id` | Delete a topic — removes the topic ID from all item `topicIds` arrays; items themselves are unaffected |

---

## Schema Documentation File

A hand-crafted `public/llm-api.md` is checked into the repo and served statically at `yourdomain.com/llm-api.md`. It describes:
- What the API does and how to authenticate
- All endpoints with request/response examples
- The full data model
- Topic resolution behaviour (names → IDs)

**Rule (enforced via AGENTS.md / CLAUDE.md):** Any change to the data model or API must update `public/llm-api.md` in the same commit.

---

## App UI — New Screens & Flows

These extend the existing four screens:

1. **Google login page** — auth gate, redirects to main library after sign-in
2. **API Keys page** — accessible from sidebar/settings:
   - List existing keys (name, created date, last used)
   - Create key: enter a name → key displayed once, copy-to-clipboard
   - Revoke: delete a key
3. **Topic management** — inline from item cards (chip click → rename/delete), no dedicated page needed initially
4. **Wire existing screens to Convex** — replace all mock data (`src/data/mockData.ts`) with live Convex queries scoped to the signed-in user

---

## LLM Integration (out of app scope for now)

The app exposes the API; the LLM workflow is external. The expected flow is:
1. User shares a URL with their LLM (via any interface)
2. LLM fetches `yourdomain.com/llm-api.md` to understand the API
3. LLM analyses the URL and calls `POST /api/items` with structured data
4. Item appears in the library immediately (Convex real-time)

Adding LLM analysis from within the app is a future extension — the architecture supports it without changes.

---

## Security Notes

- API keys are hashed with SHA-256 before storage; the raw key is never persisted
- All Convex queries and HTTP endpoints validate that the requesting user owns the data being accessed
- Google OAuth is the only login method — no password surface
- Topics and items are always user-scoped at the database query level, not just in application code
