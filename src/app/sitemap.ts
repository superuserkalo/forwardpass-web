import type { MetadataRoute } from "next";
import { loadEditorial } from "@/lib/feed";
import { SITE_URL } from "@/lib/seo";

// The archive API reads request cookies; rendering per request also keeps new articles listed.
export const dynamic = "force-dynamic";

const PAGES = ["/", "/archive", "/archive?section=editorial", "/pricing", "/collaborate", "/privacy", "/imprint"];

// Editorial articles are public and indexable; daily and weekly editions are session-gated and left out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pieces, source } = await loadEditorial();
  const articles = source === "api" ? pieces.filter((piece) => piece.href.startsWith("/archive/editorial/")) : [];
  return [
    ...PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...articles.map((piece) => ({
      url: `${SITE_URL}${piece.href}`,
      lastModified: piece.publishedAt,
    })),
  ];
}
