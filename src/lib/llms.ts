// The agent guide served at /llms.txt and at the top of /llms-full.txt.
export const LLMS_TXT = `# The Forward Pass

> The Forward Pass is a daily intelligence newsletter for people who build with AI. It covers AI engineering, with a news archive and editorial articles.

The canonical website is https://theforwardpass.net. The free plan provides a general daily issue. Personal provides an issue based on the reader's interests. Professional adds weekly research on the reader's brief. Read the pricing page for current prices, trial terms, and archive access.

Daily issues are written by AI models and every fact is checked against its cited source; no human edits an issue before it is sent. The about page explains the process. The Sunday deep dive and the monthly data report in the editorial archive are written the same way, bylined to The Forward Pass research desk; the monthly report's numbers are The Forward Pass's own measurements of GitHub stars and Hacker News discussion. Pieces written by people carry their author's name.

Live signals are short items about what labs, repositories and papers publish, usually written within minutes of the source. Every fact in a signal comes with a line quoted from its source and found word for word in it, signals are written by AI models and no human edits them, and a correction or retraction is logged in public. Each signal has its own page at /signals/<id>, which is the URL to cite, and the signals page also shows how many signals were published, how soon after their source and how many needed correcting.

Start with the public archive for published coverage. Use the article's URL and publication date when citing it. Follow linked original sources when checking research or product claims. News describes events at publication time and may have changed since then.

Each featured story in a daily issue has its own page at /archive/daily/<date>/<story>, which is the best URL to cite for that story. Every free daily issue, story and editorial article has a plain Markdown copy: add .md to its URL, for example https://theforwardpass.net/archive/daily/2026-10-02.md. Archive content can depend on the reader's session and subscription. A sign-in, upgrade, or unavailable notice is not the article's content. Personal editions and account preferences are not public reference material.

## Read

- [Home](https://theforwardpass.net/): Newsletter overview and coverage.
- [About](https://theforwardpass.net/about): What is covered and how each issue is collected, written and checked.
- [News archive](https://theforwardpass.net/archive): Published stories with links to each daily issue and its sources.
- [Live signals](https://theforwardpass.net/signals): The latest checked signals, newest first, with the scorecard and how a signal is checked.
- [Signals feed](https://theforwardpass.net/signals.xml): RSS feed of the latest signals.
- [Signal corrections](https://theforwardpass.net/signals/corrections): Every correction and retraction of a signal, with what it said before.
- [Editorial archive](https://theforwardpass.net/archive?section=editorial): Deep dives, tutorials and opinion pieces.
- [Full text](https://theforwardpass.net/llms-full.txt): This guide plus the latest signals, the latest free daily issues and every editorial article in Markdown.
- [RSS feed](https://theforwardpass.net/feed.xml): Free daily issues and editorial articles, newest first.
- [Pricing](https://theforwardpass.net/pricing): Current plans, features, prices, trial terms, and archive access.
- [Agent access](https://theforwardpass.net/agents): Active Personal trial readers and Personal and Professional subscribers can create a revocable read-only MCP key. The 14-day Personal trial includes 500 free credits total, MCP and code mode, with no payment required. Trial credits do not reset monthly; access ends with the trial. Trial readers cannot buy credits or enable auto-refill. Paid Personal includes 500 credits per calendar month; Professional includes 2,500. One successful get_updates, search_coverage or get_story call costs one credit. The code tool runs server-side JavaScript using codemode.get_updates, codemode.search_coverage and codemode.get_story; each successful underlying call costs one credit even if the script later fails. Code mode allows 20 coverage calls and 20 seconds, with no network or billing access and no extra execution credit fee. Connection setup and failed underlying calls are free. Purchased credits carry forward. Only the human account owner may buy credits or authorize auto-refill. Use a client that supports authorization headers. Coverage updates with daily publication, not in real time. Keys belong in client configuration, never prompts or URLs.

## Optional

- [Advertise](https://theforwardpass.net/advertise): Advertising and sponsorship information.
- [Privacy](https://theforwardpass.net/privacy): How subscriber data is handled.
- [Imprint](https://theforwardpass.net/imprint): Publisher information.
- [Sitemap](https://theforwardpass.net/sitemap.xml): XML index of public pages, free daily issues, their stories, editorial articles and the latest signals.
- [Crawler rules](https://theforwardpass.net/robots.txt): Crawl permissions for automated clients.
`;
