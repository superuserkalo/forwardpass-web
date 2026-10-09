import assert from "node:assert/strict";
import { test } from "node:test";
import { prefersMarkdown } from "../src/lib/accept-markdown.ts";

test("agents asking for Markdown get it", () => {
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.9"), true);
  assert.equal(prefersMarkdown("text/markdown;q=1.0, */*;q=0.1"), true);
});

test("browsers and missing headers get HTML", () => {
  assert.equal(prefersMarkdown(null), false);
  assert.equal(prefersMarkdown("text/html"), false);
  assert.equal(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), false);
  assert.equal(prefersMarkdown("text/html, text/markdown;q=0.5"), false);
  assert.equal(prefersMarkdown("text/markdown;q=0"), false);
});
