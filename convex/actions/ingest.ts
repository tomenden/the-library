"use node";
import { action, internalAction, ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { VALID_CONTENT_TYPES, ContentType } from "../schema";

declare const process: { env: Record<string, string | undefined> };

export interface EnrichmentData {
  title?: string;
  summary?: string;
  contentType?: ContentType;
  sourceName?: string;
  topicNames: string[];
}

export function truncateHtml(html: string, maxChars = 50000): string {
  return html.length > maxChars ? html.slice(0, maxChars) : html;
}

export function parseEnrichmentResponse(text: string): EnrichmentData {
  try {
    const data = JSON.parse(text);
    const topicNames = Array.isArray(data.topicNames)
      ? data.topicNames.filter((t: unknown): t is string => typeof t === "string")
      : [];
    const contentType = VALID_CONTENT_TYPES.includes(data.contentType)
      ? (data.contentType as ContentType)
      : undefined;
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      summary: typeof data.summary === "string" ? data.summary : undefined,
      contentType,
      sourceName: typeof data.sourceName === "string" ? data.sourceName : undefined,
      topicNames,
    };
  } catch {
    return { topicNames: [] };
  }
}

async function enrichUrl(url: string, apiKey: string): Promise<EnrichmentData> {
  const pageRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TheLibrary/1.0; +https://the-library-sigma.vercel.app)",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!pageRes.ok) {
    throw new Error(`Failed to fetch URL (${pageRes.status}): ${url}`);
  }
  const html = await pageRes.text();
  const truncated = truncateHtml(html);

  const prompt =
    `You are a content metadata extractor. Given the HTML of a webpage, extract the following as JSON:\n` +
    `- title: the title of the content. Use og:title or the page <title> if meaningful. If the title is missing, empty, a single character, or clearly a placeholder (e.g. "-", "Untitled"), derive a descriptive title from the body text instead (string)\n` +
    `- summary: a 2-3 sentence summary of the actual content. Use the body text, not just meta tags (string)\n` +
    `- contentType: one of "article", "video", "podcast", "tweet", "newsletter" — or null if none fit\n` +
    `- sourceName: the name of the source/publication/platform (e.g. "YouTube", "Medium", "Substack") — or null\n` +
    `- topicNames: an array of 1-4 relevant topic tags as short title-case strings (e.g. ["Machine Learning", "Python"])\n\n` +
    `Respond with only valid JSON, no explanation.\n\nURL: ${url}\n\nHTML:\n${truncated}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    throw new Error(`Gemini API error ${geminiRes.status}: ${err}`);
  }

  const geminiJson = await geminiRes.json();
  const responseText: string =
    geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseEnrichmentResponse(responseText);
}

async function ingestUrlHandler(
  ctx: ActionCtx,
  { userId, url, notes }: { userId: Id<"users">; url: string; notes?: string }
): Promise<Id<"items">> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http and https URLs are supported");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let enrichment: EnrichmentData = { topicNames: [] };

  if (apiKey) {
    try {
      enrichment = await enrichUrl(url, apiKey);
    } catch (e) {
      console.error("Enrichment failed, saving URL only:", e);
    }
  }

  const topicIds = await Promise.all(
    enrichment.topicNames.map((name) =>
      ctx.runMutation(internal.topics.resolveOrCreate, { userId, name })
    )
  );

  return ctx.runMutation(internal.items.createInternal, {
    userId,
    url,
    title: enrichment.title,
    summary: enrichment.summary,
    contentType: enrichment.contentType,
    sourceName: enrichment.sourceName,
    notesList: notes ? [notes] : undefined,
    topicIds,
  });
}

export const ingestItem = action({
  args: {
    url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { url, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return ingestUrlHandler(ctx, { userId, url, notes });
  },
});

export const ingestItemInternal = internalAction({
  args: {
    userId: v.id("users"),
    url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: (ctx, args) => ingestUrlHandler(ctx, args),
});
