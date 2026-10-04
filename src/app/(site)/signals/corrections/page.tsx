import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice, labelClass } from "@/components/archive/edition-shared";
import { AI_META } from "@/lib/ai-disclosure";
import { pageMetadata } from "@/lib/seo";
import { lookupHeadline, signalHref, utcStamp } from "@/lib/signals";
import { loadCorrections, loadSignal } from "@/lib/signals-client";
import { cn } from "@/lib/utils";

// Every correction and retraction of a signal, newest first, with what the text said before. A signal that was wrong is
// fixed in place, and this is where anyone can see that it was and why. It is built on request, so a correction is here the
// moment the engine has it.

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/signals/corrections",
    title: "Signal corrections",
    description: "Every correction and retraction of a live signal, with what it said before and why it was changed.",
  }),
  other: AI_META,
};

// How many of the newest entries are named by headline: each is one read, kept for a minute.
const NAMED = 40;

export default async function CorrectionsPage() {
  const entries = await loadCorrections();
  const ids = [...new Set((entries ?? []).slice(0, NAMED).map((entry) => entry.signalId))];
  const headlines = new Map(await Promise.all(ids.map(async (id): Promise<[string, string | null]> => [id, lookupHeadline(await loadSignal(id))])));
  return (
    <main className="min-h-screen">
      <div className="page-shell pt-28 pb-24 md:pt-32">
        <Link href="/signals" className={cn(labelClass, "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> Live signals
        </Link>
        <header className="mt-14 max-w-3xl">
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance md:text-6xl">Corrections</h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground text-pretty">
            Signals are written and checked by machines, so some will be wrong. When one is, it is corrected in place or retracted, the old wording is kept here, and the note says why.
          </p>
        </header>
        {entries === null ? (
          <Notice title="The log is temporarily unavailable.">Please try again in a few minutes.</Notice>
        ) : entries.length === 0 ? (
          <Notice title="No corrections yet.">Nothing has been corrected or retracted so far. If we get something wrong it will appear here.</Notice>
        ) : (
          <ul className="mt-16 border-t border-border">
            {entries.map((entry) => (
              <li key={`${entry.signalId}-${entry.at}`} className="grid gap-x-10 gap-y-3 border-b border-border py-7 md:grid-cols-[11rem_minmax(0,1fr)]">
                <p className={cn(labelClass, "text-[10px] leading-5 text-muted-foreground")}>
                  <span className={entry.kind === "retraction" ? "text-signal" : "text-foreground/80"}>{entry.kind === "retraction" ? "Retraction" : "Correction"}</span>
                  <br />
                  <time dateTime={entry.at}>{utcStamp(entry.at)}</time>
                </p>
                <div className="min-w-0 text-sm leading-7">
                  <p className="mb-2 text-muted-foreground text-pretty">{headlines.get(entry.signalId) ?? (entry.kind === "retraction" ? "A retracted signal" : "A signal")}</p>
                  <p className="text-base text-pretty">{entry.note}</p>
                  {entry.before?.headline && <p className="mt-2 text-muted-foreground text-pretty">Headline before: {entry.before.headline}</p>}
                  {entry.before?.summary && <p className="mt-2 text-muted-foreground text-pretty">Summary before: {entry.before.summary}</p>}
                  <p className={cn(labelClass, "mt-4 text-[10px]")}>
                    <Link href={signalHref(entry.signalId)} className="text-foreground underline underline-offset-4">Open the signal</Link>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
