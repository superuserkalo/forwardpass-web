import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
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
    <LegalPage
      eyebrow="Newsletter"
      title="Unsubscribe"
      lede={
        <p>
          {token
            ? "Confirm below and you’ll stop receiving the newsletter right away."
            : "Enter the email address you subscribed with. We’ll email you a link to confirm, so nobody else can unsubscribe you."}
        </p>
      }
    >
      <UnsubscribeForm initialEmail={email} token={token} />
    </LegalPage>
  );
}
