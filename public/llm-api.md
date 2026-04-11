# The Library — LLM API

This API lets you add and manage items in a user's personal content library.

## Claude Skill

Install the [Claude skill](https://the-library-sigma.vercel.app/the-library/SKILL.md) to let Claude
save things to your library automatically. Download the `the-library/` folder as a zip and
upload it at claude.ai → Settings → Features → Agent Skills.

## Authentication

All requests must include an API key in the `Authorization` header:

```
Authorization: Bearer lib_<64 hex chars>
```

The user generates API keys from Settings → API Keys in the app. Each key is scoped to one user — all data written through a key belongs to that user.

## Base URL

```
https://the-library-sigma.vercel.app
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
| `isFavorite` | boolean? | Whether the item is starred as a favorite |
| `notesList` | string[]? | List of private notes added by the user |
| `topicIds` | string[] | IDs of associated topics |

### POST /api/items — Create an item

Use `topicNames` (strings) instead of `topicIds` — the API resolves or creates topics automatically.

**Tag reuse:** Before creating items, call `GET /api/topics` to retrieve the existing tag list. Prefer exact or close matches from that list over introducing new tags — this prevents duplicates like `"AI"` and `"Artificial Intelligence"` coexisting.

**Request:**
```json
{
  "url": "https://www.example.com/article",
  "title": "The Art of Deep Work",
  "summary": "An exploration of focused work practices and their cognitive benefits.",
  "contentType": "article",
  "sourceName": "Medium",
  "imageUrl": "https://miro.medium.com/example.jpg",
  "notes": "Suggested by a colleague — appended to the item's notes list",
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
  "..."
}
```

### POST /api/ingest — Save a URL with AI enrichment

Fetches the page at the given URL, uses AI to extract a title, summary, content type, source name, and suggested topics, then saves the item automatically. No metadata required from the caller.

**Request:**
```json
{
  "url": "https://www.example.com/article",
  "notes": "Optional personal note appended to the item"
}
```

**Response:** `201 Created` — enriched item object (same shape as `POST /api/items` response).

Falls back to saving with just the URL if the page cannot be fetched or enrichment fails.

### GET /api/items — List items

Query params (all optional):
- `status` — filter by `saved`, `in_progress`, or `done`
- `topicId` — filter by topic ID
- `contentType` — filter by `article`, `video`, `podcast`, `tweet`, or `newsletter`
- `isFavorite` — filter by favorite status (`true` or `false`)
- `q` — search title, summary, and notes

```
GET /api/items?status=saved&q=productivity
GET /api/items?isFavorite=true
GET /api/items?contentType=video
```

**Response:** `200 OK` — array of item objects.

### GET /api/items/search — Semantic search

Finds items by meaning, not just keyword matching. Uses vector embeddings to surface conceptually related items.

Query params:
- `q` *(required)* — natural language query, e.g. `"what should I read about focus?"`

```
GET /api/items/search?q=stoicism+and+resilience
GET /api/items/search?q=machine+learning+fundamentals
```

**Response:** `200 OK` — array of item objects, ordered by relevance. Each item includes a `_score` field (−1 to 1, higher = more relevant).

```json
[
  {
    "_id": "jx7abc123...",
    "title": "The Obstacle Is the Way",
    "_score": 0.91,
    "..."
  }
]
```

Returns `400` if `q` is missing or empty. Items without embeddings (just saved) will not appear in results until their embedding is generated (usually within seconds).

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
{ "error": "Unauthorized" }     // 401 — bad or missing API key
{ "error": "Not found" }        // 404
{ "error": "name is required" } // 400
```
