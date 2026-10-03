import { editionStories } from '/Users/kalo/forwardpass/agent/lib/edition-stories.ts';
import { parseEdition, matchTopics } from '/Users/kalo/forwardpass-web/src/lib/story-parse.ts';
import { rankForYou } from '/Users/kalo/forwardpass-web/src/lib/feed-rank.ts';

const header = 'THE FORWARD PASS\nAI engineering — 2026-09-26\n\n';
const section = (position, title, slug) => `${position} — ${title}\n\nWhat happened\nA measured technical finding.\n\nWhy it matters\nA practical implication.\n\nPrimary source → [Source](https://example.test/${slug})\n\n`;
const shared = editionStories(header + section(1, 'General development', 'general') + section(2, 'Security finding', 'security'));
const personal = parseEdition(header + section(1, 'Security finding', 'security'));
const ranked = rankForYou([
  { id: 'new', topics: ['Agents'], publishedAt: '2026-09-26T00:00:00Z' },
  { id: 'old', topics: ['Agents', 'Security'], publishedAt: '2026-09-01T00:00:00Z' },
], ['Agents', 'Security']);
console.log(JSON.stringify({
  sharedStoryPositions: shared.map(({ title, index }) => ({ title, index })),
  personalBlocks: personal.blocks.map(({ heading, id }) => ({ heading, id })),
  incidentalTopicMatch: matchTopics('A rapid migration strategy'),
  personalizedRank: ranked.map(({ id }) => id),
}, null, 2));
