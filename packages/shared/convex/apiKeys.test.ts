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

test("createKeyInternal: returns raw key starting with lib_", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "My Claude",
  });

  expect(rawKey).toMatch(/^lib_[0-9a-f]{64}$/);
});

test("createKeyInternal: stores hash, not raw key", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "My Claude",
  });

  const keys = await t.run(async (ctx) =>
    ctx.db.query("apiKeys").collect()
  );
  expect(keys).toHaveLength(1);
  expect(keys[0].keyHash).not.toBe(rawKey);
  expect(keys[0].keyHash).toHaveLength(64); // sha256 hex
});

test("getByHash: resolves API key to userId", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  const rawKey = await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "Test Key",
  });

  // Hash the raw key the same way the server does
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const found = await t.query(internal.apiKeys.getByHash, { keyHash: hash });
  expect(found?.userId).toBe(userId);
});

test("revokeInternal: deletes the key", async () => {
  const t = convexTest(schema, modules);
  const userId = await setupUser(t);

  await t.mutation(internal.apiKeys.createKeyInternal, {
    userId,
    name: "Temp",
  });

  const keys = await t.run(async (ctx) => ctx.db.query("apiKeys").collect());
  await t.mutation(internal.apiKeys.revokeInternal, {
    id: keys[0]._id,
    userId,
  });

  const after = await t.run(async (ctx) => ctx.db.query("apiKeys").collect());
  expect(after).toHaveLength(0);
});
