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

function signup(existing, lookupError = null) {
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
      segments: { add: async () => { calls.push(["segment"]); return {}; } },
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
  return { submit: exports.subscribeAction, calls };
}

test("registered email is normalized and rejected without writes or welcome email", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: false });
  const result = await submit("  Reader@Example.com  ");
  assert.equal(result.alreadyRegistered, true);
  assert.equal(result.canOnboard, false);
  assert.equal(result.success, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].email, "reader@example.com");
});

test("new email creates contact and onboarding session", async () => {
  const { submit, calls } = signup(null, { name: "not_found" });
  const result = await submit("new@example.com");
  assert.equal(result.success, true);
  assert.equal(result.canOnboard, true);
  assert.deepEqual(calls.map(([name]) => name), ["get", "create", "session", "welcome"]);
});

test("unsubscribed reader can rejoin without receiving a new onboarding session", async () => {
  const { submit, calls } = signup({ id: "existing", unsubscribed: true });
  const result = await submit("reader@example.com");
  assert.equal(result.success, true);
  assert.equal(result.canOnboard, false);
  assert.deepEqual(calls.map(([name]) => name), ["get", "update", "segment"]);
});

test("lookup failure stops signup without writing contacts", async () => {
  const { submit, calls } = signup(null, { name: "application_error" });
  await assert.rejects(submit("reader@example.com"), /Could not check contact/);
  assert.equal(calls.length, 1);
});
