import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/forward-pass.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function signup(existing, { lookupError = null, segments = [], topics = [] } = {}) {
  const calls = [];
  const exports = {};
  class Resend {
    contacts = {
      get: async (input) => {
        calls.push(["get", input]);
        return { data: existing, error: lookupError };
      },
      create: async (input) => { calls.push(["create", input]); return {}; },
      update: async (input) => { calls.push(["update", input]); return {}; },
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
  }
  runInNewContext(source, {
    exports,
    process: { env: { RESEND_API_KEY: "test-key" } },
    console,
    require: (name) => {
      if (name === "resend") return { Resend };
      if (name === "next/server") return { after: () => calls.push(["welcome"]) };
      if (name === "./onboarding-session") return {
        createOnboardingSession: async () => calls.push(["session"]),
        onboardingEmail: async () => null,
      };
      return require(name);
    },
  });
  return { submit: exports.subscribeAction, unsubscribe: exports.unsubscribeAction, calls };
}

test("registered email is normalized and rejected without writes or welcome email", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false }, {
    segments: ["2ec79559-e5f2-4a84-887b-5cee315656a3"],
    topics: [{ id: "418f8071-0c80-4e3f-a076-b21ccfd40318", subscription: "opt_in" }],
  });
  const result = await submit("  Reader@Example.com  ");
  assert.equal(result.alreadyRegistered, true);
  assert.equal(result.canOnboard, false);
  assert.equal(result.success, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].email, "reader@example.com");
});

test("new email creates contact and onboarding session", async () => {
  const { submit, calls } = signup(null, { lookupError: { name: "not_found" } });
  const result = await submit("new@example.com");
  assert.equal(result.success, true);
  assert.equal(result.canOnboard, true);
  assert.deepEqual(calls.map(([name]) => name), ["get", "create", "session", "welcome"]);
  assert.equal(calls[1][1].topics[0].subscription, "opt_in");
});

test("Radian-only contact can join the newsletter without changing their Radian preference", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false }, {
    segments: ["4da8672a-f61d-40bf-a5ab-eb0da7fca8f4"],
    topics: [{ id: "3703dc48-be4b-4f9b-bb87-19a4754ad64c", subscription: "opt_in" }],
  });
  const result = await submit("reader@example.com");
  assert.equal(result.success, true);
  assert.equal(result.canOnboard, true);
  assert.deepEqual(calls.map(([name]) => name), ["get", "topic-update", "segment-add", "session", "welcome"]);
  assert.equal(calls[1][1].topics[0].id, "418f8071-0c80-4e3f-a076-b21ccfd40318");
});

test("unsubscribed reader can rejoin without receiving a new onboarding session", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false }, {
    segments: ["2ec79559-e5f2-4a84-887b-5cee315656a3"],
    topics: [{ id: "418f8071-0c80-4e3f-a076-b21ccfd40318", subscription: "opt_out" }],
  });
  const result = await submit("reader@example.com");
  assert.equal(result.success, true);
  assert.equal(result.canOnboard, false);
  assert.deepEqual(calls.map(([name]) => name), ["get", "topic-update"]);
});

test("newsletter unsubscribe leaves Radian subscribed", async () => {
  const { unsubscribe, calls } = signup({ id: "existing", unsubscribed: false }, {
    segments: ["2ec79559-e5f2-4a84-887b-5cee315656a3", "4da8672a-f61d-40bf-a5ab-eb0da7fca8f4"],
  });
  await unsubscribe("reader@example.com");
  assert.deepEqual(calls.map(([name]) => name), ["get", "topic-update", "segment-remove"]);
  assert.equal(calls[1][1].topics[0].subscription, "opt_out");
  assert.equal(calls[2][1].segmentId, "2ec79559-e5f2-4a84-887b-5cee315656a3");
});

test("lookup failure stops signup without writing contacts", async () => {
  const { submit, calls } = signup(null, { lookupError: { name: "application_error" } });
  await assert.rejects(submit("reader@example.com"), /Could not check contact/);
  assert.equal(calls.length, 1);
});
