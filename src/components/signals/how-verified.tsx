import Link from "next/link";
import { labelClass } from "@/components/archive/edition-shared";
import { cn } from "@/lib/utils";

// What "checked" means, in the order the engine does it. The scorecard above it says how often and how fast, and the
// corrections log says what was wrong, so none of this is taken on trust.

const STEPS: Array<{ title: string; body: string }> = [
  { title: "A signal starts from a source.", body: "A lab's own feed, a release, a repository or a paper, read as soon as it appears. The scorecard says how long that really takes." },
  { title: "Every fact comes with a quote.", body: "A fact is kept only if a line quoted from the source was found word for word in the page the signal links to. A signal with no such fact is never published." },
  { title: "Numbers are not invented.", body: "A number in a headline or summary has to appear in a verified fact, a quote or the source's own title." },
  { title: "A second model checks the wording.", body: "The headline and each sentence of the summary are judged against the quotes. A sentence they do not support is replaced by a verified fact, or the signal is dropped." },
  { title: "Nobody edits it, and mistakes are public.", body: "No human edits a signal before it is published. When one is wrong it is corrected in place and logged, and a retracted signal keeps its page with the reason." },
];

export function HowVerified() {
  return (
    <section id="how-signals-are-checked" aria-labelledby="how-heading" className="mt-24 border-t border-border pt-10">
      <h2 id="how-heading" className="font-display text-3xl md:text-4xl">How a signal is checked</h2>
      <ol className="mt-10 grid gap-x-16 gap-y-8 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
            <span className={cn(labelClass, "pt-1 text-[10px] text-muted-foreground")}>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground text-pretty">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className={cn(labelClass, "mt-10 text-[10px] text-muted-foreground")}>
        <Link href="/signals/corrections" className="text-foreground underline underline-offset-4">Read the corrections log</Link>
      </p>
    </section>
  );
}
