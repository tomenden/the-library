/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_embeddings from "../actions/embeddings.js";
import type * as actions_ingest from "../actions/ingest.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as httpActions_ingest from "../httpActions/ingest.js";
import type * as httpActions_items from "../httpActions/items.js";
import type * as httpActions_middleware from "../httpActions/middleware.js";
import type * as httpActions_topics from "../httpActions/topics.js";
import type * as items from "../items.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as search from "../search.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/embeddings": typeof actions_embeddings;
  "actions/ingest": typeof actions_ingest;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  http: typeof http;
  "httpActions/ingest": typeof httpActions_ingest;
  "httpActions/items": typeof httpActions_items;
  "httpActions/middleware": typeof httpActions_middleware;
  "httpActions/topics": typeof httpActions_topics;
  items: typeof items;
  "lib/crypto": typeof lib_crypto;
  search: typeof search;
  topics: typeof topics;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
