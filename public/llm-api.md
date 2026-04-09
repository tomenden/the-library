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
  "..."
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
{ "error": "Unauthorized" }     // 401 — bad or missing API key
{ "error": "Not found" }        // 404
{ "error": "name is required" } // 400
```
