import { articleMarkdown, issueMarkdown } from "@/lib/markdown-copies";
import { SITE_URL } from "@/lib/seo";

// Served at /archive/<kind>/<slug>.md through the rewrite in next.config.ts. The Link header
// points search engines at the HTML page so the copy never competes with it.
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  const copy = kind === "daily" ? await issueMarkdown(slug) : kind === "editorial" ? await articleMarkdown(slug) : null;
  if (!copy) return new Response("Not found", { status: 404 });
  return new Response(copy.body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${SITE_URL}${copy.path}>; rel="canonical"`,
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
