import type { MetadataRoute } from "next";
import { publicDailyDates } from "@/lib/archive-viewer";
import { loadEditorial } from "@/lib/feed";
import { SITE_URL } from "@/lib/seo";

// The archive API reads request cookies; rendering per request also keeps new pages listed.
export const dynamic = "force-dynamic";

const PAGES = ["/", "/about", "/archive", "/archive?section=editorial", "/pricing", "/collaborate", "/privacy", "/imprint"];

// Free daily issues inside the public archive window and every editorial article. Weekly
// research and older issues need a subscription, so they stay out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ pieces, source }, dates] = await Promise.all([loadEditorial(), publicDailyDates()]);
  const articles = source === "api" ? pieces.filter((piece) => piece.href.startsWith("/archive/editorial/")) : [];
  return [
    ...PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...dates.map((date) => ({ url: `${SITE_URL}/archive/daily/${date}`, lastModified: `${date}T07:00:00Z` })),
    ...articles.map((piece) => ({ url: `${SITE_URL}${piece.href}`, lastModified: piece.publishedAt })),
  ];
}
