import { NextResponse, type NextRequest } from "next/server";
import { prefersMarkdown } from "@/lib/accept-markdown";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// RFC 8288 links from every page to the places an agent starts: the guide, the sitemap, the feed and the API catalog.
const LINKS = [
  `<${SITE_URL}/llms.txt>; rel="describedby"; type="text/plain"`,
  `<${SITE_URL}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
  `<${SITE_URL}/feed.xml>; rel="alternate"; type="application/rss+xml"; title="${SITE_NAME}"`,
  `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"`,
].join(", ");

// Pages that only exist as HTML: Markdown requests for them get the HTML page rather than a not-found.
const HTML_ONLY = ["/about", "/agents", "/advertise", "/collaborate", "/contact", "/privacy", "/terms", "/imprint", "/preferences", "/unsubscribe", "/welcome", "/signals"];

// True where a Markdown copy exists or the path does not exist, so the Markdown route can answer.
function markdownRouteAnswers(pathname: string): boolean {
  if (pathname === "/" || pathname === "/pricing") return true;
  if (HTML_ONLY.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
  const [, section, kind] = pathname.split("/");
  if (section !== "archive") return true;
  return kind === "daily" || kind === "editorial";
}

// Content negotiation: Accept: text/markdown gets the Markdown copy of a page, or a Markdown 404.
// Every page response varies on Accept so caches keep the two representations apart.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const wantsMarkdown = prefersMarkdown(request.headers.get("accept")) && markdownRouteAnswers(pathname);
  const response = wantsMarkdown ? NextResponse.rewrite(new URL(`/md${pathname === "/" ? "" : pathname}`, request.url)) : NextResponse.next();
  response.headers.append("Vary", "Accept");
  response.headers.append("Link", LINKS);
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|media|.*\\..*).*)"],
};
