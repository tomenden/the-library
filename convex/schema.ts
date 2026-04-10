import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const contentTypeValidator = v.union(
  v.literal("article"),
  v.literal("video"),
  v.literal("podcast"),
  v.literal("tweet"),
  v.literal("newsletter"),
);

export const statusValidator = v.union(
  v.literal("saved"),
  v.literal("in_progress"),
  v.literal("done"),
);

export default defineSchema({
  ...authTables,

  items: defineTable({
    userId: v.id("users"),
    url: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    sourceName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: statusValidator,
    notes: v.optional(v.string()),
    notesList: v.optional(v.array(v.string())),
    topicIds: v.array(v.id("topics")),
    isFavorite: v.optional(v.boolean()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),

  topics: defineTable({
    userId: v.id("users"),
    name: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"]),
});
