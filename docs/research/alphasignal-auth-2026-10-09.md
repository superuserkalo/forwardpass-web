# AlphaSignal account flow observations

Observed on 2026-10-09, Europe/Vienna. This report covers public UI behavior and the Google authorization handoff. It does not describe AlphaSignal's private backend or the user's existing account.

## Finding

The screenshots capture the first step of a progressive form. AlphaSignal currently reveals a password field after email entry in both signup and sign-in. Google's OAuth route avoids creating an AlphaSignal password, but an email-only passwordless login was not observed. [AlphaSignal account dialogs](https://alphasignal.ai/)

## Observed flow

| Action | Visible result |
| --- | --- |
| Open signup from the homepage | Account modal with Google, GitHub, email, a separate newsletter choice and links to terms and privacy. |
| Enter a test email | Password field appears with the placeholder `Create a password (8+ chars)`. Signup remains disabled with an empty password. |
| Open sign-in and enter that email | Password field appears with `Enter your password`. A password recovery button is available. |
| Open password recovery | Email form offers a one-time recovery code. No code was requested. |
| Toggle newsletter choice | Orange selection marker disappears. It was selected on a fresh signup dialog. |

All table observations came from the [live homepage account dialogs](https://alphasignal.ai/). Both dialogs stay on the homepage URL. The footer also provides a separate newsletter form and [newsletter page](https://alphasignal.ai/newsletter).

The Google button reached [Google Accounts](https://accounts.google.com/) with an authorization-code request, `openid email profile` scopes, PKCE `S256`, and redirect URI `https://alphasignal.ai/api/auth/callback/google`. No Google credentials were entered. The callback pathname is a public routing clue; it does not establish which auth library, account-linking rules or session storage AlphaSignal uses.

## Probe boundaries

One reserved test address, `forwardpass-probe-20261009-a4f91@example.com`, was entered into the email field. No signup was submitted, no password was entered, no email was sent, and no real account was accessed. The signup notice ties continuation to terms acceptance. Creating a credential also requires a user handoff under the browser tool's policy. Neither step was necessary to establish the progressive password fields.

REA MCP was not available in this session's callable tool registry. This research used browser CUA and a read-only web fetch instead. Public script URLs were visible in the DOM, including a Google Identity Services script. Reading selected public JavaScript files through a direct fetch returned HTTP 403, so their implementations were not inspected. No claims about session cookies, account migration, database records, newsletter-provider integration, payment or private API behavior follow from these observations.

## What this means for Forward Pass

Build the passwordless behavior the user requested explicitly. AlphaSignal's visible first step is a useful interaction reference, but its current email continuation would introduce a password.

- Offer Google and email as account-entry choices. Use a verified email code for the email path.
- Keep newsletter consent separate from authentication. Record the choice, then attach the verified identity to the existing subscriber record.
- Distinguish account creation, subscriber creation and payment state. An email address already on the newsletter list should not require a new subscriber or lose preferences when it signs in.
- Preserve the requested destination through verification so newsletter creation continues after authentication.

These are implementation recommendations for Forward Pass, not inferred AlphaSignal behavior. The user's old-account experience remains unverified. It could involve Google, an existing browser session or a different historical flow; the public probe cannot identify which occurred.

## Evidence files

Browser screenshots were saved locally for review:

- [Expanded signup](/private/tmp/alphasignal-auth-probe-20261009/signup-expanded.jpg)
- [Expanded sign-in](/private/tmp/alphasignal-auth-probe-20261009/signin-expanded.jpg)
- [Password recovery](/private/tmp/alphasignal-auth-probe-20261009/forgot-password.jpg)

These temporary files are outside the repository. The expanded signup screenshot shows the newsletter choice after deselection; the fresh dialog's selected state was also verified by the orange inner square in the rendered checkbox graphic.
