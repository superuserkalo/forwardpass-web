import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkButton, ShareButton, UpvoteButton } from "@/components/archive/story-actions";
import { StoryThumb } from "@/components/archive/story-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { ArchiveKind } from "@/lib/archive-client";
import { loadArchiveIndex, loadEditionText } from "@/lib/archive-viewer";
import { outlineEdition, type EditionOutline } from "@/lib/feed";
import { prettyDate, stripInlineMarkdown } from "@/lib/story-parse";
import { cn } from "@/lib/utils";

type Params = Promise<{ kind: string; date: string }>;

export const metadata: Metadata = {
  title: "Published edition | The Forward Pass",
  robots: { index: false, follow: false },
};

const labelClass = "font-mono text-[11px] uppercase tracking-[.2em]";

const markdownComponents: Components = {
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure>
        {/* Edition images come from arbitrary publisher hosts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    ) : null,
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ),
};

export default async function EditionPage({ params }: { params: Params }) {
  const { kind, date } = await params;
  if (kind !== "daily" && kind !== "weekly") notFound();
  const edition = await loadEditionText(kind, date);
  if (edition?.status === 404 || edition?.status === 400) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-10 md:pt-32">
        <Link href={kind === "weekly" ? "/archive?section=weekly" : "/archive"} className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Archive
        </Link>
        {edition?.status === 200 ? (
          <Edition kind={kind} date={date} outline={outlineEdition(kind, date, edition.text)} />
        ) : edition?.status === 403 ? (
          <Notice title="Outside your archive access.">
            Open the link in your latest email to restore your reading session, or see the{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-4">plans</Link>.
          </Notice>
        ) : (
          <Notice title="This edition is temporarily unavailable.">Please try again in a few minutes.</Notice>
        )}
        <Suspense fallback={<NextReadsSkeleton />}>
          <NextReads kind={kind} date={date} />
        </Suspense>
      </div>
      <SiteFooter />
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl py-28 text-center">
      <p className="font-display text-4xl">{title}</p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{children}</p>
    </div>
  );
}

function Edition({ kind, date, outline }: { kind: ArchiveKind; date: string; outline: EditionOutline }) {
  const [introLead = "", ...introRest] = outline.preamble.split(/\n\s*\n/);
  const dek = stripInlineMarkdown(introLead) || outline.lead;
  const editionId = `${kind}:${date}`;
  const facts: Array<[string, string]> = [
    ["Edition", kind === "weekly" ? "Weekly research" : "Daily"],
    ["Published", prettyDate(date)],
    ["Read time", `${outline.readMinutes} min`],
    ["Stories", String(outline.sections.length)],
  ];

  return (
    <article>
      <header className="mx-auto mt-14 max-w-4xl text-center">
        <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>
          {kind === "weekly" ? "Weekly deep dive" : "Daily edition"} <span aria-hidden="true">·</span> {prettyDate(date)}
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">{outline.title}</h1>
        {dek && <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">{dek}</p>}
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

      <StoryThumb seed={editionId} image={outline.heroImage} className="mx-auto mt-14 aspect-[21/9] max-w-6xl" />

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
                {outline.sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="-ml-px flex gap-3 border-l border-transparent pl-4 text-sm leading-snug text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                      <span className="font-mono text-[11px] tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      <span>{section.heading || `Story ${index + 1}`}</span>
                    </a>
                  </li>
                ))}
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
          {outline.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-border py-12 first-of-type:border-t-0 first-of-type:pt-0">
              {section.heading && (
                <div className="mb-6 flex items-start justify-between gap-6">
                  <div>
                    <p className="font-mono text-[11px] text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</p>
                    <h2 className="mt-2 font-display text-3xl leading-tight text-balance md:text-[2.125rem]">{section.heading}</h2>
                  </div>
                  <UpvoteButton id={`${kind}:${date}:${index}`} upvotes={0} viewerHasUpvoted={false} className="mt-6 shrink-0" />
                </div>
              )}
              <div className="archive-copy">
                <ReactMarkdown components={markdownComponents}>{section.body}</ReactMarkdown>
              </div>
            </section>
          ))}
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
