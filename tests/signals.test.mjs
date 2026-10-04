// Live signals as the site shows them. The fixtures in tests/fixtures/signals are what the engine's own public handler
// answered for a small seeded corpus (a corrected signal, one checked against a feed summary, a retracted one), so these
// tests fail when the site's reading of the contract drifts from the engine's.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ageLabel, correctionsSchema, evidenceView, formatLatency, isSignalId, readSignalLookup, retractionSchema, scorecard, signalHref, signalIdFromParam,
  lookupHeadline, signalListSchema, signalRecordSchema, signalStatsSchema, signalsMarkdown, signalsPath, sourceGapLabel, typeLabel, utcStamp,
} from "../src/lib/signals.ts";
import { buildSignalsRss } from "../src/lib/signals-rss.ts";

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/signals/${name}.json`, import.meta.url), "utf8")).body;
const SITE0 = "https://site.example";
const list = fixture("list");
const corrected = fixture("one-corrected");
const feedSummary = fixture("one-feed-summary");

test("the schemas accept what the engine answers", () => {
  const parsed = signalListSchema.parse(list);
  assert.deepEqual(parsed.signals.map(({ type }) => type), ["papers", "repos", "models"]);
  assert.equal(parsed.next, null);
  const record = signalRecordSchema.parse(corrected);
  assert.equal(record.status, "corrected");
  assert.equal(record.corrections[0].before?.summary, "Embed 5 is in preview on the Cohere API. It scores 85.8 on ViDoRe V3.");
  assert.equal(signalRecordSchema.parse(feedSummary).evidence.basis, "feed-summary");
  assert.deepEqual(retractionSchema.parse(fixture("retracted")), { id: fixture("retracted").id, status: "retracted", note: "The lab withdrew the announcement.", retractedAt: "2026-10-03T11:45:00.000Z" });
  assert.deepEqual(signalStatsSchema.parse(fixture("stats")).last7days, { published: 3, medianLatencyMinutes: 40, pageVerifiedShare: 2 / 3, corrections: 2 });
  assert.equal(correctionsSchema.parse(fixture("corrections")).corrections.length, 2);
});

test("a malformed answer is refused, and a field the site does not know yet is ignored", () => {
  const summary = list.signals[0];
  const refused = (change) => assert.equal(signalListSchema.safeParse({ ...list, signals: [{ ...summary, ...change }] }).success, false, JSON.stringify(change));
  refused({ headline: "" });
  refused({ headline: undefined });
  refused({ id: "g-123" });
  refused({ id: "../archive" });
  refused({ status: "archived" });
  refused({ publishedAt: "yesterday" });
  refused({ url: "javascript:alert(1)" });
  refused({ topics: "Agents" });
  refused({ evidenceCount: -1 });
  refused({ evidenceCount: 1.5 });
  assert.equal(signalListSchema.safeParse({ signals: [summary] }).success, false, "a list says whether there is more");
  const tolerant = signalListSchema.parse({ ...list, signals: [{ ...summary, somethingNew: 1 }] });
  assert.equal("somethingNew" in tolerant.signals[0], false);
  // A record without a verified quote is not one the site will show.
  assert.equal(signalRecordSchema.safeParse({ ...corrected, facts: [] }).success, false);
  assert.equal(signalRecordSchema.safeParse({ ...corrected, facts: [{ fact: "x", quote: "", impact: 1 }] }).success, false);
});

test("an id is g- and sixteen hex digits, round-trips through its address, and nothing else becomes one", () => {
  const id = corrected.id;
  assert.equal(isSignalId(id), true);
  assert.equal(signalHref(id), `/signals/${id}`);
  assert.equal(signalIdFromParam(id), id);
  for (const bad of ["", "g-123", "G-0123456789abcdef", "g-0123456789ABCDEF", `${id}/x`, `${id}?x=1`, "../archive", "..%2Farchive", "%2e%2e", `g-${"0".repeat(17)}`, `g-${"z".repeat(16)}`, " " + id, id + "\n"]) {
    assert.equal(isSignalId(bad), false, JSON.stringify(bad));
    assert.equal(signalIdFromParam(bad), null, JSON.stringify(bad));
    assert.throws(() => signalHref(bad), RangeError, JSON.stringify(bad));
  }
});

test("the evidence shown is the record's own: every quote and fact as written, the most telling first, and how it was checked said plainly", () => {
  const record = signalRecordSchema.parse(corrected);
  const view = evidenceView(record);
  assert.deepEqual(view.facts, [{ fact: "Embed 5 is generally available on the Cohere API.", quote: "now generally available", impact: 5 }, { fact: "Embed 5 scores 85.8 on ViDoRe V3.", quote: "85.8 on ViDoRe V3", impact: 3 }]);
  assert.deepEqual(view.sources, record.sources);
  assert.deepEqual(view.checked, { supported: 3, total: 3 });
  assert.equal(view.basis, "page");
  assert.match(view.basisNote, /word for word in the page/);
  const fallback = evidenceView(signalRecordSchema.parse(feedSummary));
  assert.equal(fallback.basis, "feed-summary");
  assert.match(fallback.basisNote, /feed summary/);
  assert.doesNotMatch(fallback.basisNote, /word for word in the page/, "a feed summary is never passed off as the page");

  // Whatever order the facts come in, the view holds exactly the same facts: none added, none altered, none dropped.
  const facts = Array.from({ length: 9 }, (_, i) => ({ fact: `Fact ${i}.`, quote: `quote ${i}`, impact: i % 4 }));
  for (const order of [facts, [...facts].reverse(), [...facts.slice(3), ...facts.slice(0, 3)]]) {
    const shown = evidenceView({ ...record, facts: order }).facts;
    assert.deepEqual([...shown].map(({ quote }) => quote).sort(), facts.map(({ quote }) => quote).sort());
    assert.ok(shown.every(({ fact, quote, impact }) => facts.some((f) => f.fact === fact && f.quote === quote && f.impact === impact)));
    assert.ok(shown.every((fact, i) => i === 0 || shown[i - 1].impact >= fact.impact), "most telling first");
  }
  // Facts of equal weight keep the record's order.
  const tied = evidenceView({ ...record, facts: [{ fact: "B.", quote: "b", impact: 2 }, { fact: "A.", quote: "a", impact: 2 }, { fact: "C.", quote: "c", impact: 9 }] }).facts.map(({ quote }) => quote);
  assert.deepEqual(tied, ["c", "b", "a"]);
  // A verdict below the line counts as not supported, so a weak check is never shown as a strong one.
  const weak = evidenceView({ ...record, evidence: { ...record.evidence, grounding: { evaluator: "jev", verdicts: [{ text: "a", verdict: "supported", supported: 0.9 }, { text: "b", verdict: "unsupported", supported: 0.2 }] } } });
  assert.deepEqual(weak.checked, { supported: 1, total: 2 });
});

test("an age is said in minutes under an hour, hours under a day, then days, and never in the future", () => {
  const at = Date.parse("2026-10-03T12:00:00.000Z");
  const ago = (ms) => ageLabel(new Date(at - ms).toISOString(), at);
  const MIN = 60_000, HOUR = 3_600_000;
  assert.deepEqual([0, 59_999].map(ago), ["just now", "just now"]);
  assert.deepEqual([MIN, 5 * MIN, 59 * MIN].map(ago), ["1 min ago", "5 min ago", "59 min ago"]);
  assert.deepEqual([60 * MIN, 2 * HOUR, 23 * HOUR + 59 * MIN].map(ago), ["1 hr ago", "2 hr ago", "23 hr ago"]);
  assert.deepEqual([24 * HOUR, 47 * HOUR, 48 * HOUR, 9 * 24 * HOUR].map(ago), ["1 day ago", "1 day ago", "2 days ago", "9 days ago"]);
  assert.equal(ago(-5 * MIN), "just now", "a clock that runs ahead does not put a signal in the future");
});

test("how soon after its source a signal came is said only when it is a matter of hours", () => {
  const gap = (minutes, source = "2026-10-03T09:00:00.000Z") => sourceGapLabel({ sourcePublishedAt: source, publishedAt: new Date(Date.parse("2026-10-03T09:00:00.000Z") + minutes * 60_000).toISOString() });
  assert.equal(gap(0), "within a minute of the source");
  assert.equal(gap(0.5), "within a minute of the source");
  assert.equal(gap(1), "1 minute after the source");
  assert.equal(gap(40), "40 minutes after the source");
  assert.equal(gap(60), "1 hour after the source");
  assert.equal(gap(90), "1 hour after the source");
  assert.equal(gap(180), "3 hours after the source");
  assert.equal(gap(23 * 60 + 59), "23 hours after the source");
  assert.equal(gap(24 * 60), null, "a day later is not a live signal and is not dressed as one");
  assert.equal(gap(-10), null, "a source dated after the signal is not believed");
  assert.equal(gap(5, null), null);
});

test("the scorecard says what the numbers are, and says n/a rather than a number it does not have", () => {
  assert.deepEqual(scorecard({ published: 42, medianLatencyMinutes: 38, pageVerifiedShare: 0.9667, corrections: 1 }), [
    { label: "Signals", value: "42" }, { label: "Median time after the source", value: "38 min" }, { label: "Checked against the source page", value: "97%" }, { label: "Corrections", value: "1" },
  ]);
  assert.deepEqual(scorecard({ published: 0, medianLatencyMinutes: null, pageVerifiedShare: null, corrections: 0 }).map(({ value }) => value), ["0", "n/a", "n/a", "0"]);
  assert.deepEqual([null, 0, 0.4, 1, 119, 120, 150, 1440].map(formatLatency), ["n/a", "<1 min", "<1 min", "1 min", "119 min", "2.0 hr", "2.5 hr", "24.0 hr"]);
  assert.equal(scorecard({ published: 1, medianLatencyMinutes: 1, pageVerifiedShare: 0.004, corrections: 0 })[2].value, "0%");
  assert.equal(scorecard({ published: 1, medianLatencyMinutes: 1, pageVerifiedShare: 1, corrections: 0 })[2].value, "100%");
});

test("a type has a name for a reader", () => {
  assert.deepEqual(["news", "papers", "models", "repos"].map(typeLabel), ["News", "Papers", "Models", "Repos"]);
});

test("the list is asked for with a bounded size, and only a type or a cursor the site recognises is passed on", () => {
  const cursor = Buffer.from("2026-10-03T11:30:00.000Z|g-0123456789abcdef").toString("base64url");
  assert.equal(signalsPath(), "/signals?limit=50");
  assert.equal(signalsPath({ type: "models" }), "/signals?limit=50&type=models");
  assert.equal(signalsPath({ before: cursor }), `/signals?limit=50&before=${cursor}`);
  assert.equal(signalsPath({ type: "models", before: cursor, limit: 10 }), `/signals?limit=10&type=models&before=${cursor}`);
  assert.deepEqual([0, -3, 5000, 2.9, Number.NaN].map((limit) => signalsPath({ limit })), ["/signals?limit=1", "/signals?limit=1", "/signals?limit=50", "/signals?limit=2", "/signals?limit=50"]);
  for (const bad of ["", "not a cursor", "../../x", `${cursor}&type=news`, "a".repeat(500), "x".repeat(5), "%2e%2e%2f", "a=b"]) assert.equal(signalsPath({ before: bad }), "/signals?limit=50", JSON.stringify(bad));
  assert.equal(signalsPath({ type: "gossip" }), "/signals?limit=50", "an unknown type is no filter");
  assert.equal(signalsPath({ type: "models&limit=500" }), "/signals?limit=50");
});

test("an answer is read as a signal, a retraction, a signal that is not there, or no answer at all, and half an answer is no answer", () => {
  assert.equal(readSignalLookup(200, corrected).kind, "found");
  assert.equal(readSignalLookup(200, corrected).record.headline, corrected.headline);
  assert.deepEqual(readSignalLookup(410, fixture("retracted")), { kind: "retracted", retraction: retractionSchema.parse(fixture("retracted")) });
  assert.deepEqual(readSignalLookup(404, { error: "Not found" }), { kind: "missing" });
  for (const [status, body] of [[500, {}], [503, { error: "x" }], [429, { error: "Too many requests" }], [400, { error: "bad" }], [200, {}], [200, null], [200, { ...corrected, facts: [] }], [200, "text"], [410, { id: "x" }], [410, null], [302, null]]) {
    assert.deepEqual(readSignalLookup(status, body), { kind: "unavailable" }, `${status} ${JSON.stringify(body)?.slice(0, 40)}`);
  }
});

test("a time is shown in UTC whoever reads it", () => {
  assert.equal(utcStamp("2026-10-03T10:20:00.000Z"), "3 Oct 2026, 10:20 UTC");
  assert.equal(utcStamp("2026-12-31T23:59:59.000Z"), "31 Dec 2026, 23:59 UTC");
  assert.equal(utcStamp("2026-10-03T00:05:00.000Z"), "3 Oct 2026, 00:05 UTC", "midnight is 00, not 24");
});

test("the full text for agents lists the signals newest first, each with its source and its page, and says it is AI-generated", () => {
  const md = signalsMarkdown([list.signals[2], { ...list.signals[0], headline: "Newest\n   one" }], SITE0);
  assert.match(md, /^## Live signals \(2\)\n\n/);
  assert.match(md, /AI-generated/);
  const items = md.split("\n").filter((line) => line.startsWith("- "));
  assert.equal(items.length, 2);
  assert.ok(items[0].startsWith("- **Newest one** (arXiv, papers, 3 Oct 2026, 11:30 UTC): "), "newest first, on one line");
  assert.ok(items[0].includes(` Page: ${SITE0}/signals/${list.signals[0].id}`));
  assert.ok(items[1].includes("Source: https://cohere.com/blog/embed-5 Page: "));
  assert.equal(signalsMarkdown([], SITE0).includes("(0)"), true);
});

test("the corrections log names a signal by its headline when the engine still has one to show, and says nothing it does not know", () => {
  assert.equal(lookupHeadline(readSignalLookup(200, corrected)), corrected.headline);
  for (const lookup of [readSignalLookup(410, fixture("retracted")), readSignalLookup(404, {}), readSignalLookup(500, {})]) assert.equal(lookupHeadline(lookup), null);
});

// ---- the feed ----
const NOW = new Date("2026-10-03T12:00:00.000Z");
const SITE = "https://site.example";
const rss = (signals) => buildSignalsRss(signals, { site: SITE, name: "The Forward Pass", now: NOW });
const sample = (extra = {}, i = 0) => ({ ...list.signals[0], id: `g-${String(i).padStart(16, "0")}`, ...extra });

test("the feed lists signals newest first with their pages, says they are AI-generated, and escapes what it was given", () => {
  const xml = rss([sample({ headline: "Old one", publishedAt: "2026-10-03T08:00:00.000Z" }, 1), sample({ headline: "Fresh <b>one</b> & \"quoted\" 'text'", summary: "Costs < $5 & > $3.", publishedAt: "2026-10-03T11:30:00.000Z" }, 2)]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
  assert.ok(xml.indexOf("Fresh &lt;b&gt;one&lt;/b&gt; &amp; &quot;quoted&quot; &apos;text&apos;") < xml.indexOf("Old one"), "newest first, whatever the order given");
  assert.match(xml, /<description>Costs &lt; \$5 &amp; &gt; \$3\./);
  assert.match(xml, new RegExp(`<link>${SITE}/signals/g-0000000000000002</link>`));
  assert.match(xml, new RegExp(`<guid isPermaLink="true">${SITE}/signals/g-0000000000000002</guid>`));
  assert.match(xml, /<pubDate>Sat, 03 Oct 2026 11:30:00 GMT<\/pubDate>/);
  assert.match(xml, /<lastBuildDate>Sat, 03 Oct 2026 11:30:00 GMT<\/lastBuildDate>/, "the feed last changed when its newest signal arrived");
  assert.match(xml, /<atom:link href="https:\/\/site\.example\/signals\.xml" rel="self" type="application\/rss\+xml" \/>/);
  const channel = /<channel>[\s\S]*?<description>([^<]*)<\/description>/.exec(xml)?.[1] ?? "";
  assert.match(channel, /AI-generated/);
  assert.match(channel, /quote/i);
  assert.equal((xml.match(/<item>/g) ?? []).length, 2);
  assert.ok((xml.match(/<category>AI-generated<\/category>/g) ?? []).length === 2, "each item says so too, for a reader that shows only items");
  assert.doesNotMatch(xml, /&(?!(amp|lt|gt|quot|apos);)/, "no ampersand is left bare");
  const bare = xml.replace(/<\?xml[^>]*\?>/, "").replace(/<\/?[a-zA-Z][a-zA-Z:]*(?:\s[^<>]*)?\/?>/g, "");
  assert.doesNotMatch(bare, /[<>]/, "and nothing but tags carries an angle bracket");
});

test("a feed with nothing in it is still a feed, and characters XML cannot carry are dropped", () => {
  const empty = rss([]);
  assert.equal((empty.match(/<item>/g) ?? []).length, 0);
  assert.match(empty, /<lastBuildDate>Sat, 03 Oct 2026 12:00:00 GMT<\/lastBuildDate>/);
  const odd = rss([sample({ headline: "Bell\u0007 and null\u0000 and tab\tand \u{1F600}", summary: "Line one.\nLine two\u001f." })]);
  assert.doesNotMatch(odd, /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/);
  assert.match(odd, /Bell and null and tab\tand \u{1F600}/u);
  const categories = [...rss([sample({ type: "models", topics: ["Agents", "Open source"] })]).matchAll(/<category>([^<]*)<\/category>/g)].map(([, name]) => name);
  assert.deepEqual(categories, ["Models", "Agents", "Open source", "AI-generated"]);
});

// ---- where the site says it exists ----
import { LLMS_TXT } from "../src/lib/llms.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the agent guide, the sitemap, the header and the footer all lead to the signals", () => {
  for (const address of ["https://theforwardpass.net/signals)", "https://theforwardpass.net/signals.xml)", "https://theforwardpass.net/signals/corrections)"]) assert.ok(LLMS_TXT.includes(address), address);
  assert.match(LLMS_TXT, /word for word/);
  assert.match(source("src/app/sitemap.ts"), /"\/signals", "\/signals\/corrections"/);
  assert.match(source("src/app/sitemap.ts"), /loadRecentSignals\(SIGNAL_PAGES\)/);
  assert.equal((source("src/components/site-header.tsx").match(/href="\/signals"/g) ?? []).length, 2, "desktop and mobile menus");
  assert.match(source("src/components/site-footer.tsx"), /href: "\/signals"/);
  assert.match(source("src/app/llms-full.txt/route.ts"), /signalsMarkdown\(signals\.signals, SITE_URL\)/);
});

test("the feed answers 503 when the engine is not reachable, never an empty feed a reader would take for a clean slate", () => {
  const route = source("src/app/signals.xml/route.ts");
  assert.match(route, /if \(!page\) return new Response\([^)]*status: 503/s);
  assert.match(route, /"Retry-After"/);
  assert.match(route, /s-maxage=60/);
});

test("a signal's page is built on demand and kept for a minute, and an engine that is down is an error, not a page", () => {
  const page = source("src/app/(site)/signals/[id]/page.tsx");
  assert.match(page, /export const revalidate = 60;/);
  assert.match(page, /export async function generateStaticParams\(\) \{\s*return \[\];/);
  assert.match(page, /if \(found\.kind === "unavailable"\) throw unavailable\(\);/g, "in the page and in its metadata");
  assert.equal((page.match(/throw unavailable\(\)/g) ?? []).length, 2);
  assert.match(page, /signalIdFromParam\(\(await params\)\.id\)/, "an address that is not an id is refused before anything is asked");
  assert.match(page, /robots: \{ index: false, follow: false \}/, "what is retracted or missing is not indexed");
});

test("every signal read is anonymous; a page built on request reads fresh and a page that is kept reads with a minute's copy", () => {
  const client = source("src/lib/signals-client.ts");
  assert.match(client, /archiveRequest\(path, fresh \? undefined : \{ next: \{ revalidate: REVALIDATE_SECONDS \} \}, \{ anonymous: true \}\)/);
  assert.match(client, /const REVALIDATE_SECONDS = 60;/);
  assert.match(client, /\{ fresh = true \}: Freshness = \{\}/, "fresh unless a caller says otherwise");
  assert.match(client, /read\(`\/signals\/\$\{id\}`, \{ fresh: false \}\)/, "a signal's own page is the one that is kept");
  const page = source("src/app/(site)/signals/[id]/page.tsx");
  assert.match(page, /loadSignals\(\{ limit: 6 \}, \{ fresh: false \}\)/, "and everything it reads is kept with it");
  assert.doesNotMatch(source("src/app/(site)/signals/corrections/page.tsx"), /export const revalidate/, "the log is built on request");
});
