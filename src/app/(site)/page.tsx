import type { Metadata } from "next";
import { NewsletterForm } from "@/components/forward-pass-forms";
import { Hero } from "@/components/hero";
import { TrustBand } from "@/components/trust-band";
import { FEED_TYPES, SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationJsonLd, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "The Forward Pass: What's changing in AI engineering" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", types: FEED_TYPES },
  openGraph: {
    url: "/",
    siteName: SITE_NAME,
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

const homeJsonLd = {
  "@graph": [
    organizationJsonLd,
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": organizationJsonLd["@id"] },
    },
  ],
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd) }} />
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
        <div className="page-shell relative flex min-h-[calc(100svh-7.5rem)] flex-col justify-center pb-8 pt-28 md:pt-24">
          <h1 className="font-display whitespace-nowrap text-[1.375rem] leading-tight font-medium tracking-[-0.02em] sm:text-[2.125rem]">Your daily briefing on AI.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The news, models, papers and tools worth keeping up with. Free, AI-generated and checked against the original sources.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Daily AI-generated issues. Every fact is checked against its cited source.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <TrustBand />

      <section className="border-y border-border">
        <div className="page-shell py-20 md:py-28">
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
    </main>
  );
}
