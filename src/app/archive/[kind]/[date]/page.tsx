import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ReactMarkdown from "react-markdown";
import { ArticleSkeleton } from "@/components/archive/skeletons";
import { CrawlerSuspense } from "@/components/crawler-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkButton, ShareButton, UpvoteButton } from "@/components/archive/story-actions";
import { StoryThumb } from "@/components/archive/story-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { imageForSection, type ArchiveKind, type StoryImage } from "@/lib/archive-client";
import { loadArchiveIndex, loadEditionText } from "@/lib/archive-viewer";
import { loadEditorialArticle, loadFeed, outlineEdition, type EditionOutline, type EditorialArticle } from "@/lib/feed";
import { prettyDate, stripInlineMarkdown } from "@/lib/story-parse";
import { AI_DISCLOSURE, AI_LABEL, AI_META } from "@/lib/ai-disclosure";
import { FEED_TYPES, SITE_NAME, SITE_URL, organizationJsonLd, serializeJsonLd } from "@/lib/seo";
import { Notice, absoluteUrl, breadcrumbJsonLd, labelClass, markdownComponents, storyNumber, storyVoteId } from "@/components/archive/edition-shared";
import { storySlug } from "@/lib/story-slug";
import { cn } from "@/lib/utils";

type Params = Promise<{ kind: string; date: string }>;

// generateMetadata and the page share one request per render.
const loadArticle = cache(loadEditorialArticle);
const loadEdition = cache((kind: ArchiveKind, date: string) => loadEditionText(kind, date));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { kind, date } = await params;
  if (kind === "editorial") return editorialMetadata(date, await loadArticle(date));
  const hidden: Metadata = {
    title: "Published edition",
    robots: { index: false, follow: false },
    ...(kind === "daily" || kind === "weekly" ? { other: AI_META } : {}),
  };
  if (kind !== "daily") return hidden;
  // A daily issue is indexable exactly when this request may read it. Crawlers arrive signed out,
  // so free issues inside the public archive window are indexed and older ones drop out.
  const edition = await loadEdition(kind, date);
  if (edition?.status !== 200) return hidden;
  return editionMetadata(date, outlineEdition(kind, date, edition.text), edition.image);
}

function editionDek(outline: EditionOutline): string {
  return stripInlineMarkdown(outline.preamble.split(/\n\s*\n/)[0] ?? "") || outline.lead || "";
}

function editionMetadata(date: string, outline: EditionOutline, cover: string | null): Metadata {
  const path = `/archive/daily/${date}`;
  const description = editionDek(outline) || `The Forward Pass daily issue for ${prettyDate(date)}.`;
  const image = cover ?? outline.heroImage;
  return {
    title: outline.title,
    description,
    alternates: { canonical: path, types: { ...FEED_TYPES, "text/markdown": `${path}.md` } },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      title: outline.title,
      description,
      publishedTime: `${date}T07:00:00Z`,
      section: "Daily issue",
      tags: outline.topics,
      ...(image ? { images: [{ url: image, alt: outline.title }] } : {}),
    },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title: outline.title, description },
    other: AI_META,
  };
}

function editionJsonLd(date: string, outline: EditionOutline, cover: string | null) {
  const path = `/archive/daily/${date}`;
  const image = cover ?? outline.heroImage;
  return {
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: outline.title,
        description: editionDek(outline) || undefined,
        image: image ? absoluteUrl(image) : `${SITE_URL}/opengraph-image`,
        datePublished: `${date}T07:00:00Z`,
        author: { "@id": organizationJsonLd["@id"] },
        publisher: organizationJsonLd,
        mainEntityOfPage: `${SITE_URL}${path}`,
        articleSection: "Daily issue",
        keywords: outline.topics.join(", ") || undefined,
        isAccessibleForFree: true,
        inLanguage: "en",
      },
      breadcrumbJsonLd([["Home", "/"], ["Archive", "/archive"], [prettyDate(date), path]]),
    ],
  };
}

function editorialMetadata(slug: string, article: EditorialArticle | null): Metadata {
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };
  const path = `/archive/editorial/${slug}`;
  const description = article.dek || `${KIND_LABELS[article.kind]} by ${article.author} in The Forward Pass.`;
  return {
    title: article.title,
    description,
    authors: [{ name: article.author }],
    alternates: { canonical: path, types: { ...FEED_TYPES, "text/markdown": `${path}.md` } },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      title: article.title,
      description,
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.topics,
      ...(article.image ? { images: [{ url: article.image, alt: article.title }] } : {}),
    },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title: article.title, description },
  };
}

function articleJsonLd(article: EditorialArticle, path: string) {
  return {
    "@graph": [
      {
        "@type": article.kind === "opinion" ? "OpinionNewsArticle" : article.kind === "tutorial" ? "TechArticle" : "AnalysisNewsArticle",
        headline: article.title,
        description: article.dek || undefined,
        image: article.image ? absoluteUrl(article.image) : `${SITE_URL}/opengraph-image`,
        datePublished: article.publishedAt,
        author: { "@type": "Person", name: article.author },
        publisher: organizationJsonLd,
        mainEntityOfPage: `${SITE_URL}${path}`,
        keywords: article.topics.join(", ") || undefined,
        wordCount: article.markdown.split(/\s+/).length,
        isAccessibleForFree: true,
        inLanguage: "en",
      },
      breadcrumbJsonLd([["Home", "/"], ["Editorial", "/archive?section=editorial"], [article.title, path]]),
    ],
  };
}

export default function EditionPage({ params }: { params: Params }) {
  return (
    <CrawlerSuspense
      fallback={
        <main className="min-h-screen">
          <ArticleSkeleton />
        </main>
      }
    >
      <EditionContent params={params} />
    </CrawlerSuspense>
  );
}

async function EditionContent({ params }: { params: Params }) {
  const { kind, date } = await params;
  if (kind === "editorial") return <EditorialArticlePage slug={date} />;
  if (kind !== "daily" && kind !== "weekly") notFound();
  const [edition, feed] = await Promise.all([
    loadEdition(kind, date),
    kind === "daily" ? loadFeed(200) : Promise.resolve(null),
  ]);
  const votes = new Map(
    (feed?.stories ?? []).map((story) => [story.id, { upvotes: story.upvotes, viewerHasUpvoted: story.viewerHasUpvoted }]),
  );
  if (edition?.status === 404 || edition?.status === 400) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <Link href={kind === "weekly" ? "/archive?section=weekly" : "/archive"} className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Archive
        </Link>
        {edition?.status === 200 ? (
          <>
            {kind === "daily" && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(editionJsonLd(date, outlineEdition(kind, date, edition.text), edition.image)) }}
              />
            )}
            <Edition kind={kind} date={date} outline={outlineEdition(kind, date, edition.text)} cover={edition.image} storyImages={edition.storyImages} votes={votes} />
          </>
        ) : edition?.status === 403 ? (
          <Notice title="Outside your archive access.">
            Open the link in your latest email to restore your reading session, or see the{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-4">plans</Link>.
          </Notice>
        ) : (
          <Notice title="This edition is temporarily unavailable.">Please try again in a few minutes.</Notice>
        )}
        <CrawlerSuspense fallback={<NextReadsSkeleton />}>
          <NextReads kind={kind} date={date} />
        </CrawlerSuspense>
      </div>
      <SiteFooter />
    </main>
  );
}

/** 1-based story number, or null for labelled sections such as Quick signals. */
/** Vote id for a story section: its record id when the engine marked one, else its position (older issues). */
async function EditorialArticlePage({ slug }: { slug: string }) {
  const article = await loadArticle(slug);
  if (!article) notFound();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd(article, `/archive/editorial/${slug}`)) }}
      />
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <Link href="/archive?section=editorial" className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Editorial
        </Link>
        <EditorialArticleView article={article} />
      </div>
      <SiteFooter />
    </main>
  );
}

const KIND_LABELS: Record<EditorialArticle["kind"], string> = { "deep-dive": "Deep dive", tutorial: "Tutorial", opinion: "Opinion" };
const longDate = new Intl.DateTimeFormat("en", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });

function EditorialArticleView({ article }: { article: EditorialArticle }) {
  const facts: Array<[string, string]> = [
    ["Kind", KIND_LABELS[article.kind]],
    ["By", article.author],
    ["Published", longDate.format(new Date(article.publishedAt))],
    ["Read time", `${Math.max(1, Math.round(article.markdown.split(/\s+/).length / 220))} min`],
  ];
  return (
    <article>
      <header className="mx-auto mt-14 max-w-4xl text-center">
        <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>
          {KIND_LABELS[article.kind]} <span aria-hidden="true">·</span> {article.author}
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">{article.title}</h1>
        {article.dek && <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">{article.dek}</p>}
      </header>
      <StoryThumb seed={article.id} image={article.image} className="mx-auto mt-14 aspect-[21/9] max-w-6xl" />
      <dl className="mx-auto grid max-w-6xl grid-cols-2 border-x border-b border-border md:grid-cols-4">
        {facts.map(([label, value], index) => (
          <div key={label} className={cn("px-5 py-4", index % 2 === 1 && "border-l border-border", index >= 2 && "border-t border-border md:border-t-0", index === 2 && "md:border-l")}>
            <dt className={cn(labelClass, "text-[10px] text-muted-foreground")}>{label}</dt>
            <dd className="mt-1.5 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:flex-col lg:items-start">
            <UpvoteButton id={article.id} upvotes={article.upvotes} viewerHasUpvoted={article.viewerHasUpvoted} layout="inline" />
            <BookmarkButton id={article.id} title={article.title} />
            <ShareButton />
          </div>
        </aside>
        <div className="archive-copy min-w-0 max-w-2xl">
          <ReactMarkdown components={markdownComponents}>{article.markdown}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}

type VoteState = { upvotes: number; viewerHasUpvoted: boolean };

function Edition({
  kind,
  date,
  outline,
  cover,
  storyImages,
  votes,
}: {
  kind: ArchiveKind;
  date: string;
  outline: EditionOutline;
  cover: string | null;
  storyImages: Record<string, StoryImage>;
  votes: Map<string, VoteState>;
}) {
  const [, ...introRest] = outline.preamble.split(/\n\s*\n/);
  const dek = editionDek(outline);
  const editionId = `${kind}:${date}`;
  const facts: Array<[string, string]> = [
    ["Edition", kind === "weekly" ? "Weekly research" : "Daily"],
    ["Published", prettyDate(date)],
    ["Read time", `${outline.readMinutes} min`],
    ["Stories", String(outline.sections.filter((section) => !section.label).length)],
  ];

  return (
    <article>
      <header className="mx-auto mt-14 max-w-4xl text-center">
        <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>
          {kind === "weekly" ? "Weekly deep dive" : "Daily edition"} <span aria-hidden="true">·</span> {prettyDate(date)}
        </p>
        <p className={cn(labelClass, "mt-3 text-[10px] text-muted-foreground")}>{kind === "weekly" ? "AI-generated issue" : AI_LABEL}</p>
        <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">{outline.title}</h1>
        {dek && <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">{dek}</p>}
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">{AI_DISCLOSURE}</p>
        {outline.topics.length > 0 && (
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {outline.topics.slice(0, 5).map((topic) => (
              <li key={topic} className={cn(labelClass, "border border-border px-3 py-1.5 text-[10px] text-muted-foreground")}>
                {topic}
              </li>
            ))}
          </ul>
        )}
      </header>

      <StoryThumb seed={editionId} image={cover ?? outline.heroImage} className="mx-auto mt-14 aspect-[21/9] max-w-6xl" />

      <dl className="mx-auto grid max-w-6xl grid-cols-2 border-x border-b border-border md:grid-cols-4">
        {facts.map(([label, value], index) => (
          <div key={label} className={cn("px-5 py-4", index % 2 === 1 && "border-l border-border", index >= 2 && "border-t border-border md:border-t-0", index === 2 && "md:border-l")}>
            <dt className={cn(labelClass, "text-[10px] text-muted-foreground")}>{label}</dt>
            <dd className="mt-1.5 text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {outline.sections.length > 1 && (
            <nav aria-label="In this issue">
              <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>In this issue</p>
              <ol className="mt-4 space-y-3 border-l border-border">
                {outline.sections.map((section, index) => {
                  const number = storyNumber(outline, section.id);
                  return (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="-ml-px flex gap-3 border-l border-transparent pl-4 text-sm leading-snug text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                        <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums">{number ? String(number).padStart(2, "0") : "·"}</span>
                        <span>{section.heading || `Story ${index + 1}`}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-6 lg:flex-col lg:items-start">
            <UpvoteButton id={editionId} upvotes={0} viewerHasUpvoted={false} layout="inline" />
            <BookmarkButton id={editionId} title={outline.title} />
            <ShareButton />
          </div>
        </aside>

        <div className="min-w-0 max-w-2xl">
          {introRest.length > 0 && (
            <div className="archive-copy mb-10">
              <ReactMarkdown components={markdownComponents}>{introRest.join("\n\n")}</ReactMarkdown>
            </div>
          )}
          {outline.takeaways.length > 0 && (
            <section aria-labelledby="takeaways" className="mb-14 border border-border">
              <h2 id="takeaways" className={cn(labelClass, "border-b border-border px-5 py-3 text-[10px] text-muted-foreground")}>
                Key takeaways
              </h2>
              <ol>
                {outline.takeaways.map((takeaway, index) => (
                  <li key={takeaway} className="flex gap-4 border-b border-border px-5 py-4 text-[15px] leading-7 last:border-b-0">
                    <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    {takeaway}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {outline.sections.map((section) => {
            const number = storyNumber(outline, section.id);
            return (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-border py-12 first-of-type:border-t-0 first-of-type:pt-0">
              {section.heading && (
                <div className="mb-6 flex items-start justify-between gap-6">
                  <div>
                    <p className={cn("text-muted-foreground", number ? "font-mono text-[11px] tabular-nums" : labelClass + " text-[10px]")}>
                      {number ? String(number).padStart(2, "0") : "Also in this issue"}
                    </p>
                    <h2 className="mt-2 font-display text-3xl leading-tight text-balance md:text-[2.125rem]">
                      {number && kind === "daily" ? (
                        <Link href={`/archive/daily/${date}/${storySlug(section.heading)}`} className="underline-offset-[6px] decoration-1 hover:underline">
                          {section.heading}
                        </Link>
                      ) : (
                        section.heading
                      )}
                    </h2>
                  </div>
                  {number && kind === "daily" && (
                    <UpvoteButton
                      id={storyVoteId(kind, date, section.id, number)}
                      upvotes={votes.get(storyVoteId(kind, date, section.id, number))?.upvotes ?? 0}
                      viewerHasUpvoted={votes.get(storyVoteId(kind, date, section.id, number))?.viewerHasUpvoted ?? false}
                      className="mt-6 shrink-0"
                    />
                  )}
                </div>
              )}
              {/* The lead story's image is already the issue's hero. */}
              {number && number > 1 && imageForSection(storyImages, section.id, storySlug(section.heading)) && (
                <StoryThumb seed={`${editionId}:${section.id}`} image={imageForSection(storyImages, section.id, storySlug(section.heading))?.path ?? null} className="mb-8 aspect-[16/9]" />
              )}
              <div className="archive-copy">
                <ReactMarkdown components={markdownComponents}>{section.body}</ReactMarkdown>
              </div>
            </section>
            );
          })}
        </div>
      </div>
    </article>
  );
}

async function NextReads({ kind, date }: { kind: ArchiveKind; date: string }) {
  const index = await loadArchiveIndex();
  const dates = (index ? index[kind] : []).filter((entry) => entry !== date).sort().reverse();
  const older = dates.filter((entry) => entry < date);
  const picks = [...older, ...dates.filter((entry) => entry > date)].slice(0, 3);
  if (picks.length === 0) return null;
  const reads = await Promise.all(
    picks.map(async (pick) => {
      const entry = await loadEditionText(kind, pick);
      const title = entry?.status === 200 ? outlineEdition(kind, pick, entry.text).title : null;
      return { date: pick, title };
    }),
  );
  return (
    <section aria-labelledby="next-reads" className="mx-auto mt-24 max-w-6xl border-t border-border pt-12">
      <h2 id="next-reads" className={cn(labelClass, "text-[10px] text-muted-foreground")}>Keep reading</h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {reads.map((read) => (
          <li key={read.date} className="group/read relative">
            <StoryThumb seed={`${kind}:${read.date}`} image={null} className="aspect-[16/9]" />
            <p className={cn(labelClass, "mt-4 text-[10px] text-muted-foreground")}>{prettyDate(read.date)}</p>
            <h3 className="mt-2 text-lg leading-snug font-medium text-balance">
              <Link href={`/archive/${kind}/${read.date}`} className="decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover/read:underline">
                {read.title ?? (kind === "weekly" ? "Weekly deep dive" : "Daily edition")}
              </Link>
            </h3>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NextReadsSkeleton() {
  return (
    <div className="mx-auto mt-24 grid max-w-6xl gap-6 border-t border-border pt-12 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  );
}
