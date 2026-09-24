"use client";
import Link from "next/link";
export default function WelcomeError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <Link href="/" className="wordmark">
        THE FORWARD PASS
      </Link>
      <h1 className="onboarding-title mt-16">
        We couldn&apos;t load your preferences.
      </h1>
      <p className="mt-6 text-muted-foreground">
        Your saved draft is still in this browser. Please try again.
      </p>
      <button
        onClick={retry}
        className="mt-8 bg-primary px-6 py-4 text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
