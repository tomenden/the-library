import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";
import { Id } from "../_generated/dataModel";

function extractId<T extends string>(request: Request): Id<T> | null {
  const seg = new URL(request.url).pathname.split("/").pop();
  return seg ? (seg as Id<T>) : null;
}

function notFoundOrRethrow(e: unknown): Response {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "Not found") return errorResponse("Not found", 404);
  throw e;
}

export const listTopics = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const topics = await ctx.runQuery(internal.topics.listInternal, {
    userId: auth.userId,
  });

  return jsonResponse(topics);
});

export const createTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return errorResponse("name is required", 400);
  }

  const id = await ctx.runMutation(internal.topics.resolveOrCreate, {
    userId: auth.userId,
    name,
  });

  const topic = await ctx.runQuery(internal.topics.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(topic, 201);
});

export const updateTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = extractId<"topics">(request);
  if (!id) return errorResponse("Bad request", 400);

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return errorResponse("name is required", 400);
  }

  try {
    await ctx.runMutation(internal.topics.renameInternal, {
      id,
      userId: auth.userId,
      name,
    });
  } catch (e) {
    return notFoundOrRethrow(e);
  }

  const topic = await ctx.runQuery(internal.topics.getInternal, {
    id,
    userId: auth.userId,
  });

  if (!topic) return errorResponse("Not found", 404);
  return jsonResponse(topic);
});

export const deleteTopic = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = extractId<"topics">(request);
  if (!id) return errorResponse("Bad request", 400);

  try {
    await ctx.runMutation(internal.topics.removeInternal, {
      id,
      userId: auth.userId,
    });
    return jsonResponse({ success: true });
  } catch (e) {
    return notFoundOrRethrow(e);
  }
});
