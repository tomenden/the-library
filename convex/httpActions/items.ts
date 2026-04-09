import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";
import { Id } from "../_generated/dataModel";

export const createItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { topicNames, topicIds: _ignored, ...fields } = body;

  // Resolve topic names → IDs (create topics that don't exist yet)
  let topicIds: Id<"topics">[] = [];
  if (Array.isArray(topicNames) && topicNames.length > 0) {
    topicIds = await Promise.all(
      topicNames.map((name: string) =>
        ctx.runMutation(internal.topics.resolveOrCreate, {
          userId: auth.userId,
          name,
        })
      )
    );
  }

  const id = await ctx.runMutation(internal.items.createInternal, {
    ...fields,
    userId: auth.userId,
    topicIds,
  });

  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(item, 201);
});

export const listItems = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? undefined) as any;
  const topicId = (url.searchParams.get("topicId") ?? undefined) as
    | Id<"topics">
    | undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const items = await ctx.runQuery(internal.items.listInternal, {
    userId: auth.userId,
    status,
    topicId,
    q,
  });

  return jsonResponse(items);
});

export const getItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;
  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  if (!item) return errorResponse("Not found", 404);
  return jsonResponse(item);
});

export const updateItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;
  const body = await request.json();

  try {
    await ctx.runMutation(internal.items.updateInternal, {
      id,
      userId: auth.userId,
      ...body,
    });
  } catch {
    return errorResponse("Not found", 404);
  }

  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  return jsonResponse(item);
});

export const deleteItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = new URL(request.url).pathname.split("/").pop() as Id<"items">;

  try {
    await ctx.runMutation(internal.items.removeInternal, {
      id,
      userId: auth.userId,
    });
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Not found", 404);
  }
});
