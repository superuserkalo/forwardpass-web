import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { buildSignalsRss } from "@/lib/signals-rss";
import { loadSignals } from "@/lib/signals-client";

// The latest signals, newest first. Read anonymously, so the CDN may share it, and for no longer than a minute.
export async function GET() {
  const page = await loadSignals({ limit: 50 });
  // An engine that cannot be reached is not an empty feed: a reader that took it for one would drop what it already has.
  if (!page) return new Response("Signals are temporarily unavailable.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(buildSignalsRss(page.signals, { site: SITE_URL, name: SITE_NAME, now: new Date() }), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
