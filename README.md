# The Forward Pass website

The website for [The Forward Pass](https://theforwardpass.net), an AI-generated briefing on AI engineering. This repository contains the public site, reading archive, signals pages, newsletter onboarding, reader preferences, billing integration and agent-access UI.

The app uses Next.js 16.3.6 App Router, React 19.2.8, TypeScript and Tailwind CSS v4. WorkOS AuthKit handles Google, GitHub and passwordless email authentication. GitHub is configured in staging and production as described in [WorkOS setup](docs/workos-setup.md). Resend stores reader contacts and sends newsletters, legacy account links and inquiry emails. Polar handles subscriptions and agent credit purchases. The website targets Vercel. Collection, issue generation, scheduled email/chat delivery, content storage and MCP run in the separate `forwardpass` Cloudflare Workers repository, reached through `FORWARDPASS_AGENT_URL`.

## Run locally

Use Node.js 22.13 or newer for the documented TypeScript test commands, plus npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). With `FORWARDPASS_AGENT_URL` empty, development mode supplies archive and editorial fixtures. Set `FORWARDPASS_DEMO_TIER=free` or `personal` to preview restricted archive states; the default fixture tier is Professional. Fixtures do not provide signup, billing, agent credits or chat connections. Production never uses them.

For real content, configure the Worker origin. Account forms need WorkOS and Resend credentials; authenticated Worker requests also need the shared signing secret. Contact and unsubscribe-link requests use Turnstile. The environment template includes a public production Turnstile site key; replace it with a development key when testing locally. See [development and configuration](docs/development.md) and [WorkOS setup](docs/workos-setup.md).

## What is implemented

- Google, GitHub and email-code accounts with WorkOS-managed sessions; newsletter consent is applied after verified authentication. Social logins that require email verification resume hosted AuthKit. Previously issued reader and unsubscribe links remain supported.
- Onboarding and saved reading briefs, a fixed 14-day Personal trial, subscription checkout and verified Polar webhook reconciliation.
- An archive with news, topic-based "For you" ordering, editorial articles, individual story pages, images, bookmarks and votes.
- Public signals pages with source evidence, correction and retraction handling, a scorecard and RSS.
- Agent key creation, revocation, credit balances, manual credit checkout and optional auto-refill controls in preferences. The Worker implements MCP and code mode.
- Personal and shared Slack, Discord and Telegram destination controls. The Worker owns provider installation, connection commands and delivery.
- Public RSS, Markdown copies, sitemap, crawler metadata and `llms.txt`/`llms-full.txt`.

## Current implementation limits

The adjacent Worker currently sends one canonical daily issue to its opted-in email audience. Saving a reading brief and ranking the archive by topics do not establish personalized email generation. Its weekly archive handler currently returns no reader edition, although the website has a Professional weekly UI and pricing copy. See [architecture](docs/architecture.md).

The checked-in Worker configuration enables daily and editorial autopublishing, but disables scheduled signals, the fast collection lane and Polar off-session auto-refill. Website controls depend on the Worker's returned availability. Configuration and dated rollout notes do not prove today's production settings or successful delivery to a particular provider.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and newsletter signup |
| `/signup`, `/signin` | Google, GitHub or passwordless email account entry |
| `/auth/start`, `/auth/callback`, `/auth/complete` | Start AuthKit, exchange authorization codes and resume onboarding/account access |
| `/welcome` | Confirmed-reader onboarding and Personal trial |
| `/pricing`, `/agents` | Plan offers, checkout and MCP/credit guide |
| `/preferences` | Reading brief, billing portal, agent keys/credits and chat delivery |
| `/preferences/open`, `/preferences/session` | Exchange an existing emailed token for a legacy reader session |
| `/unsubscribe` | Request an emailed link or confirm a signed unsubscribe token |
| `/archive` | News and editorial listings, including the weekly UI |
| `/archive/daily/<date>`, `/archive/daily/<date>/<story>` | Published issue and individual story |
| `/archive/editorial/<slug>`, `/archive/weekly/<date>` | Editorial article and weekly reader UI |
| `/signals`, `/signals/<id>`, `/signals/corrections` | Public signals, evidence and correction log |
| `/advertise`, `/collaborate`, `/contact` | Inquiry forms, also available through modal routes |
| `/about`, `/privacy`, `/terms`, `/imprint` | Publication process and legal pages |
| `/api/polar/webhook` | Verified subscription and credit-order events |
| `/feed.xml`, `/signals.xml` | Publication and signals RSS |
| `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` | Crawler and agent discovery |
| `/archive/daily/<date>.md`, `/archive/daily/<date>/<story>.md`, `/archive/editorial/<slug>.md` | Public Markdown copies via rewrites |
| `/media/<path>` | Validated proxy for Worker-hosted images |

## Checks

```bash
npm test
node --experimental-strip-types --test scripts/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

`npm test` runs only `tests/*.test.mjs`. The separate command covers account and billing tests under `scripts/`. `npm run build -- --webpack` selects Webpack when needed; the default uses Turbopack.

Start with the [documentation index](docs/README.md) for architecture, setup, reader accounts, API, chat delivery and agent credits. Reports under `docs/research/` preserve dated findings and proposals.
