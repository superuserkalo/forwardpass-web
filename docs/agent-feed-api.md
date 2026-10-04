# Agent API: feed, editorial and votes

The archive reads these routes from the agent at `FORWARDPASS_AGENT_URL`. They
are implemented in the agent repo (`agent/channels/reader.ts`, documented in
`docs/reader-api.md` there). Requests carry the reader's signed preferences
token as `Authorization: Bearer <token>` when they have a session.

| Route | Used by |
| --- | --- |
| `GET /feed?limit=48` | News feed (`loadFeed` in `src/lib/feed.ts`) and per-story counts on edition pages |
| `GET /editorial` | Editorial section and editorial stories in the feed |
| `GET /editorial/:slug` | `/archive/editorial/<slug>` article pages |
| `POST /votes` | Upvote buttons (`castVote` in `src/lib/votes.ts`) |
| `GET /signals?limit=50&type=&before=` | Live signals list at `/signals` and `/signals.xml` (`loadSignals` in `src/lib/signals-client.ts`) |
| `GET /signals/:id` | A signal's page at `/signals/<id>`: 200 with the record, 410 with the reason when it was retracted |
| `GET /signals/stats` | The scorecard on `/signals` |
| `GET /corrections` | The corrections log at `/signals/corrections` |

## Ids

- `daily:<date>:<n>` is the nth numbered story of a daily edition. It links to
  `/archive/daily/<date>#story-<n>`.
- `daily:<date>:signal:<n>` is a quick signal. It links to `#quick-signals`.
- `daily:<date>` and `weekly:<date>` are whole editions.
- `editorial:<slug>` is a long-form piece.

The website's edition parser (`parseEdition` in `src/lib/story-parse.ts`)
produces the same `story-<n>` anchors from the delivered plain-text format, so
feed links land on the right section.

## Fallbacks

- `/feed` unavailable: stories are parsed from edition markdown and start at
  0 upvotes. Topics are always assigned here from `FEED_TOPICS`.
- `/votes` returns anything but 200 (anonymous readers get 401): the vote is
  kept in the reader's browser instead.
- No `FORWARDPASS_AGENT_URL` in development: sample fixtures fill every
  section. `FORWARDPASS_DEMO_TIER=free|personal` previews the locked states.

## Publishing an editorial piece

In the agent repo:

```bash
npm run articles -- publish path/to/piece.md
```

See the agent's `docs/reader-api.md` for the front matter fields.

## Live signals

The routes above are public, need no token and are read anonymously by the site, so the answers are the same for everyone.
They are served by the engine's signals API (`src/api/signals.ts` in the agent repo) and every response carries
`X-AI-Generated: true`. The site reads them with zod schemas in `src/lib/signals.ts` that refuse a record without a
quoted fact, and `tests/fixtures/signals/*.json` are what the engine's own handler answered for a small seeded corpus,
so the tests fail when the site's reading drifts from the engine's. Regenerate them from the agent repo when the
contract changes.

- A signal has one page, `/signals/<id>`, whatever its headline says, so a correction never moves it.
- The list, the log and the feed are read fresh on every request (the engine's edge cache answers for a minute). A signal's
  own page is built once and kept for a minute, and is shown from its last copy when the engine cannot be reached.
- A retracted signal's page stays up with the reason and is not indexed.
