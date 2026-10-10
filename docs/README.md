# Documentation

The implementation guides below were checked against the website and adjacent `forwardpass` engine source on 5 October 2026, with account/authentication guides updated on 9 October. They describe the checkout. Live provider settings and deployment acceptance require separate checks.

| Guide | Contents |
| --- | --- |
| [Website overview](../README.md) | Features, routes and quick start |
| [Architecture](architecture.md) | Website/Worker ownership, content flow, access and implementation gaps |
| [Development and configuration](development.md) | Environment, fixtures, setup scripts, tests and deployment |
| [Newsletter and reader accounts](newsletter-and-accounts.md) | Confirmation, sign-in, sessions, trials, briefs and billing |
| [WorkOS setup](workos-setup.md) | Staging configuration, production activation and migration boundaries |
| [Reader API](agent-feed-api.md) | Archive, feed, editorial, votes, media and signals |
| [Chat delivery](chat-delivery.md) | Connections, availability and acceptance checks |
| [Agent access and credits](agent-access.md) | MCP, code mode, credit accounting and dated rollout evidence |

## Dated research

[Newsletter signup compliance](newsletter-signup-compliance.md) is legal and disclosure research from 3 October, with subsequent implementation notes. It is not a current compliance certification. The account guide documents current code behavior.

Files under `research/` preserve findings and evidence from their stated dates:

- [Channel feasibility, 3 October](research/newsletter-channel-feasibility-2026-10-03.md). The current website exposes Slack, Discord and Telegram; Teams is hidden in the connection UI.
- [Infrastructure review](research/forwardpass-infrastructure-review-2026-09-26.md) and [handoff](research/forwardpass-infrastructure-handoff-2026-09-26.md), 26 September. Their Eve runtime and pipeline proposals describe the reviewed checkout, which predates the current Worker architecture.
- [AlphaSignal research](research/alphasignal-2026-09-26.md) and [reverse engineering](research/alphasignal-newsletter-reverse-engineering-2026-09-26.md).
- [AlphaSignal account-flow probe, 9 October](research/alphasignal-auth-2026-10-09.md). Progressive email/password forms and the public Google OAuth handoff.
- [Infrastructure evidence](research/forwardpass-infra-evidence/README.md) and [AlphaSignal evidence](research/alphasignal-system-evidence/README.md).

Refresh historical assumptions against source before using them for new work.
