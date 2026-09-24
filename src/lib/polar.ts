import { Polar } from "@polar-sh/sdk";

export type Plan = "personal" | "professional";

export const PLANS: Record<Plan, { productEnv: string; label: string }> = {
  personal: { productEnv: "POLAR_PRODUCT_PERSONAL", label: "Personal" },
  professional: {
    productEnv: "POLAR_PRODUCT_PROFESSIONAL",
    label: "Professional",
  },
};

export function getPolar(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not configured.");
  return new Polar({ accessToken: token });
}

function productIdFor(plan: Plan): string {
  const id = process.env[PLANS[plan].productEnv];
  if (!id) throw new Error(`${PLANS[plan].productEnv} is not configured.`);
  return id;
}

export async function createSubscriptionCheckout(input: {
  email: string;
  interests: string;
  plan: Plan;
  customerIpAddress?: string | null;
}): Promise<string> {
  const polar = getPolar();
  const checkout = await polar.checkouts.create({
    products: [productIdFor(input.plan)],
    customerEmail: input.email,
    externalCustomerId: input.email,
    customerIpAddress: input.customerIpAddress ?? undefined,
    metadata: {
      interests: input.interests,
      plan: input.plan,
    },
  });
  return checkout.url;
}
