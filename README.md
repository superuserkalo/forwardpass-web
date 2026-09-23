# The Forward Pass — Website

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
