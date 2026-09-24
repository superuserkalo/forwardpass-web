import { z } from "zod";
import { archiveEntry, archiveIndex, archiveRequest, type ArchiveKind } from "./archive-client";
import { demoFeed, demoEditorial, demoFixturesEnabled } from "./feed-fixtures";
import {
  FEED_TOPICS,
  editionReadMinutes,
  findImages,
  findLinks,
  inferStoryType,
  matchTopics,
  parseEdition,
  sentenceTitle,
  sourceNameFromUrl,
  stripInlineMarkdown,
  type FeedTopic,
  type StoryType,
} from "./story-parse";

export type Story = {
  id: string;
  type: StoryType;
  title: string;
  dek: string;
  sourceName: string | null;
  sourceUrl: string | null;
  topics: FeedTopic[];
  image: string | null;
  publishedAt: string;
  upvotes: number;
  viewerHasUpvoted: boolean;
  href: string;
  author: string | null;
  section: ArchiveKind;
};

export type EditorialPiece = {
  id: string;
  title: string;
  dek: string;
  author: string;
  kind: "deep-dive" | "tutorial" | "opinion";
  image: string | null;
  publishedAt: string;
  href: string;
  topics: FeedTopic[];
  upvotes: number;
  viewerHasUpvoted: boolean;
};

export type RemoteVote = {
  id: string;
  upvotes: number;
  viewerHasUpvoted: boolean;
};

export type FeedSource = "api" | "editions" | "fixtures";

const storyTypeSchema = z.enum(["news", "papers", "models", "repos", "editorial"]);

const remoteStorySchema = z.object({
  id: z.string().min(1),
  type: storyTypeSchema.catch("news"),
  title: z.string().min(1),
  dek: z.string().catch(""),
  source: z.object({ name: z.string().nullish(), url: z.string().nullish() }).nullish(),
  topics: z.array(z.string()).catch([]),
  image: z.string().nullish(),
  published_at: z.string(),
  upvotes: z.number().int().catch(0),
  viewer_has_upvoted: z.boolean().catch(false),
  href: z.string().nullish(),
  author: z.string().nullish(),
  section: z.enum(["daily", "weekly"]).catch("daily"),
});

const remoteFeedSchema = z.object({ stories: z.array(remoteStorySchema) });

const remoteEditorialSchema = z.object({
  pieces: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      dek: z.string().catch(""),
      author: z.string().catch("The Forward Pass"),
      kind: z.enum(["deep-dive", "tutorial", "opinion"]).catch("deep-dive"),
      image: z.string().nullish(),
      published_at: z.string(),
      href: z.string().nullish(),
      topics: z.array(z.string()).catch([]),
      upvotes: z.number().int().catch(0),
      viewer_has_upvoted: z.boolean().catch(false),
    }),
  ),
});

const remoteVoteSchema = z.object({
  id: z.string().min(1),
  upvotes: z.number().int().catch(0),
  viewer_has_upvoted: z.boolean().catch(false),
});

function toFeedTopics(values: string[]): FeedTopic[] {
  const seen = new Set<FeedTopic>();
  for (const value of values) {
    const match = FEED_TOPICS.find(
      (topic) => topic.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match) seen.add(match);
  }
  return [...seen];
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function remoteFeedStories(limit: number): Promise<Story[] | null> {
  const response = await archiveRequest(`/feed?limit=${limit}`);
  if (!response?.ok) return null;
  const parsed = remoteFeedSchema.safeParse(await readJson(response));
  if (!parsed.success) return null;
  return parsed.data.stories.map((story) => ({
    id: story.id,
    type: story.type,
    title: story.title,
    dek: story.dek,
    sourceName: story.source?.name ?? (story.source?.url ? sourceNameFromUrl(story.source.url) : null),
    sourceUrl: story.source?.url ?? null,
    topics: toFeedTopics(story.topics),
    image: story.image ?? null,
    publishedAt: story.published_at,
    upvotes: story.upvotes,
    viewerHasUpvoted: story.viewer_has_upvoted,
    href: story.href ?? "/archive",
    author: story.author ?? null,
    section: story.section,
  }));
}

export async function remoteEditorialPieces(): Promise<EditorialPiece[] | null> {
  const response = await archiveRequest("/editorial");
  if (!response?.ok) return null;
  const parsed = remoteEditorialSchema.safeParse(await readJson(response));
  if (!parsed.success) return null;
  return parsed.data.pieces.map((piece) => ({
    id: piece.id,
    title: piece.title,
    dek: piece.dek,
    author: piece.author,
    kind: piece.kind,
    image: piece.image ?? null,
    publishedAt: piece.published_at,
    href: piece.href ?? "/archive",
    topics: toFeedTopics(piece.topics),
    upvotes: piece.upvotes,
    viewerHasUpvoted: piece.viewer_has_upvoted,
  }));
}

export async function submitRemoteVote(id: string, voted: boolean): Promise<RemoteVote | null> {
  const response = await archiveRequest("/votes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, voted }),
  });
  if (!response?.ok) return null;
  const parsed = remoteVoteSchema.safeParse(await readJson(response));
  return parsed.success
    ? { id: parsed.data.id, upvotes: parsed.data.upvotes, viewerHasUpvoted: parsed.data.viewer_has_upvoted }
    : null;
}

export function storyFromBlock(
  kind: ArchiveKind,
  date: string,
  index: number,
  heading: string,
  blockBody: string,
): Story {
  const title = heading || sentenceTitle(blockBody, `${date} edition`);
  const image = findImages(blockBody)[0] ?? null;
  const links = findLinks(blockBody);
  const sourceUrl = links.find((link) => !link.includes("theforwardpass.net")) ?? null;
  const combined = `${title}\n${blockBody}`;
  return {
    id: `${kind}:${date}:${index}`,
    type: inferStoryType(combined, sourceUrl),
    title,
    dek: stripInlineMarkdown(blockBody.split(/\n\s*\n/)[0] ?? "").slice(0, 220),
    sourceName: sourceUrl ? sourceNameFromUrl(sourceUrl) : "THE FORWARD PASS",
    sourceUrl,
    topics: matchTopics(combined),
    image,
    publishedAt: `${date}T00:00:00Z`,
    upvotes: 0,
    viewerHasUpvoted: false,
    href: `/archive/${kind}/${date}#story-${index}`,
    author: null,
    section: kind,
  };
}

async function storiesFromEditions(limit: number): Promise<Story[]> {
  const index = await archiveIndex();
  if (!index) return [];
  const dates = [...index.daily].sort().reverse().slice(0, Math.min(12, limit));
  const editions = await Promise.all(
    dates.map(async (date) => {
      const entry = await archiveEntryText("daily", date);
      return entry ? { date, text: entry } : null;
    }),
  );
  const stories: Story[] = [];
  for (const edition of editions) {
    if (!edition) continue;
    const parsed = parseEdition(edition.text);
    parsed.blocks.forEach((block, position) => {
      stories.push(storyFromBlock("daily", edition.date, position, block.heading, block.body));
    });
    if (stories.length >= limit) break;
  }
  return stories.slice(0, limit);
}

async function archiveEntryText(kind: ArchiveKind, date: string): Promise<string | null> {
  const entry = await archiveEntry(kind, date);
  return entry && entry.status === 200 ? entry.text : null;
}

export async function loadFeed(limit = 48): Promise<{ stories: Story[]; source: FeedSource }> {
  const remote = await remoteFeedStories(limit);
  if (remote && remote.length > 0) return { stories: remote, source: "api" };
  const derived = await storiesFromEditions(limit);
  if (derived.length > 0) return { stories: derived, source: "editions" };
  if (demoFixturesEnabled()) return { stories: demoFeed(), source: "fixtures" };
  return { stories: [], source: "editions" };
}

export async function loadEditorial(): Promise<{ pieces: EditorialPiece[]; source: FeedSource }> {
  const remote = await remoteEditorialPieces();
  if (remote && remote.length > 0) return { pieces: remote, source: "api" };
  if (demoFixturesEnabled()) return { pieces: demoEditorial(), source: "fixtures" };
  return { pieces: [], source: "editions" };
}

export function editorialAsStory(piece: EditorialPiece): Story {
  return {
    id: piece.id,
    type: "editorial",
    title: piece.title,
    dek: piece.dek,
    sourceName: "THE FORWARD PASS",
    sourceUrl: null,
    topics: piece.topics,
    image: piece.image,
    publishedAt: piece.publishedAt,
    upvotes: piece.upvotes,
    viewerHasUpvoted: piece.viewerHasUpvoted,
    href: piece.href,
    author: piece.author,
    section: "daily",
  };
}

export function storyReadMinutes(story: Story): number {
  return editionReadMinutes(story.dek.split(/\s+/).filter(Boolean).length + 220);
}

export type EditionOutline = {
  title: string;
  lead: string | null;
  preamble: string;
  heroImage: string | null;
  readMinutes: number;
  takeaways: string[];
  topics: FeedTopic[];
  type: StoryType;
  sections: Array<{ id: string; heading: string; body: string }>;
};

function bulletLines(markdown: string): string[] {
  return markdown
    .split(/\n/)
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map((line) => stripInlineMarkdown(line.replace(/^\s*[-*]\s+/, "")))
    .filter(Boolean);
}

export function outlineEdition(kind: ArchiveKind, date: string, markdown: string): EditionOutline {
  const parsed = parseEdition(markdown);
  const links = findLinks(markdown);
  const sourceUrl = links.find((link) => !link.includes("theforwardpass.net")) ?? null;
  const preambleBullets = bulletLines(parsed.preamble);
  const takeaways = (preambleBullets.length > 0 ? preambleBullets : bulletLines(parsed.blocks[0]?.body ?? "")).slice(0, 6);
  const preamble = parsed.preamble
    .split(/\n/)
    .filter((line) => !/^\s*[-*]\s+/.test(line))
    .join("\n")
    .trim();
  return {
    title: parsed.title ?? (kind === "weekly" ? "This week in depth." : "Today’s forward pass."),
    lead: parsed.lead,
    preamble,
    heroImage: parsed.firstImage,
    readMinutes: editionReadMinutes(parsed.wordCount),
    takeaways,
    topics: matchTopics(markdown),
    type: inferStoryType(markdown, sourceUrl),
    sections: parsed.blocks.map((block, index) => ({
      id: `story-${index}`,
      heading: block.heading,
      body: block.body,
    })),
  };
}
