# Web analytics

Forward Pass uses `@vercel/analytics/next` in the root layout through `WebAnalytics`.
The Vercel project is `forwardpass-web`, ID `prj_8WXjghdxQCPT9Wx3Md0LYbDFycHp`.
View traffic and events in [Vercel Analytics](https://vercel.com/superuserkalos-projects/forwardpass-web/analytics).

Web Analytics is live on `theforwardpass.net` as of 2026-10-09. The current Vercel
team cannot access custom-event reports: both the plugin and CLI return HTTP 402,
requiring Pro or Enterprise, and the dashboard shows an upgrade prompt. Conversion
instrumentation is installed, but those reports are not available on the current plan.

## Events

| Event | What it measures |
| --- | --- |
| `newsletter_signup_started` | A valid newsletter form submission, before authentication or bot verification |
| `newsletter_confirmation_requested` | The legacy signup action returned successfully, before email confirmation; it does not prove delivery or a new subscription |
| `pricing_cta_clicked` | A Free, Personal, Professional or Enterprise pricing CTA click; paid choices include billing period |
| `checkout_started` | A valid paid checkout form submission |
| `checkout_created` | The checkout service returned a redirect URL; this is not a completed payment |
| `checkout_failed` | The checkout action failed |
| `contact_submitted` | A contact message was accepted |
| `advertising_inquiry_submitted` | An advertising inquiry was accepted |

Traffic includes page views and referral sources. Compare pricing visits with CTA clicks,
checkout starts and checkout creation. Payments and confirmed subscriptions remain the
authority for revenue and subscriber counts. Email opens and clicks are separate Resend data.

The repository combines analytics with WorkOS authentication. Its newsletter form
records signup starts before the hosted Google or email-code flow. The legacy
confirmation-request event belongs to the earlier signup flow. The first isolated
analytics deployment used production commit
`9b978b1c45b4322917746afd0a96ea0d8cfbfaf5`, with only analytics changes applied.

## Privacy

`redactAnalyticsEvent` removes all URL query parameters and fragments, including campaign
parameters. Authentication callbacks and reader-session exchange pages are excluded.
Custom properties are limited to plan and billing period. Do not add email addresses,
names, reading briefs, inquiry contents or signed links. Analytics errors never block a
form submission. The public privacy page describes this collection.

## Activation and verification

On 2026-10-09, the Vercel plugin's page-view query returned `web_analytics_not_enabled`.
The user enabled Web Analytics in the dashboard. The isolated analytics copy was
then rebuilt and promoted to production as
[`dpl_9E1tSouUPaavQtvBuNwdMRTpMVPF`](https://vercel.com/superuserkalos-projects/forwardpass-web/9E1tSouUPaavQtvBuNwdMRTpMVPF).
At that time, the Vercel plugin confirmed that `theforwardpass.net` pointed to this deployment.
The deployed analytics script returns HTTP 200. There is no historical traffic to backfill.

Validation: `npm run build`, `npm test`, focused ESLint and `git diff --check`.
The privacy tests exercise email/token redaction and authentication-route exclusion.
Both the current checkout and the isolated deployment copy build successfully. All
38 tests pass. A local browser check confirms that pricing clicks queue the expected
plan, client navigation queues page views, and the redaction hook is registered.
Live collection was verified with a normal browser visit and a Contact sales click:
the Vercel plugin and refreshed dashboard reported one test visitor and two page views,
for `/pricing` and `/contact`. These first counts are QA traffic, not customer traction.
The Vercel script deliberately excludes automated/headless browsers, so a headless
probe alone cannot validate ingestion. No signup, payment or inquiry was submitted.

See [Vercel's setup guide](https://vercel.com/docs/analytics/quickstart) and
[custom event documentation](https://vercel.com/docs/analytics/custom-events).
