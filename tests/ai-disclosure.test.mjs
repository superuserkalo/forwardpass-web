// EU AI Act Article 50: issues are AI-generated, so the site must say so where readers meet them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { AI_DISCLOSURE, AI_LABEL, AI_META } from "../src/lib/ai-disclosure.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const archive = read("src/app/(site)/archive/[kind]/[date]/page.tsx");

test("disclosure wording says the issue is AI-written with no human edit", () => {
  assert.equal(AI_LABEL, "Daily AI-generated issue");
  assert.match(AI_DISCLOSURE, /written by AI models/);
  assert.match(AI_DISCLOSURE, /No human edits it/);
  assert.deepEqual(AI_META, { "ai-generated": "true" });
});

test("archived issues show the label in the header and the full disclosure before the stories", () => {
  const header = archive.indexOf(": AI_LABEL}");
  const disclosure = archive.indexOf("{AI_DISCLOSURE}");
  const stories = archive.indexOf("outline.sections.map((section) => {");
  assert.ok(header > 0, "label rendered");
  assert.ok(disclosure > header && disclosure < stories, "disclosure rendered before story text");
});

test("archived issues carry machine-readable marking", () => {
  assert.match(archive, /other: AI_META/);
});

test("the homepage tells visitors before they subscribe", () => {
  const home = read("src/app/(site)/page.tsx");
  assert.match(home, /AI-generated/);
  assert.ok(home.indexOf("AI-generated") < home.indexOf("<NewsletterForm"));
});

// ---- live signals are written by the engine too, so the same rule holds for them ----
import { AI_SIGNAL_DISCLOSURE, AI_SIGNAL_LABEL } from "../src/lib/ai-disclosure.ts";

const signalPage = read("src/app/(site)/signals/[id]/page.tsx");
const signalsList = read("src/app/(site)/signals/page.tsx");
const corrections = read("src/app/(site)/signals/corrections/page.tsx");

test("the signal disclosure says AI wrote it, that the facts are quoted from the source, and that no human edits it", () => {
  assert.equal(AI_SIGNAL_LABEL, "AI-generated signal");
  assert.match(AI_SIGNAL_DISCLOSURE, /written by AI models/);
  assert.match(AI_SIGNAL_DISCLOSURE, /line quoted from that source/);
  assert.match(AI_SIGNAL_DISCLOSURE, /No human edits it/);
});

test("a signal's page labels it in the header and gives the full disclosure after the evidence, whether it is live or not", () => {
  const header = signalPage.indexOf("<span>{AI_SIGNAL_LABEL}</span>");
  const evidence = signalPage.indexOf("<Evidence view={view} />");
  const disclosure = signalPage.indexOf("{AI_SIGNAL_DISCLOSURE}");
  assert.ok(header > 0 && evidence > header && disclosure > evidence, "label, then the evidence, then the disclosure");
  assert.match(signalPage, /other: AI_META/, "machine-readable marking on a signal");
  assert.match(signalPage, /const hidden = [^\n]*other: AI_META/, "and on the pages that are not shown");
});

test("the list and the corrections log carry the marking too, and the list says so before the first signal", () => {
  assert.match(signalsList, /other: AI_META/);
  assert.match(corrections, /other: AI_META/);
  assert.ok(signalsList.indexOf("AI-generated") > 0 && signalsList.indexOf("AI-generated") < signalsList.indexOf("<SignalList"));
});
