import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { verifyPreferencesToken } from "../src/lib/preferences-token.ts";

const require = createRequire(import.meta.url);

test("signed edit links expire and reject tampering", () => {
  const oldSecret = process.env.PREFERENCES_SIGNING_SECRET;
  process.env.PREFERENCES_SIGNING_SECRET = "a".repeat(32);
  try {
    const payload = Buffer.from(JSON.stringify({ email: "reader@example.com", expires: 2000 })).toString("base64url");
    const signature = createHmac("sha256", process.env.PREFERENCES_SIGNING_SECRET).update(`preferences:${payload}`).digest("base64url");
    assert.equal(verifyPreferencesToken(`${payload}.${signature}`, 1000)?.email, "reader@example.com");
    assert.equal(verifyPreferencesToken(`${payload}.${signature}`, 2000), null);
    assert.equal(verifyPreferencesToken(`${payload}.${signature}x`, 1000), null);
  } finally {
    if (oldSecret === undefined) delete process.env.PREFERENCES_SIGNING_SECRET;
    else process.env.PREFERENCES_SIGNING_SECRET = oldSecret;
  }
});

function interestsAction(ownerEmail) {
  const source = ts.transpileModule(readFileSync(new URL("../src/lib/personal-actions.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  const writes = [];
  runInNewContext(source, {
    exports,
    require: (name) => {
      if (name === "./onboarding-session") return { onboardingEmail: async () => null };
      if (name === "./preferences-session") return { preferencesEmail: async () => ownerEmail };
      if (name === "./subscribers") return { setInterests: async (...args) => writes.push(args) };
      if (name === "./polar") return { createSubscriptionCheckout: async () => "" };
      if (name === "next/headers") return { headers: async () => new Headers() };
      return require(name);
    },
  });
  return { action: exports.updateInterestsAction, writes };
}

test("an email address alone cannot edit another subscriber's brief", async () => {
  const { action, writes } = interestsAction("owner@example.com");
  await assert.rejects(action({ email: "victim@example.com", interests: "Agents and infrastructure" }), /signed edit link/);
  assert.equal(writes.length, 0);
});

test("the signed owner can update their brief", async () => {
  const { action, writes } = interestsAction("owner@example.com");
  await action({ email: "owner@example.com", interests: "Agents and infrastructure" });
  assert.deepEqual(writes, [["owner@example.com", "Agents and infrastructure"]]);
});
