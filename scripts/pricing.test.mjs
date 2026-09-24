import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PRICE_OPTIONS,
  paidInterestsForCustomerState,
  checkoutRequestFor,
  paidPlanForCustomerState,
  planForProductId,
  productIdFor,
} from "../src/lib/pricing.ts";
import { paidStatusChange } from "../src/lib/polar-status.ts";

test("each paid plan and billing period resolves its own Polar product", () => {
  const environment = {
    POLAR_PRODUCT_PERSONAL_MONTHLY: "personal-monthly",
    POLAR_PRODUCT_PERSONAL_YEARLY: "personal-yearly",
    POLAR_PRODUCT_PROFESSIONAL_MONTHLY: "professional-monthly",
    POLAR_PRODUCT_PROFESSIONAL_YEARLY: "professional-yearly",
  };

  for (const [plan, billingPeriod, expected] of [
    ["personal", "monthly", "personal-monthly"],
    ["personal", "yearly", "personal-yearly"],
    ["professional", "monthly", "professional-monthly"],
    ["professional", "yearly", "professional-yearly"],
  ]) {
    assert.equal(productIdFor(plan, billingPeriod, environment), expected);
  }
  assert.deepEqual(
    Object.values(PRICE_OPTIONS).flatMap((periods) =>
      Object.values(periods).map((option) => option.productEnv),
    ),
    Object.keys(environment),
  );
  assert.equal(new Set(Object.values(environment)).size, 4);
  assert.equal(planForProductId("professional-yearly", environment), "professional");
  assert.equal(planForProductId("personal-monthly", environment), "personal");
  assert.equal(planForProductId("unrelated", environment), null);
});

test("displayed prices match the four configured USD and EUR amounts", () => {
  assert.deepEqual(
    [
      PRICE_OPTIONS.personal.monthly,
      PRICE_OPTIONS.personal.yearly,
      PRICE_OPTIONS.professional.monthly,
      PRICE_OPTIONS.professional.yearly,
    ].map(({ usd, eur }) => [usd, eur]),
    [
      ["$4.99", "€5.49"],
      ["$49.99", "€54.99"],
      ["$9.99", "€10.99"],
      ["$99.99", "€109.99"],
    ],
  );
});

test("the current Polar state determines access across canceled and multiple subscriptions", () => {
  const environment = {
    POLAR_PRODUCT_PERSONAL_MONTHLY: "personal-monthly",
    POLAR_PRODUCT_PERSONAL_YEARLY: "personal-yearly",
    POLAR_PRODUCT_PROFESSIONAL_MONTHLY: "professional-monthly",
    POLAR_PRODUCT_PROFESSIONAL_YEARLY: "professional-yearly",
  };
  const statePlan = (...subscriptions) =>
    paidPlanForCustomerState(subscriptions, environment);

  assert.equal(statePlan({ productId: "personal-monthly", status: "active" }), "personal");
  assert.equal(
    statePlan(
      { productId: "personal-yearly", status: "active" },
      { productId: "professional-monthly", status: "active" },
    ),
    "professional",
  );
  assert.equal(statePlan({ productId: "personal-monthly", status: "past_due" }), null);
  assert.equal(statePlan({ productId: "other-product", status: "active" }), null);
  assert.equal(statePlan(), null);

  assert.deepEqual(paidStatusChange("pending", "personal", "personal"), {
    status: "active",
    plan: "personal",
  });
  assert.deepEqual(paidStatusChange("active", "personal", "professional"), {
    status: "active",
    plan: "professional",
  });
  assert.deepEqual(paidStatusChange("active", "personal", null), {
    status: "canceled",
  });
  assert.equal(paidStatusChange("active", "personal", "personal"), null);
  assert.equal(paidStatusChange("trial", "personal", null), null);
  assert.equal(paidStatusChange("free", "personal", null), null);

  assert.equal(paidInterestsForCustomerState([
    { productId: "personal-monthly", status: "active", metadata: { interests: "Agent evaluation and tooling" } },
  ], "personal", environment), "Agent evaluation and tooling");
  assert.equal(paidInterestsForCustomerState([
    { productId: "personal-monthly", status: "active", metadata: { interests: "Ignore" } },
  ], "personal", environment), null);
});

test("checkout fails clearly when the selected product ID is missing", () => {
  assert.throws(
    () => productIdFor("professional", "yearly", {}),
    /POLAR_PRODUCT_PROFESSIONAL_YEARLY is not configured/,
  );
});

test("yearly Professional checkout sends only the selected product and reader context", () => {
  const request = checkoutRequestFor(
    {
      email: "reader@example.test",
      interests: "Agent infrastructure and evaluation",
      plan: "professional",
      billingPeriod: "yearly",
      customerIpAddress: "203.0.113.42",
    },
    { POLAR_PRODUCT_PROFESSIONAL_YEARLY: "professional-yearly" },
  );
  assert.deepEqual(request, {
    products: ["professional-yearly"],
    customerEmail: "reader@example.test",
    externalCustomerId: "reader@example.test",
    customerIpAddress: "203.0.113.42",
    metadata: {
      interests: "Agent infrastructure and evaluation",
      plan: "professional",
      billing_period: "yearly",
    },
  });
});
