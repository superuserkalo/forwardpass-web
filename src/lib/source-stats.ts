// The last count read from the engine, shown when its stats endpoint is unreachable or not deployed yet.
export const FALLBACK_SOURCES = 878;

// The engine started collecting on 24 Sep 2026. It collects every two hours (12 runs a day), and the
// measured run of that day read 2,702 records: 1,992 from sources and 710 community posts. Scaling
// that run to the day gives the pace below. It is an estimate, not a ledger, so swap in a figure from
// the engine if it ever reports one.
export const SCAN_START_MS = Date.UTC(2026, 8, 24);
export const SCANNED_PER_DAY = 2702 * 12;

/** Items scanned by `now`. A pure function of the clock, so every visit and reload shows the same count. */
export function scannedAt(now: number): number {
  return Math.max(0, Math.floor(((now - SCAN_START_MS) / 86_400_000) * SCANNED_PER_DAY));
}
