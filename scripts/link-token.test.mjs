import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { createLinkToken, verifyLinkToken } from "../src/lib/link-token.ts";

const SECRET = "s".repeat(32);

function withSecret(secret, run) {
  const previous = process.env.PREFERENCES_SIGNING_SECRET;
  if (secret === undefined) delete process.env.PREFERENCES_SIGNING_SECRET;
  else process.env.PREFERENCES_SIGNING_SECRET = secret;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.PREFERENCES_SIGNING_SECRET;
    else process.env.PREFERENCES_SIGNING_SECRET = previous;
  }
}

test("a link token proves the address it was issued for until it expires", () => {
  withSecret(SECRET, () => {
    const token = createLinkToken("signin", "Reader@Example.com", 1_000, 60_000);
    assert.equal(verifyLinkToken("signin", token, 1_001)?.email, "reader@example.com");
    assert.equal(verifyLinkToken("signin", token, 61_000), null);
  });
});

test("a token for one purpose cannot be used for another", () => {
  withSecret(SECRET, () => {
    const token = createLinkToken("unsubscribe", "reader@example.com", 1_000, 60_000);
    assert.equal(verifyLinkToken("signin", token, 1_001), null);
    assert.equal(verifyLinkToken("verify", token, 1_001), null);
    assert.equal(verifyLinkToken("unsubscribe", token, 1_001)?.email, "reader@example.com");
  });
});

test("a tampered address or signature is rejected", () => {
  withSecret(SECRET, () => {
    const token = createLinkToken("signin", "reader@example.com", 1_000, 60_000);
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ email: "victim@example.com", expires: 61_000 })).toString("base64url");
    assert.equal(verifyLinkToken("signin", `${forged}.${signature}`, 1_001), null);
    assert.equal(verifyLinkToken("signin", `${payload}.${signature}x`, 1_001), null);
    assert.equal(verifyLinkToken("signin", "not-a-token", 1_001), null);
  });
});

test("a signature made without the purpose prefix is rejected", () => {
  withSecret(SECRET, () => {
    const payload = Buffer.from(JSON.stringify({ email: "reader@example.com", expires: 61_000 })).toString("base64url");
    const bare = createHmac("sha256", SECRET).update(payload).digest("base64url");
    assert.equal(verifyLinkToken("signin", `${payload}.${bare}`, 1_001), null);
  });
});

test("a missing or short signing secret refuses to issue or accept tokens", () => {
  const token = withSecret(SECRET, () => createLinkToken("signin", "reader@example.com", 1_000, 60_000));
  withSecret(undefined, () => {
    assert.throws(() => createLinkToken("signin", "reader@example.com", 1_000, 60_000), /not configured/);
    assert.equal(verifyLinkToken("signin", token, 1_001), null);
  });
  withSecret("short", () => {
    assert.throws(() => createLinkToken("signin", "reader@example.com", 1_000, 60_000), /not configured/);
    assert.equal(verifyLinkToken("signin", token, 1_001), null);
  });
});
