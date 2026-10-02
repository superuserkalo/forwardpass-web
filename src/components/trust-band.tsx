import { FileText, GitBranch, MessagesSquare, Newspaper, ScrollText } from "lucide-react";

// What the engine reads, as described on the About page.
const SOURCES = [
  { label: "Lab and company blogs", Icon: Newspaper },
  { label: "Changelogs and release notes", Icon: ScrollText },
  { label: "Research papers", Icon: FileText },
  { label: "GitHub releases", Icon: GitBranch },
  { label: "Developer communities", Icon: MessagesSquare },
];

export function TrustBand() {
  return (
    <section aria-label="Where the issues come from" className="border-t border-border">
      <div className="page-shell py-10 text-center md:py-12">
        <p className="text-sm text-muted-foreground sm:text-base">
          We read <span className="font-mono text-foreground">850+</span> sources every two hours, so you only read one issue.
        </p>
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {SOURCES.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm whitespace-nowrap text-foreground/70">
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
