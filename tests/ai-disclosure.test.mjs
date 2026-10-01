// EU AI Act Article 50: issues are AI-generated, so the site must say so where readers meet them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { AI_DISCLOSURE, AI_LABEL, AI_META } from "../src/lib/ai-disclosure.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const archive = read("src/app/archive/[kind]/[date]/page.tsx");

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
  assert.match(read("src/app/page.tsx"), /Daily AI-generated issues/);
});
