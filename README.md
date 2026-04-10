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

The app exposes a REST API at `https://the-library-sigma.vercel.app/api/`.
Generate an API key at **Settings → API Keys** in the app.

Full docs: [llm-api.md](https://the-library-sigma.vercel.app/llm-api.md)

### Claude skill (recommended)

This repo ships a [SKILL.md](./SKILL.md) at the root, making it installable via the `agent-skills-cli`:

```bash
npx agent-skills-cli install tomenden/the-library
```

Or install manually for Claude Code:

```bash
mkdir -p ~/.claude/skills/the-library
curl -fsSL https://the-library-sigma.vercel.app/the-library/SKILL.md \
  -o ~/.claude/skills/the-library/SKILL.md
```

For claude.ai: download [SKILL.md](./SKILL.md), put it in a folder named `the-library`, zip it, and upload at **claude.ai → Settings → Features → Agent Skills**.

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
