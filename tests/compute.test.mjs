// The Compute block in the daily issue: the engine lists chip, memory and data center stories under `## Compute`, each with where the
// claim comes from. The archive must show it as a list like the Signals, not as a story of its own, and readers must be able to follow
// the two topics it files them under.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FEED_TOPICS, matchTopics, parseEdition } from "../src/lib/story-parse.ts";
import { TOPICS } from "../src/lib/onboarding.ts";

const issue = `# Lead story

_Preview_

Intro paragraph.

<!-- story:s-aaaaaaaaaaaaaaaa -->
## Lead story

Body one.

## Signals

1. [A signal](https://a.test/x) · 1,000 stars

## Compute

1. [Samsung's profit rises ninefold to $80bn on AI chip demand](https://www.ft.com/content/abc) · Reported · ft.com
2. [TSMC reportedly raises 2nm wafer prices by 10% for 2027](https://www.digitimes.com/news/a1.html) · Unconfirmed · digitimes.com
`;

test("the Compute list is a labelled section like the Signals, and is not counted as a story", () => {
  const parsed = parseEdition(issue);
  const compute = parsed.blocks.find((block) => block.heading === "Compute");
  assert.ok(compute, "the section is there");
  assert.equal(compute.label, true);
  assert.equal(compute.id, "compute");
  assert.match(compute.body, /Reported · ft\.com/);
  assert.match(compute.body, /Unconfirmed · digitimes\.com/);
  assert.deepEqual(parsed.blocks.filter((block) => !block.label).map((block) => block.heading), ["Lead story"], "one story, and neither list is a story");
});

test("an issue without a Compute list parses as it did", () => {
  const parsed = parseEdition(issue.slice(0, issue.indexOf("## Compute")));
  assert.deepEqual(parsed.blocks.map((block) => block.heading), ["Lead story", "Signals"]);
});

test("Chips and Data centers are topics a story can be filed under and a reader can follow", () => {
  for (const topic of ["Chips", "Data centers"]) {
    assert.ok(FEED_TOPICS.includes(topic), `${topic} is a feed topic`);
    assert.ok(TOPICS.includes(topic), `${topic} can be chosen in the reading brief`);
  }
  assert.ok(matchTopics("Micron says HBM4 supply stays tight as memory prices climb").includes("Chips"));
  assert.ok(matchTopics("Oracle's 1.4 gigawatt data center campus waits on a power approval").includes("Data centers"));
  assert.ok(!matchTopics("Mistral launches a new open-weight language model").includes("Chips"));
});
