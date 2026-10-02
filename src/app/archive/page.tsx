import type { Metadata } from "next";
import Link from "next/link";
import { EDITORIAL_KINDS, EditorialBoard, EditorialKindNav, type EditorialFilter } from "@/components/archive/editorial-board";
import { CrawlerSuspense } from "@/components/crawler-suspense";
import { NewsFeed, type FeedTab } from "@/components/archive/news-feed";
import { EditorialSkeleton, NewsFeedSkeleton, WeeklySkeleton } from "@/components/archive/skeletons";
import { WeeklyDeepDive, type WeeklyIssue } from "@/components/archive/weekly-deep-dive";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasPersonalFeatures, loadArchiveIndex, loadEditionText, readerTopics, requestTime } from "@/lib/archive-viewer";
import { editorialAsStory, loadEditorial, loadFeed, outlineEdition } from "@/lib/feed";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";


const SECTIONS = [
  { value: "news", label: "News" },
  { value: "editorial", label: "Editorial" },
] as const;

type Section = (typeof SECTIONS)[number]["value"];
type SearchParams = Promise<{ section?: string | string[]; kind?: string | string[]; tab?: string | string[] }>;

// Tabs and kind filters are views of the same two listings, so each canonicalises to its section.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  return pick(params.section, SECTIONS.map((entry) => entry.value), "news") === "editorial"
    ? pageMetadata({
        path: "/archive?section=editorial",
        title: "Editorial archive",
        description: "Deep dives, tutorials and opinion on AI engineering from The Forward Pass.",
      })
    : pageMetadata({
        path: "/archive",
        title: "Archive",
        description: "Every story, deep dive and weekly research issue from The Forward Pass.",
      });
}

const TABS = ["latest", "for-you", "weekly"] as const;

function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  const single = Array.isArray(value) ? value[0] : value;
  return allowed.find((entry) => entry === single) ?? fallback;
}

export default async function ArchivePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // Weekly used to be its own section; old links now open the Weekly tab.
  const legacyWeekly = (Array.isArray(params.section) ? params.section[0] : params.section) === "weekly";
  const section = pick(params.section, SECTIONS.map((entry) => entry.value), "news");
  const tab = legacyWeekly ? "weekly" : pick(params.tab, TABS, "latest");
  const kind = pick(params.kind, EDITORIAL_KINDS.map((entry) => entry.value), "all");

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <SectionNav active={section} />
        <div className="pt-12">
          {section === "news" && (
            <CrawlerSuspense fallback={<NewsFeedSkeleton />}>
              <NewsSection tab={tab} />
            </CrawlerSuspense>
          )}
          {section === "editorial" && (
            <>
              <h1 className="sr-only">Editorial archive</h1>
              <EditorialKindNav active={kind} />
              <CrawlerSuspense key={kind} fallback={<EditorialSkeleton />}>
                <EditorialSection kind={kind} />
              </CrawlerSuspense>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

function SectionNav({ active }: { active: Section }) {
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
        </Link>
      ))}
    </nav>
  );
}

async function NewsSection({ tab }: { tab: FeedTab }) {
  const [index, feed, editorial, topics] = await Promise.all([
    loadArchiveIndex(),
    loadFeed(),
    loadEditorial(),
    readerTopics(),
  ]);
  const stories = [...feed.stories, ...editorial.pieces.map(editorialAsStory)];
  const professional = index?.tier === "professional";
  if (stories.length === 0 && !professional) {
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
      professional={professional}
      weekly={
        professional && index ? (
          <CrawlerSuspense fallback={<WeeklySkeleton />}>
            <WeeklyIssues dates={index.weekly} />
          </CrawlerSuspense>
        ) : null
      }
      initialTab={tab}
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

async function WeeklyIssues({ dates }: { dates: string[] }) {
  const recent = [...dates].sort().reverse().slice(0, 7);
  const editions = await Promise.all(
    recent.map(async (date): Promise<WeeklyIssue | null> => {
      const entry = await loadEditionText("weekly", date);
      return entry?.status === 200 ? { date, outline: outlineEdition("weekly", date, entry.text) } : null;
    }),
  );
  return <WeeklyDeepDive issues={editions.filter((issue): issue is WeeklyIssue => issue !== null)} />;
}
