import { createHmac } from "node:crypto";
import type { Order } from "@polar-sh/sdk/models/components/order";
import { getPolar } from "./polar";
import { paidPlanForCustomerState } from "./pricing";
import type { AgentCreditCurrency } from "./agent-credit-policy";

export async function createAgentCreditCheckout(email: string, currency: AgentCreditCurrency): Promise<string> {
  const product = process.env.POLAR_PRODUCT_AGENT_CREDITS;
  const base = process.env.PUBLIC_SITE_URL ?? "https://theforwardpass.net";
  if (!product) throw new Error("Credit top-ups are not configured.");
  const api = getPolar();
  const customer = await api.customers.getStateExternal({ externalId: email });
  if (customer.email?.toLowerCase() !== email.toLowerCase() || !paidPlanForCustomerState(customer.activeSubscriptions, process.env)) throw new Error("An active paid subscription is required.");
  const checkout = await api.checkouts.create({
    products: [product], customerId: customer.id, currency, allowDiscountCodes: false,
    successUrl: new URL("/agents?topup=complete", base).toString(),
  });
  return checkout.url;
}

export function agentCreditPayment(order: Pick<Order, "id" | "customerId" | "customer" | "productId" | "paid" | "netAmount" | "refundedAmount" | "currency" | "metadata">) {
  if (!process.env.POLAR_PRODUCT_AGENT_CREDITS || order.productId !== process.env.POLAR_PRODUCT_AGENT_CREDITS) return null;
  if (order.currency !== "usd" && order.currency !== "eur") throw new Error("Unsupported credit currency.");
  if (!order.customer.email || order.netAmount <= 0) throw new Error("Invalid credit order.");
  const attempt = order.metadata.forwardpass_agent_refill;
  return {
    orderId: order.id, email: order.customer.email.toLowerCase(), customerId: order.customerId, productId: order.productId,
    paid: order.paid, netAmount: order.netAmount, refundedAmount: order.refundedAmount, currency: order.currency,
    automaticAttempt: typeof attempt === "string" ? attempt : null,
  };
}

/** Credit fulfillment is driven by canonical paid orders, never checkout redirects or client metadata. */
export async function reconcileAgentCreditOrder(id: string): Promise<void> {
  const order = await getPolar().orders.get({ id });
  const payment = agentCreditPayment(order);
  if (!payment) return;
  const secret = process.env.PREFERENCES_SIGNING_SECRET;
  const configured = process.env.FORWARDPASS_AGENT_URL;
  if (!secret || secret.length < 32 || !configured) throw new Error("Credit fulfillment is not configured.");
  const base = new URL(configured);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) throw new Error("Credit fulfillment requires HTTPS.");
  const body = JSON.stringify(payment);
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", secret).update(`agent-credit-payment:${timestamp}:${body}`).digest("hex");
  const response = await fetch(new URL("/agent-credit-payment", base), {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000), body,
    headers: { "Content-Type": "application/json", "x-forwardpass-signature": signature, "x-forwardpass-timestamp": timestamp },
  });
  if (!response.ok) throw new Error("Credit fulfillment unavailable. Retry the webhook.");
}
