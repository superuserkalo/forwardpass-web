import assert from "node:assert/strict";
import { test } from "node:test";
import { createLinkToken } from "../src/lib/link-token.ts";
import { createPreferencesToken, verifyPreferencesToken } from "../src/lib/preferences-token.ts";
import { loadLib } from "./support/load-ts.mjs";

const SECRET = "s".repeat(32);
process.env.PREFERENCES_SIGNING_SECRET = SECRET;
const { exchangeLinkToken } = loadLib("session-exchange", {
  env: { PREFERENCES_SIGNING_SECRET: SECRET },
});
const DAY = 86_400_000;

test("a confirmation link starts a 30-day session and continues to onboarding", () => {
  const now = Date.now();
  const token = createLinkToken("verify", "reader@example.com", now, DAY);
  const session = exchangeLinkToken(token, now);
  assert.equal(session.next, "/welcome");
  assert.equal(session.subscribeEmail, "reader@example.com");
  assert.equal(session.maxAgeSeconds, 30 * 86_400);
  assert.equal(verifyPreferencesToken(session.cookie, now)?.email, "reader@example.com");
  assert.ok(verifyPreferencesToken(session.cookie, now + 29 * DAY));
  assert.equal(verifyPreferencesToken(session.cookie, now + 31 * DAY), null);
});

test("a sign-in link starts the same session and continues to the reading brief", () => {
  const now = Date.now();
  const session = exchangeLinkToken(createLinkToken("signin", "reader@example.com", now, 60_000), now);
  assert.equal(session.next, "/preferences");
  assert.equal(session.subscribeEmail, null);
  assert.equal(verifyPreferencesToken(session.cookie, now)?.email, "reader@example.com");
});

test("an existing newsletter edit link keeps working and keeps its own expiry", () => {
  const now = Date.now();
  const token = createPreferencesToken("reader@example.com", now);
  const session = exchangeLinkToken(token, now);
  assert.equal(session.cookie, token);
  assert.equal(session.subscribeEmail, null);
  assert.equal(session.next, "/preferences");
  assert.equal(session.maxAgeSeconds, 86_400);
});

test("expired, wrong-purpose and forged links start no session", () => {
  const now = Date.now();
  assert.equal(exchangeLinkToken(createLinkToken("signin", "reader@example.com", now - 120_000, 60_000), now), null);
  assert.equal(exchangeLinkToken(createLinkToken("unsubscribe", "reader@example.com", now, 60_000), now), null);
  assert.equal(exchangeLinkToken("forged.token", now), null);
  assert.equal(exchangeLinkToken("", now), null);
});
