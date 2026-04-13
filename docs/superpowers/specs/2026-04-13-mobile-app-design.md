# The Library — Mobile App Design Spec

## Overview

A React Native (Expo) mobile companion app for The Library, a personal knowledge
base for saving and organizing links. iPhone is the primary target; Android is
secondary. The app shares the same Convex backend as the existing Vite web app.

## Requirements

- **Quick-save links** from any app via the iOS/Android share sheet
- **Browse and read** saved items — filter by topic, status, content type, favorites
- **Search** — keyword and semantic search
- **Consistent design** with the web app, native feel where it makes sense
- **Google sign-in** — same auth as the web app
- **Always online** — no offline support needed
- **No push notifications**
- **Automated testing** — component tests via CLI, LLM-automatable

## Project Structure: Monorepo

Convert the existing single-app repo to an npm workspaces monorepo.

```
the-library/
├── apps/
│   ├── web/              # existing Vite + React web app (moved)
│   └── mobile/           # new Expo React Native app
├── packages/
│   └── shared/           # shared TypeScript code
│       ├── convex/       # existing convex/ folder (moved)
│       └── src/          # shared types, validation, utilities
├── package.json          # workspace root
└── ...
```

### What moves where

| Current location | New location |
|------------------|-------------|
| `src/` | `apps/web/src/` |
| `convex/` | `packages/shared/convex/` |
| `public/` | `apps/web/public/` |
| `index.html` | `apps/web/index.html` |
| `vite.config.ts` | `apps/web/vite.config.ts` |
| `tailwind.config.js` | `apps/web/tailwind.config.js` |
| `postcss.config.js` | `apps/web/postcss.config.js` |
| `tsconfig.json` | `apps/web/tsconfig.json` (web-specific) |
| `vercel.json` | `apps/web/vercel.json` |

Root `package.json` declares workspaces: `["apps/*", "packages/*"]`.

Both `apps/web` and `apps/mobile` depend on `@the-library/shared` (the shared
package).

A root `convex.json` points to the new Convex functions path:
`{ "functions": "packages/shared/convex" }`

### What gets shared

- **Convex schema, queries, mutations, HTTP actions** — written once in
  `packages/shared/convex/`, used by both apps
- **TypeScript types** — `Item`, `Topic`, `ContentType`, `Status`, etc.
- **Validation logic** — URL validation, input sanitization
- **Convex hooks** — `useQuery(api.items.list, ...)` works identically in both

### What stays separate

- **UI components** — web uses `<div>` + Tailwind, mobile uses `<View>` + NativeWind
- **Navigation** — web uses React Router, mobile uses Expo Router
- **Auth flow** — web uses browser redirects, mobile uses `expo-auth-session`
- **Share sheet extension** — mobile only

## Screens & Navigation

### Bottom tab bar (4 tabs)

| Tab | Screen | Description |
|-----|--------|-------------|
| Library | MainLibrary | Item list with All/Favorites tabs, topic/status/type filters |
| Search | Search | Keyword + semantic search with results |
| + Save | AddItem | Paste URL or manual entry, triggers AI enrichment |
| Settings | Settings | Profile, API keys, logout |

### Stack screens (pushed from tabs)

| Screen | Accessed from | Description |
|--------|--------------|-------------|
| ItemDetail | Library, Search | View item, edit notes, change status, toggle favorite, open in browser, delete |
| TopicManager | Settings, Library filter | Create, rename, delete topics |

### Navigation library

Expo Router (file-based routing).

### Mobile-specific interactions

- Pull-to-refresh on Library and Search
- Swipe actions on list items (right to favorite, left to archive)
- Share sheet triggers the Save flow from outside the app

## Share Sheet Extension

### User flow

1. User is in Safari / Twitter / any app, taps the share button
2. "Save to Library" appears as an option
3. Tap — a small modal shows the URL with a "Save" button
4. Calls `POST /api/ingest` — AI enrichment runs in the background
5. Quick confirmation, back to the source app

### Technical approach

- `expo-share-intent` handles iOS Share Extension and Android intents
- Extension uses stored auth token to call the API
- No topic selection at share time — keep it fast, AI picks topics automatically
- If enrichment fails, item saves with `status: "saved"` for manual fix later

### Auth in the extension

- iOS: App Group shared keychain between main app and extension
- Main app stores auth token there after Google sign-in
- Extension reads it to authenticate API calls

## Authentication

### Flow

1. App opens — if no stored session, show login screen with "Sign in with Google"
2. `expo-auth-session` handles Google OAuth (same Google Cloud project as web,
   with a new iOS client ID)
3. Exchange Google token with Convex Auth (`@convex-dev/auth`)
4. Session token stored via `expo-secure-store`
5. Subsequent opens load token from secure storage, skip login

### Backend changes

None. Convex Auth already handles Google OAuth. Only change is registering an iOS
OAuth client ID in Google Cloud Console.

## Tech Stack

| Concern | Library | Notes |
|---------|---------|-------|
| Framework | Expo SDK 52+ | Managed workflow |
| Navigation | Expo Router | File-based routing |
| Backend | Convex React Native SDK | Real-time subscriptions |
| Auth | expo-auth-session + expo-secure-store | Google OAuth + secure storage |
| Share sheet | expo-share-intent | iOS + Android share extensions |
| Styling | NativeWind v5 | Tailwind CSS v4 for RN; web stays on v3 — same class names, separate configs |
| Icons | lucide-react-native | Same icon set as web app |
| Testing | Jest + React Native Testing Library | CLI-driven, LLM-automatable |
| Builds | EAS Build | Cloud builds, no local Xcode needed |
| Distribution | TestFlight (iOS), APK (Android) | EAS handles both |
| Agent skills | Expo Skills plugin for Claude Code | 12 skills for Expo development |

## Testing Strategy

- **Component tests:** Jest + React Native Testing Library — test components and
  hooks in isolation, fully CLI-driven
- **Backend tests:** existing Vitest tests on Convex functions (unchanged)
- **E2E:** manual via iOS Simulator during development; Maestro can be added
  later for automated E2E if needed

## Development Workflow

### One-time setup

1. Convert to monorepo (npm workspaces)
2. Install Expo skills in Claude Code
3. Create Expo app in `apps/mobile/`
4. Move `convex/` to `packages/shared/convex/`
5. Register iOS OAuth client ID in Google Cloud Console

### Day-to-day

- `npx expo start` — preview on phone via Expo Go (fastest iteration)
- `npx expo run:ios` — build and run in iOS Simulator (share extension work)
- `npx convex dev` — shared Convex dev server (unchanged)

### Building for devices

- **Development:** Expo Go (free, no build step)
- **Test builds:** EAS Build → TestFlight (iOS)
- **Android:** EAS Build → APK, share directly

## Git & PR Strategy

All work happens on a feature branch off `master`, not directly on `master`.

Commits are atomic and well-separated. Work is organized as stacked PRs for
clear, reviewable units:

| PR | Scope | Base |
|----|-------|------|
| 1 | Monorepo restructure — move files, npm workspaces, verify web app still works | `master` |
| 2 | Bare Expo app with navigation skeleton + shared package wiring | PR 1 branch |
| 3 | Authentication — Google sign-in flow | PR 2 branch |
| 4 | Core screens — Library, Item Detail, Search, Settings | PR 3 branch |
| 5 | Share sheet extension | PR 4 branch |
| 6 | Polish, testing, EAS Build setup | PR 5 branch |

No special stacking tools — just plain `gh pr create --base <previous-branch>`.
Each PR is independently reviewable and the chain merges bottom-up.
