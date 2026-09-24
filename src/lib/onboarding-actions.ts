"use server";

import { Resend } from "resend";
import { z } from "zod";
import { onboardingEmail } from "./onboarding-session";
import {
  onboardingSchema,
  readingBrief,
  existingOnboardingResult,
  TRIAL_DAYS,
  type ReadingProfile,
} from "./onboarding";

export async function completeOnboardingAction(
  input: ReadingProfile,
  choice: "trial" | "free",
) {
  const profile = onboardingSchema.parse(input);
  const selected = z.enum(["trial", "free"]).parse(choice);
  const email = await onboardingEmail();
  if (!email)
    throw new Error("Your signup session expired. Please sign up again.");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data: contact, error } = await resend.contacts.get({ email });
  if (error || !contact)
    throw new Error("Could not load your signup. Please try again.");
  const status = String(contact.properties.personal_status?.value ?? "");
  const previousEnd = String(
    contact.properties.personal_trial_ends_at?.value ?? "",
  );
  // Retry-safe: never restart a trial or overwrite a paid subscription.
  const previous = existingOnboardingResult(status, previousEnd);
  if (previous && previous.status !== "free") return previous;
  const trialEndsAt =
    selected === "trial"
      ? new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString()
      : null;
  const properties: Record<string, string> = {
    interests: readingBrief(profile),
    onboarding_profile: JSON.stringify(profile),
    personal_plan: "personal",
    personal_status: selected === "trial" ? "trial" : "free",
  };
  if (trialEndsAt) properties.personal_trial_ends_at = trialEndsAt;
  const { error: updateError } = await resend.contacts.update({
    id: contact.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    properties,
  });
  if (updateError)
    throw new Error("Could not save your preferences. Please try again.");
  return { status: selected, trialEndsAt };
}
