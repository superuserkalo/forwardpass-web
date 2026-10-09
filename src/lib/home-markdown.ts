import { COVERAGE } from "./coverage";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./seo";

// Markdown copy of the homepage, served when a client asks for Accept: text/markdown at /.
export const HOME_MARKDOWN = `# ${SITE_NAME}: What's changing in AI engineering

${SITE_DESCRIPTION} A free daily AI-generated briefing on what's changing in AI engineering, delivered to Email, Slack, Discord and Telegram, and available to an AI agent over MCP. Source: ${SITE_URL}

## What you'll get

Important developments, why they matter, and primary sources.

${COVERAGE.map(({ name, leaves }) => `- **${name}**: ${leaves.join(", ")}`).join("\n")}

## Read it

- [News archive](${SITE_URL}/archive): Published daily issues and stories, each with its sources.
- [Live signals](${SITE_URL}/signals): The latest checked signals, newest first.
- [Pricing](${SITE_URL}/pricing): Plans, trial terms and archive access.
- [About](${SITE_URL}/about): How each issue is collected, written and checked.
- [Agent access](${SITE_URL}/agents): A revocable read-only MCP key for the coverage.
- [Agent guide](${SITE_URL}/llms.txt): When to use The Forward Pass and how an agent should call it.
- [Full text](${SITE_URL}/llms-full.txt): The guide, latest signals, latest free issues and every editorial article in Markdown.
`;

export function notFoundMarkdown(path: string): string {
  return `# Not found

No page exists at \`${path}\` on ${SITE_NAME}. Start from the [home page](${SITE_URL}/), the [agent guide](${SITE_URL}/llms.txt) or the [sitemap](${SITE_URL}/sitemap.xml) to find what you were looking for.
`;
}
