import type { ReactNode } from "react";

/**
 * Shared frame for text pages (privacy, terms, imprint, about, unsubscribe): the title and lede hold the
 * left of the page while the copy runs in a readable column beside it. Header and footer come from the
 * site layout.
 */
export function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="page-shell min-h-[70vh] pb-24 pt-32 md:pb-36 md:pt-44">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 xl:gap-32">
        <header className="lg:sticky lg:top-36 lg:self-start">
          <p className="onboarding-eyebrow">{eyebrow}</p>
          <h1 className="font-display text-6xl leading-[0.95] font-medium tracking-[-0.02em] sm:text-7xl xl:text-8xl">{title}</h1>
          {lede ? <div className="legal-lede mt-8 max-w-md text-base leading-relaxed text-muted-foreground">{lede}</div> : null}
          {updated ? <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Last updated {updated}</p> : null}
        </header>
        <article className="legal-copy">{children}</article>
      </div>
    </main>
  );
}
