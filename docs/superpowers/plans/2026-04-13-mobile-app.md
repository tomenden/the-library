# The Library Mobile App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native (Expo) mobile companion app that shares the Convex backend with the existing web app.

**Architecture:** Monorepo with npm workspaces. The existing web app stays in place at the repo root (zero changes to web code). The mobile app lives in `apps/mobile/`. Convex functions remain at the root `convex/` directory, shared by both apps via path aliases. Stacked PRs for reviewability.

**Tech Stack:** Expo SDK 52+, Expo Router, Convex React Native SDK, NativeWind v5, expo-auth-session, expo-share-intent, lucide-react-native

**Spec:** `docs/superpowers/specs/2026-04-13-mobile-app-design.md`

---

## Prerequisites

Before starting any task, install Expo skills in Claude Code:
```
/plugin marketplace add expo/skills
/plugin install expo
```

These skills provide detailed guidance for NativeWind setup, native UI patterns, deployment, and more. Reference them during implementation.

---

## PR 1 — Monorepo + Bare Expo App

**Branch:** `feature/mobile-app/01-monorepo` (off `feature/mobile-app`)

**Design note:** The spec proposed moving the web app to `apps/web/` and convex to `packages/shared/convex/`. This plan simplifies that: the existing web app stays exactly where it is — `src/`, `public/`, `index.html`, `vite.config.ts`, `convex/` all remain at the repo root. This avoids any risk of breaking the web app or Vercel deployment. Only the mobile app is new code under `apps/mobile/`. The full restructure can be done later if needed.

---

### Task 1: Configure npm workspaces

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add workspaces field to root package.json**

Add the `workspaces` field to the existing root `package.json`. Do not change any other fields — the web app's dependencies, scripts, and config stay as-is.

```json
{
  "workspaces": ["apps/*"]
}
```

Add this field alongside the existing `name`, `private`, `version` fields.

- [ ] **Step 2: Verify web app still works**

```bash
npm install
npm run build
npm test
```

Expected: all 39 tests pass, build succeeds. The workspaces field alone shouldn't break anything since there's no `apps/` directory yet.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add npm workspaces config for monorepo"
```

---

### Task 2: Create bare Expo app

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Scaffold Expo app**

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd ..
```

This creates a minimal TypeScript Expo project.

- [ ] **Step 2: Configure Metro for monorepo**

Metro bundler needs to know about the monorepo root to resolve hoisted packages and the shared `convex/` directory. Replace `apps/mobile/metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for changes (needed for convex/)
config.watchFolders = [monorepoRoot];

// Let Metro resolve packages from both the project and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

- [ ] **Step 3: Configure TypeScript path alias for convex**

Replace `apps/mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@convex/*": ["../../convex/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "../../convex/**/*.ts"]
}
```

- [ ] **Step 4: Add path alias to babel config**

Replace `apps/mobile/babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@convex': '../../convex',
        },
      }],
    ],
  };
};
```

Add the babel plugin:

```bash
cd apps/mobile && npm install --save-dev babel-plugin-module-resolver && cd ../..
```

- [ ] **Step 5: Create minimal app layout**

Replace `apps/mobile/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Replace `apps/mobile/app/index.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Library</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
});
```

- [ ] **Step 6: Update app.json**

Ensure `apps/mobile/app.json` has:

```json
{
  "expo": {
    "name": "The Library",
    "slug": "the-library",
    "version": "1.0.0",
    "scheme": "the-library",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.thelibrary.app",
      "supportsTablet": false
    },
    "android": {
      "package": "com.thelibrary.app",
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": ["expo-router"]
  }
}
```

- [ ] **Step 7: Verify the Expo app starts**

```bash
cd apps/mobile && npx expo start --ios
```

Expected: app opens in iOS Simulator showing "The Library / Loading..." placeholder.

Press `Ctrl+C` to stop.

- [ ] **Step 8: Verify web app is still unaffected**

From the repo root:

```bash
npm run build
npm test
```

Expected: all 39 tests pass, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/
git commit -m "feat: add bare Expo app with monorepo workspace config"
```

---

## PR 2 — Navigation Skeleton + Convex Wiring

**Branch:** `feature/mobile-app/02-navigation` (off `feature/mobile-app/01-monorepo`)

---

### Task 3: Set up tab navigation with Expo Router

**Files:**
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/app/(tabs)/search.tsx`
- Create: `apps/mobile/app/(tabs)/add.tsx`
- Create: `apps/mobile/app/(tabs)/settings.tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Delete: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Install navigation dependencies**

```bash
cd apps/mobile && npx expo install expo-status-bar react-native-safe-area-context && cd ../..
```

- [ ] **Step 2: Create tab layout**

Create `apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { Library, Search, PlusCircle, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6750A4',
        tabBarInactiveTintColor: '#49454F',
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Save',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create placeholder tab screens**

Create `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
```

Create `apps/mobile/app/(tabs)/search.tsx` (same pattern, title "Search").

Create `apps/mobile/app/(tabs)/add.tsx` (same pattern, title "Save Item").

Create `apps/mobile/app/(tabs)/settings.tsx` (same pattern, title "Settings").

- [ ] **Step 4: Create stack screens for detail views**

Create `apps/mobile/app/item/[id].tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Detail</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
});
```

- [ ] **Step 5: Update root layout to include stack**

Replace `apps/mobile/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="item/[id]"
        options={{ headerShown: true, title: 'Item', presentation: 'card' }}
      />
    </Stack>
  );
}
```

Delete `apps/mobile/app/index.tsx` (replaced by `(tabs)/index.tsx`).

- [ ] **Step 6: Install lucide-react-native**

```bash
cd apps/mobile && npm install lucide-react-native react-native-svg && npx expo install react-native-svg && cd ../..
```

- [ ] **Step 7: Verify navigation works**

```bash
cd apps/mobile && npx expo start --ios
```

Expected: app shows bottom tab bar with 4 tabs (Library, Search, Save, Settings). Each tab shows its placeholder. Switching tabs works.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add tab navigation skeleton with Expo Router"
```

---

### Task 4: Wire up Convex client

**Files:**
- Create: `apps/mobile/lib/convex.ts`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/(tabs)/index.tsx`
- Modify: `apps/mobile/package.json` (new deps)

- [ ] **Step 1: Install Convex dependencies**

```bash
cd apps/mobile && npm install convex @convex-dev/auth react-native-get-random-values && cd ../..
```

`react-native-get-random-values` is required because React Native doesn't have a built-in `crypto.getRandomValues`.

- [ ] **Step 2: Create Convex client**

Create `apps/mobile/lib/convex.ts`:

```typescript
import { ConvexReactClient } from "convex/react";

// In development, use your Convex dev URL
// In production, use the production URL
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || "https://colorful-beagle-698.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);
```

- [ ] **Step 3: Add Convex provider to root layout**

Replace `apps/mobile/app/_layout.tsx`:

```tsx
import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { ConvexProvider } from 'convex/react';
import { convex } from '../lib/convex';

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="item/[id]"
          options={{ headerShown: true, title: 'Item', presentation: 'card' }}
        />
      </Stack>
    </ConvexProvider>
  );
}
```

Note: We use `ConvexProvider` (not `ConvexAuthProvider`) for now. Auth comes in PR 3.

- [ ] **Step 4: Test Convex connection with a real query**

Replace `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export default function LibraryScreen() {
  // This will fail without auth — that's expected for now
  // It proves the Convex connection and import alias work
  const items = useQuery(api.items.list, { status: "saved" });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>
        {items === undefined ? 'Connecting to Convex...' : `${items.length} items`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
});
```

- [ ] **Step 5: Add .env file for Convex URL**

Create `apps/mobile/.env`:

```
EXPO_PUBLIC_CONVEX_URL=https://colorful-beagle-698.convex.cloud
```

Add to root `.gitignore` if not already covered:

```
apps/mobile/.env
```

- [ ] **Step 6: Verify Convex connection**

```bash
cd apps/mobile && npx expo start --ios
```

Expected: app shows "Library" with either "Connecting to Convex..." or an auth error (since we haven't set up auth yet). The key validation is that Metro resolves `@convex/_generated/api` without errors — check the terminal for no import resolution failures.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/ .gitignore
git commit -m "feat: wire up Convex client with monorepo path aliases"
```

---

## PR 3 — Authentication

**Branch:** `feature/mobile-app/03-auth` (off `feature/mobile-app/02-navigation`)

---

### Task 5: Implement Google sign-in

**Files:**
- Create: `apps/mobile/app/login.tsx`
- Create: `apps/mobile/lib/auth.ts`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/package.json` (new deps)

**Prerequisites:** Register an iOS OAuth client ID in Google Cloud Console for the app's bundle identifier (`com.thelibrary.app`). Save the client ID — it goes in app.json.

- [ ] **Step 1: Install auth dependencies**

```bash
cd apps/mobile && npx expo install expo-auth-session expo-secure-store expo-crypto expo-web-browser && cd ../..
```

- [ ] **Step 2: Update app.json with auth scheme**

Add to the `expo` section of `apps/mobile/app.json`:

```json
{
  "expo": {
    "scheme": "the-library",
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

- [ ] **Step 3: Create auth utility**

Create `apps/mobile/lib/auth.ts`:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { makeRedirectUri } from 'expo-auth-session';

const SECURE_STORE_TOKEN_KEY = 'convex_auth_token';

// Google OAuth config — replace with your iOS client ID
const GOOGLE_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({ scheme: 'the-library' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery,
  );

  return { request, response, promptAsync };
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_TOKEN_KEY);
}
```

- [ ] **Step 4: Create login screen**

Create `apps/mobile/app/login.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoogleAuth, saveToken } from '../lib/auth';
import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';

export default function LoginScreen() {
  const router = useRouter();
  const { request, response, promptAsync } = useGoogleAuth();
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        // Exchange with Convex Auth
        // The exact integration depends on how @convex-dev/auth handles
        // mobile OAuth tokens — see Convex Auth docs for React Native
        saveToken(id_token);
      }
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Library</Text>
      <Text style={styles.subtitle}>Your personal knowledge base</Text>
      <Pressable
        style={[styles.button, !request && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFBFE',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#49454F',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#6750A4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 5: Add auth gate to root layout**

Replace `apps/mobile/app/_layout.tsx`:

```tsx
import 'react-native-get-random-values';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { convex } from '../lib/convex';
import { useEffect } from 'react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const onLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !onLoginScreen) {
      router.replace('/login');
    } else if (isAuthenticated && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="item/[id]"
            options={{ headerShown: true, title: 'Item', presentation: 'card' }}
          />
        </Stack>
      </AuthGate>
    </ConvexAuthProvider>
  );
}
```

- [ ] **Step 6: Verify auth flow**

```bash
cd apps/mobile && npx expo start --ios
```

Expected: app opens to login screen. Tapping "Sign in with Google" opens the Google OAuth flow. After sign-in, redirects to Library tab.

Note: full auth testing requires the Google Cloud Console iOS client ID to be configured. If not yet done, verify the login screen renders and the OAuth prompt opens (it will fail with an invalid client ID but the flow is correct).

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add Google sign-in with Convex Auth"
```

---

## PR 4 — Core Screens

**Branch:** `feature/mobile-app/04-screens` (off `feature/mobile-app/03-auth`)

---

### Task 6: Set up NativeWind (Tailwind for React Native)

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/global.css`
- Modify: `apps/mobile/metro.config.js`
- Modify: `apps/mobile/babel.config.js`
- Modify: `apps/mobile/app/_layout.tsx`

**Note:** Use the `expo-tailwind-setup` Expo skill for detailed NativeWind v5 setup guidance. The steps below cover the essentials.

- [ ] **Step 1: Install NativeWind**

```bash
cd apps/mobile && npm install nativewind tailwindcss@^4 && cd ../..
```

- [ ] **Step 2: Create global.css**

Create `apps/mobile/global.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 3: Update Metro config for CSS support**

Update `apps/mobile/metro.config.js` to add NativeWind:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 4: Import CSS in root layout**

Add at the top of `apps/mobile/app/_layout.tsx`:

```tsx
import '../global.css';
```

- [ ] **Step 5: Test NativeWind works**

Update the Library placeholder to use Tailwind classes:

```tsx
// In apps/mobile/app/(tabs)/index.tsx
<View className="flex-1 justify-center items-center">
  <Text className="text-xl font-semibold text-gray-900">Library</Text>
</View>
```

Run `npx expo start --ios` and verify styling applies.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/
git commit -m "feat: set up NativeWind v5 for Tailwind styling"
```

---

### Task 7: Build Library screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/components/ItemCard.tsx`
- Create: `apps/mobile/components/FilterBar.tsx`

**Reference:** The web app's `src/pages/MainLibrary.tsx` for feature parity. The mobile version should support:
- All Items / Favorites tabs
- Topic filter chips
- Status filter (saved / in_progress / done)
- Pull-to-refresh
- Tap item to navigate to detail

- [ ] **Step 1: Create ItemCard component**

Create `apps/mobile/components/ItemCard.tsx`:

```tsx
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import type { Doc } from '@convex/_generated/dataModel';

type Item = Doc<'items'>;

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();

  return (
    <Pressable
      className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
      onPress={() => router.push(`/item/${item._id}`)}
    >
      <View className="flex-row">
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-16 h-16 rounded-lg mr-3"
            resizeMode="cover"
          />
        )}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
            {item.title || item.url}
          </Text>
          {item.summary && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
              {item.summary}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            {item.contentType && (
              <View className="bg-purple-50 px-2 py-0.5 rounded-full mr-2">
                <Text className="text-xs text-purple-700">{item.contentType}</Text>
              </View>
            )}
            {item.isFavorite && <Heart size={14} color="#E91E63" fill="#E91E63" />}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create FilterBar component**

Create `apps/mobile/components/FilterBar.tsx`:

```tsx
import { ScrollView, Pressable, Text } from 'react-native';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterBar({ options, selected, onSelect }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 py-2"
      contentContainerStyle={{ gap: 8 }}
    >
      <Pressable
        className={`px-3 py-1.5 rounded-full ${
          selected === null ? 'bg-purple-600' : 'bg-gray-100'
        }`}
        onPress={() => onSelect(null)}
      >
        <Text className={selected === null ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
          All
        </Text>
      </Pressable>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          className={`px-3 py-1.5 rounded-full ${
            selected === opt.value ? 'bg-purple-600' : 'bg-gray-100'
          }`}
          onPress={() => onSelect(selected === opt.value ? null : opt.value)}
        >
          <Text
            className={
              selected === opt.value ? 'text-white text-sm' : 'text-gray-700 text-sm'
            }
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 3: Build the Library screen**

Replace `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ItemCard } from '../../components/ItemCard';
import { FilterBar } from '../../components/FilterBar';

const STATUS_OPTIONS = [
  { label: 'Saved', value: 'saved' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'Article', value: 'article' },
  { label: 'Video', value: 'video' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Tweet', value: 'tweet' },
  { label: 'Newsletter', value: 'newsletter' },
];

type Tab = 'all' | 'favorites';

export default function LibraryScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [contentTypeFilter, setContentTypeFilter] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryArgs: Record<string, unknown> = {};
  if (statusFilter) queryArgs.status = statusFilter;
  if (contentTypeFilter) queryArgs.contentType = contentTypeFilter;
  if (topicFilter) queryArgs.topicId = topicFilter;
  if (tab === 'favorites') queryArgs.isFavorite = true;

  const items = useQuery(api.items.list, queryArgs);
  const topics = useQuery(api.topics.list);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex auto-refreshes via subscriptions, so just briefly show the indicator
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header */}
      <View className="px-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Library</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-2">
        <Pressable
          className={`mr-4 pb-2 ${tab === 'all' ? 'border-b-2 border-purple-600' : ''}`}
          onPress={() => setTab('all')}
        >
          <Text className={tab === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500'}>
            All Items
          </Text>
        </Pressable>
        <Pressable
          className={`pb-2 ${tab === 'favorites' ? 'border-b-2 border-purple-600' : ''}`}
          onPress={() => setTab('favorites')}
        >
          <Text
            className={tab === 'favorites' ? 'text-purple-600 font-semibold' : 'text-gray-500'}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

      {/* Filters */}
      <FilterBar options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} />
      <FilterBar options={CONTENT_TYPE_OPTIONS} selected={contentTypeFilter} onSelect={setContentTypeFilter} />
      {topics && topics.length > 0 && (
        <FilterBar
          options={topics.map((t) => ({ label: t.name, value: t._id }))}
          selected={topicFilter}
          onSelect={setTopicFilter}
        />
      )}

      {/* Item list */}
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ItemCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20">
            <Text className="text-gray-400 text-base">
              {items === undefined ? 'Loading...' : 'No items found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

- [ ] **Step 4: Verify Library screen**

```bash
cd apps/mobile && npx expo start --ios
```

Expected: Library tab shows items from your Convex backend (after auth). Tabs switch between All/Favorites. Filter chips filter by status. Pull-to-refresh shows indicator. Tapping an item navigates to the detail placeholder.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/
git commit -m "feat: build Library screen with filters and item cards"
```

---

### Task 8: Build Item Detail screen

**Files:**
- Modify: `apps/mobile/app/item/[id].tsx`

**Reference:** The web app's `src/pages/ContentPreview.tsx`.

- [ ] **Step 1: Build the detail screen**

Replace `apps/mobile/app/item/[id].tsx`:

```tsx
import { View, Text, ScrollView, Pressable, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Trash2,
  BookOpen,
  CheckCircle,
  Bookmark,
} from 'lucide-react-native';

const STATUS_ICONS = {
  saved: Bookmark,
  in_progress: BookOpen,
  done: CheckCircle,
} as const;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useQuery(api.items.get, { id: id as Id<'items'> });
  const updateItem = useMutation(api.items.update);
  const deleteItem = useMutation(api.items.remove);
  const topics = useQuery(api.topics.list);

  if (!item) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  const toggleFavorite = () => {
    updateItem({ id: item._id, isFavorite: !item.isFavorite });
  };

  const cycleStatus = () => {
    const statuses = ['saved', 'in_progress', 'done'] as const;
    const currentIndex = statuses.indexOf(item.status as typeof statuses[number]);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateItem({ id: item._id, status: nextStatus });
  };

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem({ id: item._id });
          router.back();
        },
      },
    ]);
  };

  const itemTopics = topics?.filter((t) => item.topicIds?.includes(t._id));
  const StatusIcon = STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] || Bookmark;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#1C1B1F" />
        </Pressable>
        <View className="flex-1" />
        <Pressable onPress={toggleFavorite} className="p-2">
          <Heart
            size={22}
            color={item.isFavorite ? '#E91E63' : '#666'}
            fill={item.isFavorite ? '#E91E63' : 'none'}
          />
        </Pressable>
        <Pressable onPress={handleDelete} className="p-2">
          <Trash2 size={22} color="#666" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Image */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="cover"
          />
        )}

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {item.title || item.url}
        </Text>

        {/* Source & type */}
        <View className="flex-row items-center mb-4">
          {item.sourceName && (
            <Text className="text-sm text-gray-500 mr-3">{item.sourceName}</Text>
          )}
          {item.contentType && (
            <View className="bg-purple-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-purple-700">{item.contentType}</Text>
            </View>
          )}
        </View>

        {/* Status */}
        <Pressable
          onPress={cycleStatus}
          className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-4"
        >
          <StatusIcon size={18} color="#6750A4" />
          <Text className="ml-2 text-purple-700 font-medium capitalize">{item.status}</Text>
          <Text className="ml-auto text-xs text-gray-400">Tap to change</Text>
        </Pressable>

        {/* Topics */}
        {itemTopics && itemTopics.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {itemTopics.map((t) => (
              <View key={t._id} className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-sm text-gray-700">{t.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {item.summary && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-500 mb-1">Summary</Text>
            <Text className="text-base text-gray-800 leading-6">{item.summary}</Text>
          </View>
        )}

        {/* Notes */}
        {item.notes && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-500 mb-1">Notes</Text>
            <Text className="text-base text-gray-800 leading-6">{item.notes}</Text>
          </View>
        )}

        {/* Open URL */}
        <Pressable
          className="flex-row items-center justify-center bg-purple-600 rounded-xl py-3 mb-8"
          onPress={() => Linking.openURL(item.url)}
        >
          <ExternalLink size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Open in Browser</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Verify detail screen**

Navigate to Library → tap an item. Expected: detail screen shows image, title, source, status (tappable), topics, summary, notes, and "Open in Browser" button. Back arrow returns to Library. Favorite toggle works. Delete shows confirmation.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "feat: build Item Detail screen with actions"
```

---

### Task 9: Build Search screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/search.tsx`

- [ ] **Step 1: Build Search screen**

Replace `apps/mobile/app/(tabs)/search.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ItemCard } from '../../components/ItemCard';
import { Search as SearchIcon, X } from 'lucide-react-native';
import type { Doc } from '@convex/_generated/dataModel';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doc<'items'>[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Keyword search via query (real-time)
  const keywordResults = useQuery(
    api.items.list,
    query.length >= 2 ? { q: query } : 'skip',
  );

  const displayResults = searchResults ?? keywordResults;

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <View className="px-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Search</Text>
      </View>

      {/* Search bar */}
      <View className="mx-4 mb-3 flex-row items-center bg-white rounded-xl px-3 border border-gray-200">
        <SearchIcon size={20} color="#999" />
        <TextInput
          className="flex-1 py-3 px-2 text-base text-gray-900"
          placeholder="Search your library..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={clearSearch} className="p-1">
            <X size={18} color="#999" />
          </Pressable>
        )}
      </View>

      {isSearching && (
        <ActivityIndicator className="mt-4" color="#6750A4" />
      )}

      {/* Results */}
      <FlatList
        data={displayResults ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ItemCard item={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-gray-400 text-base">
              {query.length === 0
                ? 'Type to search your library'
                : query.length < 2
                  ? 'Keep typing...'
                  : displayResults === undefined
                    ? 'Searching...'
                    : 'No results found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

- [ ] **Step 2: Verify Search screen**

Expected: Search tab shows search bar. Typing 2+ characters triggers keyword search with real-time results. Clearing resets. Tapping a result navigates to detail.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "feat: build Search screen with keyword search"
```

---

### Task 10: Build Add Item screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/add.tsx`

- [ ] **Step 1: Build Add Item screen**

Replace `apps/mobile/app/(tabs)/add.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Link2, Sparkles } from 'lucide-react-native';

export default function AddItemScreen() {
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const ingest = useMutation(api.items.create);

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL validation
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a URL starting with http:// or https://');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await ingest({ url: trimmed });
      setUrl('');
      Alert.alert('Saved!', 'Item saved. AI enrichment will process it shortly.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Save Item</Text>
      <Text className="text-base text-gray-500 mb-6">
        Paste a URL and AI will extract the title, summary, and topics.
      </Text>

      <View className="bg-white rounded-xl p-4 border border-gray-200">
        <View className="flex-row items-center mb-4">
          <Link2 size={20} color="#6750A4" />
          <Text className="ml-2 text-sm font-medium text-gray-700">URL</Text>
        </View>

        <TextInput
          className="text-base text-gray-900 bg-gray-50 rounded-lg px-4 py-3 mb-4"
          placeholder="https://example.com/article"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleSave}
        />

        <Pressable
          className={`flex-row items-center justify-center py-3.5 rounded-xl ${
            isSaving || !url.trim() ? 'bg-purple-300' : 'bg-purple-600'
          }`}
          onPress={handleSave}
          disabled={isSaving || !url.trim()}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Save with AI</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify Add screen**

Expected: Save tab shows URL input. Pasting a URL and tapping "Save with AI" creates the item. Success alert shown. Invalid URLs rejected.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "feat: build Add Item screen with URL save"
```

---

### Task 11: Build Settings screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Build Settings screen**

Replace `apps/mobile/app/(tabs)/settings.tsx`:

```tsx
import { View, Text, Pressable, Alert } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { LogOut, Key, User } from 'lucide-react-native';

export default function SettingsScreen() {
  const { signOut } = useAuthActions();
  const apiKeys = useQuery(api.apiKeys.list);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

      {/* Profile section */}
      <View className="bg-white rounded-xl mb-4 overflow-hidden">
        <View className="flex-row items-center p-4 border-b border-gray-100">
          <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
            <User size={20} color="#6750A4" />
          </View>
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-900">Account</Text>
            <Text className="text-sm text-gray-500">Signed in with Google</Text>
          </View>
        </View>

        <Pressable className="flex-row items-center p-4 border-b border-gray-100">
          <Key size={20} color="#49454F" />
          <Text className="ml-3 text-base text-gray-900">API Keys</Text>
          <Text className="ml-auto text-sm text-gray-400">
            {apiKeys?.length ?? 0} keys
          </Text>
        </Pressable>

        <Pressable className="flex-row items-center p-4" onPress={handleSignOut}>
          <LogOut size={20} color="#D32F2F" />
          <Text className="ml-3 text-base text-red-600">Sign Out</Text>
        </Pressable>
      </View>

      <Text className="text-center text-xs text-gray-400 mt-4">
        The Library v1.0.0
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify Settings screen**

Expected: Settings tab shows profile section, API Keys row with count, and Sign Out button with confirmation.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "feat: build Settings screen with sign-out"
```

---

### Task 11b: Add swipe actions to item list

**Files:**
- Modify: `apps/mobile/components/ItemCard.tsx`
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install swipeable library**

```bash
cd apps/mobile && npx expo install react-native-gesture-handler react-native-reanimated && cd ../..
```

- [ ] **Step 2: Wrap ItemCard with swipe actions**

Update `apps/mobile/components/ItemCard.tsx` to use `Swipeable` from `react-native-gesture-handler`. Swipe right reveals a "Favorite" action (purple background with Heart icon), swipe left reveals an "Archive" action (gray background with Archive icon).

```tsx
import { Swipeable } from 'react-native-gesture-handler';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

// Inside ItemCard component:
const updateItem = useMutation(api.items.update);

const renderLeftActions = () => (
  <Pressable
    className="bg-purple-600 justify-center px-6 rounded-l-xl"
    onPress={() => updateItem({ id: item._id, isFavorite: !item.isFavorite })}
  >
    <Heart size={22} color="#fff" fill={item.isFavorite ? '#fff' : 'none'} />
  </Pressable>
);

const renderRightActions = () => (
  <Pressable
    className="bg-gray-500 justify-center px-6 rounded-r-xl"
    onPress={() => updateItem({ id: item._id, status: 'done' })}
  >
    <Archive size={22} color="#fff" />
  </Pressable>
);

// Wrap the card content with:
<Swipeable renderLeftActions={renderLeftActions} renderRightActions={renderRightActions}>
  {/* existing card content */}
</Swipeable>
```

- [ ] **Step 3: Add GestureHandlerRootView to root layout**

In `apps/mobile/app/_layout.tsx`, wrap the entire app with:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Wrap the outermost component:
<GestureHandlerRootView style={{ flex: 1 }}>
  {/* existing ConvexAuthProvider + AuthGate + Stack */}
</GestureHandlerRootView>
```

- [ ] **Step 4: Verify swipe actions**

Swipe an item right — favorite toggle appears. Swipe left — archive action appears.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add swipe actions to item cards (favorite/archive)"
```

---

### Task 11c: Build Topic Manager screen

**Files:**
- Create: `apps/mobile/app/topics.tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/(tabs)/settings.tsx`
- Modify: `convex/topics.ts` (add public `update` mutation — currently only exists as HTTP action)

- [ ] **Step 1: Add public update mutation to convex/topics.ts**

The `update` (rename) mutation only exists as an HTTP action, not as a public query. Add it to `convex/topics.ts` following the same pattern as the existing `create` and `remove` mutations:

```typescript
export const update = mutation({
  args: { id: v.id("topics"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const topic = await ctx.db.get(args.id);
    if (!topic || topic.userId !== userId) throw new Error("Topic not found");
    await ctx.db.patch(args.id, { name: args.name });
  },
});
```

- [ ] **Step 2: Create Topic Manager screen**

Create `apps/mobile/app/topics.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Edit3 } from 'lucide-react-native';
import type { Id } from '@convex/_generated/dataModel';

export default function TopicManagerScreen() {
  const router = useRouter();
  const topics = useQuery(api.topics.list);
  const createTopic = useMutation(api.topics.create);
  const updateTopic = useMutation(api.topics.update);
  const deleteTopic = useMutation(api.topics.remove);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createTopic({ name: trimmed });
    setNewName('');
  };

  const handleDelete = (id: Id<'topics'>, name: string) => {
    Alert.alert('Delete Topic', `Delete "${name}"? Items won't be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTopic({ id }),
      },
    ]);
  };

  const handleRename = (id: Id<'topics'>, currentName: string) => {
    Alert.prompt('Rename Topic', `New name for "${currentName}":`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Rename',
        onPress: (newName) => {
          if (newName?.trim()) updateTopic({ id, name: newName.trim() });
        },
      },
    ], 'plain-text', currentName);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#1C1B1F" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Topics</Text>
      </View>

      {/* Create new */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TextInput
          className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-base mr-2"
          placeholder="New topic name"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Pressable
          className={`p-2 rounded-lg ${newName.trim() ? 'bg-purple-600' : 'bg-gray-200'}`}
          onPress={handleCreate}
          disabled={!newName.trim()}
        >
          <Plus size={20} color={newName.trim() ? '#fff' : '#999'} />
        </Pressable>
      </View>

      {/* Topic list */}
      <FlatList
        data={topics ?? []}
        keyExtractor={(t) => t._id}
        renderItem={({ item: topic }) => (
          <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-50">
            <Text className="flex-1 text-base text-gray-900">{topic.name}</Text>
            <Pressable onPress={() => handleRename(topic._id, topic.name)} className="p-2">
              <Edit3 size={18} color="#666" />
            </Pressable>
            <Pressable onPress={() => handleDelete(topic._id, topic.name)} className="p-2">
              <Trash2 size={18} color="#D32F2F" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-8">No topics yet</Text>
        }
      />
    </View>
  );
}
```

- [ ] **Step 3: Register screen in root layout**

Add to the Stack in `apps/mobile/app/_layout.tsx`:

```tsx
<Stack.Screen
  name="topics"
  options={{ headerShown: false, presentation: 'card' }}
/>
```

- [ ] **Step 4: Link from Settings**

In `apps/mobile/app/(tabs)/settings.tsx`, make the API Keys row navigate to topics. Add a new row before the API Keys row:

```tsx
<Pressable
  className="flex-row items-center p-4 border-b border-gray-100"
  onPress={() => router.push('/topics')}
>
  <Tag size={20} color="#49454F" />
  <Text className="ml-3 text-base text-gray-900">Manage Topics</Text>
  <Text className="ml-auto text-sm text-gray-400">
    {topics?.length ?? 0} topics
  </Text>
</Pressable>
```

Import `Tag` from lucide-react-native, `useRouter` from expo-router, and query topics.

- [ ] **Step 5: Verify Topic Manager**

Settings → "Manage Topics" → shows list of topics. Can create, rename, and delete topics.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add Topic Manager screen"
```

---

## PR 5 — Share Sheet Extension

**Branch:** `feature/mobile-app/05-share` (off `feature/mobile-app/04-screens`)

---

### Task 12: Implement share sheet extension

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/share.tsx`

**Note:** The share extension requires a **development build** (not Expo Go). You'll need `npx expo run:ios` or EAS Build to test this.

- [ ] **Step 1: Install expo-share-intent**

```bash
cd apps/mobile && npx expo install expo-share-intent && cd ../..
```

- [ ] **Step 2: Add plugin to app.json**

Add `expo-share-intent` to the plugins array in `apps/mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-share-intent",
        {
          "iosActivationRules": {
            "NSExtensionActivationSupportsWebURLWithMaxCount": 1
          }
        }
      ]
    ]
  }
}
```

- [ ] **Step 3: Create share handler screen**

Create `apps/mobile/app/share.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useShareIntent, ShareIntent } from 'expo-share-intent';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useRouter } from 'expo-router';
import { Link2, Check, X } from 'lucide-react-native';

export default function ShareScreen() {
  const { shareIntent, resetShareIntent } = useShareIntent();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const createItem = useMutation(api.items.create);
  const router = useRouter();

  const url = shareIntent?.url || shareIntent?.text;

  const handleSave = async () => {
    if (!url) return;

    setIsSaving(true);
    try {
      await createItem({ url });
      setSaved(true);
      setTimeout(() => {
        resetShareIntent();
        router.replace('/(tabs)');
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetShareIntent();
    router.replace('/(tabs)');
  };

  // Auto-save when receiving a share intent
  useEffect(() => {
    if (url && !isSaving && !saved) {
      handleSave();
    }
  }, [url]);

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      {saved ? (
        <>
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Check size={32} color="#16A34A" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Saved!</Text>
          <Text className="text-sm text-gray-500 mt-1">AI enrichment in progress...</Text>
        </>
      ) : (
        <>
          <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
            {isSaving ? (
              <ActivityIndicator color="#6750A4" />
            ) : (
              <Link2 size={32} color="#6750A4" />
            )}
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {isSaving ? 'Saving...' : 'Save to Library'}
          </Text>
          {url && (
            <Text className="text-sm text-gray-500 text-center mb-6" numberOfLines={2}>
              {url}
            </Text>
          )}
          {!isSaving && (
            <Pressable onPress={handleCancel} className="mt-4">
              <Text className="text-gray-500">Cancel</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Register share route in root layout**

Add the share screen to the Stack in `apps/mobile/app/_layout.tsx`:

```tsx
<Stack.Screen
  name="share"
  options={{ presentation: 'modal', headerShown: false }}
/>
```

Also add share intent handling to the root layout. Import and use:

```tsx
import { useShareIntentContext, ShareIntentProvider } from 'expo-share-intent';
```

Wrap the app with `ShareIntentProvider` and add routing logic to navigate to `/share` when a share intent is received.

- [ ] **Step 5: Build a development build to test**

```bash
cd apps/mobile && npx expo run:ios && cd ../..
```

This creates a native build with the share extension. Test by:
1. Open Safari on the simulator
2. Navigate to any URL
3. Tap the share button
4. Select "The Library" from the share sheet
5. Verify the URL is saved

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add iOS/Android share sheet extension"
```

---

## PR 6 — Testing + EAS Build Setup

**Branch:** `feature/mobile-app/06-polish` (off `feature/mobile-app/05-share`)

---

### Task 13: Set up component testing

**Files:**
- Create: `apps/mobile/jest.config.js`
- Create: `apps/mobile/__tests__/components/ItemCard.test.tsx`
- Create: `apps/mobile/__tests__/components/FilterBar.test.tsx`
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install testing dependencies**

```bash
cd apps/mobile && npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest && cd ../..
```

- [ ] **Step 2: Configure Jest**

Create `apps/mobile/jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind)',
  ],
  moduleNameMapper: {
    '^@convex/(.*)$': '<rootDir>/../../convex/$1',
  },
};
```

Add to `apps/mobile/package.json` scripts:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 3: Write ItemCard test**

Create `apps/mobile/__tests__/components/ItemCard.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ItemCard } from '../../components/ItemCard';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Heart: () => 'Heart',
}));

const mockItem = {
  _id: '123' as any,
  _creationTime: Date.now(),
  userId: 'user1' as any,
  url: 'https://example.com/article',
  title: 'Test Article',
  summary: 'A test summary',
  contentType: 'article' as const,
  status: 'saved',
  isFavorite: false,
  imageUrl: null,
  sourceName: 'Example',
  topicIds: [],
  notes: null,
  notesList: null,
  enrichmentStatus: 'enriched' as const,
  embedding: null,
};

describe('ItemCard', () => {
  it('renders title and summary', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('A test summary')).toBeTruthy();
  });

  it('shows content type badge', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText('article')).toBeTruthy();
  });

  it('falls back to URL when no title', () => {
    render(<ItemCard item={{ ...mockItem, title: undefined as any }} />);
    expect(screen.getByText('https://example.com/article')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Write FilterBar test**

Create `apps/mobile/__tests__/components/FilterBar.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FilterBar } from '../../components/FilterBar';

const options = [
  { label: 'Saved', value: 'saved' },
  { label: 'Done', value: 'done' },
];

describe('FilterBar', () => {
  it('renders all options plus All button', () => {
    render(<FilterBar options={options} selected={null} onSelect={jest.fn()} />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('calls onSelect when option tapped', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected={null} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Saved'));
    expect(onSelect).toHaveBeenCalledWith('saved');
  });

  it('calls onSelect with null when All tapped', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected="saved" onSelect={onSelect} />);
    fireEvent.press(screen.getByText('All'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('deselects when tapping active option', () => {
    const onSelect = jest.fn();
    render(<FilterBar options={options} selected="saved" onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Saved'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
cd apps/mobile && npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add component tests with Jest and Testing Library"
```

---

### Task 14: Configure EAS Build

**Files:**
- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
```

- [ ] **Step 2: Create EAS configuration**

Create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

- [ ] **Step 3: Configure app.json for EAS**

Ensure `apps/mobile/app.json` includes the `extra.eas.projectId` field. This is set when you run:

```bash
cd apps/mobile && eas init && cd ../..
```

Follow the prompts to link to an Expo account and project.

- [ ] **Step 4: Test a simulator build**

```bash
cd apps/mobile && eas build --profile development --platform ios && cd ../..
```

This queues a cloud build. When complete, download and install in the simulator to verify.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/
git commit -m "chore: add EAS Build configuration"
```

---

### Task 15: Root-level convenience scripts

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add convenience scripts to root package.json**

Add these scripts to the root `package.json`:

```json
{
  "scripts": {
    "mobile": "npm run start -w apps/mobile",
    "mobile:ios": "npm run ios -w apps/mobile",
    "mobile:test": "npm test -w apps/mobile"
  }
}
```

Add corresponding scripts in `apps/mobile/package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest"
  }
}
```

- [ ] **Step 2: Verify convenience scripts work**

```bash
npm run mobile:test
```

Expected: mobile tests pass.

- [ ] **Step 3: Verify web app is still unaffected**

```bash
npm test
npm run build
```

Expected: all 39 web tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json apps/mobile/package.json
git commit -m "chore: add root-level convenience scripts for mobile"
```
