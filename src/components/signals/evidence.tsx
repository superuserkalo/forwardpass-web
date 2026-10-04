import { labelClass } from "@/components/archive/edition-shared";
import type { EvidenceView } from "@/lib/signals";
import { cn } from "@/lib/utils";

// The evidence a reader can weigh for themselves: each fact beside the line it was taken from, and where the line is.
// Everything shown comes from evidenceView, which holds nothing the record does not.

const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

export function Evidence({ view }: { view: EvidenceView }) {
  return (
    <section aria-labelledby="evidence-heading" className="mt-16 border-t border-border pt-10">
      <h2 id="evidence-heading" className={cn(labelClass, "text-foreground")}>Checked against the source</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground text-pretty">{view.basisNote}</p>
      <ol className="mt-10 space-y-10">
        {view.facts.map((fact) => (
          <li key={fact.quote} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-12">
            <p className="text-base leading-7 text-pretty">{fact.fact}</p>
            <blockquote className="border-l border-signal pl-5">
              <p className="font-mono text-[13px] leading-7 break-words text-foreground/90">&ldquo;{fact.quote}&rdquo;</p>
              <p className={cn(labelClass, "mt-3 text-[10px] text-muted-foreground")}>
                {view.basis === "page" ? "Word for word in the source page" : "Word for word in the feed summary"}
              </p>
            </blockquote>
          </li>
        ))}
      </ol>
      {view.checked.total > 0 && (
        <p className={cn(labelClass, "mt-12 text-[10px] text-muted-foreground")}>
          {view.checked.supported} of {view.checked.total} statements in the headline and summary supported by these quotes
        </p>
      )}
      <h3 className={cn(labelClass, "mt-12 text-foreground")}>Sources</h3>
      <ul className="mt-5 divide-y divide-border border-y border-border">
        {view.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 text-sm underline-offset-4 hover:underline">
              <span>{source.label}</span>
              <span className={cn(labelClass, "text-[10px] text-muted-foreground")}>{hostOf(source.url)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
