"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSubscriptionCheckout } from "./polar";
import { onboardingEmail } from "./onboarding-session";
import { preferencesEmail } from "./preferences-session";
import { setInterests, upsertSubscriber } from "./subscribers";

const checkoutSchema = z.object({
  email: z.string().trim().email().max(254),
  interests: z.string().trim().min(10).max(500),
  plan: z.enum(["personal", "professional"]),
  billingPeriod: z.enum(["monthly", "yearly"]),
});

const interestsSchema = z.object({
  email: z.string().trim().email().max(254),
  interests: z.string().trim().min(10).max(500),
});

export async function startCheckoutAction(input: {
  email: string;
  interests: string;
  plan: string;
  billingPeriod: string;
}): Promise<{ url: string }> {
  const data = checkoutSchema.parse(input);
  const requestHeaders = await headers();
  const customerIpAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");

  await upsertSubscriber({
    email: data.email,
    interests: data.interests,
    plan: data.plan,
    status: "pending",
  });

  const url = await createSubscriptionCheckout({
    email: data.email,
    interests: data.interests,
    plan: data.plan,
    billingPeriod: data.billingPeriod,
    customerIpAddress,
  });

  return { url };
}

export async function updateInterestsAction(input: {
  email: string;
  interests: string;
}): Promise<{ success: true }> {
  const data = interestsSchema.parse(input);
  const ownerEmail = await preferencesEmail() ?? await onboardingEmail();
  if (ownerEmail !== data.email) throw new Error("This reading brief requires your signed edit link.");
  await setInterests(data.email, data.interests);
  return { success: true };
}
