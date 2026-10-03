# Forward Pass delivery beyond email

Implementation decision: the user selected Vercel Chat SDK and a simultaneous Slack, Discord, Telegram and Microsoft Teams release for personal and shared destinations. The phased recommendation below is the earlier research recommendation, not the agreed release scope. Current implementation, registration requirements and live acceptance checks are in `/Users/kalo/forwardpass/docs/chat-apps/README.md`. App registration and production delivery remain unverified.

Research date: 2026-10-03. Proposal only; no apps registered or messages sent. Platform findings use primary platform documentation and first-party vendor/project sources. Limits and pricing must be checked again during implementation.

## Recommendation

Generate and publish one canonical issue, then deliver an edition adapted for each selected destination. Launch Telegram personal subscriptions plus Slack and Discord shared channels first. Add Teams next, WhatsApp after template and publisher onboarding checks, and treat iMessage as a separate provider feasibility project.

Readers should be able to enable multiple destinations independently, pause a particular destination, disconnect it, and keep or disable email. Offer a compact chat digest with linked headlines and the full web issue; do not paste the email HTML into chats.

## Platform feasibility

| Channel | Connection and destination | Scheduled delivery | Main constraint |
| --- | --- | --- | --- |
| Telegram | Reader clicks Connect, opens a bot deep link containing a short-lived account-link token, then presses Start. Store the chat ID. Groups/channels are a separate administrator connection. | Yes, after the user starts the bot; group/channel posting needs access. | Ordinary messages allow 4,096 characters. Free broadcasts are approximately 30 messages/second; queue sends and honor 429s. |
| Discord | Prefer a server/channel installation or a channel webhook authorized by its administrator. Explicit reader action can establish a bot DM subscription. | Yes for authorized channels and accessible DMs. | Webhooks target channels rather than personal inboxes. Content limit 2,000 characters; up to 10 embeds with 6,000 combined characters. DM settings and platform anti-spam controls can block delivery. |
| Slack | Add to Slack through OAuth, then select a channel or opt into an app DM. Webhook installation can bind a specific selected channel. | Yes through webhook or chat.postMessage. | Workspace installation/admin policy, channel access, and approximately one message/second per channel. Use Block Kit plus short fallback text. |
| WhatsApp | Business Platform/Cloud API number, approved templates, and opt-in recipient identity. Let the user confirm the requested newsletter and frequency. | Yes with an approved template outside the rolling 24-hour customer-service window. | Budget as marketing unless Meta approves another category. Per-delivered-message fees vary by market/category; template review, quality controls, and news-publisher policy apply. |
| Microsoft Teams | Shared destination: Power Automate Workflows webhook. Product integration/personal destination: installed Teams app/notification bot with stored tenant and conversation identity. | Yes through a workflow or proactive bot messages after access is established. | Legacy Office 365 connector webhooks retired in May 2026. Workflow ownership and tenant admin policies affect continuity. |
| iMessage / Apple Messages | Apple's official business route is Messages for Business, including consented Business Updates. Third-party iMessage APIs and Mac bridges exist separately. | Business Updates are possible for supported approved use cases; a recurring editorial newsletter has not been verified as eligible. | Ordinary iMessage is not a generic public server sending API. Provider bridge restrictions can defeat passive daily subscriptions. Separate commercial and Apple eligibility review is required. |

Telegram's [bot introduction](https://core.telegram.org/bots), [deep-linking guide](https://core.telegram.org/bots/features#deep-linking), [sendMessage reference](https://core.telegram.org/bots/api#sendmessage), and [broadcast FAQ](https://core.telegram.org/bots/faq#broadcasting-to-users) establish the connection flow and limits. Standard broadcasts have no platform fee within the free rate; paid higher-throughput broadcasting exists.

Discord's [webhook reference](https://docs.discord.com/developers/resources/webhook#execute-webhook), [message reference](https://docs.discord.com/developers/resources/message#create-message), and [Create DM guidance](https://docs.discord.com/developers/resources/user#create-dm) establish rendering limits and warn against DMing everyone in a server. Make private subscriptions an explicit user action and mark an inaccessible destination disconnected instead of repeatedly retrying it.

Slack's [incoming webhook guide](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/), [chat.postMessage](https://docs.slack.dev/reference/methods/chat.postmessage), and [rate limits](https://docs.slack.dev/apis/web-api/rate-limits/) cover shared channels, app messages, and throttling. Treat workspace installations separately from newsletter reader identities.

## WhatsApp requires a dedicated onboarding gate

The [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy), updated September 23, 2026, requires opt-in, honoring opt-out, approved templates for initiated conversations and sends outside 24 hours, and registration as a Facebook News Page for organizations that primarily publish news. The newsletter's exact eligibility and ability to complete this publisher onboarding remain unresolved. The template must have an approved category and purpose; assume a newsletter is marketing for planning, rather than trying to disguise it as a transactional utility message.

[WhatsApp pricing](https://whatsappbusiness.com/products/platform-pricing/) is based on delivered messages, recipient market, and message category. No exact rate estimate is asserted here. Obtain the current rate card for actual audience countries, include any provider markup, and calculate monthly cost as recipients × editions × paid messages per edition. Prefer one approved concise template containing issue context and a read link. Do not assume arbitrary full-length text is permitted outside the service window. Exact template component limits were not verified because Meta's developer documentation returned HTTP 429.

## Teams: use current routes

Microsoft's [final retirement announcement](https://devblogs.microsoft.com/microsoft365dev/retirement-of-office-365-connectors-within-microsoft-teams/) says connector disablement ran May 18–22, 2026 and connector-based webhooks no longer function afterward. This supersedes older Microsoft Learn pages that still describe them as nearing deprecation.

The [current webhook guide](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) supports a Workflows HTTP trigger posting to a channel/chat. [Workflow ownership guidance](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/what-are-webhooks-and-connectors) explains that flows belong to users and can become orphaned; assign co-owners for a shared subscription. [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages) supports scheduled sends after installation/access, using stored tenant and conversation identities. Tenant policy and the selected Power Automate plan need validation with a test workspace. Use concise Adaptive Cards; no exact current card size limit is asserted.

## iMessage: distinguish the official business service from bridges

Apple documents [customer-started Messages for Business conversations](https://support.apple.com/en-us/102053) and [Business Updates](https://www.apple.com/legal/privacy/data/en/messages-for-business/), where a person supplies their phone number and authorization for updates. Therefore the absolute statement that businesses can never initiate any Apple Messages conversation is incorrect. Apple describes support, commerce, and purchase-related updates; those sources do not establish permission to broadcast a daily editorial newsletter. Confirm use-case eligibility with Apple/an approved messaging provider before offering this channel.

Vendor [Blooio's REST API](https://docs.blooio.com/guides/imessage-rest-api) claims ordinary iMessage sending through real Apple infrastructure. Its [messaging safety guide](https://docs.blooio.com/guides/messaging-safety) limits a new recipient to three consecutive plain-text sends before a response/reaction, with further protection based on conversation activity. Those are provider claims rather than Apple approval. They make unattended newsletter delivery a material feasibility risk. [BlueBubbles](https://docs.bluebubbles.app/server) documents another bridge using a Mac, AppleScript, and optional private APIs. Neither route should be treated as the same operational contract as an official business messaging API.

SMS or RCS may appear in Apple's Messages app, but they should be presented under their actual transport name rather than labeled iMessage.

## A common adapter layer can help

[Vercel's Chat SDK](https://github.com/vercel/chat) has official adapters for Slack, Discord, Telegram, Teams, and WhatsApp. The [WhatsApp launch announcement](https://vercel.com/changelog/chat-sdk-adds-whatsapp-adapter-support) confirms the adapter family. Current [WhatsApp adapter source](https://github.com/vercel/chat/blob/main/packages/adapter-whatsapp/src/index.ts) implements `sendTemplate` and explicitly says normal text posts are not automatically converted to templates outside the customer-service window. Pin and test a published version containing that API during implementation.

Chat SDK is a promising rendering/transport helper, not a complete newsletter subscription/delivery system. It does not remove native app setup, administrator installation, reader opt-in, template approval, pricing, throttling, or provider reconciliation. Simple outbound channel webhooks may be enough initially; adopt the SDK where its shared bot connection and message handling reduce actual work. A community iMessage adapter/provider remains a separate provider contract, even if it exposes the same programming interface.

## Fit with the current code

The main repository inspection found structured issue content in `/Users/kalo/forwardpass/src/lib/issue.ts` (`IssueV2` subject/intro, featured and signal stories, sources). `/Users/kalo/forwardpass/src/worker.ts` publishes through `IssueWorkflow` then starts `DeliveryWorkflow`. `/Users/kalo/forwardpass/src/delivery/deliver.ts` already stages opted-in Resend audiences, rechecks consent, tracks per-date/email attempts and sent/failed/skipped states, and moves ambiguous attempts beyond its 23-hour safe retry window to reconciliation.

Keep Cloudflare Workflows and R2 publishing. Add provider-neutral Reader, Destination, Subscription, and per-edition/per-destination delivery attempts rather than extending an email-address-only ledger. Trigger independent channel workers after the issue is published; a Telegram outage must not block email. Use source IssueV2 fields to render native messages and reuse the canonical archive URL.

The authenticated preferences flow at `/Users/kalo/forwardpass-web/src/app/(site)/preferences/page.tsx` and `/Users/kalo/forwardpass-web/src/lib/preferences-session.ts` can host connect/pause/disconnect controls. Shared channel messages must never include an individual's secret preference-management or unsubscribe URL. A shared destination needs its own administrator management and subscription ownership.

## Launch order and acceptance

1. Telegram private subscriptions; Slack and Discord shared channel subscriptions. Verify connection ownership, one real test destination per transport, rendering, unsubscribe/disconnect, rate-limit retries, and ambiguous send outcomes.
2. Teams Workflows for selected pilots; add a dedicated app/bot for personal or broadly distributed installs when demand justifies it.
3. WhatsApp only after publisher eligibility, account/number setup, approved template/category, opt-in and opt-out, and audience-country cost estimates are confirmed.
4. iMessage only after official Business Updates newsletter eligibility or a third-party provider's commercial reliability and broadcast limits are established. Do not advertise it based only on an adapter existing.

For every transport, persist provider message IDs, distinguish accepted from delivered when receipts exist, honor Retry-After, stop on revoked permissions, and cap retries. Local idempotency is necessary but cannot guarantee exactly-once delivery when a provider accepts a send and the response is lost; use provider-specific idempotency/reconciliation where available.
