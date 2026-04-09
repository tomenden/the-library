import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";
import { Id } from "../_generated/dataModel";

const VALID_STATUSES = ["saved", "in_progress", "done"] as const;
type Status = (typeof VALID_STATUSES)[number];

function extractId<T extends string>(request: Request): Id<T> | null {
  const seg = new URL(request.url).pathname.split("/").pop();
  return seg ? (seg as Id<T>) : null;
}

function notFoundOrRethrow(e: unknown): Response {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "Not found") return errorResponse("Not found", 404);
  throw e;
}

export const createItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { url, title, summary, contentType, sourceName, imageUrl, notes, topicNames } = body;

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
    url,
    title,
    summary,
    contentType,
    sourceName,
    imageUrl,
    notes,
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

  const reqUrl = new URL(request.url);
  const rawStatus = reqUrl.searchParams.get("status") ?? undefined;
  if (rawStatus !== undefined && !VALID_STATUSES.includes(rawStatus as Status)) {
    return errorResponse("Invalid status value", 400);
  }
  const status = rawStatus as Status | undefined;
  const topicId = (reqUrl.searchParams.get("topicId") ?? undefined) as
    | Id<"topics">
    | undefined;
  const q = reqUrl.searchParams.get("q") ?? undefined;

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

  const id = extractId<"items">(request);
  if (!id) return errorResponse("Bad request", 400);

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

  const id = extractId<"items">(request);
  if (!id) return errorResponse("Bad request", 400);

  const { title, summary, status, notes, topicIds } = await request.json();

  try {
    await ctx.runMutation(internal.items.updateInternal, {
      id,
      userId: auth.userId,
      title,
      summary,
      status,
      notes,
      topicIds,
    });
  } catch (e) {
    return notFoundOrRethrow(e);
  }

  const item = await ctx.runQuery(internal.items.getInternal, {
    id,
    userId: auth.userId,
  });

  if (!item) return errorResponse("Not found", 404);
  return jsonResponse(item);
});

export const deleteItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const id = extractId<"items">(request);
  if (!id) return errorResponse("Bad request", 400);

  try {
    await ctx.runMutation(internal.items.removeInternal, {
      id,
      userId: auth.userId,
    });
    return jsonResponse({ success: true });
  } catch (e) {
    return notFoundOrRethrow(e);
  }
});
