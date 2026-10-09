import { storyMarkdown, markdownDocument } from "@/lib/markdown-copies";
import { SITE_URL } from "@/lib/seo";

// Served at /archive/daily/<date>/<story>.md through the rewrite in next.config.ts.
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string; story: string }> }) {
  const { kind, slug, story } = await params;
  const copy = kind === "daily" ? await storyMarkdown(slug, story) : null;
  if (!copy) return new Response("Not found", { status: 404 });
  return new Response(markdownDocument(copy), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${SITE_URL}${copy.path}>; rel="canonical"`,
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
