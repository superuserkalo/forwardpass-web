import Link from "next/link";

export default function ArchiveLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-24 pt-10 md:px-10 md:pt-16" aria-busy="true">
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
      <p className="border-b border-border py-5 text-xs text-muted-foreground" role="status">Loading available editions…</p>
    </main>
  );
}
