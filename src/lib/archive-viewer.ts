import { archiveEntry, archiveIndex, type ArchiveEntry, type ArchiveIndex, type ArchiveKind } from "./archive-client";
import { demoDailyDates, demoEdition, demoFixturesEnabled, demoWeeklyDates } from "./feed-fixtures";
import { loadOnboardingState } from "./onboarding-state";
import { preferencesEmail } from "./preferences-session";
import type { FeedTopic } from "./story-parse";

export type Tier = ArchiveIndex["tier"];

const DEMO_TOPICS: FeedTopic[] = ["Agents", "Security", "LLMs"];

function demoTier(): Tier {
  const wanted = process.env.FORWARDPASS_DEMO_TIER;
  return wanted === "free" || wanted === "personal" ? wanted : "professional";
}

export async function loadArchiveIndex(): Promise<ArchiveIndex | null> {
  const index = await archiveIndex().catch(() => null);
  if (index) return index;
  if (!demoFixturesEnabled()) return null;
  return { tier: demoTier(), daily: demoDailyDates(), weekly: demoWeeklyDates() };
}

export async function loadEditionText(
  kind: ArchiveKind,
  date: string,
  access: { anonymous?: boolean } = {},
): Promise<ArchiveEntry | null> {
  const entry = await archiveEntry(kind, date, access);
  if (entry || !demoFixturesEnabled()) return entry;
  return { status: 200, text: demoEdition(kind, date), image: null, storyImages: {} };
}

/** Daily issues an anonymous reader can open: the ones search engines and feeds may carry. */
export async function publicDailyDates(): Promise<string[]> {
  const index = await archiveIndex({ anonymous: true }).catch(() => null);
  if (index) return index.daily;
  return demoFixturesEnabled() ? demoDailyDates() : [];
}

export async function readerTopics(): Promise<FeedTopic[]> {
  if (demoFixturesEnabled()) return DEMO_TOPICS;
  const email = await preferencesEmail();
  if (!email || !process.env.RESEND_API_KEY) return [];
  try {
    const state = await loadOnboardingState(email);
    return state?.profile.topics ?? [];
  } catch {
    return [];
  }
}

export function hasPersonalFeatures(tier: Tier): boolean {
  return tier === "personal" || tier === "professional";
}

/** Request time, captured once on the server so relative dates render the same on the client. */
export function requestTime(): number {
  return Date.now();
}
