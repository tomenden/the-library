/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { truncateHtml, cleanHtml, parseEnrichmentResponse, extractImageUrl, isTwitterUrl, composeTwitterText, extractTwitterImageUrl, isYouTubeUrl, extractYouTubeVideoId, extractYouTubeDescription, composeYouTubeText } from "./ingest";

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

// composeTwitterText

test("composeTwitterText: composes text for a regular tweet", () => {
  const data = {
    tweet: {
      text: "This is a great thread about AI",
      author: { name: "John", screen_name: "john_ai" },
    },
  };
  const result = composeTwitterText(data);
  expect(result).toBe("Tweet by John (@john_ai):\n\nThis is a great thread about AI");
});

test("composeTwitterText: composes text for an article with content blocks", () => {
  const data = {
    tweet: {
      text: "",
      author: { name: "AVB", screen_name: "neural_avb" },
      article: {
        title: "Neural Computers, Explained",
        preview_text: "This new Meta AI paper trains a neural network.",
        content: {
          blocks: [
            { text: "First paragraph.", type: "unstyled" },
            { text: "Second paragraph.", type: "unstyled" },
          ],
        },
      },
    },
  };
  const result = composeTwitterText(data);
  expect(result).toContain('Article by AVB (@neural_avb): "Neural Computers, Explained"');
  expect(result).toContain("First paragraph.");
  expect(result).toContain("Second paragraph.");
});

test("composeTwitterText: uses preview_text when no content blocks", () => {
  const data = {
    tweet: {
      text: "",
      author: { name: "AVB", screen_name: "neural_avb" },
      article: {
        title: "Some Article",
        preview_text: "A preview of the article content.",
      },
    },
  };
  const result = composeTwitterText(data);
  expect(result).toContain('"Some Article"');
  expect(result).toContain("A preview of the article content.");
});

test("composeTwitterText: handles missing author gracefully", () => {
  const data = {
    tweet: {
      text: "Hello world",
    },
  };
  const result = composeTwitterText(data);
  expect(result).toContain("Hello world");
});

// extractTwitterImageUrl

test("extractTwitterImageUrl: prefers article cover image", () => {
  const data = {
    tweet: {
      author: { avatar_url: "https://pbs.twimg.com/avatar.jpg" },
      media: { photos: [{ url: "https://pbs.twimg.com/media/photo.jpg" }] },
      article: {
        cover_media: {
          media_info: { original_img_url: "https://pbs.twimg.com/media/cover.jpg" },
        },
      },
    },
  };
  expect(extractTwitterImageUrl(data)).toBe("https://pbs.twimg.com/media/cover.jpg");
});

test("extractTwitterImageUrl: falls back to tweet media photo", () => {
  const data = {
    tweet: {
      author: { avatar_url: "https://pbs.twimg.com/avatar.jpg" },
      media: { photos: [{ url: "https://pbs.twimg.com/media/photo.jpg" }] },
    },
  };
  expect(extractTwitterImageUrl(data)).toBe("https://pbs.twimg.com/media/photo.jpg");
});

test("extractTwitterImageUrl: falls back to author avatar", () => {
  const data = {
    tweet: {
      author: { avatar_url: "https://pbs.twimg.com/avatar.jpg" },
    },
  };
  expect(extractTwitterImageUrl(data)).toBe("https://pbs.twimg.com/avatar.jpg");
});

test("extractTwitterImageUrl: returns undefined when no images", () => {
  expect(extractTwitterImageUrl({ tweet: {} })).toBeUndefined();
  expect(extractTwitterImageUrl({})).toBeUndefined();
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

// isYouTubeUrl

test("isYouTubeUrl: recognizes youtube.com/watch", () => {
  expect(isYouTubeUrl("https://youtube.com/watch?v=tvos4nORf_Y")).toBe(true);
});

test("isYouTubeUrl: recognizes www.youtube.com", () => {
  expect(isYouTubeUrl("https://www.youtube.com/watch?v=tvos4nORf_Y")).toBe(true);
});

test("isYouTubeUrl: recognizes m.youtube.com", () => {
  expect(isYouTubeUrl("https://m.youtube.com/watch?v=tvos4nORf_Y")).toBe(true);
});

test("isYouTubeUrl: recognizes music.youtube.com", () => {
  expect(isYouTubeUrl("https://music.youtube.com/watch?v=tvos4nORf_Y")).toBe(true);
});

test("isYouTubeUrl: recognizes youtu.be", () => {
  expect(isYouTubeUrl("https://youtu.be/tvos4nORf_Y")).toBe(true);
});

test("isYouTubeUrl: rejects other domains", () => {
  expect(isYouTubeUrl("https://example.com/watch?v=abc")).toBe(false);
  expect(isYouTubeUrl("https://notyoutube.com/watch?v=abc")).toBe(false);
});

test("isYouTubeUrl: rejects non-URL strings", () => {
  expect(isYouTubeUrl("not a url")).toBe(false);
});

// extractYouTubeVideoId

test("extractYouTubeVideoId: extracts id from youtube.com/watch?v=", () => {
  expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=tvos4nORf_Y")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id when other params present", () => {
  expect(
    extractYouTubeVideoId("https://www.youtube.com/watch?v=tvos4nORf_Y&t=42s&list=PLabc")
  ).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id from youtu.be short link", () => {
  expect(extractYouTubeVideoId("https://youtu.be/tvos4nORf_Y")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id from youtu.be with query params", () => {
  expect(extractYouTubeVideoId("https://youtu.be/tvos4nORf_Y?t=10")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id from shorts path", () => {
  expect(extractYouTubeVideoId("https://www.youtube.com/shorts/tvos4nORf_Y")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id from embed path", () => {
  expect(extractYouTubeVideoId("https://www.youtube.com/embed/tvos4nORf_Y")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: extracts id from m.youtube.com", () => {
  expect(extractYouTubeVideoId("https://m.youtube.com/watch?v=tvos4nORf_Y")).toBe("tvos4nORf_Y");
});

test("extractYouTubeVideoId: returns undefined for non-YouTube URL", () => {
  expect(extractYouTubeVideoId("https://example.com/watch?v=abc")).toBeUndefined();
});

test("extractYouTubeVideoId: returns undefined when no id present", () => {
  expect(extractYouTubeVideoId("https://www.youtube.com/")).toBeUndefined();
});

test("extractYouTubeVideoId: returns undefined for invalid URL", () => {
  expect(extractYouTubeVideoId("not a url")).toBeUndefined();
});

// extractYouTubeDescription

test("extractYouTubeDescription: extracts shortDescription from ytInitialPlayerResponse", () => {
  const description = "This is the real video description.";
  const payload = JSON.stringify({ videoDetails: { shortDescription: description } });
  const html = `<script>var ytInitialPlayerResponse = ${payload};</script>`;
  expect(extractYouTubeDescription(html)).toBe(description);
});

test("extractYouTubeDescription: falls back to og:description when player JSON missing", () => {
  const html = `<meta property="og:description" content="OG fallback description">`;
  expect(extractYouTubeDescription(html)).toBe("OG fallback description");
});

test("extractYouTubeDescription: falls back to twitter:description when no og:description", () => {
  const html = `<meta name="twitter:description" content="Twitter fallback">`;
  expect(extractYouTubeDescription(html)).toBe("Twitter fallback");
});

test("extractYouTubeDescription: falls back to og:description when player JSON is malformed", () => {
  const html = `<script>var ytInitialPlayerResponse = {not valid json};</script><meta property="og:description" content="OG wins">`;
  expect(extractYouTubeDescription(html)).toBe("OG wins");
});

test("extractYouTubeDescription: returns undefined when nothing is present", () => {
  expect(extractYouTubeDescription("<html><body>no meta</body></html>")).toBeUndefined();
});

// composeYouTubeText

test("composeYouTubeText: composes text with title, author, description", () => {
  const oembed = { title: "Great Talk", author_name: "Channel" };
  expect(composeYouTubeText(oembed, "A deep dive.")).toBe(
    'Video: "Great Talk" by Channel\n\nA deep dive.'
  );
});

test("composeYouTubeText: omits description section when missing", () => {
  const oembed = { title: "Great Talk", author_name: "Channel" };
  expect(composeYouTubeText(oembed)).toBe('Video: "Great Talk" by Channel');
});

test("composeYouTubeText: handles missing author", () => {
  const oembed = { title: "Great Talk" };
  expect(composeYouTubeText(oembed, "Body")).toBe('Video: "Great Talk"\n\nBody');
});
