import { COVERAGE } from "./coverage";
import { PLAN_COMPARISON, PRICE_OPTIONS } from "./pricing";
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

// The requested path is deliberately not echoed: it is attacker-controlled text in a body that agents read.
export const NOT_FOUND_MARKDOWN = `# Not found

No page exists at this address on ${SITE_NAME}. Start from the [home page](${SITE_URL}/), the [agent guide](${SITE_URL}/llms.txt) or the [sitemap](${SITE_URL}/sitemap.xml) to find what you were looking for.
`;

const cell = (value: string): string => value.replace(/\|/g, "\\|");
const COMPARISON_ROWS = PLAN_COMPARISON.map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n");

// Markdown copy of the pricing page, also served at /pricing.md.
export const PRICING_MARKDOWN = `# ${SITE_NAME} pricing

A free daily issue for everyone. A personal issue written to your interests from ${PRICE_OPTIONS.personal.monthly.usd}/month. Source: ${SITE_URL}/pricing

## Plans

| Plan | Monthly | Yearly | What it adds |
| --- | --- | --- | --- |
| Free | $0 | $0 | The general daily issue, curated AI-engineering sources and full editorial access. Daily issues are sponsored. |
| Personal | ${PRICE_OPTIONS.personal.monthly.usd} (${PRICE_OPTIONS.personal.monthly.eur}) | ${PRICE_OPTIONS.personal.yearly.usd} (${PRICE_OPTIONS.personal.yearly.eur}) | A daily issue shaped by your interests, ad-free, with an editable brief, a links-only option, MCP and code mode, and 500 agent credits per month. |
| Professional | ${PRICE_OPTIONS.professional.monthly.usd} (${PRICE_OPTIONS.professional.monthly.eur}) | ${PRICE_OPTIONS.professional.yearly.usd} (${PRICE_OPTIONS.professional.yearly.eur}) | Everything in Personal, plus weekly deep research on your interests, 2,500 agent credits per month and priority support. |

Yearly billing saves 16%. Prices are shown in US dollars with the euro price in brackets.

## Free trial

Personal has a 14-day free trial that needs no payment. The trial includes MCP, code mode and 500 agent credits in total; the credits do not reset monthly. Credit top-ups, 1,000 credits for $5, are available with a paid plan.

## Compare plans

| Feature | Free | Personal | Professional |
| --- | --- | --- | --- |
${COMPARISON_ROWS}

## Related

- [Agent access](${SITE_URL}/agents): Read-only MCP keys, credits and code mode for subscribers.
- [Agent guide](${SITE_URL}/llms.txt): When to use The Forward Pass and how an agent should call it.
`;
