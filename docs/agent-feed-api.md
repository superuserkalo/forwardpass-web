# Agent API handoff: feed, editorial and votes

Give this file to the agent working in the Forward Pass agent repo. The website
already calls these endpoints. Until they respond, it falls back to parsing
edition markdown (feed) or shows an empty state (editorial), and votes are kept
per browser.

## Shared rules

- Base URL is `FORWARDPASS_AGENT_URL`. HTTPS outside localhost.
- Every request carries `Authorization: Bearer <preferences token>` when the
  reader has a session. The token is the same signed token `/archive` already
  verifies with `PREFERENCES_SIGNING_SECRET`. Requests without it are anonymous.
- Respond with JSON. Any non-2xx status or a body that fails the shape below is
  treated as "endpoint not available" and the site falls back quietly.
- Dates are ISO 8601 strings in UTC.

## `GET /feed?limit=48`

Stories the reader is allowed to see under their tier, newest first.

```json
{
  "stories": [
    {
      "id": "daily:2026-09-24:0",
      "type": "news",
      "title": "Anthropic Now Charges Developers for Claude's Blocked Safety Refusals",
      "dek": "Refused requests are billed at input-token rates.",
      "source": { "name": "CLAUDEDEVS", "url": "https://docs.anthropic.com" },
      "topics": ["LLMs", "Security"],
      "image": "https://cdn.example.com/og/refusals.png",
      "published_at": "2026-09-24T07:00:00Z",
      "upvotes": 1429,
      "viewer_has_upvoted": false,
      "href": "/archive/daily/2026-09-24#story-0",
      "author": null,
      "section": "daily"
    }
  ]
}
```

- `type`: one of `news`, `papers`, `models`, `repos`, `editorial`.
- `topics`: names from `FEED_TOPICS` in `src/lib/story-parse.ts`. Unknown names
  are dropped.
- `image`: an absolute URL (the source's Open Graph image is ideal) or `null`.
  The site draws generated art when it is missing.
- `href`: where the story opens. Use the edition anchor (`#story-<index>`) so it
  lands on the right section of the archive page.
- `viewer_has_upvoted`: per reader, from the bearer token. `false` when
  anonymous.

## `GET /editorial`

Long-form pieces written by the Forward Pass team.

```json
{
  "pieces": [
    {
      "id": "editorial:qwen-local-agent",
      "title": "How to Run Qwen 3.8 27B as a Local Coding Agent",
      "dek": "Pick a file, an engine and a harness for your machine.",
      "author": "ADHAM KHALED",
      "kind": "tutorial",
      "image": "https://cdn.example.com/editorial/qwen.png",
      "published_at": "2026-09-21T09:00:00Z",
      "href": "https://theforwardpass.net/archive/editorial/qwen-local-agent",
      "topics": ["LLMs", "Development"]
    }
  ]
}
```

- `kind`: one of `deep-dive`, `tutorial`, `opinion`.

## `POST /votes`

Idempotent. The client sends the state it wants, not a toggle, so retries and
double clicks are safe.

Request:

```json
{ "id": "daily:2026-09-24:0", "voted": true }
```

Response:

```json
{ "id": "daily:2026-09-24:0", "upvotes": 1430, "viewer_has_upvoted": true }
```

- Require the bearer token. Return `401` for anonymous requests. The site keeps
  anonymous votes in the browser.
- Store one row per `(reader_email, story_id)`. `voted: true` inserts, `voted:
  false` deletes. Return the fresh total.
- Reject unknown story ids with `404`.
- Rate limit per reader (for example 60 writes a minute).

## Acceptance checks

1. `GET /feed` returns stories and the archive shows real counts instead of `0`.
2. Upvoting in two browsers signed in as different readers adds 2 to the count.
3. Upvoting twice with `voted: true` keeps the count the same.
4. `GET /editorial` returning pieces fills the Editorial tab.
