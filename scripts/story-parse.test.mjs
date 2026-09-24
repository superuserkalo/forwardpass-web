import assert from "node:assert/strict";
import test from "node:test";
import { formatTimeAgo, inferStoryType, matchTopics, parseEdition } from "../src/lib/story-parse.ts";

const edition = `# Refusals get a price tag

Anthropic starts billing for blocked requests. More below.

- Refused requests are billed.
- Cursor watches deploys.

## Anthropic charges for refusals

Billed at input-token rates. See the [docs](https://docs.anthropic.com).

## Cursor Rollouts ships

An agent per deploy.
`;

test("editions keep the intro before the first story heading", () => {
  const parsed = parseEdition(edition);
  assert.equal(parsed.title, "Refusals get a price tag");
  assert.match(parsed.preamble, /^Anthropic starts billing/);
  assert.match(parsed.preamble, /- Cursor watches deploys\./);
  assert.equal(parsed.lead, "Anthropic starts billing for blocked requests.");
  assert.deepEqual(
    parsed.blocks.map((block) => block.heading),
    ["Anthropic charges for refusals", "Cursor Rollouts ships"],
  );
});

test("editions without headings have no preamble", () => {
  const parsed = parseEdition("First story here.\n\n---\n\nSecond story here.");
  assert.equal(parsed.preamble, "");
  assert.equal(parsed.blocks.length, 2);
});

test("story metadata is inferred from text", () => {
  assert.equal(inferStoryType("A new paper from researchers", "https://arxiv.org/abs/1"), "papers");
  assert.ok(matchTopics("An agent harness with MCP tools").includes("Agents"));
  assert.equal(formatTimeAgo("2026-09-24T10:00:00Z", Date.parse("2026-09-24T12:30:00Z")), "2 hrs ago");
});

test("the delivered plain-text edition splits into numbered stories and labelled sections", async () => {
  const { readFileSync } = await import("node:fs");
  const edition = readFileSync(new URL("./fixtures/daily-edition.md", import.meta.url), "utf8");
  const parsed = parseEdition(edition);
  assert.equal(parsed.title, "NeMo Helix v0.6.0 adds sandboxed Gym evaluation and retrieval workflows");
  assert.match(parsed.lead ?? "", /^NVIDIA’s v0\.6\.0 release adds/);
  assert.deepEqual(
    parsed.blocks.map((block) => [block.id, block.label ?? false]),
    [["story-0", false], ["worth-watching", true], ["quick-signals", true], ["worth-reading", true]],
  );
  assert.match(parsed.blocks[0].body, /^#### What happened\n/m);
  assert.match(parsed.blocks[2].body, /^- \[Claude Opus 5\.5 released\]\(https:\/\/www\.anthropic\.com\/news\/claude-opus-5-5\)$/m);
});
