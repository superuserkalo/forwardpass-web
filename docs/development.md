# Development and configuration

## Install and run

Use Node.js 22.13 or newer for the TypeScript test commands below. Next.js declares Node.js 20.9 or newer, but that minimum does not cover these test commands. Dependencies are locked in `package-lock.json`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Next.js loads `.env.local`. Standalone setup scripts require `--env-file=.env.local`. Neither tests nor the fixture archive needs production credentials.

Before changing Next.js code, read the relevant guide shipped in `node_modules/next/dist/docs/`, as required by `AGENTS.md`. This repository prohibits TypeScript `any`.

## Environment variables

| Variable | Consumer and purpose |
| --- | --- |
| `RESEND_API_KEY` | Contacts, account-link emails, reading briefs, paid status and inquiries |
| `WORKOS_API_KEY`, `WORKOS_CLIENT_ID` | Matching WorkOS environment credentials, server only |
| `WORKOS_COOKIE_PASSWORD` | At least 32 random characters; encrypts managed sessions and auth state |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Registered callback, `http://localhost:3000/auth/callback` locally and `https://theforwardpass.net/auth/callback` in production |
| `PREFERENCES_SIGNING_SECRET` | At least 32 characters; signs email links, reader sessions and internal credit fulfillment. Must match the engine |
| `FORWARDPASS_AGENT_URL` | Engine origin for content, agent management, credits and chat. HTTPS required outside loopback development |
| `NEXT_PUBLIC_SITE_URL` | Account-email origin and additional production Turnstile hostname checks; use `http://localhost:3000` for local email links |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public widget key for legacy signup/sign-in, unsubscribe-link requests and contact forms |
| `TURNSTILE_SECRET_KEY` | Server verification; protected forms fail closed when missing or invalid |
| `POLAR_ACCESS_TOKEN` | Checkout, customer-state reconciliation and credit orders |
| `POLAR_WEBHOOK_SECRET` | Standard Webhooks verification at `/api/polar/webhook` |
| `POLAR_PRODUCT_PERSONAL_MONTHLY`, `POLAR_PRODUCT_PERSONAL_YEARLY` | Personal recurring product IDs |
| `POLAR_PRODUCT_PROFESSIONAL_MONTHLY`, `POLAR_PRODUCT_PROFESSIONAL_YEARLY` | Professional recurring product IDs |
| `POLAR_PRODUCT_AGENT_CREDITS` | One-time 1,000-credit product ID; must match the engine |
| `PUBLIC_SITE_URL` | Optional credit-checkout return origin in `agent-billing.ts`; defaults to `https://theforwardpass.net`. Distinct from `NEXT_PUBLIC_SITE_URL` |
| `POLAR_ORGANIZATION_ID` | Optional override used only by `scripts/setup-agent-credits.mjs` |
| `FORWARDPASS_DEMO_TIER` | Development archive fixture tier, `free`, `personal` or `professional`; default Professional |

`.env.example` is a starter template. It does not currently list the last four variables. Add them to `.env.local` when needed. Keep secrets in local/hosting environment storage. `NEXT_PUBLIC_` values are public and bundled for the browser.

Use paired development Turnstile site/secret keys for local form checks. The template's site key belongs to the production widget. Production verifies the form action and hostname against `theforwardpass.net`, the configured site hostname and their `www` variants. Preview forms need matching hostname configuration and widget registration.

## Fixtures and engine integration

Fixtures activate only when `NODE_ENV` is `development` and `FORWARDPASS_AGENT_URL` is empty. They cover news, editorial and daily/weekly archive examples. The demo tier changes archive UI access, not real account permissions. Signals have test contract fixtures but no equivalent page fallback.

To connect a local engine, run its `npm run dev` in the sibling repository and set this website's engine URL to the loopback URL printed by Wrangler. Use matching signing secrets for authenticated integration. The engine needs its own bindings and secrets; website variables alone do not configure it.

## Account and payment setup

Configure WorkOS using [WorkOS setup](workos-setup.md). All four WorkOS variables must be present before new authentication is available. WorkOS sends the authentication codes; Resend remains the reader/contact and newsletter service. The shared signing secret still authorizes server-to-Worker requests and existing email links.

Register contact properties before onboarding and account links:

```bash
node --env-file=.env.local scripts/setup-contact-properties.mjs
```

This writes missing string properties to Resend and rejects incompatible types. It includes profile, plan/trial and all link-cooldown fields. Newsletter segment/topic IDs are in `src/lib/newsletter.ts`; the advertiser segment and inquiry sender are in `src/lib/forward-pass.ts`; account-email sender is in `src/lib/link-email.ts`. Align the engine's audience configuration.

Configure four Polar recurring products with the website's USD/EUR prices and map their IDs to the plan variables. Displayed amounts live in `src/lib/pricing.ts`; changing product IDs does not change those amounts.

Inspect the credit product with:

```bash
node --env-file=.env.local scripts/setup-agent-credits.mjs
```

This checks existing prices and tax treatment. Adding `--apply` creates a missing product. Copy the returned ID into website and engine settings.

Register the canonical, non-redirecting `/api/polar/webhook` endpoint for `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.uncanceled`, `subscription.revoked`, `order.paid` and `order.refunded`.

Auto-refill also requires Polar organization approval, an engine Polar secret and `POLAR_OFF_SESSION_ENABLED=true`. The checked-in engine flag is `false`.

## Checks

```bash
npm test
node --experimental-strip-types --test scripts/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

`npm test` covers only `tests/`. The separate `scripts/` suite covers signup, sessions, onboarding, billing and other library behavior using mocked dependencies and TypeScript loading. `npm run build -- --webpack` selects Webpack explicitly. `npm run start` serves a completed production build. Production builds do not activate fixtures and may read public engine content.

Browser acceptance includes Google and email-code callbacks, sign-out, returning-reader state, explicit newsletter consent, checkout identity, legacy/expired links, archive restrictions, standalone and modal inquiry pages, evidence/correction pages and provider connections. Use a separate WorkOS staging environment and controlled inboxes for email actions; real submissions can send email or create contacts.

## Deploy

Deploy this repository to the website's Vercel project with its environment variables. Deploy the sibling Worker independently with its scripts and `wrangler.jsonc`. Align engine URL, signing secret, audience and product mappings.

There is no checked-in GitHub Actions deployment workflow. Git-triggered production deployments depend on hosting configuration. For CLI deployment, confirm project ownership, use `npx --yes vercel` for preview or `npx --yes vercel --prod` for production, and wait for Ready. A website deployment does not deploy the engine or configure Resend, Polar or chat apps.
