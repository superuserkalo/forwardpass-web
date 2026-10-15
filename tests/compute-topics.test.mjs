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

test("consumer GPU and memory stories match the existing Chips reading preference", () => {
  for (const title of [
    "GeForce RTX 5090 launches with 32GB GDDR7 VRAM",
    "AMD Ryzen AI Max ships with 128GB unified memory",
    "Intel Arc B580 gets 12GB graphics memory",
    "Snapdragon X NPU improves on-device inference",
    "GPU memory bandwidth rises with GDDR7",
    "A faster NPU runs INT8 inference",
  ]) assert.ok(matchTopics(title).includes("Chips"), title);
  assert.ok(!matchTopics("A new agent framework ships with tools").includes("Chips"));
  assert.ok(!matchTopics("API input caching reduces latency").includes("Chips"));
});
