# Agent access and credits

Implementation review: 5 October 2026. The protocol, account UI and credit policy below describe the checked-in code. Deployment IDs, provider settings, product registration and acceptance results explicitly dated 3 October are historical evidence, not a fresh production inspection. Provider pricing estimates also retain their original research date.

The current engine is the sibling `forwardpass` Cloudflare Worker. Its checked-in `POLAR_OFF_SESSION_ENABLED` flag is `false`; enable auto-refill only after the required Polar capability and engine secret are configured. The website reads actual availability from the engine. Current setup is in [development and configuration](development.md), and runtime ownership and reader-delivery limitations are in [architecture](architecture.md).

The Cloudflare engine serves `/mcp`, `/agent-access`, and the signed internal `/agent-credit-payment` endpoint. The Vercel website serves `/agents` and receives Polar webhooks at `/api/polar/webhook`.

## Offer

| Plan | Included monthly credits | Archive |
| --- | ---: | --- |
| Personal, active paid subscription | 500 | 12 months |
| Professional, active paid subscription | 2,500 | 24 months |

A one-time pack adds 1,000 credits for $5 or €5.49 before applicable tax. The created Polar product is `4c08dd9f-14b0-4a20-8e8d-ab33d71d9c9e`. The existing subscription prices are unchanged. The 14-day Personal trial includes MCP and code mode with 500 free credits total and no payment required. Credits do not reset at a calendar boundary or after key rotation. Access expires at personal_trial_ends_at; missing, malformed or expired dates deny access. Trial readers cannot spend purchased credits, buy packs or enable auto-refill. Upgrading starts the normal paid monthly allowance; trial usage remains separate.

One successful `get_updates`, `search_coverage`, or `get_story` call costs one credit. Empty successful searches and each pagination call count. Initialization, listing tools, invalid requests, missing stories, and failures do not count. Monthly credits are used first. Allowances reset on the first day of each UTC calendar month for monthly and annual subscribers. Monthly credits expire; purchased credits carry forward and require an active paid subscription to use.

Usage survives key replacement, signing-secret rotation, and tier changes. Personal and Professional share one account ledger, with the current tier's allowance minus credits already used that month. Top-ups do not extend archive access.

## Code mode

The same MCP endpoint exposes `code` alongside the three normal tools, during the Personal trial and on both paid plans. Server-side code mode works with an ordinary MCP client; a harness can also orchestrate the normal tools in its own code mode. The agent supplies an async JavaScript function and receives a concise JSON result:

```javascript
async () => {
  const page = await codemode.search_coverage({ query: "agents", limit: 3 });
  return await Promise.all(page.stories.map(async ({ id }) => {
    const story = await codemode.get_story({ id });
    return { headline: story.headline, sources: story.sources };
  }));
}
```

This example uses four credits if it returns three stories. Each successful underlying coverage call is charged even if later script execution fails. Failed calls are free; execution itself has no additional credit charge. An available credit is required to start a script. Billing and account management are never exposed to generated code.

Cloudflare's official `@cloudflare/codemode` executor creates a network-isolated Worker (`globalOutbound: null`) with no secrets, credentials, R2 or ledger bindings. A host-side dispatcher validates the same Zod input schemas, applies archive entitlements, and meters each call. Limits: 12,000 code characters, 20 attempted coverage calls, 20 seconds wall time, 50 ms CPU, 30 sandbox subrequests, and a 24 KB JSON response. Logs are bounded. Fire-and-forget work cannot spend after the script returns or its deadline expires. No scripts or logs are retained in our account ledger.

Identical scripts reuse a content-hashed Worker ID **within one account only**, preventing warm globals from crossing accounts. Globals are transient and must not be used as storage. We use the framework-independent executor because the package's MCP wrapper currently targets SDK v1 while this server uses SDK v2. See [Cloudflare code mode](https://developers.cloudflare.com/agents/tools/codemode/api-reference/) and [resource limits](https://developers.cloudflare.com/dynamic-workers/usage/limits/).

## Billing correctness

One SQLite-backed Durable Object per account reserves credits before work and settles after completion. Failed calls return their reservation. Abandoned reservations expire after five minutes. Work cannot successfully settle an expired reservation.

Polar checkout redirects never grant credits. Signed `order.paid` and `order.refunded` webhooks fetch the canonical Polar order, then send a bounded, separately signed fulfillment request to Cloudflare. Credit grants and cumulative refunds are idempotent by order ID. Refunding spent credits can leave a negative purchased balance that future credits offset. Failed fulfillment returns HTTP 503 so Polar retries.

Auto-refill is opt-in, uses the selected currency, and buys one pack when total available credits reach 50 or fewer. Readers choose a cap of 1 to 10 automatic packs per UTC calendar month. Pending and failed attempts count toward that cap. Manual purchases are separate. The ledger records a pending attempt before requesting a charge, preventing overlapping purchases. A definitive decline pauses auto-refill. An ambiguous payment pauses further charges until its paid webhook reconciles the original order. Turning auto-refill off does not cancel a payment already underway. Agent keys cannot purchase credits or change billing settings.

## Production configuration

1. Deploy the engine with the `AGENT_CODE_LOADER` Worker Loader binding, `AGENT_CREDITS` Durable Object binding and `agent-credits-v1` SQLite migration in `wrangler.jsonc`. Its product ID is already configured there.
2. Set the website's `POLAR_PRODUCT_AGENT_CREDITS` to the same product ID as the engine. The checked-in Worker uses `4c08dd9f-14b0-4a20-8e8d-ab33d71d9c9e`; the website reads its environment at runtime. This variable is absent from `.env.example`, so add it when enabling credit purchases. Keep `FORWARDPASS_AGENT_URL` pointing to the engine and the preferences signing secret identical in both runtimes.
3. The existing Polar webhook endpoint now includes `order.paid` and `order.refunded`, preserving all five subscription events. Deploy the updated frontend webhook and `/agents` page before exposing credit checkout to readers.
4. For auto-refill, Polar must enable `off_session_charges_enabled` for the organization. It was verified **disabled on 2026-10-03**. Once enabled, add `POLAR_ACCESS_TOKEN` as a Worker secret with customer read and order write access, then set the Worker's `POLAR_OFF_SESSION_ENABLED=true`. Until then, the UI offers manual top-ups and says auto-refill is unavailable. The implementation never silently substitutes automatic charges.

No subscription or payment was created during validation. The one-time product, webhook event configuration, Vercel product mapping, backend and frontend are deployed to production as of 2026-10-03. To inspect or reuse the product, run `node --env-file=.env.local scripts/setup-agent-credits.mjs` in the frontend. The script only creates a missing product with `--apply` and verifies existing prices and exclusive tax treatment before reusing it.

## Cost and verification

No MCP request runs a model or fetches an original publisher. Coverage reads at most 31 editions per search page and shares five-minute caches across readers. Entitlement and brief checks share a one-minute cache; revocation still checks R2 on every request. Successful calls require two Durable Object RPCs for reservation and settlement. Ledger queries use indexes and store counters, purchase IDs, and refill consent rather than search history.

For a deliberately uncached 31-edition page, allow up to 63 R2 reads including the key check, plus date-list requests. If the date list fits one R2 page, the current Standard storage operation rates imply roughly $0.03 in R2 operations per 1,000 such calls, before free allowances and billing-unit rounding. This is an estimate of R2 operations only, not a measured production cost or an estimate of Workers, Durable Objects, Resend, or payment fees. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), and [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/). Code-mode sandbox invocations also count toward Workers usage. Cloudflare includes 1,000 unique Dynamic Workers per month and then charges $0.002 per Worker per day. Repeating identical code within the same account reuses its ID; new scripts or accounts create new IDs. For 1,000 distinct script executions beyond the allowance, budget about $2 in creation fees plus Workers usage. See [Dynamic Workers pricing](https://developers.cloudflare.com/dynamic-workers/pricing/). Monitor actual CPU, creation counts and request usage before tuning allowances.

Validation covers allowance exhaustion, concurrent reservations, failures and abandoned calls, plan changes, calendar resets, purchase carry-forward, duplicate and out-of-order payment/refund delivery, consent and refill caps, both MCP protocols, Personal archive restrictions, code-mode validation, per-call charging, partial failures, call budgets, response bounds, account isolation and runtime-enforced network denial. Local Workers checks exercise actual SQLite Durable Objects and mocked saved-card charges. No real payment method was charged.

Backend checks: `npm test`, `npm run typecheck`, and `npm run check:worker`. Frontend checks: `npm run lint`, `npx tsc --noEmit`, `npm test`, `node --test scripts/agent-billing.test.mjs scripts/pricing.test.mjs`, and `npm run build -- --webpack`.

## Production rollout on 2026-10-03

- Cloudflare Worker: `forwardpass-engine`, version `c34b9b01-8e1e-426f-b661-e997f79dd4bf`, at https://forwardpass-engine.gantchevkaloyan.workers.dev. The SQLite Durable Object migration and code-mode Worker Loader binding are active. Existing cron schedules and Workflows remain configured.
- Vercel frontend: deployment `dpl_21c6nZiFjgh2h7wA7DNPXa9fRTtC`, status Ready, aliased to https://theforwardpass.net. Its production `FORWARDPASS_AGENT_URL` points to the Cloudflare Worker.
- Production checks exercised Personal and Professional allowances, all four MCP tools, real published coverage, isolated code execution, network denial, an empty sandbox environment, per-call credit accounting, human/agent credential separation and key revocation. The public `/agents` page visibly shows both plans, credit packs and code mode.
- Verification used temporary unsubscribed contacts outside the newsletter audience. Those contacts and keys were removed. No email was sent and no checkout, subscription or payment was created.
- Auto-refill remains disabled until Polar enables off-session charges. Manual top-ups and signed fulfillment are deployed; a real paid purchase was not performed as a test.

### Personal trial rollout — 2026-10-03

- The 14-day Personal trial includes all four MCP tools and 500 free credits total. The durable trial counter is separate from the paid monthly allowance and survives key rotation and calendar boundaries.
- Trial access requires an unexpired, valid `personal_trial_ends_at`. Its absolute expiry is checked even when entitlement is cached, and successful work cannot settle after expiry.
- Trial billing controls are hidden and rejected by the backend. Trial readers cannot spend purchased credits or initiate top-ups or auto-refill. Upgrading starts the normal paid monthly allowance.
- Cloudflare version: `947ee093-89c0-48b6-80ab-39594dd04e48`. Vercel deployment: `dpl_7sXqWAnGCxWntgrmaCWdEZ2TT8wY`, Ready and aliased to theforwardpass.net.
- Validation: 104 backend tests, 18 frontend tests, scoped TypeScript/lint checks, Worker dry run and a Next.js production build. Production trial checks exercised actual code mode, network denial, credit accounting, key rotation, billing denial, revocation and cached entitlement expiry. Temporary unsubscribed test contacts and keys were removed; no email or payment was sent.
- Unfinished chat-channel changes in the shared checkout were excluded from this release. Existing committed homepage and signup changes were preserved.
