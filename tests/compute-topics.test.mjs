// Chip, memory and data center news is part of the daily issue like any other story. The topics it is filed under are feed topics a story can be
// filed under and a reader can follow in the reading brief.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FEED_TOPICS, matchTopics } from "../src/lib/story-parse.ts";
import { TOPICS } from "../src/lib/onboarding.ts";

test("Chips and Data centers are topics a story can be filed under and a reader can follow", () => {
  for (const topic of ["Chips", "Data centers"]) {
    assert.ok(FEED_TOPICS.includes(topic), `${topic} is a feed topic`);
    assert.ok(TOPICS.includes(topic), `${topic} can be chosen in the reading brief`);
  }
  assert.ok(matchTopics("Micron says HBM4 supply stays tight as memory prices climb").includes("Chips"));
  assert.ok(matchTopics("Oracle's 1.4 gigawatt data center campus waits on a power approval").includes("Data centers"));
  assert.ok(!matchTopics("Mistral launches a new open-weight language model").includes("Chips"));
});
