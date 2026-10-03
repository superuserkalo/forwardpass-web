import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { loadLib } from "./support/load-ts.mjs";

const PRODUCT = "22222222-2222-4222-8222-222222222222";
const ORDER = "11111111-1111-4111-8111-111111111111";
const env = { POLAR_PRODUCT_AGENT_CREDITS: PRODUCT, POLAR_PRODUCT_PERSONAL_MONTHLY: "personal", PUBLIC_SITE_URL: "https://site.example", FORWARDPASS_AGENT_URL: "https://worker.example", PREFERENCES_SIGNING_SECRET: "credit-tests-only-secret".repeat(3) };
const order = { id: ORDER, customerId: ORDER, customer: { email: "reader@example.test" }, productId: PRODUCT, paid: true, netAmount: 500, refundedAmount: 0, currency: "usd", metadata: {} };

test("top-ups attach to the authenticated paid customer and never trust a checkout redirect to grant credits", async () => {
  const calls = [];
  const state = { id: ORDER, email: "reader@example.test", activeSubscriptions: [{ productId: "personal", status: "active" }] };
  const api = { customers: { getStateExternal: async () => state }, checkouts: { create: async (input) => { calls.push(input); return { url: "https://checkout.example" }; } } };
  const billing = loadLib("agent-billing", { env, mocks: { "./polar": { getPolar: () => api } } });
  assert.equal(await billing.createAgentCreditCheckout("reader@example.test", "eur"), "https://checkout.example");
  assert.equal(calls[0].customerId, ORDER);
  assert.equal(calls[0].products[0], PRODUCT);
  assert.equal(calls[0].currency, "eur");
  assert.equal(calls[0].allowDiscountCodes, false);
  state.activeSubscriptions = [];
  await assert.rejects(() => billing.createAgentCreditCheckout("reader@example.test", "usd"));
  state.activeSubscriptions = [{ productId: "personal", status: "active" }];
  await assert.rejects(() => billing.createAgentCreditCheckout("attacker@example.test", "usd"));
  assert.equal(calls.length, 1);
});

test("paid order reconciliation uses canonical order data and signs the exact payload for Cloudflare", async () => {
  let fulfilled;
  const api = { orders: { get: async ({ id }) => { assert.equal(id, ORDER); return order; } } };
  const billing = loadLib("agent-billing", { env, mocks: { "./polar": { getPolar: () => api } }, globals: { fetch: async (url, init) => { fulfilled = { url, init }; return { ok: true }; } } });
  await billing.reconcileAgentCreditOrder(ORDER);
  assert.equal(fulfilled.url.toString(), "https://worker.example/agent-credit-payment");
  const timestamp = fulfilled.init.headers["x-forwardpass-timestamp"];
  const expected = createHmac("sha256", env.PREFERENCES_SIGNING_SECRET).update(`agent-credit-payment:${timestamp}:${fulfilled.init.body}`).digest("hex");
  assert.equal(fulfilled.init.headers["x-forwardpass-signature"], expected);
  assert.equal(JSON.parse(fulfilled.init.body).orderId, ORDER);
  assert.equal(billing.agentCreditPayment({ ...order, productId: ORDER }), null);
  assert.equal(billing.agentCreditPayment({ ...order, refundedAmount: 250 }).refundedAmount, 250);
});

test("a fulfillment outage fails the webhook reconciliation so Polar retries rather than losing paid credits", async () => {
  const billing = loadLib("agent-billing", { env, mocks: { "./polar": { getPolar: () => ({ orders: { get: async () => order } }) } }, globals: { fetch: async () => ({ ok: false }) } });
  await assert.rejects(() => billing.reconcileAgentCreditOrder(ORDER), /Retry the webhook/);
});

test("agent credentials cannot buy credits or enable auto-refill without a human session", async () => {
  let calls = 0;
  const actions = loadLib("agent-actions", { mocks: {
    "./preferences-session": { preferencesEmail: async () => null },
    "./agent-client": { requestAgentAccess: async () => { calls++; } },
    "./agent-billing": { createAgentCreditCheckout: async () => { calls++; } },
  } });
  assert.ok((await actions.buyAgentCreditsAction("usd")).error);
  assert.ok((await actions.updateAgentRefillAction({ enabled: true, currency: "usd", maxPacksPerMonth: 2 })).error);
  assert.equal(calls, 0);
});

test("trial readers cannot open a credit checkout even by calling the server action directly", async () => {
  let checkouts = 0;
  const actions = loadLib("agent-actions", { mocks: {
    "./preferences-session": { preferencesEmail: async () => "trial@example.test" },
    "./agent-client": { requestAgentAccess: async () => ({ access: { topUpAvailable: false, credits: { trialEndsAt: "2099-01-01T00:00:00.000Z" } } }) },
    "./agent-billing": { createAgentCreditCheckout: async () => { checkouts++; return "https://checkout.example"; } },
  } });
  assert.ok((await actions.buyAgentCreditsAction("usd")).error);
  assert.equal(checkouts, 0);
});
