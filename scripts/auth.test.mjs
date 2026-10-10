import assert from "node:assert/strict";
import { test } from "node:test";
import { AuthenticationException } from "@workos-inc/node";
import { sealData } from "iron-session";
import { loadLib } from "./support/load-ts.mjs";

const configured = {
  WORKOS_API_KEY: "test-key",
  WORKOS_CLIENT_ID: "client_test",
  WORKOS_COOKIE_PASSWORD: "s".repeat(48),
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: "http://localhost:3000/auth/callback",
  PREFERENCES_SIGNING_SECRET: "p".repeat(48),
};

test("auth destinations reject external, protocol-relative and unexpected paths", () => {
  const { authReturnPath } = loadLib("auth-config");
  for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "/auth/callback", "/preferences/../../evil", "/api/polar/webhook", "/preferences\r\nLocation: evil"]) assert.equal(authReturnPath(value), "/auth/complete");
  assert.equal(authReturnPath("/pricing?plan=personal&billing=yearly"), "/pricing?plan=personal&billing=yearly");
});

function account(existing = null, lookupError = null) {
  const calls = [];
  class Resend {
    contacts = {
      get: async (input) => { calls.push(["get", input]); return { data: existing, error: lookupError }; },
      create: async (input) => { calls.push(["create", input]); return { data: { id: "new" }, error: null }; },
      update: async (input) => { calls.push(["update", input]); return { error: null }; },
      topics: {
        list: async () => ({ data: { data: [] }, error: null }),
        update: async (input) => { calls.push(["topic", input]); return { error: null }; },
      },
      segments: {
        list: async () => ({ data: { data: [] }, error: null }),
        add: async (input) => { calls.push(["segment", input]); return { error: null }; },
      },
    };
  }
  return { ...loadLib("account-sync", { mocks: { resend: { Resend } }, env: { RESEND_API_KEY: "test" } }), calls };
}
const verified = { id: "user_123", email: "Reader@Example.com", emailVerified: true };

test("unverified accounts cannot create or subscribe a contact", async () => {
  const { syncAccount, calls } = account();
  await assert.rejects(syncAccount({ ...verified, emailVerified: false }, '{"newsletter":true}'), /Verify your email/);
  assert.equal(calls.length, 0);
});

test("account-only signup creates a reader without newsletter consent", async () => {
  const { syncAccount, calls } = account();
  await syncAccount(verified, '{"newsletter":false}');
  assert.deepEqual(calls.map(([name]) => name), ["get", "create"]);
  const input = calls[1][1];
  assert.equal(input.email, "reader@example.com");
  assert.equal(input.topics[0].subscription, "opt_out");
  assert.equal(input.segments, undefined);
});

test("sign-in preserves a reader's opt-out, paid plan, brief and trial history", async () => {
  const contact = { id: "existing", unsubscribed: true, properties: { personal_status: { value: "active" }, interests: { value: "Agent evals" }, personal_trial_ends_at: { value: "2026-09-01" } } };
  const { syncAccount, calls } = account(contact);
  await syncAccount(verified, '{"newsletter":false}');
  assert.deepEqual(calls.map(([name]) => name), ["get"]);
  assert.equal(contact.properties.personal_status.value, "active");
});

test("explicit consent can restore only the newsletter without overwriting account properties", async () => {
  const { syncAccount, calls } = account({ id: "existing", unsubscribed: true, properties: {} });
  await syncAccount(verified, '{"newsletter":true}');
  assert.deepEqual(calls.map(([name]) => name), ["get", "topic", "segment", "update"]);
  assert.equal(calls[1][1].topics[0].subscription, "opt_in");
  assert.equal(calls[3][1].properties, undefined);
});

test("provider failure does not create a duplicate reader", async () => {
  const { syncAccount, calls } = account(null, { name: "rate_limit_exceeded" });
  await assert.rejects(syncAccount(verified), /Could not load/);
  assert.deepEqual(calls.map(([name]) => name), ["get"]);
});

function authAction() {
  const urls = [];
  const lib = loadLib("auth-actions", {
    env: configured,
    mocks: {
      "@workos-inc/authkit-nextjs": {
        getSignInUrl: async (options) => { urls.push(["signin", options]); return "https://api.workos.com/user_management/authorize?provider=authkit&state=sealed&code_challenge=challenge&screen_hint=sign-in"; },
        getSignUpUrl: async (options) => { urls.push(["signup", options]); return "https://api.workos.com/user_management/authorize?provider=authkit&state=sealed&code_challenge=challenge&screen_hint=sign-up"; },
        signOut: async () => {},
      },
      "next/headers": { cookies: async () => ({ delete() {} }) },
      "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
    },
  });
  return { ...lib, urls };
}

for (const [provider, oauthProvider] of [["google", "GoogleOAuth"], ["github", "GitHubOAuth"]]) {
  test(`${provider} keeps SDK PKCE and state, and sign-in cannot opt readers into email`, async () => {
    const { beginAuthAction, urls } = authAction();
    const form = new FormData();
    form.set("provider", provider);
    form.set("mode", "signin");
    form.set("newsletter", "on");
    form.set("next", "//evil.test");
    await assert.rejects(beginAuthAction(form), { message: `redirect:https://api.workos.com/user_management/authorize?provider=${oauthProvider}&state=sealed&code_challenge=challenge` });
    assert.equal(urls[0][1].returnTo, "/auth/complete");
    assert.equal(JSON.parse(urls[0][1].state).newsletter, false);
  });
}

for (const newsletter of [false, true]) {
  test(`GitHub signup preserves the destination and newsletter consent ${newsletter}`, async () => {
    const { beginAuthAction, urls } = authAction();
    const form = new FormData();
    form.set("provider", "github");
    form.set("mode", "signup");
    form.set("next", "/pricing?plan=personal&billing=yearly");
    form.set("email", "invalid unused hint");
    if (newsletter) form.set("newsletter", "on");
    await assert.rejects(beginAuthAction(form), { message: "redirect:https://api.workos.com/user_management/authorize?provider=GitHubOAuth&state=sealed&code_challenge=challenge" });
    assert.equal(urls[0][0], "signup");
    assert.equal(urls[0][1].loginHint, undefined);
    assert.equal(urls[0][1].returnTo, "/pricing?plan=personal&billing=yearly");
    assert.equal(JSON.parse(urls[0][1].state).newsletter, newsletter);
  });
}

function authRecovery() {
  const urls = [];
  const lib = loadLib("auth-recovery", {
    env: configured,
    mocks: {
      "@workos-inc/node": { AuthenticationException },
      "@workos-inc/authkit-nextjs": {
        getSignInUrl: async (options) => { urls.push(options); return "https://forwardpass.authkit.app/verify"; },
      },
    },
  });
  return { ...lib, urls };
}

const verificationError = new AuthenticationException(403, {
  code: "email_verification_required",
  email: "reader@example.com",
  pending_authentication_token: "must-not-be-forwarded",
}, "test");
const authState = { nonce: "nonce", codeVerifier: "verifier", returnPathname: "/agents", customState: '{"newsletter":true}' };

function callbackRequest(state, cookieValue = state) {
  return {
    nextUrl: new URL(`http://localhost:3000/auth/callback?state=${encodeURIComponent(state)}`),
    cookies: { getAll: () => cookieValue ? [{ name: "wos-auth-verifier-flow", value: cookieValue }] : [] },
  };
}

test("social email verification resumes hosted AuthKit with the original destination and consent", async () => {
  const { emailVerificationUrl, urls } = authRecovery();
  const state = await sealData(authState, { password: configured.WORKOS_COOKIE_PASSWORD, ttl: 600 });
  assert.equal(await emailVerificationUrl(verificationError, callbackRequest(state)), "https://forwardpass.authkit.app/verify");
  assert.equal(urls[0].loginHint, "reader@example.com");
  assert.equal(urls[0].returnTo, "/agents");
  assert.equal(urls[0].state, '{"newsletter":true}');
  assert.ok(!JSON.stringify(urls).includes("must-not-be-forwarded"));
});

test("email verification rejects missing, mismatched, tampered and expired browser state", async () => {
  const { emailVerificationUrl, urls } = authRecovery();
  const state = await sealData(authState, { password: configured.WORKOS_COOKIE_PASSWORD, ttl: 600 });
  const invalid = await sealData({}, { password: configured.WORKOS_COOKIE_PASSWORD, ttl: 600 });
  const expired = await sealData(authState, { password: configured.WORKOS_COOKIE_PASSWORD, ttl: -120 });
  for (const request of [callbackRequest(state, null), callbackRequest(state, "different"), callbackRequest("tampered"), callbackRequest(invalid), callbackRequest(expired)]) {
    assert.equal(await emailVerificationUrl(verificationError, request), null);
  }
  assert.equal(urls.length, 0);
});

test("email verification sanitizes recovered destinations and leaves unrelated errors alone", async () => {
  const { emailVerificationUrl, urls } = authRecovery();
  const state = await sealData({ ...authState, returnPathname: "//evil.test" }, { password: configured.WORKOS_COOKIE_PASSWORD, ttl: 600 });
  const request = callbackRequest(state);
  assert.equal(await emailVerificationUrl(new Error("other callback failure"), request), null);
  await emailVerificationUrl(verificationError, request);
  assert.equal(urls[0].returnTo, "/auth/complete");
});

test("email signup forwards a normalized hint and explicit consent to the SDK", async () => {
  const { beginAuthAction, urls } = authAction();
  const form = new FormData();
  form.set("mode", "signup");
  form.set("email", " Reader@Example.com ");
  form.set("newsletter", "on");
  await assert.rejects(beginAuthAction(form), /redirect:/);
  assert.equal(urls[0][1].loginHint, "reader@example.com");
  assert.equal(JSON.parse(urls[0][1].state).newsletter, true);
});

test("a revoked WorkOS session never falls back to a different legacy identity", async () => {
  const jar = new Map([["wos-session", { value: "expired" }], ["forwardpass-preferences", { value: "legacy" }]]);
  const { preferencesEmail } = loadLib("preferences-session", {
    env: configured,
    mocks: {
      "@workos-inc/authkit-nextjs": { withAuth: async () => ({ user: null }) },
      "next/headers": { cookies: async () => ({ has: (name) => jar.has(name), get: (name) => jar.get(name) }) },
      "./preferences-token": { preferencesCookieName: "forwardpass-preferences", verifyPreferencesToken: () => ({ email: "other@example.com" }) },
    },
  });
  assert.equal(await preferencesEmail(), null);
});

test("Worker credentials use the verified WorkOS email and expire in one minute", async () => {
  const { preferencesBearer } = loadLib("preferences-session", {
    env: configured,
    mocks: {
      "@workos-inc/authkit-nextjs": { withAuth: async () => ({ user: verified }) },
      "next/headers": { cookies: async () => ({ has: () => true, get: () => undefined }) },
    },
  });
  const token = await preferencesBearer();
  const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
  assert.equal(payload.email, "reader@example.com");
  assert.ok(payload.expires > Date.now() + 59_000 && payload.expires <= Date.now() + 60_000);
});

test("checkout uses the session identity and ignores a client-supplied email", async () => {
  let checkout;
  const writes = [];
  const { startCheckoutAction } = loadLib("personal-actions", {
    mocks: {
      "./preferences-session": { preferencesEmail: async () => "owner@example.com" },
      "next/headers": { headers: async () => new Headers() },
      "./subscribers": { upsertSubscriber: async (input) => writes.push(input) },
      "./polar": { createSubscriptionCheckout: async (input) => { checkout = input; return "https://polar.sh/checkout/test"; } },
    },
    globals: { Headers },
  });
  await startCheckoutAction({ email: "victim@example.com", interests: "AI agent infrastructure", plan: "personal", billingPeriod: "monthly" });
  assert.equal(checkout.email, "owner@example.com");
  assert.equal(writes[0].email, "owner@example.com");
});

test("anonymous checkout cannot create a subscriber or payment session", async () => {
  const calls = [];
  const { startCheckoutAction } = loadLib("personal-actions", {
    mocks: {
      "./preferences-session": { preferencesEmail: async () => null },
      "next/headers": { headers: async () => new Headers() },
      "./subscribers": { upsertSubscriber: async () => calls.push("subscriber") },
      "./polar": { createSubscriptionCheckout: async () => calls.push("checkout") },
    },
  });
  await assert.rejects(startCheckoutAction({ interests: "AI agent infrastructure", plan: "personal", billingPeriod: "monthly" }), /Sign in/);
  assert.equal(calls.length, 0);
});
