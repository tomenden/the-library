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
  imageUrl?: string;
}

export function truncateHtml(html: string, maxChars = 50000): string {
  return html.length > maxChars ? html.slice(0, maxChars) : html;
}

export function cleanHtml(html: string): string {
  return html
    // Remove tags whose content is never useful to an LLM
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    // Remove structural boilerplate elements
    .replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Strip remaining tags, keeping text
    .replace(/<[^>]+>/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
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

function metaContent(html: string, attr: string, val: string): RegExpMatchArray | null {
  return html.match(new RegExp(`<meta\\s[^>]*${attr}=["']${val}["'][^>]*content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta\\s[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${val}["']`, "i"));
}

export function extractImageUrl(html: string, baseUrl: string): string | undefined {
  const ogMatch = metaContent(html, "property", "og:image");
  if (ogMatch?.[1]) return new URL(ogMatch[1], baseUrl).href;

  const twMatch = metaContent(html, "name", "twitter:image");
  if (twMatch?.[1]) return new URL(twMatch[1], baseUrl).href;

  const imgMatch = html.match(/<img\s[^>]*src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    const resolved = new URL(imgMatch[1], baseUrl).href;
    if (resolved.startsWith("https://") || resolved.startsWith("http://")) {
      return resolved;
    }
  }

  return undefined;
}

async function enrichUrl(url: string, apiKey: string, existingTopics: string[]): Promise<EnrichmentData> {
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
  const imageUrl = extractImageUrl(html, url);
  const content = truncateHtml(cleanHtml(html), 15000);

  const prompt =
    `You are a content metadata extractor. Given the text content of a webpage, extract the following as JSON:\n` +
    `- title: a meaningful, descriptive title for the content. Use the page's own title if it clearly represents the content; otherwise generate a concise, accurate title from the body text (string)\n` +
    `- summary: a 2-3 sentence summary of the actual content. For videos, use the video description. For articles, summarise the body text (string)\n` +
    `- contentType: one of "article", "video", "podcast", "tweet", "newsletter" — or null if none fit\n` +
    `- sourceName: the name of the source/publication/platform (e.g. "YouTube", "Medium", "Substack") — or null\n` +
    `- topicNames: an array of 1-4 relevant topic tags as short title-case strings (e.g. ["Machine Learning", "Python"]). Prefer reusing tags from the existing list below when they closely match — only introduce new tags when nothing in the list fits.\n\n` +
    `Existing tags: ${existingTopics.length > 0 ? existingTopics.join(", ") : "none yet"}\n\n` +
    `Respond with only valid JSON, no explanation.\n\nURL: ${url}\n\nContent:\n${content}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
  return { ...parseEnrichmentResponse(responseText), imageUrl };
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
      const existingTopics = await ctx.runQuery(internal.topics.listInternal, { userId });
      const existingTopicNames = existingTopics.map((t) => t.name);
      enrichment = await enrichUrl(url, apiKey, existingTopicNames);
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
    imageUrl: enrichment.imageUrl,
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
