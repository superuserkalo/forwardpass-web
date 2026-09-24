import { Polar } from "@polar-sh/sdk";
import { checkoutRequestFor, type BillingPeriod, type Plan } from "./pricing";

export type { Plan, BillingPeriod } from "./pricing";

export function getPolar(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not configured.");
  return new Polar({ accessToken: token });
}

export async function createSubscriptionCheckout(input: {
  email: string;
  interests: string;
  plan: Plan;
  billingPeriod: BillingPeriod;
  customerIpAddress?: string | null;
}): Promise<string> {
  const polar = getPolar();
  const checkout = await polar.checkouts.create(
    checkoutRequestFor(input, process.env),
  );
  return checkout.url;
}
