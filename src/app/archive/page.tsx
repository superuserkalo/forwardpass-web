import type { Metadata } from "next";
import Link from "next/link";
import { archiveIndex } from "@/lib/archive-client";

export const metadata: Metadata = {
  title: "Archive | The Forward Pass",
  description: "Published editions of The Forward Pass.",
};

export const dynamic = "force-dynamic";

function prettyDate(date: string): string {
  return new Intl.DateTimeFormat("en", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

export default async function ArchivePage() {
  const archive = await archiveIndex();
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-24 pt-10 md:px-10 md:pt-16">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="wordmark">THE FORWARD PASS</Link>
        <Link href="/preferences" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Reading brief</Link>
      </div>
      <div className="mt-24 border-b border-border pb-10 md:mt-32">
        <p className="onboarding-eyebrow">Published editions</p>
        <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-none md:text-7xl">The archive.</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
          Read the issues we have published. Your active plan determines how far back you can go.
        </p>
      </div>
      {!archive ? (
        <p className="py-12 text-sm text-muted-foreground">The archive is being prepared. Check back soon.</p>
      ) : archive.daily.length === 0 && archive.weekly.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">No editions have been published yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-5 text-xs text-muted-foreground">
            <span>Current access: <span className="capitalize text-foreground">{archive.tier}</span></span>
            <span>{archive.tier === "professional" ? "24 months + weekly research" : archive.tier === "personal" ? "12 months" : "6 months"}</span>
          </div>
          {archive.weekly.length > 0 && (
            <section className="mt-12" aria-labelledby="weekly-heading">
              <h2 id="weekly-heading" className="mb-5 font-[family-name:var(--font-technical)] text-xs uppercase tracking-[.18em] text-muted-foreground">Professional weekly research</h2>
              <ul>{archive.weekly.map((date) => (
                <li key={date} className="border-t border-border">
                  <Link href={`/archive/weekly/${date}`} className="flex items-baseline justify-between gap-5 py-5 hover:text-muted-foreground">
                    <span className="font-[family-name:var(--font-editorial)] text-2xl">Week ending {prettyDate(date)}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}</ul>
            </section>
          )}
          <section className="mt-12" aria-labelledby="daily-heading">
            <h2 id="daily-heading" className="mb-5 font-[family-name:var(--font-technical)] text-xs uppercase tracking-[.18em] text-muted-foreground">Daily editions</h2>
            <ul>{archive.daily.map((date) => (
              <li key={date} className="border-t border-border">
                <Link href={`/archive/daily/${date}`} className="flex items-baseline justify-between gap-5 py-5 hover:text-muted-foreground">
                  <span className="font-[family-name:var(--font-editorial)] text-2xl">{prettyDate(date)}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}</ul>
          </section>
        </>
      )}
    </main>
  );
}
