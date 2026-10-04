import { labelClass } from "@/components/archive/edition-shared";
import { scorecard, type StatsWindow } from "@/lib/signals";
import { cn } from "@/lib/utils";

// The numbers behind the promise, from the engine's own records: how many, how soon after the source, how many were
// checked against the page itself, and how many had to be corrected.

export function Scorecard({ window, heading }: { window: StatsWindow; heading: string }) {
  return (
    <section aria-label={heading} className="mt-10 md:mt-12">
      <p className={cn(labelClass, "mb-4 text-[10px] text-muted-foreground")}>{heading}</p>
      <dl className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {scorecard(window).map((row) => (
          <div key={row.label} className="flex flex-col justify-between gap-4 bg-background px-5 py-5">
            <dt className={cn(labelClass, "text-[10px] leading-4 text-muted-foreground")}>{row.label}</dt>
            <dd className="font-display text-3xl tabular-nums md:text-4xl">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
