import type { MetadataRoute } from "next";
import { publicDailyDates } from "@/lib/archive-viewer";
import { loadEditorial, remoteFeedStories } from "@/lib/feed";
import { SITE_URL } from "@/lib/seo";

// The archive API reads request cookies; rendering per request also keeps new pages listed.
export const dynamic = "force-dynamic";

const PAGES = ["/", "/about", "/archive", "/archive?section=editorial", "/pricing", "/collaborate", "/contact", "/privacy", "/terms", "/imprint"];

// Free daily issues inside the public archive window, their stories and every editorial article. Weekly
// research and older issues need a subscription, so they stay out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ pieces, source }, dates, feed] = await Promise.all([loadEditorial(), publicDailyDates(), remoteFeedStories(200)]);
  // Featured stories of the latest issues have their own pages; older ones stay linked from their issue.
  const stories = (feed ?? []).filter((story) => /^\/archive\/daily\/\d{4}-\d{2}-\d{2}\/[a-z0-9-]+$/.test(story.href));
  const articles = source === "api" ? pieces.filter((piece) => piece.href.startsWith("/archive/editorial/")) : [];
  return [
    ...PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...dates.map((date) => ({ url: `${SITE_URL}/archive/daily/${date}`, lastModified: `${date}T07:00:00Z` })),
    ...stories.map((story) => ({ url: `${SITE_URL}${story.href}`, lastModified: story.publishedAt })),
    ...articles.map((piece) => ({ url: `${SITE_URL}${piece.href}`, lastModified: piece.publishedAt })),
  ];
}
