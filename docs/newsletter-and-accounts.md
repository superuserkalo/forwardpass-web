# Newsletter and reader accounts

This guide describes current code behavior. The [signup compliance report](newsletter-signup-compliance.md) retains dated legal/disclosure research and unresolved evidence requirements.

## Signup and identity

`subscribeAction` checks Turnstile before reading contacts. A new address becomes an unconfirmed Resend contact outside the newsletter segment and opted out of the newsletter topic. A confirmation email proves inbox ownership; submitting an address does not subscribe it or authorize profile edits.

Existing subscribed readers receive a sign-in link instead. Signup, sign-in and unsubscribe-link requests return the same success response regardless of whether the address is known. Email delivery runs after the response and failures stay out of that response.

| Link | Lifetime | Result |
| --- | --- | --- |
| Confirmation | 24 hours | Confirm newsletter membership, create a session, open `/welcome` |
| Sign-in | 30 minutes | Create a session, open `/preferences` |
| Unsubscribe | 90 days | Authorize newsletter unsubscribe |
| Existing preferences/edit token | Until its signed expiry | Restore that token as the session without extending it |

Confirmation and sign-in URLs use `/preferences/open#token=…`. The browser submits the fragment token to `/preferences/session`, which verifies it and sets the HTTP-only `forwardpass-preferences` cookie. New confirmation/sign-in sessions last 30 days. The cookie is Secure in production. Unsubscribe links use `/unsubscribe?token=…` and a separate signing purpose.

`link-email.ts` applies a two-minute cooldown per address and per purpose. Properties are `last_verify_link_sent_at`, `last_signin_link_sent_at` and `last_unsubscribe_link_sent_at`; `last_link_sent_at` remains as the legacy fallback. A recent confirmation request does not block a sign-in once purpose-specific state exists. `scripts/setup-contact-properties.mjs` registers these fields.

## Newsletter consent and unsubscribe

Confirmation calls `joinNewsletter` before issuing the session. It opts into the newsletter topic and joins the newsletter segment. Repeated confirmation is supported. Unsubscribe opts out of that topic and removes that segment, preserving unrelated topic/segment membership.

An email address on `/unsubscribe` only requests a signed email link. It never unsubscribes the address directly. Current daily email footer links open this email-prefilled request flow. Engine delivery stages opted-in segment members and rechecks consent before sending.

Turnstile protects signup, sign-in, unsubscribe-link requests and the contact form. Advertising inquiries have separate validation and an advertiser segment. An advertising inquiry is not newsletter consent.

## Onboarding and trial

`/welcome` requires an emailed reader session. Onboarding saves `onboarding_profile` and `interests`; incomplete UI drafts remain in the current tab's session storage. Starting Personal saves `personal_plan`, `personal_status=trial` and `personal_trial_ends_at` with a fixed 14-day UTC expiry. Reopening or retrying onboarding does not extend the trial. An active paid subscription takes precedence.

Free remains available. The trial creates no Polar subscription and makes no automatic charge. It includes Personal archive access and 500 total trial agent credits. Trial credits do not reset monthly; trials cannot buy credit packs or enable auto-refill.

Saved briefs support editing and topic-based archive ordering. The current engine delivers one canonical daily email and returns no weekly reader edition. See the [implementation gaps](architecture.md#gaps-between-the-offer-and-current-implementation) before interpreting plan copy as delivery acceptance.

## Paid subscriptions

`pricing.ts` maps Personal/Professional and monthly/yearly selections to four Polar product variables. Checkout metadata carries the reading brief and plan. The webhook verifies Standard Webhooks signatures using the raw body, then fetches the customer's current Polar state. Professional takes priority when both plans are active.

`subscribers.ts` reconciles paid plan/status in Resend. A cancellation event does not itself remove access while canonical Polar state still includes an active entitlement. Without a paid entitlement, paid access is removed while an existing app-managed trial is preserved. The first confirmed paid transition can copy the checkout brief from active subscription metadata. Readers use the Polar portal to manage subscriptions.

`order.paid` and `order.refunded` separately reconcile agent credits from the canonical order. Fulfillment is signed to the engine; failures return 503 for retry. See [agent credits](agent-access.md).
