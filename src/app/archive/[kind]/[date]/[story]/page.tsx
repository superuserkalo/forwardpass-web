import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ReactMarkdown from "react-markdown";
import { CrawlerSuspense } from "@/components/crawler-suspense";
import { Notice, absoluteUrl, breadcrumbJsonLd, labelClass, markdownComponents, storyVoteId } from "@/components/archive/edition-shared";
import { ArticleSkeleton } from "@/components/archive/skeletons";
import { ShareButton, UpvoteButton } from "@/components/archive/story-actions";
import { StoryThumb } from "@/components/archive/story-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AI_DISCLOSURE, AI_LABEL, AI_META } from "@/lib/ai-disclosure";
import { imageForSection, type ArchiveEntry } from "@/lib/archive-client";
import { loadEditionText } from "@/lib/archive-viewer";
import { loadFeed, outlineEdition, type EditionOutline } from "@/lib/feed";
import { FEED_TYPES, SITE_NAME, SITE_URL, organizationJsonLd, serializeJsonLd } from "@/lib/seo";
import { storySlug } from "@/lib/story-slug";
import { prettyDate, stripInlineMarkdown } from "@/lib/story-parse";
import { cn } from "@/lib/utils";

// One featured story from a daily issue on its own page, so it can be found, shared and cited
// by its headline. Its text is the issue's; the issue page stays the full read.

type Params = Promise<{ kind: string; date: string; story: string }>;
type Section = EditionOutline["sections"][number];

const loadEdition = cache((date: string) => loadEditionText("daily", date));

function findStory(outline: EditionOutline, slug: string): { section: Section; number: number } | null {
  const stories = outline.sections.filter((section) => !section.label);
  const index = stories.findIndex((section) => storySlug(section.heading) === slug);
  return index === -1 ? null : { section: stories[index], number: index + 1 };
}

// The body opens with "**Top News** · 984 HN points"; the dek is the first paragraph after it.
function storyDek(body: string): string {
  const paragraph = body.split(/\n\s*\n/).map((part) => part.trim()).find((part) => part && !/^\*\*[^*]+\*\*\s*(·|$)/.test(part) && !/^[-*]\s/.test(part)) ?? "";
  const text = stripInlineMarkdown(paragraph).replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 219).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { kind, date, story } = await params;
  const hidden: Metadata = { title: "Story", robots: { index: false, follow: false }, other: AI_META };
  if (kind !== "daily") return hidden;
  const edition = await loadEdition(date);
  if (edition?.status !== 200) return hidden;
  const found = findStory(outlineEdition("daily", date, edition.text), story);
  if (!found) return hidden;
  const path = `/archive/daily/${date}/${story}`;
  const title = found.section.heading;
  const description = storyDek(found.section.body) || `From The Forward Pass daily issue for ${prettyDate(date)}.`;
  const image = imageForSection(edition.storyImages, found.section.id, story)?.path;
  return {
    title,
    description,
    alternates: { canonical: path, types: { ...FEED_TYPES, "text/markdown": `${path}.md` } },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: `${date}T07:00:00Z`,
      section: "Daily issue",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title, description },
    other: AI_META,
  };
}

export default function StoryPage({ params }: { params: Params }) {
  return (
    <CrawlerSuspense
      fallback={
        <main className="min-h-screen">
          <ArticleSkeleton />
        </main>
      }
    >
      <StoryContent params={params} />
    </CrawlerSuspense>
  );
}

async function StoryContent({ params }: { params: Params }) {
  const { kind, date, story } = await params;
  if (kind !== "daily") notFound();
  const [edition, feed] = await Promise.all([loadEdition(date), loadFeed(200)]);
  if (!edition || edition.status === 404 || edition.status === 400) notFound();
  const issuePath = `/archive/daily/${date}`;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <Link href={issuePath} className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> {prettyDate(date)} issue
        </Link>
        {edition.status === 200 ? (
          <Story date={date} slug={story} edition={edition} votes={feed.stories} />
        ) : edition.status === 403 ? (
          <Notice title="Outside your archive access.">
            Open the link in your latest email to restore your reading session, or see the{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-4">plans</Link>.
          </Notice>
        ) : (
          <Notice title="This story is temporarily unavailable.">Please try again in a few minutes.</Notice>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

function Story({
  date,
  slug,
  edition,
  votes,
}: {
  date: string;
  slug: string;
  edition: ArchiveEntry;
  votes: Array<{ id: string; upvotes: number; viewerHasUpvoted: boolean }>;
}) {
  const outline = outlineEdition("daily", date, edition.text);
  const found = findStory(outline, slug);
  if (!found) notFound();
  const { section, number } = found;
  const path = `/archive/daily/${date}/${slug}`;
  const issuePath = `/archive/daily/${date}`;
  const image = imageForSection(edition.storyImages, section.id, slug);
  const voteId = storyVoteId("daily", date, section.id, number);
  const vote = votes.find((entry) => entry.id === voteId);
  const others = outline.sections.filter((entry) => !entry.label && entry.id !== section.id);
  const jsonLd = {
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: section.heading,
        description: storyDek(section.body) || undefined,
        image: image ? absoluteUrl(image.path) : `${SITE_URL}/opengraph-image`,
        datePublished: `${date}T07:00:00Z`,
        author: { "@id": organizationJsonLd["@id"] },
        publisher: organizationJsonLd,
        mainEntityOfPage: `${SITE_URL}${path}`,
        isPartOf: { "@type": "NewsArticle", headline: outline.title, url: `${SITE_URL}${issuePath}` },
        ...(image?.source ? { citation: image.source } : {}),
        isAccessibleForFree: true,
        inLanguage: "en",
      },
      breadcrumbJsonLd([["Home", "/"], ["Archive", "/archive"], [`${prettyDate(date)} issue`, issuePath], [section.heading, path]]),
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <header className="mx-auto mt-14 max-w-4xl text-center">
        <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>
          Story {String(number).padStart(2, "0")} <span aria-hidden="true">·</span>{" "}
          <Link href={issuePath} className="underline-offset-4 hover:text-foreground hover:underline">{prettyDate(date)} issue</Link>
        </p>
        <p className={cn(labelClass, "mt-3 text-[10px] text-muted-foreground")}>{AI_LABEL}</p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-balance md:text-6xl">{section.heading}</h1>
      </header>

      <figure className="mx-auto mt-14 max-w-6xl">
        <StoryThumb seed={`daily:${date}:${section.id}`} image={image?.path ?? null} className="aspect-[21/9]" />
        {image?.credit && (
          <figcaption className={cn(labelClass, "mt-3 text-[10px] text-muted-foreground")}>
            Image:{" "}
            {image.source ? (
              <a href={image.source} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline">{image.credit}</a>
            ) : (
              image.credit
            )}
          </figcaption>
        )}
      </figure>

      <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:flex-col lg:items-start">
            <UpvoteButton id={voteId} upvotes={vote?.upvotes ?? 0} viewerHasUpvoted={vote?.viewerHasUpvoted ?? false} layout="inline" />
            <ShareButton />
          </div>
        </aside>
        <div className="min-w-0 max-w-2xl">
          <div className="archive-copy">
            <ReactMarkdown components={markdownComponents}>{section.body}</ReactMarkdown>
          </div>
          <p className="mt-10 text-sm leading-6 text-muted-foreground text-pretty">{AI_DISCLOSURE}</p>

          <nav aria-label="More from this issue" className="mt-14 border-t border-border pt-8">
            <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>More from the {prettyDate(date)} issue</p>
            <ul className="mt-5 space-y-4">
              {others.map((entry) => (
                <li key={entry.id}>
                  <Link href={`${issuePath}/${storySlug(entry.heading)}`} className="font-display text-xl leading-snug underline-offset-4 hover:underline">
                    {entry.heading}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={issuePath} className={cn(labelClass, "mt-8 inline-flex text-[10px] text-foreground underline underline-offset-4")}>
              Read the full issue
            </Link>
          </nav>
        </div>
      </div>
    </article>
  );
}
