import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { UnsubscribeForm } from "@/components/forward-pass-forms";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving The Forward Pass newsletter.",
  robots: { index: false, follow: false },
};

export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:px-10 md:py-16">
      <Link href="/" className="wordmark">THE FORWARD PASS</Link>
      <article className="legal-copy">
        <h1>Unsubscribe</h1>
        <p>
          {token
            ? "Confirm below and you’ll stop receiving the newsletter right away."
            : "Enter the email address you subscribed with. We’ll email you a link to confirm, so nobody else can unsubscribe you."}
        </p>
        <UnsubscribeForm initialEmail={email} token={token} />
      </article>
      <SiteFooter />
    </main>
  );
}
