import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";

export const ingestItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { url, notes } = body;

  if (!url || typeof url !== "string") {
    return errorResponse("url is required", 400);
  }

  const itemId = await ctx.runAction(internal.actions.ingest.ingestItemInternal, {
    userId: auth.userId,
    url,
    notes: typeof notes === "string" ? notes : undefined,
  });

  const item = await ctx.runQuery(internal.items.getInternal, {
    id: itemId,
    userId: auth.userId,
  });

  return jsonResponse(item, 201);
});
