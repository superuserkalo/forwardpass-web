import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyLinkToken } from "../src/lib/link-token.ts";
import { loadLib } from "./support/load-ts.mjs";

const SECRET = "s".repeat(32);
process.env.PREFERENCES_SIGNING_SECRET = SECRET;

function reader({ contact, sendError = null, humanFails = false } = {}) {
  const calls = [];
  const pending = [];
  const humanChecks = [];
  class Resend {
    contacts = {
      get: async ({ email }) => {
        calls.push(["get", email]);
        return contact
          ? { data: contact, error: null }
          : { data: null, error: { name: "not_found" } };
      },
      update: async (input) => { calls.push(["update", input]); return { data: {}, error: null }; },
    };
    emails = {
      send: async (input) => { calls.push(["send", input]); return { data: {}, error: sendError }; },
    };
  }
  const lib = loadLib("signin-actions", {
    mocks: {
      resend: { Resend },
      "next/server": { after: (task) => pending.push(task()) },
      "./turnstile": {
        requireHuman: async (action, token) => {
          humanChecks.push([action, token]);
          if (humanFails) throw new Error("Verification failed. Please try again.");
        },
      },
    },
    env: { RESEND_API_KEY: "test-key", PREFERENCES_SIGNING_SECRET: SECRET },
  });
  const request = async (email, token) => {
    const result = await lib.requestSignInLinkAction(email, token);
    await Promise.all(pending);
    return result;
  };
  return { request, calls, humanChecks };
}

const sent = (calls) => calls.filter(([name]) => name === "send").map(([, input]) => input);
const tokenIn = (email) => /#token=([^"&\s]+)/.exec(email.html)?.[1] ?? "";

test("a known reader is emailed a sign-in link that proves their address", async () => {
  const { request, calls } = reader({ contact: { id: "c1", properties: {} } });
  const result = await request("  Reader@Example.com ");
  assert.equal(result.success, true);
  const [email] = sent(calls);
  assert.equal(email.to.length, 1);
  assert.equal(email.to[0], "reader@example.com");
  assert.match(email.from, /@theforwardpass\.net>$/);
  assert.equal(verifyLinkToken("signin", tokenIn(email))?.email, "reader@example.com");
  assert.ok(email.text.includes("/preferences/open#token="));
});

test("an unknown address gets the same answer and no email", async () => {
  const { request, calls } = reader({ contact: null });
  const result = await request("nobody@example.com");
  assert.equal(result.success, true);
  assert.equal(sent(calls).length, 0);
  assert.equal(calls.some(([name]) => name === "update"), false);
});

test("a second request inside the cooldown sends nothing", async () => {
  const recent = new Date(Date.now() - 30_000).toISOString();
  const { request, calls } = reader({
    contact: { id: "c1", properties: { last_link_sent_at: { value: recent } } },
  });
  assert.equal((await request("reader@example.com")).success, true);
  assert.equal(sent(calls).length, 0);
});

test("after the cooldown a new link is sent and the time is recorded", async () => {
  const old = new Date(Date.now() - 10 * 60_000).toISOString();
  const { request, calls } = reader({
    contact: { id: "c1", properties: { last_link_sent_at: { value: old } } },
  });
  await request("reader@example.com");
  assert.equal(sent(calls).length, 1);
  const update = calls.find(([name]) => name === "update")[1];
  assert.equal(update.id, "c1");
  assert.ok(Date.now() - Date.parse(update.properties.last_link_sent_at) < 5_000);
});

test("a send failure does not reveal whether the address exists", async () => {
  const { request } = reader({
    contact: { id: "c1", properties: {} },
    sendError: { message: "provider down" },
  });
  assert.equal((await request("reader@example.com")).success, true);
});

test("a malformed address is rejected before any lookup", async () => {
  const { request, calls } = reader({ contact: null });
  await assert.rejects(request("not-an-email"));
  assert.equal(calls.length, 0);
});

test("a sign-in link requires the human check before any lookup", async () => {
  const { request, humanChecks } = reader({ contact: { id: "c1", properties: {} } });
  await request("reader@example.com", "widget-token");
  assert.deepEqual(humanChecks, [["signin", "widget-token"]]);
  const blocked = reader({ contact: { id: "c1", properties: {} }, humanFails: true });
  await assert.rejects(blocked.request("reader@example.com", "bad"), /Verification failed/);
  assert.equal(blocked.calls.length, 0);
});
