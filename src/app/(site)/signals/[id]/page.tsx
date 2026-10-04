import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Notice, breadcrumbJsonLd, labelClass } from "@/components/archive/edition-shared";
import { Evidence } from "@/components/signals/evidence";
import { SignalList } from "@/components/signals/signal-list";
import { AI_META, AI_SIGNAL_DISCLOSURE, AI_SIGNAL_LABEL } from "@/lib/ai-disclosure";
import { requestTime } from "@/lib/archive-viewer";
import { FEED_TYPES, SITE_NAME, SITE_URL, organizationJsonLd, serializeJsonLd } from "@/lib/seo";
import { evidenceView, signalHref, signalIdFromParam, sourceGapLabel, typeLabel, utcStamp, type Retraction, type SignalRecord } from "@/lib/signals";
import { loadSignal, loadSignals } from "@/lib/signals-client";
import { cn } from "@/lib/utils";

// One signal on its own page, so it can be found, cited and checked. The page is built the first time it is asked for and
// kept for a minute, so a correction shows within a minute and the engine is not asked for every visit.
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ id: string }>;

const lookup = cache((id: string) => loadSignal(id));

const hidden = (title: string): Metadata => ({ title, robots: { index: false, follow: false }, other: AI_META });
const unavailable = () => new Error("Signals are temporarily unavailable.");

function metadataFor(record: SignalRecord): Metadata {
  const path = signalHref(record.id);
  const modified = record.corrections.at(-1)?.at;
  return {
    title: record.headline,
    description: record.summary,
    alternates: { canonical: path, types: { "application/rss+xml": [{ url: "/signals.xml", title: `${SITE_NAME}: live signals` }, ...FEED_TYPES["application/rss+xml"]] } },
    openGraph: { type: "article", url: path, siteName: SITE_NAME, title: record.headline, description: record.summary, publishedTime: record.publishedAt, ...(modified ? { modifiedTime: modified } : {}), section: typeLabel(record.type) },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title: record.headline, description: record.summary },
    other: AI_META,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = signalIdFromParam((await params).id);
  if (!id) return hidden("Signal not found");
  const found = await lookup(id);
  if (found.kind === "unavailable") throw unavailable();
  if (found.kind === "missing") return hidden("Signal not found");
  if (found.kind === "retracted") return hidden("Retracted signal");
  return metadataFor(found.record);
}

export default async function SignalPage({ params }: { params: Params }) {
  const id = signalIdFromParam((await params).id);
  if (!id) notFound();
  const found = await lookup(id);
  // An engine that cannot be reached is an error and not a page: nothing is built from it, so nothing wrong is kept for a minute.
  if (found.kind === "unavailable") throw unavailable();
  if (found.kind === "missing") notFound();
  if (found.kind === "retracted") return <RetractedPage retraction={found.retraction} />;
  return <SignalContent record={found.record} />;
}

function RetractedPage({ retraction }: { retraction: Retraction }) {
  return (
    <main className="min-h-screen">
      <div className="page-shell pt-28 pb-24 md:pt-32">
        <BackLink />
        <Notice title="This signal was retracted.">
          {retraction.note} <span className="whitespace-nowrap">Retracted {utcStamp(retraction.retractedAt)}.</span>
        </Notice>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/signals" className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
      <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Live signals
    </Link>
  );
}

async function SignalContent({ record }: { record: SignalRecord }) {
  const view = evidenceView(record);
  const path = signalHref(record.id);
  const gap = sourceGapLabel(record);
  const later = await loadSignals({ limit: 6 }, { fresh: false });
  const more = (later?.signals ?? []).filter((signal) => signal.id !== record.id).slice(0, 5);
  const jsonLd = {
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: record.headline,
        description: record.summary,
        image: `${SITE_URL}/opengraph-image`,
        datePublished: record.publishedAt,
        dateModified: record.corrections.at(-1)?.at ?? record.publishedAt,
        author: { "@id": organizationJsonLd["@id"] },
        publisher: organizationJsonLd,
        mainEntityOfPage: `${SITE_URL}${path}`,
        isBasedOn: record.sources.map((source) => ({ "@type": "WebPage", name: source.label, url: source.url })),
        citation: record.sources.map((source) => source.url),
        isAccessibleForFree: true,
        inLanguage: "en",
        ...(record.corrections.length ? { correction: record.corrections.map((entry) => ({ "@type": "CorrectionComment", text: entry.note, datePublished: entry.at })) } : {}),
      },
      breadcrumbJsonLd([["Home", "/"], ["Live signals", "/signals"], [record.headline, path]]),
    ],
  };

  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="page-shell pt-28 pb-24 md:pt-32">
        <BackLink />
        <article className="mx-auto mt-14 max-w-4xl">
          <header>
            <p className={cn(labelClass, "flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground")}>
              <span className="text-foreground/80">{typeLabel(record.type)}</span>
              <span aria-hidden="true">·</span>
              <span>{record.publisher}</span>
              {record.traction && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{record.traction}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{AI_SIGNAL_LABEL}</span>
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-balance md:text-6xl">{record.headline}</h1>
            <p className={cn(labelClass, "mt-8 text-[10px] leading-5 text-muted-foreground")}>
              Published <time dateTime={record.publishedAt}>{utcStamp(record.publishedAt)}</time>
              {gap && <> <span aria-hidden="true">·</span> {gap}</>}
            </p>
          </header>

          <p className="mt-10 max-w-3xl text-xl leading-9 text-pretty">{record.summary}</p>

          <p className={cn(labelClass, "mt-8 text-[10px]")}>
            <a href={record.url} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">Read the source</a>
          </p>

          {record.corrections.length > 0 && <Corrections entries={record.corrections} />}

          <Evidence view={view} />

          <p className="mt-12 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">{AI_SIGNAL_DISCLOSURE}</p>
        </article>

        {more.length > 0 && (
          <section aria-labelledby="more-heading" className="mx-auto mt-20 max-w-6xl">
            <h2 id="more-heading" className={cn(labelClass, "mb-6 text-[10px] text-muted-foreground")}>More live signals</h2>
            <SignalList signals={more} now={requestTime()} />
            <p className={cn(labelClass, "mt-8 text-[10px]")}>
              <Link href="/signals" className="text-foreground underline underline-offset-4">All live signals</Link>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Corrections({ entries }: { entries: SignalRecord["corrections"] }) {
  return (
    <section aria-labelledby="corrections-heading" className="mt-12 border border-signal/60 p-6">
      <h2 id="corrections-heading" className={cn(labelClass, "text-[10px] text-signal")}>Corrected</h2>
      <ul className="mt-4 space-y-5">
        {[...entries].reverse().map((entry) => (
          <li key={entry.at} className="text-sm leading-7">
            <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>{utcStamp(entry.at)}</p>
            <p className="mt-1 text-pretty">{entry.note}</p>
            {entry.before?.headline && <p className="mt-2 text-muted-foreground text-pretty">Headline before: {entry.before.headline}</p>}
            {entry.before?.summary && <p className="mt-2 text-muted-foreground text-pretty">Summary before: {entry.before.summary}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
