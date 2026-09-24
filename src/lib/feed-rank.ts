import type { Story } from "./feed";
import type { FeedTopic } from "./story-parse";

export type FeedRange = "all" | "day" | "week" | "month";

const RANGE_HOURS: Record<Exclude<FeedRange, "all">, number> = { day: 24, week: 24 * 7, month: 24 * 31 };

export function withinRange(story: Story, range: FeedRange, now: number): boolean {
  if (range === "all") return true;
  return now - Date.parse(story.publishedAt) <= RANGE_HOURS[range] * 3_600_000;
}

export function byLatest(a: Story, b: Story): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export function byUpvotes(a: Story, b: Story): number {
  return b.upvotes - a.upvotes || byLatest(a, b);
}

export function rankForYou(stories: Story[], readerTopics: FeedTopic[]): Story[] {
  const latest = [...stories].sort(byLatest);
  if (readerTopics.length === 0) return latest;
  const wanted = new Set<FeedTopic>(readerTopics);
  const score = (story: Story) => story.topics.filter((topic) => wanted.has(topic)).length;
  return latest.sort((a, b) => score(b) - score(a));
}
