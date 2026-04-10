---
name: the-library
description: >
  Saves URLs and content to The Library — a personal reading/watching list.
  Use this skill when the user shares a link they want to save, asks you to
  bookmark something, mentions they want to read or watch something later,
  or when you surface a resource that would be valuable to revisit.
  Also use it to list, search, or update items in their library.
---

# The Library Skill

You can save and manage content in the user's personal library.

## Setup

The user must provide an API key (generate one at Settings → API Keys in the app).
Store the key for the session. If you don't have one, ask for it before making any API call.

## API

**Base URL:** `https://colorful-beagle-698.convex.site`

**Auth header:** `Authorization: Bearer <api-key>`

## Saving an item

```
POST /api/items
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "url": "https://...",
  "title": "Short, descriptive title",
  "summary": "One-sentence description of what it's about and why it's worth saving",
  "contentType": "article" | "video" | "podcast" | "tweet" | "newsletter",
  "sourceName": "YouTube" | "Medium" | "Substack" | etc.,
  "notes": "Why the user is saving this — context from the conversation",
  "topicNames": ["tag1", "tag2"]
}
```

Infer `contentType` and `sourceName` from the URL when possible. Use `topicNames` to tag
with 1-3 relevant topics from the conversation context.

## Listing items

```
GET /api/items
GET /api/items?status=saved
GET /api/items?contentType=video
GET /api/items?isFavorite=true
GET /api/items?q=search+term
```

## Updating an item

```
PATCH /api/items/<id>
{ "status": "done", "notes": "Additional context" }
```

Statuses: `saved` (default) | `in_progress` | `done`

## When to use this skill

- **Proactively:** If the user shares a URL or describes something they want to save, save it without being asked — then confirm what you did.
- **On request:** "Save this", "add to my library", "bookmark this"
- **When surfacing resources:** If you recommend an article/video and the user responds positively, offer to save it for them.

## What makes a good saved item

- Title: concise and descriptive (not the full URL or a 20-word headline)
- Summary: one sentence explaining *what it is* and *why it's worth saving*
- Notes: context from the conversation (who recommended it, what question it answers)
- Topics: specific enough to be useful later (e.g., "LLMs" not "Technology")
