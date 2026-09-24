import type { Metadata } from "next";
import Link from "next/link";
import { Resend } from "resend";
import { InterestsEditor } from "@/components/personal-signup";
import { SiteFooter } from "@/components/site-footer";
import { onboardingEmail } from "@/lib/onboarding-session";
import { preferencesEmail } from "@/lib/preferences-session";

export const metadata: Metadata = {
  title: "Your reading brief | The Forward Pass",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Preferences() {
  const email = await preferencesEmail() ?? await onboardingEmail();
  let interests = "";
  if (email) {
    const key = process.env.RESEND_API_KEY;
    if (key) {
      const { data } = await new Resend(key).contacts.get({ email });
      const stored = data?.properties.interests?.value;
      if (typeof stored === "string") interests = stored;
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:py-16">
      <Link href="/" className="wordmark">THE FORWARD PASS</Link>
      <div className="mt-24">
        <p className="onboarding-eyebrow">Your edition</p>
        <h1 className="onboarding-title">Your reading brief.</h1>
        {email ? (
          <>
            <p className="mt-6 mb-8 text-muted-foreground">Update the topics you want us to follow for {email}.</p>
            <InterestsEditor email={email} initialInterests={interests} />
          </>
        ) : (
          <p className="mt-6 text-muted-foreground">Open the edit link in your latest Forward Pass email. If it has expired, the next issue will include a fresh link.</p>
        )}
        <p className="mt-8 text-sm text-muted-foreground">Manage a paid subscription in the <a className="underline" href="https://polar.sh/the-forward-pass/portal">Polar billing portal</a>.</p>
      </div>
      <SiteFooter />
    </main>
  );
}
