import { Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice, labelClass } from "@/components/archive/edition-shared";
import { ForAgents } from "@/components/signals/for-agents";
import { HowVerified } from "@/components/signals/how-verified";
import { Scorecard } from "@/components/signals/scorecard";
import { SignalList } from "@/components/signals/signal-list";
import { agentEndpoint } from "@/lib/agent-client";
import { AI_META } from "@/lib/ai-disclosure";
import { requestTime } from "@/lib/archive-viewer";
import { FEED_TYPES, SITE_NAME, SITE_URL, organizationJsonLd, pageMetadata, serializeJsonLd } from "@/lib/seo";
import { SIGNAL_TYPES, signalHref, signalsMcpUrl, typeLabel } from "@/lib/signals";
import { loadSignalStats, loadSignals } from "@/lib/signals-client";
import { cn } from "@/lib/utils";

// The live list: what the engine has verified and published, newest first, with the numbers that show how well it does that.

type SearchParams = Promise<{ type?: string | string[]; before?: string | string[] }>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
const typeOf = (value: string | string[] | undefined) => SIGNAL_TYPES.find((type) => type === first(value)) ?? null;

const DESCRIPTION = "Short signals from AI labs, repositories and papers, usually within minutes of the source, each with the line it was checked against and the numbers that show how it does.";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const type = typeOf(params.type);
  const base = pageMetadata({
    path: type ? `/signals?type=${type}` : "/signals",
    title: type ? `Live AI signals: ${typeLabel(type).toLowerCase()}` : "Live AI signals",
    description: DESCRIPTION,
  });
  return {
    ...base,
    alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: "/signals.xml", title: `${SITE_NAME}: live signals` }, ...FEED_TYPES["application/rss+xml"]] } },
    // Older pages shift with every new signal, so they are not worth indexing, but their links are worth following.
    ...(first(params.before) ? { robots: { index: false, follow: true } } : {}),
    other: AI_META,
  };
}

export default async function SignalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = typeOf(params.type);
  const before = first(params.before);
  const [page, stats] = await Promise.all([loadSignals({ type: type ?? undefined, before }), loadSignalStats()]);
  const now = requestTime();
  const mcpUrl = signalsMcpUrl(agentEndpoint());

  const jsonLd = page ? {
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Live AI signals",
        url: `${SITE_URL}/signals`,
        description: DESCRIPTION,
        isPartOf: { "@id": organizationJsonLd["@id"] },
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: page.signals.slice(0, 20).map((signal, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}${signalHref(signal.id)}`, name: signal.headline })),
        },
      },
    ],
  } : null;

  return (
    <main className="min-h-screen">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <div className="page-shell pt-28 pb-24 md:pt-32">
        <header className="max-w-4xl">
          <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>Live signals <span aria-hidden="true">·</span> AI-generated</p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-balance md:text-5xl">What just shipped, with the line that proves it.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
            Short items from labs, repositories and papers, written by AI models, usually within minutes of the source. Every fact carries a quote found word for word in that source, and mistakes are logged in public.
          </p>
          <p className={cn(labelClass, "mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-muted-foreground")}>
            <a href="/signals.xml" className="inline-flex items-center gap-2 hover:text-foreground"><Rss className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> RSS feed</a>
            <a href="#how-signals-are-checked" className="hover:text-foreground">How a signal is checked</a>
            <Link href="/signals/corrections" className="hover:text-foreground">Corrections</Link>
            {mcpUrl && <a href="#mcp" className="hover:text-foreground">For agents</a>}
          </p>
        </header>

        {stats && <Scorecard window={stats.last7days} heading="Last 7 days" />}

        <nav aria-label="Signal types" className="mt-12 flex gap-8 overflow-x-auto border-b border-border">
          {[{ value: null, label: "All" }, ...SIGNAL_TYPES.map((value) => ({ value, label: typeLabel(value) }))].map((entry) => (
            <Link
              key={entry.label}
              href={entry.value ? `/signals?type=${entry.value}` : "/signals"}
              aria-current={entry.value === type ? "page" : undefined}
              className={cn(
                "relative inline-flex shrink-0 items-center pt-1 pb-4 font-mono text-xs uppercase tracking-[.2em] transition-colors",
                entry.value === type ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </Link>
          ))}
        </nav>

        {!page ? (
          <Notice title="Signals are temporarily unavailable.">Please try again in a few minutes.</Notice>
        ) : page.signals.length === 0 ? (
          <Notice title={before ? "That is all there is." : "Nothing to show yet."}>{before ? "There are no older signals." : "New signals appear here as soon as they are checked."}</Notice>
        ) : (
          <>
            <SignalList signals={page.signals} now={now} />
            {page.next && (
              <p className={cn(labelClass, "mt-8 text-[10px]")}>
                <Link href={`/signals?${new URLSearchParams({ ...(type ? { type } : {}), before: page.next })}`} className="text-foreground underline underline-offset-4">Older signals</Link>
              </p>
            )}
          </>
        )}

        <HowVerified />
        {mcpUrl && <ForAgents url={mcpUrl} />}
      </div>
    </main>
  );
}
