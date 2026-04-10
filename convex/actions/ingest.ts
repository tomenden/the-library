const VALID_CONTENT_TYPES = [
  "article",
  "video",
  "podcast",
  "tweet",
  "newsletter",
] as const;
type ContentType = (typeof VALID_CONTENT_TYPES)[number];

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
