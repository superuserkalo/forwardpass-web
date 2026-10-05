# Chat delivery

Reader preferences expose personal and shared Slack, Discord and Telegram destinations. Teams remains in shared types and the engine adapters but is filtered out of new-connection controls in `src/components/chat-delivery.tsx`.

The website manages connections through the engine. It does not store provider tokens or send digests itself. The engine uses Vercel Chat SDK adapters, a `ChatRegistry` Durable Object, provider callbacks and a chat delivery Workflow. Availability comes from the engine, not from the homepage's channel names.

## Connection flow

1. Open `/preferences` with a signed reader session and choose personal inbox or shared channel/group.
2. Select an available provider. `connectChatAction` sends `{ action: "connect", platform, mode }` to `/chat-settings`.
3. Follow the returned URL or connection command before the ten-minute code expires. Slack workspace installation has a separate `install-slack` action.
4. Return to preferences. The UI polls while the code is valid and displays the pending destination.
5. Confirm daily delivery to activate it. Each destination can later be paused, resumed or disconnected independently.

Connection and update actions require a human reader session. Agent keys cannot manage destinations. Backend provider handlers enforce installation and destination permissions. Shared destinations should be connected by someone authorized to manage the channel/group.

## Engine endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /chat-settings` | Provider availability and destination list |
| `POST /chat-settings` | Connect, install Slack or update destination state |
| `/chat/oauth/slack` | Slack installation callback |
| `/chat/webhooks/<provider>` | Provider events and connection commands |
| `/chat/mcp/slack` | Slack coverage-tool integration |

The website client validates settings and connection payloads with Zod and gives requests a twelve-second timeout. Destinations have `pending`, `active`, `paused` or `disconnected` status. Disabled connection buttons mean the engine reports a provider unavailable. Transport/schema failures display an availability error.

## Delivery and consent

Chat delivery renders a compact digest from the canonical published issue with links to the full web edition. Personal and shared destinations are managed separately from newsletter email consent. Pausing chat does not unsubscribe email, and an email unsubscribe does not itself disconnect chat.

The engine owns per-edition delivery claims, retries and reconciliation. Shared messages must not include an owner's private reading-brief or unsubscribe token. See the sibling engine's `docs/chat-apps/` and `src/delivery/chat.ts` for registrations and operational details.

## Acceptance checks

For each provider and destination mode, connect and confirm a controlled destination, deliver a published edition, check story/edition links, repeat delivery to check deduplication, then verify pause, resume and disconnect. Check installation permissions and callback handling in the same flow.

An availability response or successful frontend build proves neither registration nor message delivery. The [3 October feasibility report](research/newsletter-channel-feasibility-2026-10-03.md) preserves earlier research; use current source and provider checks for acceptance.
