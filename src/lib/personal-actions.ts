"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSubscriptionCheckout, type Plan } from "./polar";
import { setInterests, upsertSubscriber } from "./subscribers";

const checkoutSchema = z.object({
  email: z.string().trim().email().max(254),
  interests: z.string().trim().min(10).max(500),
  plan: z.enum(["personal", "professional"]),
});

const interestsSchema = z.object({
  email: z.string().trim().email().max(254),
  interests: z.string().trim().min(10).max(500),
});

export async function startCheckoutAction(input: {
  email: string;
  interests: string;
  plan: string;
}): Promise<{ url: string }> {
  const data = checkoutSchema.parse(input);
  const requestHeaders = await headers();
  const customerIpAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");

  await upsertSubscriber({
    email: data.email,
    interests: data.interests,
    plan: data.plan as Plan,
    status: "pending",
  });

  const url = await createSubscriptionCheckout({
    email: data.email,
    interests: data.interests,
    plan: data.plan,
    customerIpAddress,
  });

  return { url };
}

export async function updateInterestsAction(input: {
  email: string;
  interests: string;
}): Promise<{ success: true }> {
  const data = interestsSchema.parse(input);
  await setInterests(data.email, data.interests);
  return { success: true };
}
