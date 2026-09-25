"use client";

import { ChevronDown, LayoutGrid, Lock, Rows3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Story } from "@/lib/feed";
import { byLatest, rankForYou, withinRange, type FeedRange } from "@/lib/feed-rank";
import { formatTimeAgo, type FeedTopic, type StoryType } from "@/lib/story-parse";
import { cn } from "@/lib/utils";
import { BookmarkButton, UpvoteButton } from "./story-actions";
import { SourceMark, StoryThumb } from "./story-media";

export type FeedTab = "latest" | "for-you" | "weekly";
type FeedView = "list" | "grid";

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<StoryType, string> = {
  news: "News",
  papers: "Papers",
  models: "Models",
  repos: "Repos",
  editorial: "Editorial",
};
const TYPE_ORDER: StoryType[] = ["news", "papers", "models", "repos", "editorial"];

const RANGE_LABELS: Record<FeedRange, string> = {
  all: "All time",
  day: "Today",
  week: "Last week",
  month: "Last month",
};
const RANGE_TITLES: Record<FeedRange, string> = {
  all: "Latest News",
  day: "Today in AI",
  week: "Last week in AI",
  month: "Last month in AI",
};

const numberFormat = new Intl.NumberFormat("en");
const labelClass = "font-mono text-[11px] uppercase tracking-[.2em]";

function toggleIn<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function NewsFeed({
  stories,
  personalized,
  professional,
  weekly,
  initialTab = "latest",
  readerTopics,
  now,
}: {
  stories: Story[];
  personalized: boolean;
  professional: boolean;
  /** Server-rendered Weekly deep dive, shown in its tab for Professional readers. */
  weekly: React.ReactNode;
  initialTab?: FeedTab;
  readerTopics: FeedTopic[];
  now: number;
}) {
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [view, setView] = useState<FeedView>("list");
  const [range, setRange] = useState<FeedRange>("all");
  const [types, setTypes] = useState<StoryType[]>([]);
  const [topics, setTopics] = useState<FeedTopic[]>([]);
  const [shown, setShown] = useState(PAGE_SIZE);

  const inRange = useMemo(
    () => stories.filter((story) => withinRange(story, personalized ? range : "all", now)),
    [stories, range, personalized, now],
  );
  const typeCounts = useMemo(() => {
    const counts = new Map<StoryType, number>();
    for (const story of inRange) counts.set(story.type, (counts.get(story.type) ?? 0) + 1);
    return counts;
  }, [inRange]);
  const ofType = useMemo(
    () => (types.length === 0 ? inRange : inRange.filter((story) => types.includes(story.type))),
    [inRange, types],
  );
  const topicCounts = useMemo(() => {
    const counts = new Map<FeedTopic, number>();
    for (const story of ofType) for (const topic of story.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [ofType]);
  const visible = useMemo(() => {
    const filtered =
      topics.length === 0 ? ofType : ofType.filter((story) => story.topics.some((topic) => topics.includes(topic)));
    if (tab === "for-you") return rankForYou(filtered, readerTopics);
    return [...filtered].sort(byLatest);
  }, [ofType, topics, tab, readerTopics]);

  const locked = (tab === "for-you" && !personalized) || (tab === "weekly" && !professional);
  const title =
    tab === "weekly"
      ? "Weekly deep dive"
      : tab === "for-you" && range === "all"
        ? "For You"
        : RANGE_TITLES[personalized ? range : "all"];

  function resetPaging() {
    setShown(PAGE_SIZE);
  }

  const filters = (
    <FilterPanel
      total={inRange.length}
      typeCounts={typeCounts}
      types={types}
      onToggleType={(type) => {
        setTypes((current) => (type ? toggleIn(current, type) : []));
        resetPaging();
      }}
      topicTotal={ofType.length}
      topicCounts={topicCounts}
      topics={topics}
      onToggleTopic={(topic) => {
        setTopics((current) => (topic ? toggleIn(current, topic) : []));
        resetPaging();
      }}
    />
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">{title}</h1>
        <p className={cn(labelClass, "shrink-0 pb-1 text-muted-foreground", tab === "weekly" && "invisible")}>
          <span className="text-foreground">{locked ? 0 : visible.length}</span> results
        </p>
      </div>

      <div className={cn("mt-10 grid gap-10 lg:gap-12", tab !== "weekly" && "lg:grid-cols-[17rem_minmax(0,1fr)]")}>
        <aside className={cn("hidden", tab !== "weekly" && "lg:block")}>{filters}</aside>
        <details className={cn("group border border-border lg:hidden", tab === "weekly" && "hidden")}>
          <summary className={cn(labelClass, "flex cursor-pointer list-none items-center justify-between px-4 py-3")}>
            Filters
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={1.5} />
          </summary>
          <div className="border-t border-border p-2">{filters}</div>
        </details>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as FeedTab);
            resetPaging();
          }}
          className="min-w-0 gap-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-border">
            <TabsList variant="line" className="h-auto gap-6 p-0 md:gap-9">
              {(
                [
                  ["latest", "Latest"],
                  ["for-you", "For you"],
                  ["weekly", "Weekly deep dive"],
                ] as const
              ).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    labelClass,
                    "flex-none rounded-none px-0 pt-1 pb-4 text-xs font-normal text-muted-foreground data-[state=active]:text-foreground",
                    "group-data-[orientation=horizontal]/tabs:after:bottom-[-1px] group-data-[orientation=horizontal]/tabs:after:h-px",
                  )}
                >
                  {label}
                  {((value === "for-you" && !personalized) || (value === "weekly" && !professional)) && (
                    <Lock className="size-3" strokeWidth={1.5} />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className={cn("flex items-center gap-2 pb-3", tab === "weekly" && "invisible")}>
              {personalized && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      labelClass,
                      "inline-flex items-center gap-2 px-2 py-1.5 text-xs whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
                    )}
                  >
                    {RANGE_LABELS[range]}
                    <ChevronDown className="size-3.5" strokeWidth={1.5} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40 rounded-none">
                    <DropdownMenuRadioGroup
                      value={range}
                      onValueChange={(value) => {
                        setRange(value as FeedRange);
                        resetPaging();
                      }}
                    >
                      {(Object.keys(RANGE_LABELS) as FeedRange[]).map((value) => (
                        <DropdownMenuRadioItem key={value} value={value} className={cn(labelClass, "rounded-none text-[11px]")}>
                          {RANGE_LABELS[value]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => value && setView(value as FeedView)}
                aria-label="Layout"
                className="gap-1"
              >
                <ToggleGroupItem value="list" aria-label="List view" className="size-9 rounded-none border border-transparent data-[state=on]:border-border data-[state=on]:bg-transparent">
                  <Rows3 strokeWidth={1.5} />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Grid view" className="size-9 rounded-none border border-transparent data-[state=on]:border-border data-[state=on]:bg-transparent">
                  <LayoutGrid strokeWidth={1.5} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <TabsContent value="weekly" className="onboarding-enter">
            {professional ? weekly : <LockedTab tab="weekly" />}
          </TabsContent>
          {(["latest", "for-you"] as const).map((value) => (
            <TabsContent key={value} value={value} className="onboarding-enter">
              {locked ? (
                <LockedTab tab="for-you" />
              ) : visible.length === 0 ? (
                <p className={cn(labelClass, "py-24 text-center text-muted-foreground")}>No stories match these filters</p>
              ) : (
                <>
                  {view === "list" ? (
                    <ul>
                      {visible.slice(0, shown).map((story) => (
                        <StoryRow key={story.id} story={story} now={now} />
                      ))}
                    </ul>
                  ) : (
                    <ul className="grid gap-6 pt-8 sm:grid-cols-2 xl:grid-cols-3">
                      {visible.slice(0, shown).map((story) => (
                        <StoryCard key={story.id} story={story} now={now} />
                      ))}
                    </ul>
                  )}
                  {shown < visible.length ? (
                    <div className="flex justify-center pt-10">
                      <Button
                        variant="outline"
                        className={cn(labelClass, "rounded-none text-xs")}
                        onClick={() => setShown((count) => count + PAGE_SIZE)}
                      >
                        Load more
                      </Button>
                    </div>
                  ) : (
                    <p className={cn(labelClass, "pt-12 text-center text-[10px] text-muted-foreground")}>You’re all caught up</p>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function FilterPanel({
  total,
  typeCounts,
  types,
  onToggleType,
  topicTotal,
  topicCounts,
  topics,
  onToggleTopic,
}: {
  total: number;
  typeCounts: Map<StoryType, number>;
  types: StoryType[];
  onToggleType: (type: StoryType | null) => void;
  topicTotal: number;
  topicCounts: Array<[FeedTopic, number]>;
  topics: FeedTopic[];
  onToggleTopic: (topic: FeedTopic | null) => void;
}) {
  return (
    <div className="space-y-10">
      <FilterGroup label="Type">
        <FilterRow label="All" count={total} checked={types.length === 0} onChange={() => onToggleType(null)} />
        {TYPE_ORDER.filter((type) => typeCounts.has(type)).map((type) => (
          <FilterRow
            key={type}
            label={TYPE_LABELS[type]}
            count={typeCounts.get(type) ?? 0}
            checked={types.includes(type)}
            onChange={() => onToggleType(type)}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Topics">
        <FilterRow label="All" count={topicTotal} checked={topics.length === 0} onChange={() => onToggleTopic(null)} />
        {topicCounts.map(([topic, count]) => (
          <FilterRow
            key={topic}
            label={topic}
            count={count}
            checked={topics.includes(topic)}
            onChange={() => onToggleTopic(topic)}
          />
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className={cn(labelClass, "mb-3 px-4 text-[10px] text-muted-foreground")}>{label}</legend>
      <div className="space-y-px">{children}</div>
    </fieldset>
  );
}

function FilterRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        labelClass,
        "flex cursor-pointer items-center gap-4 px-4 py-3 text-xs transition-colors hover:bg-muted/60",
        checked ? "bg-muted text-foreground" : "text-foreground/80",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="flex-1 truncate">{label}</span>
      <span className="tabular-nums text-muted-foreground">{numberFormat.format(count)}</span>
    </label>
  );
}

function StoryMeta({ story, now }: { story: Story; now: number }) {
  const source = story.author ?? story.sourceName ?? "The Forward Pass";
  return (
    <p className={cn(labelClass, "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground")}>
      <span className="inline-flex items-center gap-2.5 text-foreground/80">
        <SourceMark name={source} />
        {source}
      </span>
      {story.topics[0] && (
        <>
          <span aria-hidden="true">·</span>
          <span>{story.topics[0]}</span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <time dateTime={story.publishedAt}>{formatTimeAgo(story.publishedAt, now)}</time>
    </p>
  );
}

function StoryRow({ story, now }: { story: Story; now: number }) {
  return (
    <li className="group/row relative grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 border-b border-border py-7 transition-colors hover:bg-muted/30 sm:grid-cols-[4.5rem_minmax(0,1fr)_13rem] sm:gap-x-6 md:grid-cols-[4.5rem_minmax(0,1fr)_17rem]">
      <div className="relative z-10 flex justify-center">
        <UpvoteButton id={story.id} upvotes={story.upvotes} viewerHasUpvoted={story.viewerHasUpvoted} />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg leading-snug font-medium text-pretty md:text-xl">
          <Link href={story.href} className="after:absolute after:inset-0 group-hover/row:underline group-hover/row:underline-offset-4 group-hover/row:decoration-1">
            {story.title}
          </Link>
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <StoryMeta story={story} now={now} />
          <span aria-hidden="true" className="text-muted-foreground">·</span>
          <BookmarkButton id={story.id} title={story.title} className="relative z-10" />
        </div>
      </div>
      <StoryThumb seed={story.id} image={story.image} className="hidden aspect-[16/9] sm:block" />
    </li>
  );
}

function StoryCard({ story, now }: { story: Story; now: number }) {
  const source = story.author ?? story.sourceName ?? "The Forward Pass";
  return (
    <li className="group/card relative flex flex-col border border-border transition-colors hover:border-foreground/40">
      <div className="p-5 pb-0">
        <StoryThumb seed={story.id} image={story.image} className="aspect-[16/10]" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className={cn(labelClass, "inline-flex items-center gap-2.5 text-[11px] text-foreground/80")}>
          <SourceMark name={source} />
          {source}
        </p>
        <h2 className="text-lg leading-snug font-medium text-balance">
          <Link href={story.href} className="after:absolute after:inset-0 group-hover/card:underline group-hover/card:underline-offset-4 group-hover/card:decoration-1">
            {story.title}
          </Link>
        </h2>
      </div>
      <div className={cn(labelClass, "grid grid-cols-[auto_1fr_auto] border-t border-border text-[11px] text-muted-foreground")}>
        <span className="border-r border-border px-5 py-3.5">{story.topics[0] ?? TYPE_LABELS[story.type]}</span>
        <time dateTime={story.publishedAt} className="px-5 py-3.5">
          {formatTimeAgo(story.publishedAt, now)}
        </time>
        <span className="relative z-10 grid place-content-center border-l border-border px-4">
          <BookmarkButton id={story.id} title={story.title} />
        </span>
      </div>
      <div className="relative z-10 border-t border-border px-4 py-2.5">
        <UpvoteButton id={story.id} upvotes={story.upvotes} viewerHasUpvoted={story.viewerHasUpvoted} layout="inline" />
      </div>
    </li>
  );
}

const LOCKED_COPY = {
  "for-you": {
    title: "A feed ranked to your reading brief.",
    body: "For You orders every story by the topics you picked. It comes with Personal and Professional.",
    href: "/pricing",
  },
  weekly: {
    title: "One deep dive, every week.",
    body: "A weekly research issue that follows the biggest shift of the week to its primary sources. It comes with Professional.",
    href: "/pricing?plan=professional",
  },
} as const;

function LockedTab({ tab }: { tab: keyof typeof LOCKED_COPY }) {
  const copy = LOCKED_COPY[tab];
  return (
    <div className="flex flex-col items-start gap-5 border-b border-border py-20">
      <Lock className="size-5 text-muted-foreground" strokeWidth={1.5} />
      <h2 className="font-display text-3xl">{copy.title}</h2>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">{copy.body}</p>
      <Button asChild className={cn(labelClass, "rounded-none text-xs")}>
        <Link href={copy.href}>See plans</Link>
      </Button>
    </div>
  );
}
