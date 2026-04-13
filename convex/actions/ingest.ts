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

const TWITTER_HOSTS = new Set(["twitter.com", "x.com"]);

export function isTwitterUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return TWITTER_HOSTS.has(host);
  } catch {
    return false;
  }
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

// ── LLM provider helpers ──────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(input, init);
    if (res.ok || !RETRYABLE_STATUS_CODES.has(res.status) || attempt === retries) {
      return res;
    }
    const delay = 1000 * Math.pow(2, attempt);
    console.log(`LLM API returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetchWithRetry(
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

async function callOpenRouter(apiKey: string, prompt: string): Promise<string> {
  const res = await fetchWithRetry(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://the-library-sigma.vercel.app",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "{}";
}

// ── Enrichment pipeline ───────────────────────────────────────────────────

function buildEnrichmentPrompt(url: string, content: string, existingTopics: string[]): string {
  return (
    `You are a content metadata extractor. Given the text content of a webpage, extract the following as JSON:\n` +
    `- title: a meaningful, descriptive title for the content. Use the page's own title if it clearly represents the content; otherwise generate a concise, accurate title from the body text (string)\n` +
    `- summary: a 2-3 sentence summary of the actual content. For videos, use the video description. For articles, summarise the body text (string)\n` +
    `- contentType: one of "article", "video", "podcast", "tweet", "newsletter" — or null if none fit\n` +
    `- sourceName: the name of the source/publication/platform (e.g. "YouTube", "Medium", "Substack") — or null\n` +
    `- topicNames: an array of 1-4 relevant topic tags as short title-case strings (e.g. ["Machine Learning", "Python"]). Prefer reusing tags from the existing list below when they closely match — only introduce new tags when nothing in the list fits.\n\n` +
    `Existing tags: ${existingTopics.length > 0 ? existingTopics.join(", ") : "none yet"}\n\n` +
    `Respond with only valid JSON, no explanation.\n\nURL: ${url}\n\nContent:\n${content}`
  );
}

async function enrichUrl(url: string, existingTopics: string[]): Promise<EnrichmentData> {
  // 1. Fetch page content (shared across providers)
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
  const prompt = buildEnrichmentPrompt(url, content, existingTopics);

  // 2. Try Gemini first, then OpenRouter fallback
  let responseText: string | undefined;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      responseText = await callGemini(geminiKey, prompt);
    } catch (e) {
      console.error("Gemini enrichment failed:", e);
    }
  }

  if (!responseText) {
    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey) {
      console.log("Falling back to OpenRouter for enrichment");
      try {
        responseText = await callOpenRouter(orKey, prompt);
      } catch (e) {
        console.error("OpenRouter fallback failed:", e);
      }
    }
  }

  if (!responseText) {
    throw new Error("All enrichment providers failed");
  }

  return { ...parseEnrichmentResponse(responseText), imageUrl };
}

// Shared: resolve enrichment + topics, then create item.
// returnOnEnrichmentFailure = true → return { itemId: null, enrichmentFailed: true } (frontend modal)
// returnOnEnrichmentFailure = false → save bare URL on failure (HTTP API)
async function ingestUrlHandler(
  ctx: ActionCtx,
  { userId, url, notes, returnOnEnrichmentFailure = false }:
    { userId: Id<"users">; url: string; notes?: string; returnOnEnrichmentFailure?: boolean }
): Promise<any> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http and https URLs are supported");
  }

  let enrichment: EnrichmentData = { topicNames: [] };
  let enrichmentStatus: "enriched" | "failed" | undefined;

  try {
    const existingTopics = await ctx.runQuery(internal.topics.listInternal, { userId });
    const existingTopicNames = existingTopics.map((t) => t.name);
    enrichment = await enrichUrl(url, existingTopicNames);
    enrichmentStatus = "enriched";
  } catch (e) {
    console.error("Enrichment failed:", e);
    enrichmentStatus = "failed";
    if (returnOnEnrichmentFailure) {
      return { itemId: null, enrichmentFailed: true };
    }
  }

  const topicIds = await Promise.all(
    enrichment.topicNames.map((name) =>
      ctx.runMutation(internal.topics.resolveOrCreate, { userId, name })
    )
  );

  const itemId = await ctx.runMutation(internal.items.createInternal, {
    userId,
    url,
    title: enrichment.title,
    summary: enrichment.summary,
    contentType: enrichment.contentType,
    sourceName: enrichment.sourceName,
    imageUrl: enrichment.imageUrl,
    notesList: notes ? [notes] : undefined,
    topicIds,
    enrichmentStatus,
  });

  if (returnOnEnrichmentFailure) {
    return { itemId, enrichmentFailed: false };
  }
  return itemId;
}

// Frontend action — returns enrichment status so the modal can offer choices on failure.
// (Convex sanitizes thrown errors in production, so we return a result object instead.)
export const ingestItem = action({
  args: {
    url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { url, notes }): Promise<{ itemId: string | null; enrichmentFailed: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return ingestUrlHandler(ctx, { userId, url, notes, returnOnEnrichmentFailure: true });
  },
});

// Re-enrich an existing item (retry from ContentPreview)
export const reEnrich = action({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const item = await ctx.runQuery(internal.items.getInternal, { id, userId });
    if (!item) throw new Error("Not found");

    const existingTopics = await ctx.runQuery(internal.topics.listInternal, { userId });
    const existingTopicNames = existingTopics.map((t: { name: string }) => t.name);

    const enrichment = await enrichUrl(item.url, existingTopicNames);

    const topicIds = await Promise.all(
      enrichment.topicNames.map((name) =>
        ctx.runMutation(internal.topics.resolveOrCreate, { userId, name })
      )
    );

    const existingTopicIds = item.topicIds ?? [];
    const mergedTopicIds = [...new Set([...existingTopicIds, ...topicIds])];

    await ctx.runMutation(internal.items.updateEnrichment, {
      id,
      userId,
      title: enrichment.title,
      summary: enrichment.summary,
      contentType: enrichment.contentType,
      sourceName: enrichment.sourceName,
      imageUrl: enrichment.imageUrl,
      topicIds: mergedTopicIds,
      enrichmentStatus: "enriched",
    });
  },
});

// HTTP API action — graceful degradation, always saves the item
export const ingestItemInternal = internalAction({
  args: {
    userId: v.id("users"),
    url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: (ctx, args) => ingestUrlHandler(ctx, args),
});
