// A daily issue's page title names the issue, not the lead story it opens with.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEdition, prettyDate } from "../src/lib/story-parse.ts";

const issue = `# Pi ships 1.0 agent harness

_Pi ships 1.0, Cloudflare open-sources Clef, Copilot adds desktop computer use_

Intro paragraph.

<!-- story:s-c51b49ddb0275fd5 -->
## Pi ships 1.0 agent harness

Body one.

## Cloudflare open-sources Clef

Body two.
`;

test("the engine heads an issue with its lead story's headline", () => {
  const parsed = parseEdition(issue);
  assert.equal(parsed.title, "Pi ships 1.0 agent harness");
  assert.equal(parsed.blocks[0].heading, parsed.title);
  assert.equal(prettyDate("2026-10-02"), "October 2, 2026");
});
