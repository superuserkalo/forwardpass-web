import { HOME_MARKDOWN, NOT_FOUND_MARKDOWN } from "@/lib/home-markdown";
import { articleMarkdown, issueMarkdown, storyMarkdown, type MarkdownCopy } from "@/lib/markdown-copies";
import { SITE_URL } from "@/lib/seo";

// Reached through the rewrite in src/proxy.ts when a client sends Accept: text/markdown to a page that
// has a Markdown copy, or to a path that does not exist.
async function copyFor(segments: string[]): Promise<MarkdownCopy | null> {
  if (segments.length === 0) return { path: "/", body: HOME_MARKDOWN };
  const [section, kind, slug, story] = segments;
  if (section !== "archive") return null;
  if (kind === "daily" && slug && story) return storyMarkdown(slug, story);
  if (kind === "daily" && slug) return issueMarkdown(slug);
  if (kind === "editorial" && slug && !story) return articleMarkdown(slug);
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const copy = await copyFor(path);
  const headers = { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" };
  if (!copy) {
    return new Response(NOT_FOUND_MARKDOWN, { status: 404, headers: { ...headers, "Cache-Control": "public, s-maxage=60" } });
  }
  return new Response(copy.body, {
    headers: {
      ...headers,
      Link: `<${SITE_URL}${copy.path}>; rel="canonical"`,
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
