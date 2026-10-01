import assert from "node:assert/strict";
import { test } from "node:test";
import { loadLib } from "./support/load-ts.mjs";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const GENERIC = /Verification failed\. Please try again\./;

function verifier({ result, networkError = false, ok = true, env = {}, ip = "203.0.113.9, 10.0.0.1" } = {}) {
  const requests = [];
  const lib = loadLib("turnstile", {
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://theforwardpass.net",
      TURNSTILE_SECRET_KEY: "real-secret",
      ...env,
    },
    mocks: { "next/headers": { headers: async () => new Headers({ "x-forwarded-for": ip }) } },
    globals: {
      Headers,
      fetch: async (url, init) => {
        requests.push({ url, body: Object.fromEntries(init.body) });
        if (networkError) throw new Error("network down");
        return { ok, json: async () => result };
      },
    },
  });
  return { requireHuman: lib.requireHuman, requests };
}

const pass = (overrides = {}) => ({
  success: true,
  action: "signup",
  hostname: "theforwardpass.net",
  ...overrides,
});

test("a valid token for the right action and site passes, and Cloudflare sees the visitor's IP", async () => {
  const { requireHuman, requests } = verifier({ result: pass() });
  await requireHuman("signup", "token-123");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, VERIFY_URL);
  assert.equal(requests[0].body.secret, "real-secret");
  assert.equal(requests[0].body.response, "token-123");
  assert.equal(requests[0].body.remoteip, "203.0.113.9");
});

test("the www host is accepted too", async () => {
  const { requireHuman } = verifier({ result: pass({ hostname: "www.theforwardpass.net" }) });
  await requireHuman("signup", "token-123");
});

test("the canonical host is accepted even if NEXT_PUBLIC_SITE_URL is unset or wrong", async () => {
  for (const env of [{ NEXT_PUBLIC_SITE_URL: "" }, { NEXT_PUBLIC_SITE_URL: "https://preview-abc.vercel.app" }]) {
    const { requireHuman } = verifier({ result: pass(), env });
    await requireHuman("signup", "token-123");
  }
});

test("a failed challenge is rejected with a generic message", async () => {
  const { requireHuman } = verifier({ result: { success: false, "error-codes": ["timeout-or-duplicate"] } });
  await assert.rejects(requireHuman("signup", "token-123"), GENERIC);
});

test("a token minted for another form is rejected", async () => {
  const { requireHuman } = verifier({ result: pass({ action: "signin" }) });
  await assert.rejects(requireHuman("signup", "token-123"), GENERIC);
});

test("a token minted on another site is rejected", async () => {
  const { requireHuman } = verifier({ result: pass({ hostname: "evil.example" }) });
  await assert.rejects(requireHuman("signup", "token-123"), GENERIC);
  const local = verifier({ result: pass({ hostname: "localhost" }) });
  await assert.rejects(local.requireHuman("signup", "token-123"), GENERIC);
});

test("a missing, empty or oversized token never reaches Cloudflare", async () => {
  const { requireHuman, requests } = verifier({ result: pass() });
  await assert.rejects(requireHuman("signup", ""), GENERIC);
  await assert.rejects(requireHuman("signup", undefined), GENERIC);
  await assert.rejects(requireHuman("signup", "x".repeat(2049)), GENERIC);
  assert.equal(requests.length, 0);
});

test("without a configured secret every request fails closed", async () => {
  const { requireHuman, requests } = verifier({ result: pass(), env: { TURNSTILE_SECRET_KEY: "" } });
  await assert.rejects(requireHuman("signup", "token-123"), GENERIC);
  assert.equal(requests.length, 0);
});

test("a Cloudflare outage fails closed", async () => {
  await assert.rejects(verifier({ result: pass(), networkError: true }).requireHuman("signup", "t"), GENERIC);
  await assert.rejects(verifier({ result: pass(), ok: false }).requireHuman("signup", "t"), GENERIC);
});

test("local development accepts Cloudflare's test keys, which report a placeholder host", async () => {
  const { requireHuman } = verifier({
    result: { success: true, hostname: "example.com" },
    env: { NODE_ENV: "development", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" },
  });
  await requireHuman("signup", "XXXX.DUMMY.TOKEN.XXXX");
});
