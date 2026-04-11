import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { authenticateRequest, jsonResponse, errorResponse } from "./middleware";

export const ingestItem = httpAction(async (ctx, request) => {
  const auth = await authenticateRequest(ctx, request);
  if (!auth) return errorResponse("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  const { url, notes } = body;

  if (typeof url !== "string" || url.trim() === "") {
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

  if (!item) return errorResponse("Item not found after ingest", 500);
  return jsonResponse(item, 201);
});
