import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.*s");

async function setupUser(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    return ctx.db.insert("users", {
      email: "test@example.com",
      name: "Test User",
      emailVerificationTime: Date.now(),
    }) as Promise<Id<"users">>;
  });
}

test("resolveOrCreate: creates a new topic", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "Machine Learning" })
  );

  const topic = await t.run(async (ctx) => ctx.db.get(topicId));
  expect(topic?.name).toBe("Machine Learning");
  expect(topic?.userId).toBe(userId);
});

test("resolveOrCreate: returns existing topic on duplicate name", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const id1 = await t.mutation(internal.topics.resolveOrCreate, {
    userId,
    name: "Design",
  });
  const id2 = await t.mutation(internal.topics.resolveOrCreate, {
    userId,
    name: "Design",
  });

  expect(id1).toBe(id2);
});

test("removeInternal: cleans up topicIds on affected items", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const topicId = await t.run(async (ctx) =>
    ctx.db.insert("topics", { userId, name: "Tech" })
  );
  const itemId = await t.run(async (ctx) =>
    ctx.db.insert("items", {
      userId,
      url: "https://example.com",
      status: "saved",
      topicIds: [topicId],
    })
  );

  await t.mutation(internal.topics.removeInternal, { id: topicId, userId });

  const item = await t.run(async (ctx) => ctx.db.get(itemId));
  expect(item?.topicIds).toHaveLength(0);

  const topic = await t.run(async (ctx) => ctx.db.get(topicId));
  expect(topic).toBeNull();
});
