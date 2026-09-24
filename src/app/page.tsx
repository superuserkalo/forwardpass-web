import type { Metadata } from "next";
import Link from "next/link";
import { AdvertisingForm, NewsletterForm } from "@/components/forward-pass-forms";
import { Hero } from "@/components/hero";
import { Sigil } from "@/components/sigil";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "The Forward Pass: What's changing in AI engineering",
  description: "A daily intelligence newsletter for people who build with AI.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    siteName: "The Forward Pass",
    title: "The Forward Pass",
    description: "What's changing in AI engineering.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@forwardpassnews",
  },
};

const COVERAGE: Array<{ name: string; leaves: Array<string> }> = [
  { name: "models", leaves: ["releases", "benchmarks", "capability_shifts", "multimodal"] },
  { name: "agents", leaves: ["frameworks", "harnesses", "coding_agents", "tool_use"] },
  { name: "research", leaves: ["papers_worth_your_evening", "training_methods", "reasoning", "evaluations"] },
  { name: "infrastructure", leaves: ["serving", "inference", "cost", "scale"] },
  { name: "tools", leaves: ["what_builders_adopt", "sdks", "debugging", "observability"] },
  { name: "open_source", leaves: ["weights", "repos", "licences", "datasets"] },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section id="top" className="relative isolate overflow-hidden">
        <Hero />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 65%, transparent) 38%, transparent 72%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-center px-5 py-20 md:px-10 md:py-28">
          <p className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">Daily intelligence for AI builders</p>
          <h1 className="font-display max-w-5xl text-5xl leading-none font-medium tracking-[-0.02em] sm:text-7xl lg:text-8xl">What’s changing in AI engineering.</h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The important models, agents, research, infrastructure and tools. Researched and ranked for people who actually build with AI.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-24">
          <h2 className="font-display text-center text-4xl font-medium tracking-[-0.02em] sm:text-5xl">What you’ll get</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            Important developments, why they matter, and primary sources.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COVERAGE.map(({ name, leaves }) => (
              <div key={name} className="min-h-[11rem] border border-border bg-card p-5">
                <h3 className="font-mono text-sm font-semibold tracking-wide">{name}</h3>
                <ul className="mt-4 space-y-1.5">
                  {leaves.map((leaf, index) => (
                    <li key={leaf} className="flex gap-2 font-mono text-xs text-muted-foreground">
                      <span className="text-border">{index === leaves.length - 1 ? "└──" : "├──"}</span>
                      <span>{leaf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="advertise" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-24 md:px-10 md:py-36">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Advertising & sponsorship</p>
        <h2 className="font-display max-w-4xl text-4xl leading-tight font-medium tracking-[-0.02em] sm:text-6xl">Building for AI engineers?</h2>
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Reach an audience of AI engineers, researchers, technical founders and people building the next generation of AI systems.
        </p>
        <p className="mt-8 text-sm font-medium">Advertise in The Forward Pass</p>
        <AdvertisingForm />
      </section>

      <footer className="border-t border-border">
        <Sigil />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 text-sm sm:flex-row sm:items-end sm:justify-between md:px-10">
          <div><div className="wordmark">THE FORWARD PASS</div><a className="mt-2 block text-muted-foreground hover:text-foreground" href="https://x.com/forwardpassnews" target="_blank" rel="noreferrer">@forwardpassnews</a></div>
          <nav className="flex gap-6 text-muted-foreground" aria-label="Legal"><Link className="hover:text-foreground" href="/privacy">Privacy</Link><Link className="hover:text-foreground" href="/imprint">Imprint</Link><Link className="hover:text-foreground" href="/unsubscribe">Unsubscribe</Link></nav>
        </div>
      </footer>
    </main>
  );
}
