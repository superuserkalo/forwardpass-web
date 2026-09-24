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
