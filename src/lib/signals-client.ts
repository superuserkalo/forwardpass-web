import { archiveRequest } from "./archive-client";
import {
  correctionsSchema, isSignalId, readSignalLookup, signalListSchema, signalStatsSchema, signalsPath,
  type LoggedCorrection, type SignalLookup, type SignalStats, type SignalSummary, type SignalsQuery,
} from "./signals";

// Reads the engine's public signals API. Signals are the same for every reader, so every read is anonymous.
//
// A page that is rebuilt on request (the list, the log, the feed) reads fresh: the engine's own edge cache already answers
// for a minute, and a copy kept here would show the first visitor after a quiet spell what was true hours ago. A page that is
// built once and kept (a signal's own page) reads with a minute's copy, and when the minute is up and the engine cannot be
// reached the last copy is shown until it can. A page that was never built is an error, never a page that says nothing.

const REVALIDATE_SECONDS = 60;
type Freshness = { fresh?: boolean };
const read = (path: string, { fresh = true }: Freshness = {}): Promise<Response | null> =>
  archiveRequest(path, fresh ? undefined : { next: { revalidate: REVALIDATE_SECONDS } }, { anonymous: true });

async function bodyOf(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

/** A page of the list, or null when the engine cannot be reached or answers something this site does not understand. */
export async function loadSignals(query: SignalsQuery = {}, freshness: Freshness = {}): Promise<{ signals: SignalSummary[]; next: string | null } | null> {
  const response = await read(signalsPath(query), freshness);
  if (!response?.ok) return null;
  const parsed = signalListSchema.safeParse(await bodyOf(response));
  return parsed.success ? parsed.data : null;
}

/** The latest signals across pages, for the sitemap: up to `pages` pages of the newest. */
export async function loadRecentSignals(pages: number): Promise<SignalSummary[]> {
  const found: SignalSummary[] = [];
  let before: string | undefined;
  for (let page = 0; page < pages; page++) {
    const next = await loadSignals({ before });
    if (!next) break;
    found.push(...next.signals);
    if (!next.next) break;
    before = next.next;
  }
  return found;
}

export async function loadSignal(id: string): Promise<SignalLookup> {
  if (!isSignalId(id)) return { kind: "missing" };
  const response = await read(`/signals/${id}`, { fresh: false });
  return response ? readSignalLookup(response.status, await bodyOf(response)) : { kind: "unavailable" };
}

export async function loadSignalStats(): Promise<SignalStats | null> {
  const response = await read("/signals/stats");
  if (!response?.ok) return null;
  const parsed = signalStatsSchema.safeParse(await bodyOf(response));
  return parsed.success ? parsed.data : null;
}

export async function loadCorrections(): Promise<LoggedCorrection[] | null> {
  const response = await read("/corrections");
  if (!response?.ok) return null;
  const parsed = correctionsSchema.safeParse(await bodyOf(response));
  return parsed.success ? parsed.data.corrections : null;
}
