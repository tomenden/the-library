---
name: the-library
description: >
  Saves URLs and content to the user's personal reading library.
  Use this skill when the user shares a link they want to save, asks you to
  bookmark something, mentions wanting to read or watch something later, or when
  you surface a resource the user responds positively to. Also use it to list,
  search, or update items already in the library.
license: MIT
compatibility: Requires internet access to reach the library API. Works in Claude Code and claude.ai.
metadata:
  author: tomenden
  version: "1.0"
allowed-tools: WebFetch
---

# The Library Skill

Save links, articles, videos, podcasts, and tweets to the user's personal library.

## Setup

The user must provide an API key (generated at Settings → API Keys in the app at https://the-library-sigma.vercel.app).
Ask for the key once if you don't have it, then reuse it for the session.

## API

**Base URL:** `https://the-library-sigma.vercel.app`

**Auth:** All requests require `Authorization: Bearer <api-key>`

Full API reference: [API Documentation](https://the-library-sigma.vercel.app/llm-api.md)

## Saving an item

```
POST /api/items
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "url": "https://...",
  "title": "Short descriptive title",
  "summary": "One sentence: what it is and why it matters",
  "contentType": "article" | "video" | "podcast" | "tweet" | "newsletter",
  "sourceName": "YouTube" | "Medium" | "Substack" | "Twitter" | etc.,
  "notes": "Why the user is saving this — context from conversation",
  "topicNames": ["tag1", "tag2"]
}
```

`url` is the only required field. Infer everything else from context.

**Response:** `201 Created` with the saved item object including `_id`.

## Reading the library

```
GET /api/items                    # all items
GET /api/items?status=saved       # unread only
GET /api/items?contentType=video  # by type
GET /api/items?isFavorite=true    # starred items
GET /api/items?q=machine+learning # keyword search
GET /api/items/:id                # single item
```

## Updating an item

```
PATCH /api/items/:id
{ "status": "done", "notes": "New context to add" }
```

Statuses: `saved` (default) | `in_progress` | `done`

## Deleting an item

```
DELETE /api/items/:id
```

## Topics (tags)

```
GET /api/topics       # list all
POST /api/topics      # { "name": "Philosophy" } — creates or returns existing
```

## Behavior guidelines

**Save proactively.** If the user shares a URL or reacts positively to something you surfaced,
save it without waiting to be asked — then confirm: "I saved that to your library."

**What makes a good saved item:**
- **Title:** concise and descriptive (not a full URL)
- **Summary:** one sentence on *what it is* + *why it's worth saving*
- **Notes:** conversation context — who recommended it, what question it answers
- **Topics:** specific enough to be useful (e.g. `LLMs`, `Sleep`, `Investing` — not `Technology`)

**Content type inference:**
- YouTube, Vimeo, Loom → `video`
- Spotify, Apple Podcasts, Overcast → `podcast`
- Twitter/X → `tweet`
- Substack, Beehiiv, email newsletters → `newsletter`
- Everything else → `article`
