import { loadEditionText } from "./archive-viewer";
import { AI_ARTICLE_DISCLOSURE, AI_DISCLOSURE } from "./ai-disclosure";
import { loadEditorialArticle, outlineEdition } from "./feed";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./seo";
import { prettyDate } from "./story-parse";
import { storySlug } from "./story-slug";

// Plain Markdown copies of public pages for agents and answer engines: /archive/<kind>/<slug>.md
// and llms-full.txt. Issues are read anonymously, so a copy exists exactly for the issues anyone
// can read on the site.

// body is the page itself; title, description and updated become the frontmatter of a served copy. llms-full.txt joins the bare bodies.
export type MarkdownCopy = { path: string; body: string; title: string; description: string; updated?: string };

const yamlString = (value: string): string => JSON.stringify(value.replace(/\s+/g, " ").trim());

/** A copy as it is served: YAML frontmatter first, so an agent gets title, canonical URL and date without reading the page. */
export function markdownDocument(copy: MarkdownCopy): string {
  const lines = [`title: ${yamlString(copy.title)}`, `description: ${yamlString(copy.description)}`, `canonical: ${SITE_URL}${copy.path === "/" ? "/" : copy.path}`, ...(copy.updated ? [`updated: ${copy.updated}`] : [])];
  return `---\n${lines.join("\n")}\n---\n\n${copy.body}`;
}

export async function issueMarkdown(date: string): Promise<MarkdownCopy | null> {
  const edition = await loadEditionText("daily", date, { anonymous: true });
  if (edition?.status !== 200) return null;
  const path = `/archive/daily/${date}`;
  const title = outlineEdition("daily", date, edition.text).title;
  // The issue opens with its own title heading; the copy restates it above the byline instead.
  const text = edition.text.replace(/^<!-- story:[^>]*-->\n/gm, "").trim().replace(/^# [^\n]*\n+/, "");
  return {
    path,
    title,
    description: `${SITE_NAME} daily issue, ${prettyDate(date)}.`,
    updated: date,
    body: [`# ${title}`, `${SITE_NAME} daily issue, ${prettyDate(date)}. Source: ${SITE_URL}${path}`, `> ${AI_DISCLOSURE}`, text].join("\n\n") + "\n",
  };
}

export async function articleMarkdown(slug: string): Promise<MarkdownCopy | null> {
  const article = await loadEditorialArticle(slug);
  if (!article) return null;
  const path = `/archive/editorial/${slug}`;
  const byline = `By ${article.author}, ${SITE_NAME}, ${article.publishedAt.slice(0, 10)}. Source: ${SITE_URL}${path}`;
  const disclosure = article.ai ? `> ${AI_ARTICLE_DISCLOSURE}` : "";
  return { path, title: article.title, description: article.dek || SITE_DESCRIPTION, updated: article.publishedAt.slice(0, 10), body: [`# ${article.title}`, article.dek, byline, disclosure, article.markdown.trim()].filter(Boolean).join("\n\n") + "\n" };
}

export async function storyMarkdown(date: string, slug: string): Promise<MarkdownCopy | null> {
  const edition = await loadEditionText("daily", date, { anonymous: true });
  if (edition?.status !== 200) return null;
  const section = outlineEdition("daily", date, edition.text).sections.find((entry) => !entry.label && storySlug(entry.heading) === slug);
  if (!section) return null;
  const path = `/archive/daily/${date}/${slug}`;
  const origin = `From ${SITE_NAME} daily issue, ${prettyDate(date)} (${SITE_URL}/archive/daily/${date}). Source: ${SITE_URL}${path}`;
  return { path, title: section.heading, description: `From the ${SITE_NAME} daily issue, ${prettyDate(date)}.`, updated: date, body: [`# ${section.heading}`, origin, `> ${AI_DISCLOSURE}`, section.body.trim()].join("\n\n") + "\n" };
}
