import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EDITORIAL_KINDS, EditorialBoard, EditorialKindNav, type EditorialFilter } from "@/components/archive/editorial-board";
import { NewsFeed } from "@/components/archive/news-feed";
import { EditorialSkeleton, NewsFeedSkeleton, WeeklySkeleton } from "@/components/archive/skeletons";
import { WeeklyDeepDive, WeeklyLocked, type WeeklyIssue } from "@/components/archive/weekly-deep-dive";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasPersonalFeatures, loadArchiveIndex, loadEditionText, readerTopics, requestTime } from "@/lib/archive-viewer";
import { editorialAsStory, loadEditorial, loadFeed, outlineEdition } from "@/lib/feed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Archive | The Forward Pass",
  description: "Every story, deep dive and weekly research issue from The Forward Pass.",
};

const SECTIONS = [
  { value: "news", label: "News" },
  { value: "editorial", label: "Editorial" },
  { value: "weekly", label: "Weekly deep dive" },
] as const;

type Section = (typeof SECTIONS)[number]["value"];
type SearchParams = Promise<{ section?: string | string[]; kind?: string | string[] }>;

function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const single = Array.isArray(value) ? value[0] : value;
  return allowed.find((entry) => entry === single) ?? fallback;
}

export default async function ArchivePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const section = pick(params.section, SECTIONS.map((entry) => entry.value), "news");
  const kind = pick(params.kind, EDITORIAL_KINDS.map((entry) => entry.value), "all");

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <Suspense fallback={<SectionNav active={section} professional={false} />}>
          <SectionNavWithTier active={section} />
        </Suspense>
        <div className="pt-12">
          {section === "news" && (
            <Suspense fallback={<NewsFeedSkeleton />}>
              <NewsSection />
            </Suspense>
          )}
          {section === "editorial" && (
            <>
              <EditorialKindNav active={kind} />
              <Suspense key={kind} fallback={<EditorialSkeleton />}>
                <EditorialSection kind={kind} />
              </Suspense>
            </>
          )}
          {section === "weekly" && (
            <Suspense fallback={<WeeklySkeleton />}>
              <WeeklySection />
            </Suspense>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

async function SectionNavWithTier({ active }: { active: Section }) {
  const index = await loadArchiveIndex();
  return <SectionNav active={active} professional={index?.tier === "professional"} />;
}

function SectionNav({ active, professional }: { active: Section; professional: boolean }) {
  return (
    <nav aria-label="Archive sections" className="flex gap-8 overflow-x-auto border-b border-border">
      {SECTIONS.map((entry) => (
        <Link
          key={entry.value}
          href={entry.value === "news" ? "/archive" : `/archive?section=${entry.value}`}
          aria-current={active === entry.value ? "page" : undefined}
          className={cn(
            "relative inline-flex shrink-0 items-center gap-2 pt-1 pb-4 font-mono text-xs uppercase tracking-[.2em] transition-colors",
            active === entry.value
              ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {entry.label}
          {entry.value === "weekly" && !professional && <Lock className="size-3" strokeWidth={1.5} />}
        </Link>
      ))}
    </nav>
  );
}

async function NewsSection() {
  const [index, feed, editorial, topics] = await Promise.all([
    loadArchiveIndex(),
    loadFeed(),
    loadEditorial(),
    readerTopics(),
  ]);
  const stories = [...feed.stories, ...editorial.pieces.map(editorialAsStory)];
  if (stories.length === 0) {
    return (
      <div className="border-b border-border py-24 text-center">
        <p className="font-display text-3xl">The archive is being prepared.</p>
        <p className="mt-3 text-sm text-muted-foreground">Published stories appear here within a day of each issue.</p>
      </div>
    );
  }
  return (
    <NewsFeed
      stories={stories}
      personalized={index ? hasPersonalFeatures(index.tier) : false}
      readerTopics={topics}
      now={requestTime()}
    />
  );
}

async function EditorialSection({ kind }: { kind: EditorialFilter }) {
  const { pieces } = await loadEditorial();
  const filtered = kind === "all" ? pieces : pieces.filter((piece) => piece.kind === kind);
  return <EditorialBoard pieces={filtered} />;
}

async function WeeklySection() {
  const index = await loadArchiveIndex();
  if (index?.tier !== "professional") return <WeeklyLocked />;
  const dates = [...index.weekly].sort().reverse().slice(0, 7);
  const editions = await Promise.all(
    dates.map(async (date): Promise<WeeklyIssue | null> => {
      const entry = await loadEditionText("weekly", date);
      return entry?.status === 200 ? { date, outline: outlineEdition("weekly", date, entry.text) } : null;
    }),
  );
  return <WeeklyDeepDive issues={editions.filter((issue): issue is WeeklyIssue => issue !== null)} />;
}
