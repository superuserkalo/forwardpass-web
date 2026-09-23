import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdvertisingForm, NewsletterForm } from "@/components/forward-pass-forms";
import { Hero } from "@/components/hero";

export const metadata: Metadata = {
  title: "The Forward Pass — What's changing in AI engineering",
  description: "A daily intelligence newsletter for people who build with AI.",
  openGraph: {
    title: "The Forward Pass",
    description: "What's changing in AI engineering.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

const COVERAGE: Array<[string, string]> = [
  ["Models", "Releases, benchmarks, capability shifts."],
  ["Agents", "Frameworks, harnesses, coding agents."],
  ["Research", "Papers worth your evening."],
  ["Infrastructure", "Serving, inference, cost, scale."],
  ["Tools", "What builders actually adopt."],
  ["Open Source", "Weights, repos, licences."],
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-7 md:px-10 md:py-9">
        <a href="#top" className="flex items-center gap-3" aria-label="The Forward Pass home">
          <Image src="/logo.png" alt="The Forward Pass logo" width={28} height={28} className="size-7" priority />
          <span className="wordmark">THE FORWARD PASS</span>
        </a>
        <Link href="#advertise" className="text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">Collaborate</Link>
      </header>

      <section id="top" className="relative isolate overflow-hidden">
        <Hero />
        <div className="relative mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-center px-5 py-20 md:px-10 md:py-28">
          <p className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">Daily intelligence for AI builders</p>
          <h1 className="max-w-5xl text-5xl leading-none font-medium sm:text-7xl lg:text-8xl">What’s changing in AI engineering.</h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The important models, agents, research, infrastructure and tools. Researched and ranked for people who actually build with AI.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
          <h2 className="text-sm font-medium uppercase tracking-widest">What you’ll get</h2>
          <ul className="mt-12 border-t border-border">
            {COVERAGE.map(([item, note]) => (
              <li key={item} className="flex flex-col gap-1 border-b border-border py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="w-56 shrink-0 text-xl sm:text-2xl">{item}</span>
                <span className="text-sm text-muted-foreground">{note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
            Important developments. Why they matter. Primary sources.
          </p>
        </div>
      </section>

      <section id="advertise" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-24 md:px-10 md:py-36">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Advertising & sponsorship</p>
        <h2 className="max-w-4xl text-4xl leading-tight font-medium sm:text-6xl">Building for AI engineers?</h2>
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Reach an audience of AI engineers, researchers, technical founders and people building the next generation of AI systems.
        </p>
        <p className="mt-8 text-sm font-medium">Advertise in The Forward Pass</p>
        <AdvertisingForm />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 text-sm sm:flex-row sm:items-end sm:justify-between md:px-10">
          <div><div className="wordmark">THE FORWARD PASS</div><a className="mt-2 block text-muted-foreground hover:text-foreground" href="https://x.com/forwardpassnews" target="_blank" rel="noreferrer">@forwardpassnews</a></div>
          <nav className="flex gap-6 text-muted-foreground" aria-label="Legal"><Link className="hover:text-foreground" href="/privacy">Privacy</Link><Link className="hover:text-foreground" href="/imprint">Imprint</Link><Link className="hover:text-foreground" href="/unsubscribe">Unsubscribe</Link></nav>
        </div>
      </footer>
    </main>
  );
}
