import { Resend } from "resend";
import { existingOnboardingResult, onboardingSchema } from "./onboarding";

export async function loadOnboardingState(email: string) {
  const { data, error } = await new Resend(
    process.env.RESEND_API_KEY,
  ).contacts.get({ email });
  if (error || !data)
    throw new Error("Could not load your reading preferences.");
  const stored = data.properties.onboarding_profile?.value;
  if (typeof stored !== "string" || !stored) return null;
  try {
    const profile = onboardingSchema.parse(JSON.parse(stored));
    const result = existingOnboardingResult(
      String(data.properties.personal_status?.value ?? ""),
      String(data.properties.personal_trial_ends_at?.value ?? ""),
    );
    return result ? { profile, result } : null;
  } catch {
    return null;
  }
}
