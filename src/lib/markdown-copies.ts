import { loadEditionText } from "./archive-viewer";
import { AI_DISCLOSURE } from "./ai-disclosure";
import { loadEditorialArticle, outlineEdition } from "./feed";
import { SITE_NAME, SITE_URL } from "./seo";
import { prettyDate } from "./story-parse";

// Plain Markdown copies of public pages for agents and answer engines: /archive/<kind>/<slug>.md
// and llms-full.txt. Issues are read anonymously, so a copy exists exactly for the issues anyone
// can read on the site.

export type MarkdownCopy = { path: string; body: string };

export async function issueMarkdown(date: string): Promise<MarkdownCopy | null> {
  const edition = await loadEditionText("daily", date, { anonymous: true });
  if (edition?.status !== 200) return null;
  const path = `/archive/daily/${date}`;
  const title = outlineEdition("daily", date, edition.text).title;
  // The issue opens with its own title heading; the copy restates it above the byline instead.
  const text = edition.text.replace(/^<!-- story:[^>]*-->\n/gm, "").trim().replace(/^# [^\n]*\n+/, "");
  return {
    path,
    body: [`# ${title}`, `${SITE_NAME} daily issue, ${prettyDate(date)}. Source: ${SITE_URL}${path}`, `> ${AI_DISCLOSURE}`, text].join("\n\n") + "\n",
  };
}

export async function articleMarkdown(slug: string): Promise<MarkdownCopy | null> {
  const article = await loadEditorialArticle(slug);
  if (!article) return null;
  const path = `/archive/editorial/${slug}`;
  const byline = `By ${article.author}, ${SITE_NAME}, ${article.publishedAt.slice(0, 10)}. Source: ${SITE_URL}${path}`;
  return { path, body: [`# ${article.title}`, article.dek, byline, article.markdown.trim()].filter(Boolean).join("\n\n") + "\n" };
}
