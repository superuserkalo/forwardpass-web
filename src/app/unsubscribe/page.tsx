import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeForm } from "@/components/forward-pass-forms";

export const metadata: Metadata = {
  title: "The Forward Pass: Unsubscribe",
  description: "Stop receiving The Forward Pass newsletter.",
  openGraph: {
    title: "The Forward Pass: Unsubscribe",
    description: "Stop receiving The Forward Pass newsletter.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:px-10 md:py-16">
      <Link href="/" className="wordmark">THE FORWARD PASS</Link>
      <article className="legal-copy">
        <h1>Unsubscribe</h1>
        <p>Enter the email address you subscribed with. You’ll stop receiving the newsletter right away.</p>
        <UnsubscribeForm initialEmail={email} />
      </article>
    </main>
  );
}
