import assert from "node:assert/strict";
import { test } from "node:test";
import {
  onboardingSchema,
  onboardingDraftSchema,
  readingBrief,
  personalAccess,
  TOPICS,
  CONTENT,
  TRIAL_DAYS,
  existingOnboardingResult,
} from "../src/lib/onboarding.ts";
const profile = {
  firstName: "Ada",
  lastName: "",
  role: "Developer",
  seniority: "",
  company: "",
  topics: ["Agents"],
  content: ["Papers"],
  format: "Links only",
  notes: "Skip funding news.",
};
test("profile rejects missing requirements and unknown selections", () => {
  assert.equal(
    onboardingSchema.safeParse({ ...profile, firstName: " " }).success,
    false,
  );
  assert.equal(
    onboardingSchema.safeParse({ ...profile, topics: [] }).success,
    false,
  );
  assert.equal(
    onboardingSchema.safeParse({ ...profile, content: [] }).success,
    false,
  );
  assert.equal(
    onboardingSchema.safeParse({ ...profile, topics: ["invalid"] }).success,
    false,
  );
});
test("incomplete drafts survive without weakening submission validation", () => {
  assert.equal(
    onboardingDraftSchema.safeParse({ ...profile, firstName: "", topics: [] })
      .success,
    true,
  );
});
test("reading brief carries topic, content, format and exclusions within generator limit", () => {
  const brief = readingBrief(onboardingSchema.parse(profile));
  for (const value of [
    "Developer",
    "Agents",
    "Papers",
    "Links only",
    "Skip funding news.",
  ])
    assert.ok(brief.includes(value));
  assert.ok(
    readingBrief(
      onboardingSchema.parse({
        ...profile,
        topics: TOPICS,
        content: CONTENT,
        notes: "x".repeat(180),
      }),
    ).length <= 500,
  );
});
test("Personal access expires exactly at day 14 and never overrides a paid plan", () => {
  const start = Date.parse("2026-09-24T12:00:00Z");
  const end = new Date(start + TRIAL_DAYS * 86_400_000).toISOString();
  assert.equal(personalAccess("trial", end, start), true);
  assert.equal(personalAccess("trial", end, Date.parse(end) - 1), true);
  assert.equal(personalAccess("trial", end, Date.parse(end)), false);
  assert.equal(personalAccess("active", end, Date.parse(end) + 1), true);
  assert.equal(personalAccess("trial", "invalid", start), false);
  assert.equal(personalAccess("free", end, start), false);
  assert.equal(personalAccess("canceled", end, start), false);
});

test("resuming never extends a trial or replaces a paid plan", () => {
  const end = "2026-10-08T12:00:00Z";
  const now = Date.parse("2026-09-25T12:00:00Z");
  assert.deepEqual(existingOnboardingResult("trial", end, now), {
    status: "trial",
    trialEndsAt: end,
  });
  assert.deepEqual(existingOnboardingResult("active", end, now), {
    status: "active",
    trialEndsAt: null,
  });
  assert.equal(
    existingOnboardingResult("trial", end, Date.parse(end)).status,
    "expired",
  );
  assert.equal(
    existingOnboardingResult("canceled", end, now).status,
    "expired",
  );
  assert.equal(existingOnboardingResult("", "", now), null);
});
