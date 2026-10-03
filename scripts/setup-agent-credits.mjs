import { Polar } from "@polar-sh/sdk";
import { AGENT_CREDIT_PACK } from "../src/lib/agent-credit-policy.ts";

// Run with --apply to create the one-time product. Existing matching products are reused.
const api = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN });
const organizationId = process.env.POLAR_ORGANIZATION_ID ?? "6428471f-0561-4204-ae45-feaee0f4bda1";
let existing;
for await (const page of await api.products.list({ organizationId, limit: 100 })) {
  existing ??= page.result.items.find(product => !product.isArchived && !product.isRecurring && product.metadata.forwardpass_agent_credits === AGENT_CREDIT_PACK.credits);
}
if (existing) {
  const pricesMatch = ["usd", "eur"].every(currency => existing.prices.some(price => price.priceCurrency === currency && price.priceAmount === AGENT_CREDIT_PACK[currency] && price.taxBehavior === "exclusive"));
  if (!pricesMatch) throw new Error("Existing credit product prices do not match. Review the product before proceeding.");
  console.log(`POLAR_PRODUCT_AGENT_CREDITS=${existing.id}`);
} else if (process.argv.includes("--apply")) {
  const product = await api.products.create({
    ...(process.env.POLAR_ORGANIZATION_ID ? { organizationId: process.env.POLAR_ORGANIZATION_ID } : {}),
    name: "The Forward Pass - 1,000 Agent Credits", recurringInterval: null,
    description: "1,000 additional MCP coverage calls for an active Personal or Professional subscriber. Purchased credits carry forward. One successful tool call uses one credit; connection setup and failed calls are free.",
    metadata: { forwardpass_agent_credits: AGENT_CREDIT_PACK.credits },
    prices: ["usd", "eur"].map(currency => ({ amountType: "fixed", priceCurrency: currency, priceAmount: AGENT_CREDIT_PACK[currency], taxBehavior: "exclusive" })),
  });
  console.log(`POLAR_PRODUCT_AGENT_CREDITS=${product.id}`);
} else console.log("No credit product exists. Run with --apply to create the 1,000-credit product at $5 / €5.49.");
