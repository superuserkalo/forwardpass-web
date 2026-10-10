import { redirect } from "next/navigation";
import { preferencesEmail } from "@/lib/preferences-session";
import { loadOnboardingState } from "@/lib/onboarding-state";

export async function GET() {
  const email = await preferencesEmail();
  if (!email) redirect("/signin");
  redirect(await loadOnboardingState(email) ? "/preferences" : "/welcome");
}
