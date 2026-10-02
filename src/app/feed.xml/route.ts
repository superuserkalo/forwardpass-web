import { loadEditionText, publicDailyDates } from "@/lib/archive-viewer";
import { loadEditorial, outlineEdition } from "@/lib/feed";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { stripInlineMarkdown } from "@/lib/story-parse";

const ISSUES = 20;

type Item = { title: string; link: string; date: string; description: string; image: string | null; category: string };

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const absolute = (url: string) => (url.startsWith("/") ? `${SITE_URL}${url}` : url);

async function issueItems(): Promise<Item[]> {
  const dates = (await publicDailyDates()).slice(0, ISSUES);
  const items = await Promise.all(
    dates.map(async (date): Promise<Item | null> => {
      const edition = await loadEditionText("daily", date, { anonymous: true });
      if (edition?.status !== 200) return null;
      const outline = outlineEdition("daily", date, edition.text);
      return {
        title: outline.title,
        link: `${SITE_URL}/archive/daily/${date}`,
        date: `${date}T07:00:00Z`,
        description: stripInlineMarkdown(outline.preamble.split(/\n\s*\n/)[0] ?? "") || outline.lead || "",
        image: edition.image ?? outline.heroImage,
        category: "Daily issue",
      };
    }),
  );
  return items.filter((item): item is Item => item !== null);
}

async function articleItems(): Promise<Item[]> {
  const { pieces, source } = await loadEditorial();
  if (source !== "api") return [];
  return pieces
    .filter((piece) => piece.href.startsWith("/archive/editorial/"))
    .map((piece) => ({
      title: piece.title,
      link: `${SITE_URL}${piece.href}`,
      date: piece.publishedAt,
      description: piece.dek,
      image: piece.image,
      category: "Editorial",
    }));
}

function itemXml(item: Item): string {
  return [
    "    <item>",
    `      <title>${escape(item.title)}</title>`,
    `      <link>${escape(item.link)}</link>`,
    `      <guid isPermaLink="true">${escape(item.link)}</guid>`,
    `      <pubDate>${new Date(item.date).toUTCString()}</pubDate>`,
    `      <category>${escape(item.category)}</category>`,
    item.description ? `      <description>${escape(item.description)}</description>` : "",
    item.image ? `      <media:content url="${escape(absolute(item.image))}" medium="image" />` : "",
    "    </item>",
  ].filter(Boolean).join("\n");
}

// Free daily issues and editorial articles, newest first. Read anonymously, so the CDN may share it.
export async function GET() {
  const [issues, articles] = await Promise.all([issueItems(), articleItems()]);
  const items = [...issues, ...articles].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escape(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escape(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image><url>${SITE_URL}/logo.png</url><title>${escape(SITE_NAME)}</title><link>${SITE_URL}</link></image>
${items[0] ? `    <lastBuildDate>${new Date(items[0].date).toUTCString()}</lastBuildDate>\n` : ""}${items.map(itemXml).join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
