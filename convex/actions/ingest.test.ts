/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { truncateHtml, parseEnrichmentResponse } from "./ingest";

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
