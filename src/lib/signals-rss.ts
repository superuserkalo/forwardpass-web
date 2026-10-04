import type { SignalSummary } from "./signals";

// The signals feed at /signals.xml. Built from plain data, so it is tested without a server. Every item and the channel say the
// text is AI-generated (EU AI Act, Article 50), since a feed reader may show either.

const TYPE_CATEGORY: Record<SignalSummary["type"], string> = { news: "News", papers: "Papers", models: "Models", repos: "Repos" };
const DISCLOSURE = "AI-generated: every fact is checked against a line quoted from its source, and no human edits a signal before it is published.";
const ITEM_NOTE = "AI-generated and checked against the source.";

// XML 1.0 cannot carry most control characters, whatever a source put in a title.
const NOT_XML = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;
const escapeXml = (text: string): string =>
  text.replace(NOT_XML, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function itemXml(signal: SignalSummary, site: string): string {
  const link = `${site}/signals/${signal.id}`;
  return [
    "    <item>",
    `      <title>${escapeXml(signal.headline)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    `      <pubDate>${new Date(signal.publishedAt).toUTCString()}</pubDate>`,
    `      <category>${TYPE_CATEGORY[signal.type]}</category>`,
    ...signal.topics.map((topic) => `      <category>${escapeXml(topic)}</category>`),
    "      <category>AI-generated</category>",
    `      <description>${escapeXml(`${signal.summary} ${ITEM_NOTE}`)}</description>`,
    "    </item>",
  ].join("\n");
}

export function buildSignalsRss(signals: SignalSummary[], { site, name, now }: { site: string; name: string; now: Date }): string {
  const newest = [...signals].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const built = newest[0] ? new Date(newest[0].publishedAt) : now;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${name}: live signals`)}</title>
    <link>${escapeXml(`${site}/signals`)}</link>
    <description>${escapeXml(`Short, quote-verified AI signals, usually published within minutes of their source. ${DISCLOSURE}`)}</description>
    <language>en</language>
    <ttl>5</ttl>
    <atom:link href="${escapeXml(`${site}/signals.xml`)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${built.toUTCString()}</lastBuildDate>
${newest.map((signal) => itemXml(signal, site)).join("\n")}${newest.length ? "\n" : ""}  </channel>
</rss>
`;
}
