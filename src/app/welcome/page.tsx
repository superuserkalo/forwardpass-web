import type { Metadata } from "next";
import { preferencesEmail } from "@/lib/preferences-session";
import { loadOnboardingState } from "@/lib/onboarding-state";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { NewsletterForm } from "@/components/forward-pass-forms";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Your edition",
  robots: { index: false, follow: false },
};
export default async function Welcome() {
  const email = await preferencesEmail();
  if (email)
    return (
      <OnboardingFlow email={email} saved={await loadOnboardingState(email)} />
    );
  return (
    <>
    <SiteHeader />
    <main className="page-shell min-h-[70vh] pb-24 pt-32 md:pb-36 md:pt-44">
      <div className="max-w-2xl">
        <p className="onboarding-eyebrow">Your daily read, made personal</p>
        <h1 className="onboarding-title">Start with your inbox.</h1>
        <p className="mt-6 text-muted-foreground">
          Join The Forward Pass, confirm your email, then tell us what you want
          to read. New subscribers get 14 days of Personal on us. No card needed.
        </p>
        <NewsletterForm />
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
