import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { EditionOutline } from "@/lib/feed";
import { prettyDate } from "@/lib/story-parse";
import { cn } from "@/lib/utils";
import { StoryThumb } from "./story-media";

export type WeeklyIssue = { date: string; outline: EditionOutline };

const labelClass = "font-mono text-[11px] uppercase tracking-[.2em]";

export function WeeklyDeepDive({ issues }: { issues: WeeklyIssue[] }) {
  const [lead, ...previous] = issues;
  if (!lead) {
    return (
      <div className="border-b border-border py-24 text-center">
        <p className="font-display text-3xl">The first deep dive is on its way.</p>
        <p className="mt-3 text-sm text-muted-foreground">Weekly research lands every Sunday.</p>
      </div>
    );
  }
  return (
    <div className="onboarding-enter">
      <article className="group/piece relative grid gap-10 border-b border-border py-12 lg:grid-cols-[3fr_2fr] lg:gap-14">
        <StoryThumb seed={`weekly:${lead.date}`} image={lead.outline.heroImage} className="aspect-[3/2]" />
        <div className="flex flex-col">
          <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>
            Week ending {prettyDate(lead.date)} <span aria-hidden="true">·</span> {lead.outline.readMinutes} min read
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
            <Link
              href={`/archive/weekly/${lead.date}`}
              className="decoration-1 underline-offset-8 after:absolute after:inset-0 group-hover/piece:underline"
            >
              {lead.outline.title}
            </Link>
          </h2>
          {lead.outline.lead && <p className="mt-5 text-base leading-7 text-muted-foreground">{lead.outline.lead}</p>}
          {lead.outline.takeaways.length > 0 && (
            <ul className="mt-8 border-t border-border">
              {lead.outline.takeaways.slice(0, 3).map((takeaway, index) => (
                <li key={takeaway} className="flex gap-4 border-b border-border py-3 text-sm leading-6">
                  <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          )}
          <p className={cn(labelClass, "mt-8 inline-flex items-center gap-2 text-xs text-foreground")}>
            Read the deep dive <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </p>
        </div>
      </article>

      {previous.length > 0 && (
        <section aria-labelledby="previous-weeks" className="py-12">
          <h2 id="previous-weeks" className={cn(labelClass, "mb-6 text-[10px] text-muted-foreground")}>
            Previous weeks
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previous.map((issue) => (
              <li key={issue.date} className="group/piece relative flex flex-col border border-border transition-colors hover:border-foreground/40">
                <div className="p-5 pb-0">
                  <StoryThumb seed={`weekly:${issue.date}`} image={issue.outline.heroImage} className="aspect-[16/9]" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>Week ending {prettyDate(issue.date)}</p>
                  <h3 className="text-lg leading-snug font-medium text-balance">
                    <Link
                      href={`/archive/weekly/${issue.date}`}
                      className="decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover/piece:underline"
                    >
                      {issue.outline.title}
                    </Link>
                  </h3>
                </div>
                <div className={cn(labelClass, "flex justify-between border-t border-border px-5 py-3.5 text-[11px] text-muted-foreground")}>
                  <span>{issue.outline.topics[0] ?? "Research"}</span>
                  <span>{issue.outline.readMinutes} min</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
