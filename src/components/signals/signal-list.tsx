import { Check } from "lucide-react";
import Link from "next/link";
import { labelClass } from "@/components/archive/edition-shared";
import { ageLabel, signalHref, typeLabel, utcStamp, type SignalSummary } from "@/lib/signals";
import { cn } from "@/lib/utils";

// Newest first. The age is said to the minute and the exact UTC time is one hover away, since signals are live.

export function SignalList({ signals, now }: { signals: SignalSummary[]; now: number }) {
  return (
    <ul className="border-t border-border">
      {signals.map((signal) => (
        <SignalRow key={signal.id} signal={signal} now={now} />
      ))}
    </ul>
  );
}

function SignalRow({ signal, now }: { signal: SignalSummary; now: number }) {
  return (
    <li className="group/row relative grid gap-y-3 border-b border-border py-6 transition-colors hover:bg-muted/30 sm:grid-cols-[6.5rem_minmax(0,1fr)_11rem] sm:gap-x-8 sm:py-7">
      <time dateTime={signal.publishedAt} title={utcStamp(signal.publishedAt)} className={cn(labelClass, "text-[10px] leading-5 text-muted-foreground sm:pt-1")}>
        {ageLabel(signal.publishedAt, now)}
      </time>
      <div className="min-w-0">
        <p className={cn(labelClass, "flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground")}>
          <span className="text-foreground/80">{typeLabel(signal.type)}</span>
          <span aria-hidden="true">·</span>
          <span>{signal.publisher}</span>
          {signal.traction && (
            <>
              <span aria-hidden="true">·</span>
              <span>{signal.traction}</span>
            </>
          )}
          {signal.status === "corrected" && <span className="text-signal">Corrected</span>}
          <span className="inline-flex items-center gap-1.5 sm:hidden">
            <Check className="size-3 text-signal" strokeWidth={1.5} aria-hidden="true" />
            {signal.evidenceCount} {signal.evidenceCount === 1 ? "fact" : "facts"}
          </span>
        </p>
        <h2 className="mt-2 text-lg leading-snug font-medium text-pretty md:text-xl">
          <Link href={signalHref(signal.id)} className="after:absolute after:inset-0 group-hover/row:underline group-hover/row:decoration-1 group-hover/row:underline-offset-4">
            {signal.headline}
          </Link>
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground text-pretty">{signal.summary}</p>
      </div>
      <p className={cn(labelClass, "hidden items-start gap-2 pt-1 text-[10px] leading-5 text-muted-foreground sm:flex")}>
        <Check className="mt-0.5 size-3.5 shrink-0 text-signal" strokeWidth={1.5} aria-hidden="true" />
        {signal.evidenceCount} quoted {signal.evidenceCount === 1 ? "fact" : "facts"}
      </p>
    </li>
  );
}
