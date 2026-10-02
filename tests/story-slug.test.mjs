// The website and the engine must derive the same slug, or archive rows link to 404s.
import assert from "node:assert/strict";
import { test } from "node:test";
import { storySlug } from "../src/lib/story-slug.ts";

test("story slugs match the engine's vectors", () => {
  assert.equal(storySlug("Cloudflare open-sources Clef decision models at 209.3 ms versus Jev's 524.1 ms"), "cloudflare-open-sources-clef-decision-models-at-209-3-ms-versus-jevs-524-1-ms");
  assert.equal(storySlug("Pi ships 1.0 agent harness with Codemode, native MCP and cache warming"), "pi-ships-1-0-agent-harness-with-codemode-native-mcp-and-cache-warming");
  assert.equal(storySlug("Lab ships model"), "lab-ships-model");
  assert.ok(storySlug("x".repeat(30) + " " + "word ".repeat(30)).length <= 80);
});
