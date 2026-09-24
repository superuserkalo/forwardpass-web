# The Forward Pass Website

The public site for [The Forward Pass](https://forwardpass.news): a daily intelligence newsletter for people who build with AI.

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

## Paid checkout and webhook

Configure the four Polar product IDs as `POLAR_PRODUCT_PERSONAL_MONTHLY`,
`POLAR_PRODUCT_PERSONAL_YEARLY`, `POLAR_PRODUCT_PROFESSIONAL_MONTHLY`, and
`POLAR_PRODUCT_PROFESSIONAL_YEARLY`. Set `POLAR_ACCESS_TOKEN`,
`POLAR_WEBHOOK_SECRET`, and `RESEND_API_KEY` in Vercel Production. The pricing
form creates a checkout session for the selected product; no dashboard Checkout
Link is required.

Register `https://theforwardpass.net/api/polar/webhook` as a **Raw** Polar
endpoint for `subscription.active`, `subscription.updated`,
`subscription.canceled`, `subscription.uncanceled`, and `subscription.revoked`.
The route verifies Polar's Standard Webhooks signature and reads the current
customer state before updating the Resend contact. This preserves a paid period
after scheduled cancellation and handles retries and multiple subscriptions.
Professional takes priority when both paid plans are active.

Run `node --experimental-strip-types --test scripts/pricing.test.mjs`,
`npm run lint`, and `npm run build` before deployment.
