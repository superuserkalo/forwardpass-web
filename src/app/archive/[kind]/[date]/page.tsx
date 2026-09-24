import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { archiveEntry } from "@/lib/archive-client";

type Params = Promise<{ kind: string; date: string }>;

export const metadata: Metadata = {
  title: "Published edition | The Forward Pass",
  robots: { index: false, follow: false },
};

export default async function EditionPage({ params }: { params: Params }) {
  const { kind, date } = await params;
  if (kind !== "daily" && kind !== "weekly") notFound();
  const edition = await archiveEntry(kind, date);
  if (edition?.status === 404 || edition?.status === 400) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-10 md:px-10 md:pt-16">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="wordmark">THE FORWARD PASS</Link>
        <Link href="/archive" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">All editions</Link>
      </div>
      <div className="mt-24 border-b border-border pb-8 md:mt-32">
        <p className="onboarding-eyebrow">{kind === "weekly" ? "Professional weekly research" : "Daily edition"} · {date}</p>
        <h1 className="font-[family-name:var(--font-editorial)] text-4xl md:text-5xl">{kind === "weekly" ? "This week in depth." : "Today’s forward pass."}</h1>
      </div>
      {!edition || edition.status === 503 ? (
        <p className="py-12 text-sm text-muted-foreground">This edition is temporarily unavailable. Please try again later.</p>
      ) : edition.status === 403 ? (
        <div className="py-12 text-sm leading-7 text-muted-foreground">
          <p>This edition is outside your current archive access. Open the link in your latest email to restore your reading session, or see the <Link href="/#pricing" className="text-foreground underline underline-offset-4">plans</Link>.</p>
        </div>
      ) : edition.status === 200 ? (
        <article className="archive-copy py-12"><ReactMarkdown>{edition.text}</ReactMarkdown></article>
      ) : (
        <p className="py-12 text-sm text-muted-foreground">This edition is temporarily unavailable. Please try again later.</p>
      )}
    </main>
  );
}
