export type Plan = "personal" | "professional";
export type BillingPeriod = "monthly" | "yearly";

export const PRICE_OPTIONS = {
  personal: {
    monthly: {
      usd: "$4.99",
      eur: "€5.49",
      productEnv: "POLAR_PRODUCT_PERSONAL_MONTHLY",
    },
    yearly: {
      usd: "$49.99",
      eur: "€54.99",
      productEnv: "POLAR_PRODUCT_PERSONAL_YEARLY",
    },
  },
  professional: {
    monthly: {
      usd: "$9.99",
      eur: "€10.99",
      productEnv: "POLAR_PRODUCT_PROFESSIONAL_MONTHLY",
    },
    yearly: {
      usd: "$99.99",
      eur: "€109.99",
      productEnv: "POLAR_PRODUCT_PROFESSIONAL_YEARLY",
    },
  },
} as const satisfies Record<
  Plan,
  Record<BillingPeriod, { usd: string; eur: string; productEnv: string }>
>;

export function productIdFor(
  plan: Plan,
  billingPeriod: BillingPeriod,
  environment: Record<string, string | undefined>,
): string {
  const envName = PRICE_OPTIONS[plan][billingPeriod].productEnv;
  const id = environment[envName];
  if (!id) throw new Error(`${envName} is not configured.`);
  return id;
}

export function planForProductId(
  productId: string,
  environment: Record<string, string | undefined>,
): Plan | null {
  for (const plan of ["personal", "professional"] as const) {
    for (const billingPeriod of ["monthly", "yearly"] as const) {
      const configuredId = environment[PRICE_OPTIONS[plan][billingPeriod].productEnv];
      if (configuredId && configuredId === productId) return plan;
    }
  }
  return null;
}

export function paidPlanForCustomerState(
  subscriptions: ReadonlyArray<{ productId: string; status: string }>,
  environment: Record<string, string | undefined>,
): Plan | null {
  const plans = subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => planForProductId(subscription.productId, environment));

  if (plans.includes("professional")) return "professional";
  if (plans.includes("personal")) return "personal";
  return null;
}

export function checkoutRequestFor(
  input: {
    email: string;
    interests: string;
    plan: Plan;
    billingPeriod: BillingPeriod;
    customerIpAddress?: string | null;
  },
  environment: Record<string, string | undefined>,
) {
  return {
    products: [productIdFor(input.plan, input.billingPeriod, environment)],
    customerEmail: input.email,
    externalCustomerId: input.email,
    customerIpAddress: input.customerIpAddress ?? undefined,
    metadata: {
      interests: input.interests,
      plan: input.plan,
      billing_period: input.billingPeriod,
    },
  };
}
