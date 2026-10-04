import { publicDailyDates } from "@/lib/archive-viewer";
import { loadEditorial } from "@/lib/feed";
import { LLMS_TXT } from "@/lib/llms";
import { articleMarkdown, issueMarkdown, type MarkdownCopy } from "@/lib/markdown-copies";
import { SITE_URL } from "@/lib/seo";
import { signalsMarkdown } from "@/lib/signals";
import { loadSignals } from "@/lib/signals-client";

const ISSUES = 7;

// llms.txt plus the latest signals, the full text of the latest free issues and every editorial article, so an
// agent can load the publication in one request.
export async function GET() {
  const [dates, editorial, signals] = await Promise.all([publicDailyDates(), loadEditorial(), loadSignals({ limit: 50 })]);
  const slugs = editorial.source === "api" ? editorial.pieces.flatMap((piece) => piece.href.match(/^\/archive\/editorial\/([^/]+)$/)?.[1] ?? []) : [];
  const copies = await Promise.all([...dates.slice(0, ISSUES).map(issueMarkdown), ...slugs.map(articleMarkdown)]);
  const sections = copies.filter((copy): copy is MarkdownCopy => copy !== null).map((copy) => copy.body.trim());
  const body = [LLMS_TXT.trim(), ...(signals?.signals.length ? [signalsMarkdown(signals.signals, SITE_URL)] : []), `## Latest daily issues and editorial articles (${sections.length})`, ...sections].join("\n\n---\n\n") + "\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
