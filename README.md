# The Forward Pass Website

The public site for [The Forward Pass](https://theforwardpass.net): a daily intelligence newsletter for people who build with AI.

Next.js (App Router) + Tailwind CSS v4 + Resend. Deploys to Vercel; every push to `main` deploys to production via the Vercel GitHub integration.

## Getting started

```bash
npm install
cp .env.example .env.local  # add RESEND_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable         | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `RESEND_API_KEY` | Newsletter signup, unsubscribe, inquiries  |

Segment IDs and sender addresses live in `src/lib/forward-pass.ts`.

## Routes

| Route          | Purpose                          |
| -------------- | -------------------------------- |
| `/`            | Landing page + newsletter signup + advertiser form |
| `/privacy`     | Privacy policy                   |
| `/imprint`     | Publisher information            |
| `/unsubscribe` | Self-serve unsubscribe (`?email=` pre-fills) |

## Deploy

Connect the GitHub repo to Vercel, set `RESEND_API_KEY` in the project environment, and push to `main`.

## Newsletter onboarding and Personal trial

New newsletter signups go to `/welcome`: profile, topics, format, an animated
edition preview, and the Personal trial offer. Readers can stay on Free. Personal
is complimentary for 14 days, with no Polar checkout or automatic charge.
The existing paid checkout remains available on `/pricing`.

Before deploying, register the contact properties in the same Resend account:

```bash
node --env-file=.env.local scripts/setup-contact-properties.mjs
```

The script preserves existing properties and checks their types. It creates
`interests`, `personal_plan`, `personal_status`, `personal_trial_ends_at`, and
`onboarding_profile` as strings. Trials store `personal_status=trial` and a fixed
UTC expiry. Retrying or reopening onboarding does not reset that date. Paid
`active` subscriptions take precedence. The HTTP-only, signed onboarding cookie
expires after 24 hours; it is only issued when creating a new contact. An existing
email address by itself does not authorize profile edits or a second trial.
Draft preferences stay in the current tab's session storage until completion.

**Delivery integration:** this repository stores the reading brief and trial
entitlement. It does not schedule personal issues. The adjacent `forwardpass`
repository currently generates personal issues on demand and drafts general
broadcasts. Before offering trials in production, its delivery job must fetch
contact properties, exclude unsubscribed contacts, and grant Personal only when
`personal_status` is `active`, or it is `trial` and `personal_trial_ends_at` is in
the future. `personalAccess` in `src/lib/onboarding.ts` implements this rule.
Expired trials receive the general issue; no cancellation job or billing charge
is required. `interests` stays within the personal generator's 500-character
limit. Do not send both the personal and general issue to the same reader.

Verification:

```bash
node --experimental-strip-types --test scripts/onboarding.test.mjs
node --experimental-strip-types --test scripts/pricing.test.mjs
npm run lint
npm run build
```

Browser verification can run against a local Resend fixture. Never use production
addresses for a signup test; successful signup sends a welcome email.

## Paid checkout

Polar needs four recurring products: Personal monthly, Personal yearly,
Professional monthly, and Professional yearly. Configure USD and EUR prices on
each product, then set their product IDs in the matching
`POLAR_PRODUCT_*_MONTHLY` and `POLAR_PRODUCT_*_YEARLY` environment variables.
Also set `POLAR_ACCESS_TOKEN` and `RESEND_API_KEY`. The pricing form sends one
selected product to a new Polar checkout session, so a dashboard Checkout Link
is not needed. Polar selects the buyer's applicable currency at checkout.

Set `POLAR_WEBHOOK_SECRET` and register `/api/polar/webhook` as a raw Polar
webhook endpoint for `subscription.active`, `subscription.updated`,
`subscription.canceled`, `subscription.uncanceled`, and `subscription.revoked`.
The endpoint must use the non-redirecting production URL
`https://theforwardpass.net/api/polar/webhook`. The webhook verifies Polar's
Standard Webhooks signature, then reads the customer's current Polar state before
updating their Resend contact. This preserves access during a paid cancellation
period, handles duplicate deliveries, and gives Professional priority when a
customer holds both plans. A subscription with no active Polar entitlement
removes paid access; an existing free or app-managed trial stays unchanged.
