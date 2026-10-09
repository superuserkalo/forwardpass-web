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

Prices are in US dollars, with the euro price in brackets. Yearly billing saves 16%. Subscriptions can be cancelled any time from the billing portal.

## Plans at a glance

| Plan | Monthly | Yearly | Best for |
| --- | --- | --- | --- |
| Free | $0 | $0 | Following AI engineering with one general daily issue. |
| Personal | ${PRICE_OPTIONS.personal.monthly.usd} (${PRICE_OPTIONS.personal.monthly.eur}) | ${PRICE_OPTIONS.personal.yearly.usd} (${PRICE_OPTIONS.personal.yearly.eur}) | Readers who want the issue written around their own interests, and an agent that can read the coverage. |
| Professional | ${PRICE_OPTIONS.professional.monthly.usd} (${PRICE_OPTIONS.professional.monthly.eur}) | ${PRICE_OPTIONS.professional.yearly.usd} (${PRICE_OPTIONS.professional.yearly.eur}) | People who need weekly research on their brief and more agent credits. |
| Enterprise | Custom | Custom | Organizations that want the data, the audience or the briefing engine. Talk to us at ${SITE_URL}/contact. |

## Free

The daily view of AI engineering. $0, free forever; the daily issue is general and sponsored.

- General daily newsletter
- Curated AI-engineering sources
- Full editorial access
- 6-month archive

Join at ${SITE_URL}/welcome.

## Personal

A daily issue shaped by your interests. ${PRICE_OPTIONS.personal.monthly.usd} per month or ${PRICE_OPTIONS.personal.yearly.usd} per year. Everything in Free, plus:

- Your own issue, ad-free
- An editable brief and a links-only option, or prose
- MCP and code mode with 500 agent credits per month
- 12-month archive

Start with the 14-day free trial at ${SITE_URL}/welcome, or subscribe at ${SITE_URL}/pricing?plan=personal.

## Professional

Go deeper and keep your agents informed. ${PRICE_OPTIONS.professional.monthly.usd} per month or ${PRICE_OPTIONS.professional.yearly.usd} per year. Everything in Personal, plus:

- Weekly deep research on your interests
- 2,000 additional agent credits per month, 2,500 in total
- 24-month archive
- Priority support

Subscribe at ${SITE_URL}/pricing?plan=professional.

## Enterprise

The data, reach and engine behind The Forward Pass, tailored to your organization: source-backed AI data and feeds, reach to the AI-engineering audience, the research and briefing engine, API and workflow integrations, and custom delivery and licensing. Contact ${SITE_URL}/contact.

## Free trial

Personal has a 14-day free trial that needs no payment. The trial includes MCP, code mode and 500 agent credits in total. Trial credits do not reset monthly, trial readers cannot buy credits or enable auto-refill, and access ends with the trial.

## Agent credits

One successful get_updates, search_coverage or get_story call costs one credit. Paid Personal includes 500 credits per calendar month and Professional 2,500. Credit top-ups of 1,000 credits for $5 are available with a paid plan, and purchased credits carry forward. Only the human account owner may buy credits. The signals MCP server is a separate, free, read-only server. Details are at ${SITE_URL}/agents.

## Compare plans

| Feature | Free | Personal | Professional |
| --- | --- | --- | --- |
${COMPARISON_ROWS}

## Related

- [Agent access](${SITE_URL}/agents): Read-only MCP keys, credits and code mode for subscribers.
- [Live signals over MCP](${SITE_URL}/signals#mcp): A free, read-only MCP server for the live signals.
- [Agent guide](${SITE_URL}/llms.txt): When to use The Forward Pass and how an agent should call it.
`;
