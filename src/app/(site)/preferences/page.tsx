import type { Metadata } from "next";
import Link from "next/link";
import { Resend } from "resend";
import { SignInForm } from "@/components/forward-pass-forms";
import { InterestsEditor } from "@/components/personal-signup";
import { preferencesEmail } from "@/lib/preferences-session";
import { ChatDeliveryPanel } from "@/components/chat-delivery";
import { loadChatSettings } from "@/lib/chat-client";

export const metadata: Metadata = {
  title: "Your reading brief",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Preferences() {
  const email = await preferencesEmail();
  const delivery = email ? await loadChatSettings() : null;
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
    <main className="page-shell min-h-[70vh] pb-24 pt-32 md:pb-36 md:pt-44">
      <div className="max-w-2xl">
        <p className="onboarding-eyebrow">Your edition</p>
        <h1 className="onboarding-title">Your reading brief.</h1>
        {email ? (
          <>
            <p className="mt-6 mb-8 text-muted-foreground">Update the topics you want us to follow for {email}.</p>
            <InterestsEditor email={email} initialInterests={interests} />
            {delivery && <ChatDeliveryPanel initial={delivery} />}
            <p className="mt-8 text-sm text-muted-foreground">The Personal trial and both paid plans include <Link href="/agents" className="text-foreground underline underline-offset-4">agent access via MCP</Link>. Create or revoke a key to connect your agents.</p>
          </>
        ) : (
          <>
            <p className="mt-6 text-muted-foreground">Enter your email and we’ll send you a link to open your reading brief on this device.</p>
            <SignInForm />
          </>
        )}
        <p className="mt-8 text-sm text-muted-foreground">Manage a paid subscription in the <a className="underline" href="https://polar.sh/the-forward-pass/portal">Polar billing portal</a>.</p>
      </div>
    </main>
  );
}
