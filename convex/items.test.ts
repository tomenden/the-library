import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.*s");

async function setupUser(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test",
      emailVerificationTime: Date.now(),
    }) as Promise<Id<"users">>
  );
}

test("createInternal: inserts item with status=saved", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com/article",
    title: "Test Article",
    topicIds: [],
  });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item?.url).toBe("https://example.com/article");
  expect(item?.status).toBe("saved");
  expect(item?.userId).toBe(userId);
});

test("listInternal: filters by status", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://a.com",
    topicIds: [],
  });
  await t.run(async (ctx) =>
    ctx.db.insert("items", {
      userId,
      url: "https://b.com",
      status: "done",
      topicIds: [],
    })
  );

  const saved = await t.query(internal.items.listInternal, {
    userId,
    status: "saved",
  });
  expect(saved).toHaveLength(1);
  expect(saved[0].url).toBe("https://a.com");
});

test("listInternal: filters by topicId", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "AI" })
  );

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://ai.com",
    topicIds: [topicId],
  });
  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://other.com",
    topicIds: [],
  });

  const aiItems = await t.query(internal.items.listInternal, {
    userId,
    topicId,
  });
  expect(aiItems).toHaveLength(1);
  expect(aiItems[0].url).toBe("https://ai.com");
});

test("listInternal: searches title and summary", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://rust.com",
    title: "Why Rust is great",
    topicIds: [],
  });
  await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://go.com",
    title: "Go programming",
    topicIds: [],
  });

  const results = await t.query(internal.items.listInternal, {
    userId,
    q: "rust",
  });
  expect(results).toHaveLength(1);
  expect(results[0].url).toBe("https://rust.com");
});

test("updateInternal: changes status", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await t.mutation(internal.items.updateInternal, {
    id,
    userId,
    status: "done",
  });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item?.status).toBe("done");
});

test("updateInternal: throws on wrong userId", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);
  const otherId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "other@example.com",
      name: "Other",
      emailVerificationTime: Date.now(),
    })
  );

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await expect(
    t.mutation(internal.items.updateInternal, {
      id,
      userId: otherId,
      status: "done",
    })
  ).rejects.toThrow("Not found");
});

test("removeInternal: deletes item", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const id = await t.mutation(internal.items.createInternal, {
    userId,
    url: "https://example.com",
    topicIds: [],
  });

  await t.mutation(internal.items.removeInternal, { id, userId });

  const item = await t.run(async (ctx) => ctx.db.get(id));
  expect(item).toBeNull();
});
