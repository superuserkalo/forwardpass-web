import { z } from "zod";

// Live signals as the engine serves them (GET /signals, /signals/<id>, /signals/stats, /corrections), and the few things
// the pages say about them. The engine is the authority: a signal is a short item whose every fact carries a line quoted
// from its source, so a record without one is not a record this site will show. Nothing in this file imports another
// file of the site, so the tests can load it as it is.

export const SIGNAL_TYPES = ["news", "papers", "models", "repos"] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

const TYPE_LABELS: Record<SignalType, string> = { news: "News", papers: "Papers", models: "Models", repos: "Repos" };
export const typeLabel = (type: SignalType): string => TYPE_LABELS[type];

// ---- ids

const SIGNAL_ID = /^g-[a-f0-9]{16}$/;
/** An id is exactly g- and sixteen lower-case hex digits, which is all that may ever be put in an address or a request. */
export const isSignalId = (value: string): boolean => SIGNAL_ID.test(value);
/** The id a route parameter names, or null when it is not one. */
export const signalIdFromParam = (param: string): string | null => (isSignalId(param) ? param : null);
/** A signal has one page whatever its headline says, so a correction that rewrites the headline never moves it. */
export function signalHref(id: string): string {
  if (!isSignalId(id)) throw new RangeError(`Not a signal id: ${JSON.stringify(id)}`);
  return `/signals/${id}`;
}

// ---- the contract

const time = z.iso.datetime();
const httpsUrl = z.url({ protocol: /^https$/ });
const status = z.enum(["live", "corrected", "retracted"]);
const id = z.string().regex(SIGNAL_ID);

export const signalSummarySchema = z.object({
  id,
  headline: z.string().min(1),
  summary: z.string().min(1),
  type: z.enum(SIGNAL_TYPES),
  topics: z.array(z.string()),
  publisher: z.string().min(1),
  publishedAt: time,
  sourcePublishedAt: time.nullable(),
  traction: z.string().nullable(),
  importance: z.number(),
  url: httpsUrl,
  status,
  evidenceCount: z.number().int().nonnegative(),
});
export type SignalSummary = z.infer<typeof signalSummarySchema>;

export const signalListSchema = z.object({ signals: z.array(signalSummarySchema), next: z.string().nullable() });

const patchSchema = z.object({ headline: z.string().optional(), summary: z.string().optional() });
const correctionBody = { at: time, kind: z.enum(["correction", "retraction"]), note: z.string(), before: patchSchema.nullable() };
export const signalCorrectionSchema = z.object(correctionBody);
export type SignalCorrection = z.infer<typeof signalCorrectionSchema>;
export const correctionsSchema = z.object({ corrections: z.array(z.object({ signalId: id, ...correctionBody })) });
export type LoggedCorrection = z.infer<typeof correctionsSchema>["corrections"][number];

export const signalRecordSchema = z.object({
  id,
  url: httpsUrl,
  sources: z.array(z.object({ label: z.string().min(1), url: httpsUrl })).min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  type: z.enum(SIGNAL_TYPES),
  topics: z.array(z.string()),
  project: z.string().nullable(),
  publisher: z.string().min(1),
  sourcePublishedAt: time.nullable(),
  firstSeenAt: time,
  publishedAt: time,
  traction: z.string().nullable(),
  importance: z.number(),
  /** At least one, each with the line quoted from the source. */
  facts: z.array(z.object({ fact: z.string().min(1), quote: z.string().min(1), impact: z.number() })).min(1),
  evidence: z.object({
    capturedAt: time,
    basis: z.enum(["page", "feed-summary"]),
    grounding: z.object({ verdicts: z.array(z.object({ text: z.string(), verdict: z.string(), supported: z.number() })) }),
  }),
  status,
  corrections: z.array(signalCorrectionSchema),
});
export type SignalRecord = z.infer<typeof signalRecordSchema>;

/** What the engine answers, with a 410, for a signal that was withdrawn. */
export const retractionSchema = z.object({ id, status: z.literal("retracted"), note: z.string(), retractedAt: time });
export type Retraction = z.infer<typeof retractionSchema>;

const statsWindow = z.object({
  published: z.number().int().nonnegative(),
  medianLatencyMinutes: z.number().nonnegative().nullable(),
  pageVerifiedShare: z.number().min(0).max(1).nullable(),
  corrections: z.number().int().nonnegative(),
});
export const signalStatsSchema = z.object({ last7days: statsWindow, last30days: statsWindow });
export type SignalStats = z.infer<typeof signalStatsSchema>;
export type StatsWindow = z.infer<typeof statsWindow>;

// ---- what a page says

/** A check that scored at least this was found supported by the quotes. It is the engine's own line (SIGNAL_GROUNDED), below which it publishes nothing. */
const SUPPORTED = 0.6;

export type EvidenceView = {
  basis: SignalRecord["evidence"]["basis"];
  basisNote: string;
  facts: SignalRecord["facts"];
  sources: SignalRecord["sources"];
  checked: { supported: number; total: number };
};

const BASIS_NOTES: Record<EvidenceView["basis"], string> = {
  page: "Each quote below was found word for word in the page this signal links to, and the headline and summary were checked against these quotes.",
  "feed-summary": "The page itself could not be captured, so each quote below was found word for word in the publisher's own feed summary, and the headline and summary were checked against these quotes.",
};

/**
 * What the evidence section shows, taken from the record and from nothing else: every fact and quote exactly as stored, the
 * most telling first, and how they were checked said as it was. No quote can appear here that the record does not hold.
 */
export function evidenceView(record: Pick<SignalRecord, "facts" | "sources" | "evidence">): EvidenceView {
  // The sort is stable, so facts of equal weight stay in the order the record has them.
  const facts = record.facts.map(({ fact, quote, impact }) => ({ fact, quote, impact })).sort((a, b) => b.impact - a.impact);
  const verdicts = record.evidence.grounding.verdicts;
  return {
    basis: record.evidence.basis,
    basisNote: BASIS_NOTES[record.evidence.basis],
    facts,
    sources: record.sources.map(({ label, url }) => ({ label, url })),
    checked: { supported: verdicts.filter(({ supported }) => supported >= SUPPORTED).length, total: verdicts.length },
  };
}

const STAMP = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** A time as UTC always, whoever reads it and wherever they are: "3 Oct 2026, 10:20 UTC". */
export const utcStamp = (iso: string): string => `${STAMP.format(new Date(iso))} UTC`;

/** How long ago, to the minute for the first hour: signals are live, so the minutes matter. */
export function ageLabel(iso: string, now: number): string {
  // A clock that runs ahead gives a negative age, which is also "just now": a signal is never in the future.
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** How soon after its source a signal came, only while that is a matter of hours: a day later is not live. */
export function sourceGapLabel({ sourcePublishedAt, publishedAt }: { sourcePublishedAt: string | null; publishedAt: string }): string | null {
  if (!sourcePublishedAt) return null;
  const gap = Date.parse(publishedAt) - Date.parse(sourcePublishedAt);
  if (!(gap >= 0) || gap >= 86_400_000) return null;
  if (gap < 60_000) return "within a minute of the source";
  const minutes = Math.floor(gap / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} after the source`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} after the source`;
}

export function formatLatency(minutes: number | null): string {
  if (minutes === null) return "n/a";
  if (minutes < 1) return "<1 min";
  return minutes < 120 ? `${Math.round(minutes)} min` : `${(minutes / 60).toFixed(1)} hr`;
}

/** The scorecard's rows, with "n/a" for a number there is not yet enough to give. */
export function scorecard(window: StatsWindow): Array<{ label: string; value: string }> {
  return [
    { label: "Signals", value: String(window.published) },
    { label: "Median time after the source", value: formatLatency(window.medianLatencyMinutes) },
    { label: "Checked against the source page", value: window.pageVerifiedShare === null ? "n/a" : `${Math.round(window.pageVerifiedShare * 100)}%` },
    { label: "Corrections", value: String(window.corrections) },
  ];
}

// ---- asking the engine

export const PAGE_SIZE = 50;
const MAX_PAGE = 50;
// An opaque cursor is base64url text of a bounded length. The engine says whether it is one of its own.
const CURSOR_SHAPE = /^[A-Za-z0-9_-]{16,120}$/;

export type SignalsQuery = { limit?: number; before?: string; type?: string };

/** The engine path for a page of the list. Only a type or a cursor of a shape the engine issues is passed on; anything else is no filter. */
export function signalsPath(query: SignalsQuery = {}): string {
  const wanted = Math.floor(query.limit ?? PAGE_SIZE);
  const params = new URLSearchParams({ limit: String(Number.isFinite(wanted) ? Math.min(MAX_PAGE, Math.max(1, wanted)) : PAGE_SIZE) });
  if (query.type && (SIGNAL_TYPES as readonly string[]).includes(query.type)) params.set("type", query.type);
  if (query.before && CURSOR_SHAPE.test(query.before)) params.set("before", query.before);
  return `/signals?${params}`;
}

export type SignalLookup =
  | { kind: "found"; record: SignalRecord }
  | { kind: "retracted"; retraction: Retraction }
  | { kind: "missing" }
  | { kind: "unavailable" };

/** A signal's headline for a place that names it, or null when there is none to show: a retracted signal has none. */
export const lookupHeadline = (lookup: SignalLookup): string | null => (lookup.kind === "found" ? lookup.record.headline : null);

/** What the engine's answer for one signal means. An answer that does not parse is no answer: nothing partial is ever shown. */
export function readSignalLookup(status: number, body: unknown): SignalLookup {
  if (status === 404) return { kind: "missing" };
  if (status === 200) {
    const record = signalRecordSchema.safeParse(body);
    return record.success ? { kind: "found", record: record.data } : { kind: "unavailable" };
  }
  if (status === 410) {
    const retraction = retractionSchema.safeParse(body);
    return retraction.success ? { kind: "retracted", retraction: retraction.data } : { kind: "unavailable" };
  }
  return { kind: "unavailable" };
}

const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();

/** The latest signals as Markdown for an agent that reads the site's full text, newest first, each with where it came from and where it is. */
export function signalsMarkdown(signals: SignalSummary[], site: string): string {
  const newest = [...signals].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const items = newest.map((signal) => `- **${oneLine(signal.headline)}** (${oneLine(signal.publisher)}, ${typeLabel(signal.type).toLowerCase()}, ${utcStamp(signal.publishedAt)}): ${oneLine(signal.summary)} Source: ${signal.url} Page: ${site}${signalHref(signal.id)}`);
  return [
    `## Live signals (${newest.length})`,
    "Short items from labs, repositories and papers, newest first. AI-generated: every fact is checked against a line quoted from its source, and no human edits a signal before it is published.",
    ...(items.length ? [items.join("\n")] : []),
  ].join("\n\n");
}
