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

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
