# The Library

A personal knowledge base for saving and organizing links — articles, videos, podcasts, tweets, and newsletters.

Built for people who collect a lot of things to read/watch and want to actually remember why they saved them.

**Live:** https://the-library-sigma.vercel.app

## Features

- **Save anything** — paste a URL, add tags and notes, done
- **Organized by type** — separate views for Articles, Videos, Audio
- **Tags** — create and assign topics to anything
- **Notes** — add multiple private notes to each item, delete individually
- **Mark as read/watched/listened** — context-aware based on content type
- **Favorites** — star items you want to revisit
- **LLM API** — give your AI assistant an API key and let it save things for you

## LLM Integration

The app exposes a REST API so your AI assistant can add items directly to your library.

1. Go to **API Keys** in the app and generate a key
2. Point your LLM to the [API documentation](https://the-library-sigma.vercel.app/llm-api.md)

### Example Claude skill prompt

```
You have access to my personal library at https://colorful-beagle-698.convex.site.
My API key is: lib_<your-key>

When I share something interesting with you, or when you think I'd want to save something
we've discussed, add it to my library using POST /api/items with the URL, a short title,
a one-sentence summary, the content type, and relevant topic tags.
```

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v3
- **Backend:** [Convex](https://convex.dev) (database, auth, real-time queries, HTTP API)
- **Auth:** Google OAuth via `@convex-dev/auth`
- **Hosting:** Vercel (frontend) + Convex cloud (backend)

## Local Development

```bash
npm install
npx convex dev          # syncs schema/functions, starts Convex dev server
npm run dev             # Vite dev server
npm test                # run tests
```

You need a Convex project and Google OAuth credentials. See [Convex docs](https://docs.convex.dev) to set up a project, then configure:

```bash
# In .env.local
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

```bash
# Via convex dashboard or CLI
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
SITE_URL=http://localhost:5173
```

## Project Structure

```
src/
  components/    # Sidebar, TopBar, ContentCard, AddContentModal, TagChip
  pages/         # MainLibrary, ContentPreview, FilteredItems, Settings, ApiKeys, ...
convex/
  schema.ts      # Database schema
  items.ts       # Item CRUD mutations/queries
  topics.ts      # Topic management
  apiKeys.ts     # API key management
  httpActions/   # REST API endpoints (used by LLM integrations)
public/
  llm-api.md     # LLM-facing API documentation (served statically)
```
