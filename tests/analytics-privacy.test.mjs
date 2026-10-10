import assert from "node:assert/strict";
import { test } from "node:test";
import { redactAnalyticsEvent } from "../src/lib/analytics-privacy.ts";

test("reader email, signed tokens and fragments never reach analytics", () => {
  for (const type of ["pageview", "event"]) {
    const event = { type, url: "https://theforwardpass.net/unsubscribe?email=reader%40example.com&token=secret#private" };
    const result = redactAnalyticsEvent(event);
    assert.equal(result.url, "https://theforwardpass.net/unsubscribe");
    assert.equal(result.type, type);
    assert.ok(event.url.includes("secret"), "does not mutate the original event");
  }
});

test("authentication exchange pages are excluded", () => {
  for (const path of ["/auth/callback?code=secret&state=secret", "/preferences/open#token=secret", "/preferences/session"]) {
    assert.equal(redactAnalyticsEvent({ type: "pageview", url: `https://theforwardpass.net${path}` }), null);
  }
});

test("keeps public routes and drops malformed event URLs", () => {
  const event = { type: "pageview", url: "https://theforwardpass.net/pricing" };
  assert.deepEqual(redactAnalyticsEvent(event), event);
  assert.equal(redactAnalyticsEvent({ type: "pageview", url: "invalid" }), null);
});
