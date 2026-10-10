# WorkOS authentication setup

Implementation, staging and production configuration checked on 9 October 2026. The authentication release is live at `https://theforwardpass.net`.

## Staging

A separate WorkOS project named **Forward Pass** was created through the WorkOS connector. Other projects were left unchanged.

| Setting | Value |
| --- | --- |
| Project | `project_01M4GM6HMT11F04TZHVFRQRM7A` |
| Staging environment | `environment_01M4GM6HNGCY8MHJ4WY252TY3W` |
| Staging client | `client_01M4GM6J2EBGVA77NA4MJQDZFF` |
| Callback | `http://localhost:3000/auth/callback` |
| Initiate login URI | `http://localhost:3000/auth/start` |
| Logout redirect | `http://localhost:3000/` |
| Methods | Google OAuth and Magic Auth email codes |
| Passwords | Disabled |
| Signup and email verification | Enabled |

The application is named The Forward Pass and uses dark hosted branding. The existing staging API key and a generated cookie secret are stored in ignored `.env.local`. No secrets are checked in. Staging uses WorkOS's shared Google test credentials. Authentication email uses WorkOS's default sender; newsletter email continues through Resend.

Set the application's **Initiate login URI**, not the environment's **external login URI**. The latter overrides hosted login and causes a loop when it points at `/auth/start`; it is unset in staging.

## Production

The project's production environment is `environment_01M4GM6J92VHM9RW4Q9DE6CV4Y`, with client `client_01M4GM6JDW61S6R72SNV78JN1M`. Production mutations initially returned `FORBIDDEN`. After the owner completed billing activation on 9 October, the same connector successfully configured production.

| Setting | Value |
| --- | --- |
| Application | The Forward Pass |
| Callback | `https://theforwardpass.net/auth/callback` |
| Initiate login URI | `https://theforwardpass.net/auth/start` |
| Logout redirect | `https://theforwardpass.net/` |
| Homepage and signup | `https://theforwardpass.net` and `/signup` |
| Methods | Magic Auth and Google OAuth enabled; owner-supplied Google credentials saved |
| Passwords and SSO | Disabled |
| Signup and email verification | Enabled |
| Branding | Dark; The Forward Pass; production Terms and Privacy URLs |

Vercel project `forwardpass-web` now has sensitive production `WORKOS_API_KEY`, production `WORKOS_CLIENT_ID`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI` and a newly generated sensitive `WORKOS_COOKIE_PASSWORD`. The owner supplied the API key and explicitly requested that it be stored through the Vercel connector; storage as a production Secret was verified without reading it back. The temporary local copy of that cookie secret was removed after Vercel confirmed it was stored. Existing Resend, Polar, engine and signing-secret settings were preserved.

The owner created a separate Google OAuth web client and saved its ID and secret directly in WorkOS. Google's Audience screen showed **External** and **In production**. The connector confirmed one enabled Google credential, no custom scopes and provider token return disabled. WorkOS validated the registered Google callback successfully. The existing Radian/Hanko client was not changed.

The isolated production deployment `dpl_7MPXJ6RA3DxeUJtYhYu9fMfYnysB` reached Ready and was promoted to the live domain. Public signup and unauthenticated preferences served the new passwordless forms. The live `/auth/start` route opened the production AuthKit application, and its Google option reached Google's sign-in screen with the configured Google client and WorkOS callback. Its request included only basic email and profile scopes. Google displayed `workos.com` as the destination label; Forward Pass branding verification remains a separate follow-up.

A follow-up production build, `dpl_EF2BKhws9X8opy2WBgVU9UECR8Mj`, added the owner's requested square glass header and outlined Google newsletter button. A refinement, `dpl_3rnYuQ3oXiCZrE31BYVbdzFjtmSB`, reached Ready and was promoted on the same day. Live desktop checks confirmed that the header contracts from 1024 × 64px to 704 × 52px after scrolling, retaining square corners and collapsing the wordmark to just the logo. Navigation sits on the right, Sign in is black without an arrow, and Advertise is a prominent white button. The live mobile menu, Escape focus return and absence of horizontal overflow were checked at 390px; local checks also covered the compact layout at 320px. The logo still navigates home and Advertise opens the existing inquiry dialog. The header uses one IntersectionObserver and CSS transitions, with a reduced-motion override; it does not run a JavaScript animation on every scroll frame. TypeScript, focused ESLint and the Vercel production build passed.

Real Google account selection and the complete production callback, delivery of an email code to a real inbox, and authenticated checkout remain acceptance checks. No live payment was made.

Those isolated releases were based on commit `9b978b1c45b4322917746afd0a96ea0d8cfbfaf5` and included the authentication and requested interface work. Concurrent analytics edits and research were excluded from those deployments. The initial auth release passed 35 application tests, 83 library/script tests, TypeScript, ESLint and a production Webpack build after isolation. No Git commit or push was performed for those releases; Vercel received direct deployments of the isolated source.

The repository now combines the authentication, analytics and research changes for the owner's requested delivery to `main`. The latest header uses a tightly framed SVG FP mark without a background square, sized at 44 × 34px on desktop. Sign in is white with dark text. Advertise uses a deeper orange accent with white text, and the navigation links are brighter. The square glass shape and wordmark collapse on scroll remain.

WorkOS handles authentication email with its default sender. Resend continues to handle newsletters. No custom auth-email provider or WorkOS webhook was introduced here.

## GitHub addition on 10 October

The local homepage, account forms and shared callback now support GitHub. The homepage places Google and GitHub in equal columns, shortening their visible labels on narrow forms while keeping the full accessible names. Its footer reads "Free to subscribe. Unsubscribe anytime."

The WorkOS connector confirmed that Forward Pass staging and production had no custom GitHub credentials. GitHub was enabled in staging with WorkOS's default test credentials. The local homepage reached GitHub sign-in with only `user:email`. The staging redirect list now also allows `http://localhost:3001/auth/callback`, while retaining the original port-3000 default. The preview process uses the matching port-3001 callback without changing `.env.local`.

A real staging GitHub callback returned `email_verification_required`. The callback now resumes hosted AuthKit with the email supplied by WorkOS, the original allowed destination and newsletter intent. It recovers these values only from the SDK's encrypted state matched to this browser's verifier cookie. WorkOS continues to manage verification and the new authentication round trip. A live retry reached the hosted form with the email prefilled; the final email-code login was not completed.

The owner created the production GitHub OAuth app and saved its credentials directly in WorkOS on 10 October. The connector confirmed credential `oauth_credential_01M4JTTV8DTF02MW7FR53MS7FK` is valid and enabled, GitHub is enabled in AuthKit, additional scopes are empty and provider token return is disabled. A live check through the existing production `/auth/start` route reached GitHub's "Authorize The Forward Pass" screen with the configured client and callback, requesting only `user:email`. Account authorization and the complete production callback were not performed.

The website's GitHub buttons and callback recovery ship with this addition. The existing production hosted AuthKit already offers GitHub. The credential setup was:

1. In the WorkOS dashboard, select **Forward Pass > Production > Authentication > OAuth providers > GitHub > Manage** and copy its redirect URI.
2. [Create a GitHub OAuth app](https://github.com/settings/applications/new) named **The Forward Pass**, with homepage `https://theforwardpass.net` and the WorkOS redirect URI as its authorization callback. The app's callback goes to WorkOS, not directly to the website's `/auth/callback`.
3. Generate the client secret and save it with the client ID directly in the production WorkOS GitHub configuration. Leave additional scopes empty and provider token return disabled. These credentials belong in WorkOS, not the website's environment variables or repository.
4. Enable GitHub, deploy the website, then verify a production signup, a returning reader and any required email verification before declaring the flow live.

References: [GitHub OAuth setup](https://workos.com/docs/integrations/github-oauth), [authentication errors](https://workos.com/docs/reference/authkit/authentication-errors).

Validation before delivery passed: 18 authentication tests, the existing application and script suites, full ESLint, TypeScript, the production Webpack build and `git diff --check`. The homepage was checked at 320, 390 and 1440 pixels; both provider buttons had equal widths and shared a row without horizontal overflow. Both `/signin` and `/signup` were checked in the local browser and displayed "Continue with GitHub" through their shared account form. These checks do not establish completion of a production account login.

## Migration behavior

WorkOS identity is matched to the current Resend and Polar identity using the verified, normalized email. Existing preferences, trial dates and paid state are reused. Account creation without newsletter consent creates an opted-out reader contact outside the newsletter segment. Ordinary login preserves existing consent. Signup with explicit newsletter consent can restore newsletter membership.

The SDK stores and refreshes the encrypted HTTP-only WorkOS session. Server requests to the Worker create a one-minute credential in the existing signed format. The Worker does not need WorkOS secrets. Previously issued reader/edit/unsubscribe links and legacy sessions remain supported; a managed session takes precedence over a legacy identity and cannot fall back to that identity when verification fails.

This change does not migrate email changes across providers, erase old link handlers, or change newsletter generation. See [reader accounts](newsletter-and-accounts.md) for current behavior and [AlphaSignal probe](research/alphasignal-auth-2026-10-09.md) for the evidence behind the interaction reference.

## Verification on 9 October

The local website completed a real hosted email-code login for a dedicated staging user on a reserved `.test` domain: code challenge, callback/session exchange, Resend reader creation, onboarding and authenticated preferences. Sign-out returned to the homepage and subsequent preferences access showed the sign-in form. Explicit newsletter consent was then exercised against that test contact and read back as newsletter topic `opt_in` plus newsletter segment membership. The temporary Resend contact and both WorkOS probe users were removed.

Google reached the public Google account sign-in page in staging and production with the SDK's PKCE/state intact. Google account selection and its final callback were not completed. New-user hosted signup, delivery to a real inbox and live paid checkout remain acceptance checks.

An `example.com` probe was rejected by WorkOS with `organization_authentication_methods_required` and no allowed methods. The same configuration authenticated the unique `.test` identity. No domain policy was relaxed. Use a unique reserved `.test` domain for this integration's test fixtures.

Validation passed: 35 application tests, 83 library/script tests including 12 new authentication tests, TypeScript, ESLint, production build and `git diff --check`. Desktop and 390-pixel mobile signup layouts were inspected. The production deployment reached Ready and was promoted. No commit or push was performed.

## References

- [WorkOS Next.js SDK](https://github.com/workos/authkit-nextjs)
- [Magic Auth](https://workos.com/docs/authkit/magic-auth)
- [Google OAuth setup](https://workos.com/docs/integrations/google-oauth)
- [Staging and production](https://workos.com/docs/authkit/environments)
- [Reserved test domains](https://workos.com/docs/email#testing-with-example-domains)
