import assert from "node:assert/strict";
import { test } from "node:test";
import { createLinkToken, verifyLinkToken } from "../src/lib/link-token.ts";
import { loadLib } from "./support/load-ts.mjs";

const SECRET = "s".repeat(32);
process.env.PREFERENCES_SIGNING_SECRET = SECRET;
const NEWSLETTER_SEGMENT = "2ec79559-e5f2-4a84-887b-5cee315656a3";
const NEWSLETTER_TOPIC = "418f8071-0c80-4e3f-a076-b21ccfd40318";

function signup(existing, { lookupError = null, segments = [], topics = [], humanFails = false } = {}) {
  const calls = [];
  const pending = [];
  const humanChecks = [];
  class Resend {
    contacts = {
      get: async (input) => {
        calls.push(["get", input]);
        return { data: existing, error: lookupError };
      },
      create: async (input) => { calls.push(["create", input]); return { data: { id: "new-contact" }, error: null }; },
      update: async (input) => { calls.push(["update", input]); return { data: {}, error: null }; },
      segments: {
        list: async () => ({ data: { data: segments.map((id) => ({ id })) } }),
        add: async (input) => { calls.push(["segment-add", input]); return {}; },
        remove: async (input) => { calls.push(["segment-remove", input]); return {}; },
      },
      topics: {
        list: async () => ({ data: { data: topics } }),
        update: async (input) => { calls.push(["topic-update", input]); return {}; },
      },
    };
    emails = {
      send: async (input) => { calls.push(["send", input]); return { data: {}, error: null }; },
    };
  }
  const lib = loadLib("forward-pass", {
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
  const settled = (action) => async (...args) => {
    const result = await action(...args);
    await Promise.all(pending);
    return result;
  };
  return {
    submit: settled(lib.subscribeAction),
    requestUnsubscribe: settled(lib.requestUnsubscribeLinkAction),
    unsubscribe: settled(lib.unsubscribeAction),
    calls,
    humanChecks,
  };
}

const names = (calls) => calls.map(([name]) => name);
const emails = (calls) => calls.filter(([name]) => name === "send").map(([, input]) => input);
const tokenIn = (email) => /(?:#|\?)token=([^"&\s]+)/.exec(email.html)?.[1] ?? "";
const registered = { segments: [NEWSLETTER_SEGMENT], topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_in" }] };

test("a new address creates a contact and is emailed a link to confirm it", async () => {
  const { submit, calls } = signup(null, { lookupError: { name: "not_found" } });
  const result = await submit("  New@Example.com ");
  assert.equal(result.success, true);
  const create = calls.find(([name]) => name === "create")[1];
  assert.equal(create.email, "new@example.com");
  assert.equal(create.topics[0].subscription, "opt_in");
  const [email] = emails(calls);
  assert.equal(email.to[0], "new@example.com");
  assert.equal(verifyLinkToken("verify", tokenIn(email))?.email, "new@example.com");
  assert.equal(verifyLinkToken("signin", tokenIn(email)), null);
});

test("an already registered address gets the same answer and a sign-in link, with no writes", async () => {
  const fresh = signup(null, { lookupError: { name: "not_found" } });
  const freshResult = await fresh.submit("new@example.com");
  const { submit, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, registered);
  const result = await submit("  Reader@Example.com  ");
  assert.equal(JSON.stringify(result), JSON.stringify(freshResult));
  assert.equal(JSON.stringify(result), JSON.stringify({ success: true }));
  assert.equal(calls[0][1].email, "reader@example.com");
  assert.deepEqual(names(calls).filter((name) => !["get", "update", "send"].includes(name)), []);
  const [email] = emails(calls);
  assert.equal(email.to[0], "reader@example.com");
  assert.equal(verifyLinkToken("signin", tokenIn(email))?.email, "reader@example.com");
});

test("repeat signups for the same address are throttled by the link cooldown", async () => {
  const recent = new Date(Date.now() - 20_000).toISOString();
  const { submit, calls } = signup(
    { id: "existing", unsubscribed: false, properties: { last_link_sent_at: { value: recent } } },
    registered,
  );
  assert.equal((await submit("reader@example.com")).success, true);
  assert.equal(emails(calls).length, 0);
});

test("a Radian-only contact can join the newsletter without changing their Radian preference", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, {
    segments: ["4da8672a-f61d-40bf-a5ab-eb0da7fca8f4"],
    topics: [{ id: "3703dc48-be4b-4f9b-bb87-19a4754ad64c", subscription: "opt_in" }],
  });
  assert.equal((await submit("reader@example.com")).success, true);
  const topic = calls.find(([name]) => name === "topic-update")[1];
  assert.equal(topic.topics[0].id, NEWSLETTER_TOPIC);
  assert.ok(names(calls).includes("segment-add"));
  assert.equal(verifyLinkToken("verify", tokenIn(emails(calls)[0]))?.email, "reader@example.com");
});

test("an unsubscribed reader who signs up again is emailed a sign-in link, not a confirmation", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, {
    segments: [NEWSLETTER_SEGMENT],
    topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_out" }],
  });
  assert.equal((await submit("reader@example.com")).success, true);
  assert.ok(names(calls).includes("topic-update"));
  assert.equal(verifyLinkToken("signin", tokenIn(emails(calls)[0]))?.email, "reader@example.com");
});

test("lookup failure stops signup without writing contacts or sending email", async () => {
  const { submit, calls } = signup(null, { lookupError: { name: "application_error" } });
  await assert.rejects(submit("reader@example.com"), /Could not check contact/);
  assert.deepEqual(names(calls), ["get"]);
});

test("asking to unsubscribe only emails a confirmation link and changes nothing", async () => {
  const { requestUnsubscribe, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, registered);
  assert.equal(JSON.stringify(await requestUnsubscribe("reader@example.com")), JSON.stringify({ success: true }));
  const [email] = emails(calls);
  assert.equal(verifyLinkToken("unsubscribe", tokenIn(email))?.email, "reader@example.com");
  assert.ok(email.text.includes("/unsubscribe?token="));
  assert.equal(names(calls).some((name) => ["topic-update", "segment-remove"].includes(name)), false);
});

test("asking to unsubscribe an unknown address answers the same and emails nobody", async () => {
  const { requestUnsubscribe, calls } = signup(null, { lookupError: { name: "not_found" } });
  assert.equal(JSON.stringify(await requestUnsubscribe("nobody@example.com")), JSON.stringify({ success: true }));
  assert.equal(emails(calls).length, 0);
});

test("a valid unsubscribe link removes only the newsletter and leaves Radian subscribed", async () => {
  const { unsubscribe, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, {
    segments: [NEWSLETTER_SEGMENT, "4da8672a-f61d-40bf-a5ab-eb0da7fca8f4"],
  });
  const token = createLinkToken("unsubscribe", "reader@example.com", Date.now(), 60_000);
  await unsubscribe(token);
  assert.deepEqual(names(calls), ["get", "topic-update", "segment-remove"]);
  assert.equal(calls[1][1].topics[0].subscription, "opt_out");
  assert.equal(calls[2][1].segmentId, NEWSLETTER_SEGMENT);
});

test("an email address alone cannot unsubscribe anyone", async () => {
  const { unsubscribe, calls } = signup({ id: "existing", unsubscribed: false, properties: {} }, registered);
  await assert.rejects(unsubscribe("victim@example.com"), /invalid or has expired/);
  const signin = createLinkToken("signin", "victim@example.com", Date.now(), 60_000);
  await assert.rejects(unsubscribe(signin), /invalid or has expired/);
  const expired = createLinkToken("unsubscribe", "victim@example.com", Date.now() - 120_000, 60_000);
  await assert.rejects(unsubscribe(expired), /invalid or has expired/);
  assert.equal(calls.length, 0);
});

test("signup requires the human check for its own action before any lookup", async () => {
  const { submit, calls, humanChecks } = signup(null, { lookupError: { name: "not_found" } });
  await submit("new@example.com", "widget-token");
  assert.deepEqual(humanChecks, [["signup", "widget-token"]]);
  const blocked = signup(null, { lookupError: { name: "not_found" }, humanFails: true });
  await assert.rejects(blocked.submit("new@example.com", "bad"), /Verification failed/);
  assert.equal(blocked.calls.length, 0);
  assert.ok(calls.length > 0);
});

test("asking for an unsubscribe link requires the human check before any lookup", async () => {
  const { requestUnsubscribe, humanChecks } = signup({ id: "existing", unsubscribed: false, properties: {} }, registered);
  await requestUnsubscribe("reader@example.com", "widget-token");
  assert.deepEqual(humanChecks, [["unsubscribe", "widget-token"]]);
  const blocked = signup({ id: "existing", unsubscribed: false, properties: {} }, { ...registered, humanFails: true });
  await assert.rejects(blocked.requestUnsubscribe("reader@example.com", "bad"), /Verification failed/);
  assert.equal(blocked.calls.length, 0);
});
