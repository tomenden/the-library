/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { truncateHtml, cleanHtml, parseEnrichmentResponse, extractImageUrl, isTwitterUrl } from "./ingest";

// truncateHtml

test("truncateHtml: returns string unchanged when under limit", () => {
  expect(truncateHtml("hello", 100)).toBe("hello");
});

test("truncateHtml: truncates to maxChars", () => {
  expect(truncateHtml("abcdef", 3)).toBe("abc");
});

test("truncateHtml: uses 50000 as default limit", () => {
  const long = "a".repeat(60000);
  expect(truncateHtml(long)).toHaveLength(50000);
});

// cleanHtml

test("cleanHtml: removes script tags and their content", () => {
  expect(cleanHtml(`<p>Hello</p><script>alert('xss')</script>`)).toBe("Hello");
});

test("cleanHtml: removes style tags and their content", () => {
  expect(cleanHtml(`<style>.foo { color: red }</style><p>Article</p>`)).toBe("Article");
});

test("cleanHtml: removes nav, header, footer, aside", () => {
  const html = `<header>Site Header</header><main><p>Content</p></main><footer>Footer</footer>`;
  expect(cleanHtml(html)).toBe("Content");
});

test("cleanHtml: removes HTML comments", () => {
  expect(cleanHtml(`<!-- comment --><p>Text</p>`)).toBe("Text");
});

test("cleanHtml: collapses whitespace", () => {
  expect(cleanHtml(`<p>Hello   \n\n   world</p>`)).toBe("Hello world");
});

test("cleanHtml: preserves text from nested elements", () => {
  const html = `<article><h1>Title</h1><p>Body text here.</p></article>`;
  expect(cleanHtml(html)).toBe("Title Body text here.");
});

// parseEnrichmentResponse

test("parseEnrichmentResponse: extracts all fields from valid JSON", () => {
  const input = JSON.stringify({
    title: "My Article",
    summary: "A great read.",
    contentType: "article",
    sourceName: "Medium",
    topicNames: ["AI", "Writing"],
  });
  expect(parseEnrichmentResponse(input)).toEqual({
    title: "My Article",
    summary: "A great read.",
    contentType: "article",
    sourceName: "Medium",
    topicNames: ["AI", "Writing"],
  });
});

test("parseEnrichmentResponse: returns empty result on invalid JSON", () => {
  expect(parseEnrichmentResponse("not json")).toEqual({ topicNames: [] });
});

test("parseEnrichmentResponse: ignores invalid contentType", () => {
  const input = JSON.stringify({ contentType: "banana", topicNames: [] });
  expect(parseEnrichmentResponse(input).contentType).toBeUndefined();
});

test("parseEnrichmentResponse: filters non-string topicNames", () => {
  const input = JSON.stringify({ topicNames: ["good", 42, null, "also good"] });
  expect(parseEnrichmentResponse(input).topicNames).toEqual(["good", "also good"]);
});

test("parseEnrichmentResponse: treats null sourceName as undefined", () => {
  const input = JSON.stringify({ sourceName: null, topicNames: [] });
  expect(parseEnrichmentResponse(input).sourceName).toBeUndefined();
});

// isTwitterUrl

test("isTwitterUrl: recognizes x.com", () => {
  expect(isTwitterUrl("https://x.com/user/status/123")).toBe(true);
});

test("isTwitterUrl: recognizes twitter.com", () => {
  expect(isTwitterUrl("https://twitter.com/user/status/123")).toBe(true);
});

test("isTwitterUrl: recognizes www.x.com", () => {
  expect(isTwitterUrl("https://www.x.com/user/status/123")).toBe(true);
});

test("isTwitterUrl: recognizes www.twitter.com", () => {
  expect(isTwitterUrl("https://www.twitter.com/user/status/123")).toBe(true);
});

test("isTwitterUrl: rejects other domains", () => {
  expect(isTwitterUrl("https://example.com/status/123")).toBe(false);
  expect(isTwitterUrl("https://nottwitter.com/status/123")).toBe(false);
});

test("isTwitterUrl: recognizes article URLs", () => {
  expect(isTwitterUrl("https://x.com/user/article/123")).toBe(true);
});

// extractImageUrl

const BASE = "https://example.com";

test("extractImageUrl: returns og:image (property before content)", () => {
  const html = `<meta property="og:image" content="https://example.com/img.jpg">`;
  expect(extractImageUrl(html, BASE)).toBe("https://example.com/img.jpg");
});

test("extractImageUrl: returns og:image (content before property)", () => {
  const html = `<meta content="https://example.com/img.jpg" property="og:image">`;
  expect(extractImageUrl(html, BASE)).toBe("https://example.com/img.jpg");
});

test("extractImageUrl: falls back to twitter:image when no og:image", () => {
  const html = `<meta name="twitter:image" content="https://example.com/tw.jpg">`;
  expect(extractImageUrl(html, BASE)).toBe("https://example.com/tw.jpg");
});

test("extractImageUrl: falls back to first img src when no meta tags", () => {
  const html = `<img src="https://example.com/photo.png" alt="photo">`;
  expect(extractImageUrl(html, BASE)).toBe("https://example.com/photo.png");
});

test("extractImageUrl: resolves relative og:image URL", () => {
  const html = `<meta property="og:image" content="/images/cover.jpg">`;
  expect(extractImageUrl(html, BASE)).toBe("https://example.com/images/cover.jpg");
});

test("extractImageUrl: returns undefined when no image found", () => {
  expect(extractImageUrl("<html><body>no images here</body></html>", BASE)).toBeUndefined();
});

test("extractImageUrl: rejects data: URI in img src", () => {
  const html = `<img src="data:image/png;base64,abc123">`;
  expect(extractImageUrl(html, BASE)).toBeUndefined();
});

test("extractImageUrl: rejects javascript: URI in img src", () => {
  const html = `<img src="javascript:void(0)">`;
  expect(extractImageUrl(html, BASE)).toBeUndefined();
});
