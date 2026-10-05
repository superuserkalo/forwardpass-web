# Reader API: archive, feed, editorial, votes and signals

The website reads these routes from the Cloudflare engine origin in `FORWARDPASS_AGENT_URL`. The engine implementation is now `src/api/reader.ts`, `src/api/signals.ts` and `src/lib/reader-feed.ts` in the sibling `forwardpass` repository. References to the former `agent/channels/reader.ts` runtime are historical.

`src/lib/archive-client.ts` attaches a verified reader session as `Authorization: Bearer <token>` for account-aware reads. Requests are uncached in Next.js unless the caller explicitly requests revalidation. Public discovery and signals reads use anonymous access.

## Routes

| Engine route | Website consumer |
| --- | --- |
| `GET /archive` | Tier plus accessible daily/weekly date lists |
| `GET /archive/daily/<date>`, `GET /archive/weekly/<date>` | Edition Markdown; daily responses can include `x-cover-image` and `x-story-images` |
| `GET /feed?limit=48` | Archive news and edition story counts through `feed.ts` |
| `GET /editorial`, `GET /editorial/<slug>` | Editorial listings and individual article Markdown |
| `POST /votes` | `votes.ts`, body `{ id, voted }` |
| `GET /images/<path>` | Validated website `/media/<path>` image proxy |
| `GET /stats` | Public source counts |
| `GET /signals?limit=50&type=<type>&before=<cursor>` | Public signals list and signals RSS |
| `GET /signals/<id>` | Evidence page; live/corrected record or retraction payload |
| `GET /signals/stats` | Signals scorecard |
| `GET /corrections` | Public correction and retraction log |

The engine also exposes account/chat/MCP APIs; see [agent access](agent-access.md) and [chat delivery](chat-delivery.md).

## Story identity and links

| ID | Meaning |
| --- | --- |
| `daily:<date>:s-<16 hex digits>` | Stable story record in a version-2 issue, including quick-signal records |
| `daily:<date>:<n>` | Legacy positional story ID or frontend edition-parser fallback |
| `daily:<date>:signal:<n>` | Legacy quick signal |
| `daily:<date>`, `weekly:<date>` | Whole-edition vote IDs |
| `editorial:<slug>` | Editorial article |
| `g-<16 hex digits>` | Public live signal, separate from edition story/vote IDs |

Version-2 featured feed stories link to `/archive/daily/<date>/<story-slug>`. Quick-signal feed records link to their source. Daily Markdown can carry `<!-- story:s-… -->` markers, which the parser uses for stable anchors and votes. Legacy/fallback stories retain `#story-<n>` anchors. Do not derive a vote ID from list position when a stable record ID exists.

## Access, failures and development

The engine grants six months of daily archive to Free, twelve to Personal and twenty-four to Professional. Weekly access is restricted to Professional, but the current handler returns 404 with no reader edition after authorization. Public Sunday editorial deep dives are separate articles.

When the structured feed is unavailable or empty, `loadFeed` parses up to twelve accessible daily editions and initializes counts to zero. Structured topics map to website topics; absent topics are inferred from text. Editorial has no edition-parser fallback.

If vote synchronization fails, including anonymous 401 responses, the website retains the vote locally in the browser. That does not establish a persisted server vote. Invalid vote input returns unavailable.

Without an engine URL in development, fixtures cover feed, editorial and archive. `FORWARDPASS_DEMO_TIER=free|personal|professional` selects archive UI access. Fixtures are disabled in production and do not simulate the signals API.

## Public signals

Signals reads are anonymous. The engine responses disclose AI generation with `X-AI-Generated: true`. Website schemas in `src/lib/signals.ts` require evidence fields, including at least one quoted fact for a full record. Contract fixtures in `tests/fixtures/signals/` capture seeded engine responses; refresh them when the contract changes.

- `/signals/<id>` remains the citation URL when a headline changes.
- List, log, stats and feed reads are fresh at the website layer. The engine uses a one-minute edge cache.
- Individual signal reads request 60-second Next.js revalidation. Existing cached records can survive an upstream outage; uncached unavailable records are handled as unavailable.
- The engine returns HTTP 410 for a retracted signal. The website keeps an explanatory page and excludes it from indexing.
- The checked-in engine flag `FORWARDPASS_SIGNALS_ENABLED=false` disables scheduled publication. API/UI support does not prove publication is enabled in production.

## Publishing editorial

Run in the engine repository:

```bash
npm run articles -- publish path/to/piece.md
```

This publishes content. Inspect the engine's `scripts/articles.mjs` and current editorial docs for front matter and operational requirements before using it. Website Markdown rewrites expose daily issues, individual daily stories and editorial articles; they do not expose weekly editions.
