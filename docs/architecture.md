# Architecture

Source review date: 5 October 2026; authentication updated on 9 October. The website and engine are separate applications.

## Runtime ownership

| System | Responsibilities | Entry points |
| --- | --- | --- |
| Website, this repository | Pages, server actions, reader cookie, onboarding, Polar checkout/webhooks, content rendering and image proxy | `src/app`, `src/components`, `src/lib` |
| WorkOS | Google and email-code authentication, identity verification and managed sessions | `auth-actions.ts`, `src/app/auth`, `src/proxy.ts` |
| Engine, sibling `forwardpass` repository | Collection, writing/evidence pipeline, publication, email/chat delivery, reader API, signals, MCP, credits and provider callbacks | Engine `src/worker.ts`, `src/pipeline`, `src/delivery`, `src/api` |
| Resend | Contact properties, newsletter topic/segment membership and email transport | Website account modules and engine delivery |
| Polar | Subscriptions, credit orders and customer portal | Website checkout/webhook modules; engine optional auto-refill |
| Cloudflare | Worker, Workflows, R2, SQLite Durable Objects, Worker Loader and browser rendering | Engine `wrangler.jsonc` |

The website has no issue-generation cron or model-writing pipeline. `FORWARDPASS_AGENT_URL` selects the engine. Server-side fetches accept HTTPS, with HTTP allowed only for `localhost` and `127.0.0.1`.

## Reader and content flow

Signup starts WorkOS authentication. After Google or email verification, the callback matches the reader's Resend contact by verified email and applies explicit newsletter consent. Account-only signup creates an opted-out contact outside the newsletter segment. Sign-in preserves existing briefs, trials, paid state and opt-outs. Onboarding saves profile and reading-brief properties. Polar events update paid properties after checking current customer state. The Worker reads these properties to enforce access.

The archive client resolves the verified reader session and creates a one-minute signed Bearer credential for the Worker. This preserves the engine's existing authorization contract without forwarding a WorkOS browser cookie. Existing signed reader links remain compatible. `feed.ts` prefers the structured feed and falls back to parsing accessible daily editions. `story-parse.ts` and `story-slug.ts` support issue sections, stable story markers and individual article URLs. Development can supply fixtures when no engine URL is configured.

Signals use a public contract with immutable `g-…` IDs, source evidence and correction/retraction state. List, scorecard, correction and RSS reads are fresh website requests. Individual signal reads use 60-second Next.js revalidation. Signals never use reader credentials.

Public daily Markdown, RSS, sitemap and full-text discovery read the anonymous archive window. They cannot expand daily access using the viewer's session. Media requests are anonymous and allow only recognized paths and image MIME types. Editorial articles are public in the current engine.

## Access and billing

The engine's `src/lib/archive.ts` grants six months of daily archive to Free readers, twelve to Personal and twenty-four to Professional. An unexpired Personal trial receives Personal access. Paid status and valid expiry dates decide access; an email address alone grants none.

Human reader sessions manage agent keys, billing and destinations. MCP uses a separate revocable agent key. The website receives Polar events and signs credit fulfillment for the Worker; checkout redirects do not grant credits. See [agent access](agent-access.md) and [accounts](newsletter-and-accounts.md).

## Scheduled work in the engine

`wrangler.jsonc` registers collection every two hours, daily issue production at 05:30 UTC and a fifteen-minute fast-lane cron. `src/worker.ts` starts Workflows. Publishing a daily issue can start email and chat delivery; editorial extras include a Sunday deep dive and monthly report.

Current configuration sets `FORWARDPASS_AUTOPUBLISH` and `FORWARDPASS_EDITORIAL_AUTOPUBLISH` to `true`. `FORWARDPASS_FAST_LANE_ENABLED`, `FORWARDPASS_SIGNALS_ENABLED` and `POLAR_OFF_SESSION_ENABLED` are `false`. These are source defaults, not a live deployment inspection. Autopublishing does not require the old per-edition manual approval described in earlier documentation.

## Gaps between the offer and current implementation

- Engine `src/delivery/deliver.ts` renders the saved canonical `IssueV2` for the opted-in audience, with recipient-specific account links. It does not generate a separate daily email from each saved reading brief. The website's "For you" feed orders existing stories by reader topics.
- The website has weekly listings and a weekly edition route, and pricing describes Professional weekly research. The engine's weekly archive handler currently returns 404 after Professional authorization, with "No weekly edition for this reader". The public Sunday editorial deep dive is a separate article.
- Signals pages and APIs exist, but the checked-in flag disables scheduled signal publication. A page or successful fixture test does not prove the pipeline is enabled.
- The frontend exposes Slack, Discord and Telegram according to backend availability. Teams remains in types and adapters but is filtered out of new-connection controls. A configured adapter does not prove delivery.
- Auto-refill code exists but the checked-in Worker flag disables it. Manual credit purchases require product configuration and an active paid subscription.
- `source-stats.ts` supplies a fallback source count and a time-based scanned-item estimate. These displays are not a measured processing ledger.

## Source map

| Area | Website files |
| --- | --- |
| Forms and consent | `forward-pass.ts`, `newsletter.ts`, `turnstile.ts`, `forward-pass-forms.tsx` |
| Reader session | `auth-actions.ts`, `auth-config.ts`, `account-sync.ts`, `preferences-session.ts`, `src/app/auth`, `src/proxy.ts`; legacy `link-token.ts`, `link-email.ts`, `session-exchange.ts`, `preferences-token.ts` |
| Onboarding and plans | `onboarding*.ts`, `personal-actions.ts`, `subscribers.ts`, `pricing.ts`, `polar*.ts` |
| Archive and discovery | `archive-client.ts`, `archive-viewer.ts`, `feed.ts`, `story-parse.ts`, `markdown-copies.ts`, `llms.ts`, `seo.ts` |
| Signals | `signals.ts`, `signals-client.ts`, `signals-rss.ts`, `src/components/signals` |
| Agent credits | `agent-client.ts`, `agent-actions.ts`, `agent-billing.ts`, `agent-credit-policy.ts`, `agent-access.tsx` |
| Chat | `chat-client.ts`, `chat-actions.ts`, `chat-delivery.tsx` |

Library names are under `src/lib`; component names are under `src/components`. The `(site)` route group does not add a URL segment. `@modal` supplies parallel and intercepted advertising, collaboration and contact routes. Keep standalone and modal versions aligned.
