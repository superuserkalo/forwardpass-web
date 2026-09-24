import type { Metadata } from "next";
import Link from "next/link";
import { onboardingEmail } from "@/lib/onboarding-session";
import { loadOnboardingState } from "@/lib/onboarding-state";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { NewsletterForm } from "@/components/forward-pass-forms";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Your edition | The Forward Pass",
  robots: { index: false, follow: false },
};
export default async function Welcome() {
  const email = await onboardingEmail();
  if (email)
    return (
      <OnboardingFlow email={email} saved={await loadOnboardingState(email)} />
    );
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:py-16">
      <Link href="/" className="wordmark">
        THE FORWARD PASS
      </Link>
      <div className="mt-24">
        <p className="onboarding-eyebrow">Your daily read, made personal</p>
        <h1 className="onboarding-title">Start with your inbox.</h1>
        <p className="mt-6 text-muted-foreground">
          Join The Forward Pass, then tell us what you want to read. New
          subscribers get 14 days of Personal on us. No card needed.
        </p>
        <NewsletterForm />
      </div>
      <SiteFooter />
    </main>
  );
}
