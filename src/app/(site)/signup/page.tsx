import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { preferencesEmail } from "@/lib/preferences-session";
import { authReturnPath } from "@/lib/auth-config";

export const metadata: Metadata = { title: "Create your account", robots: { index: false, follow: false } };

export default async function SignUp({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = authReturnPath(params.next);
  if (await preferencesEmail()) redirect(next);
  return <main className="page-shell min-h-[80vh] pb-24 pt-32 md:pt-44"><div className="mx-auto max-w-md"><p className="onboarding-eyebrow">The Forward Pass</p><h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">Create your account.</h1><p className="mt-4 leading-7 text-muted-foreground">Track what matters in AI. Start a free Personal trial when you set up your reading brief.</p><AccountForm mode="signup" next={next} error={params.error} /></div></main>;
}
