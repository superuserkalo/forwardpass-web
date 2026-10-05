# Newsletter signup: EU and Austrian consent/disclosure research

Current code flow and setup are documented in [newsletter and reader accounts](newsletter-and-accounts.md) and [development](development.md). The legal research and unresolved operational evidence below retain their stated date; this update does not revalidate legislation or certify compliance.

Research date: **3 October 2026**. Scope: the free newsletter signup and related privacy disclosures, with a short AI-publication note. Sources are legislation, regulator material, and providers' own documentation fetched using `webfetch`. Repository observations describe the current working tree, including existing uncommitted changes; they are not a live-site or provider-account audit.

## Subsequent clarification and changes

The publisher clarified that promotions are sponsorships **inside the briefing**, not separate Radian sales/product emails. The privacy wording has been narrowed accordingly. The earlier business-lead mismatch below describes the policy at research time, not the intended current use.

The signup now keeps “Join” and “Free to subscribe. Unsubscribe anytime.” with an adjacent Privacy link, without a separate acceptance sentence or checkbox. The form's explicit newsletter purpose and confirmation email supply context for the affirmative signup action; the long sample wording below is optional clarity, not mandatory statutory text.

Newsletter Turnstile is mounted only after an email-field change or submission, rather than at page load. Its processing is now described in Privacy. Consent-evidence, retention, tracking configuration and provider-transfer verification items remain open; these edits are not a full compliance audit.

## Bottom line

- **A separate checkbox is not inherently required** for a standalone newsletter form: entering an email and deliberately clicking Join can express consent when the surrounding text clearly identifies the newsletter, controller and purpose, and other consent conditions are met. This is an application of GDPR's affirmative-action standard, not an authority's certification of this particular form. [GDPR Articles 4(11), 7; recital 32][gdpr]
- **Link to Privacy; do not ask users to “accept” Privacy.** Privacy information and consent are different things. Put the newsletter purpose and withdrawal information next to the form, with an accessible link to the complete notice before submission. [GDPR Articles 7, 12–13][gdpr]
- **No mandatory Terms-acceptance checkbox follows from the newsletter-consent laws reviewed.** Keep contractual terms separate from marketing consent; paid-plan contract formation and consumer-law requirements are outside this focused review. [GDPR Article 7(2)–(4)][gdpr]; [ePrivacy Article 13][eprivacy]; [TKG §174][tkg174]
- The largest verified mismatch is that Privacy describes **Radian business-lead/product marketing**, while Join and the confirmation email describe the newsletter. A privacy paragraph does not expand a subscriber's affirmative choice to unrelated marketing. [GDPR Articles 4(11), 7 and 13(3)][gdpr]; [EDPB consent guidance][edpb]; [TKG §174(3)][tkg174]
- Double opt-in already exists in the reviewed flow. What is not demonstrated is a durable record tying an individual confirmation to the consent wording/version shown, plus accurate retention and Turnstile disclosures. Demonstrability is binding; the specific logging design below is recommended practice. [GDPR Articles 5 and 7(1)][gdpr]

## 1. Controller and jurisdiction identified in this repo

`src/app/(site)/privacy/page.tsx` identifies **Kaloyan Gamtchev, sole proprietorship**, Inge-Konradi-Gasse 12/1/50, Vienna, Austria; contact `hello@withradian.com`. The imprint identifies the same individual/address as responsible for content. Terms identify the same publisher, say the service is operated together with Radian, and select Austrian law while preserving consumers' mandatory protections.

This establishes an Austrian-controller working assumption, so **GDPR and Austria's TKG 2021 §174** are the relevant baseline. GDPR applies to processing in the context of an EU establishment; the contractual law clause does not determine GDPR applicability. [GDPR Article 3(1)][gdpr]

**Unresolved factual point:** “operated together with Radian” does not establish whether Radian is merely a trading name, a processor, a separate controller or a joint controller. Identify the actual entity and decision-making roles. If joint controllers determine purposes/means together, Article 26 requires an arrangement and its essence made available to data subjects. Do not infer joint control from the wording alone. [GDPR Articles 4(7), 13(1)(a), 26][gdpr]

Austria is the researched national implementation, not a conclusion that every EU recipient country's rules are identical or irrelevant. Cross-border targeting can require additional national analysis.

## 2. Binding requirements and what they mean for Join

### GDPR Articles 4(11) and 7: genuine, demonstrable consent

Article 4(11) requires a **freely given, specific, informed and unambiguous** indication of wishes, by statement or clear affirmative action. Article 7 requires the controller to demonstrate consent; distinguish consent from other matters; use intelligible, accessible, plain language; explain withdrawal beforehand; and make withdrawal as easy as giving consent. Conditioning a service on unnecessary processing weighs against freely given consent. [GDPR][gdpr]

Recital 32 gives ticking a box as an example, but also permits other statements or conduct clearly indicating agreement in context; silence, inactivity and pre-ticked boxes do not qualify. Therefore a clearly labelled, single-purpose **Join newsletter** submission can work without an additional checkbox. The button label alone is insufficient if the purpose/controller are ambiguous or undisclosed extra uses are bundled. A separate optional, unticked control is a practical way to obtain a distinct choice for additional Radian product emails. The legal requirement is the distinct valid choice, not that particular widget. [GDPR recital 32, Articles 4(11), 7][gdpr]; [EDPB][edpb]

### ePrivacy Article 13 and Austrian implementation

Electronic mail for direct marketing generally needs **prior consent**, independently of the GDPR basis for storing an address. ePrivacy Article 13(2) has a narrow existing-customer exception for the same person's own similar products/services, with easy, free refusal at collection and in each message. Article 13(4) prohibits concealing the sender or omitting a valid cessation-request address. [ePrivacy][eprivacy]

Austria implements this in **TKG 2021 §174(3)–(5)**. The customer exception requires all four conditions: contact obtained in connection with a sale/service to customers; own similar products/services; clear, free, trouble-free refusal at collection and every transmission; and no prior refusal, including the ECG §7(2) list. Section 174(3) is not confined in its wording to consumer addresses. [TKG][tkg174]

For this commercial publication, whose terms describe sponsorship, consent is the sound operational baseline. Do not assume that a free signup automatically establishes the customer exception, that B2B recipients are exempt, or that GDPR legitimate interests overrides TKG's email-consent rule. Classification of a purely editorial, non-promotional message can be fact-sensitive; this report does not say every newsletter is necessarily direct marketing. [ePrivacy Article 13][eprivacy]; [TKG §174][tkg174]

### Article 13 notice at collection; Privacy is information, not acceptance

At the time the address is obtained—not only after clicking the confirmation email—provide the applicable Article 13 information: [GDPR][gdpr]

- controller identity/contact details; representative and DPO contact where applicable;
- purposes and legal bases, and the interests pursued for legitimate-interest processing;
- recipients or recipient categories;
- intended third-country transfers, adequacy or applicable safeguards, and how to obtain/access those safeguards;
- retention periods or criteria;
- access, rectification, erasure, restriction, objection and portability rights;
- withdrawal at any time without affecting the lawfulness of prior processing;
- supervisory-authority complaint rights;
- whether supplying data is required and the consequences of not providing it;
- Article 22 automated decision-making/profiling information where applicable.

Article 12 requires concise, transparent, intelligible and easily accessible information. **Recommended implementation:** a short first layer by the email field plus a directly adjacent Privacy link to the full notice. This placement is a practical way to meet accessibility/timing; the law does not prescribe a literal “Privacy” hyperlink or require all Article 13 text inside the form. The footer already links to Privacy, but a distant footer is weaker evidence that the collection notice was readily presented. [GDPR Articles 12–13][gdpr]

“I accept the Privacy Policy” is not needed to discharge Article 13 and is not a substitute for specific consent. Similarly, “By joining you agree to Terms and Privacy” muddles contract acceptance, transparency and newsletter consent. [GDPR Article 7(2)][gdpr]; [EDPB][edpb]

## 3. Double opt-in, evidence, retention and unsubscribe

**Binding:** be able to demonstrate valid consent, minimise stored data, limit storage to necessity, and stop consent-based newsletter processing after withdrawal unless another valid basis supports a different necessary purpose. Neither GDPR Article 7 nor ePrivacy Article 13 nor TKG §174 expressly prescribes a universal double-opt-in protocol or a fixed newsletter-consent-record retention period. **Recommended:** keep double opt-in as useful evidence of address control and protection against third-party signups. It cannot cure undisclosed additional marketing purposes. [GDPR Articles 5, 6, 7, 17][gdpr]; [ePrivacy][eprivacy]; [TKG][tkg174]

Reviewed implementation:

- `src/lib/forward-pass.ts:subscribeAction` verifies Turnstile, normalises the address, creates an unconfirmed contact where needed and schedules a verify email; already-subscribed addresses get a sign-in link.
- `src/lib/newsletter.ts:addUnconfirmedContact` creates a contact outside the newsletter segment with the newsletter topic opted out, although global `unsubscribed` is `false`. Newsletter eligibility checks both segment and topic plus global status. Confirm that every production send uses these gates; global status alone would be insufficient.
- `src/lib/link-email.ts` sends a 24-hour confirmation link with clear daily-newsletter purpose. `src/app/(site)/preferences/session/route.ts` calls `joinNewsletter` after the verified-token exchange. Joining records segment membership/topic opt-in, not an explicit consent-wording version or confirmation timestamp in the reviewed function.
- `last_verify_link_sent_at`, `last_signin_link_sent_at` and `last_unsubscribe_link_sent_at` throttle repeated requests independently, so unsubscribing does not block an immediate rejoin confirmation. `last_link_sent_at` is retained for compatibility with older code. These are cooldown fields, not reliable immutable records of consent. A signed link and current opt-in status do not alone prove which information a subscriber saw.

**Recommended evidence record:** subscriber identifier/address, request and confirmation timestamps, signup location, purpose(s), exact wording or immutable wording/version reference, privacy-notice version, and verification event/reference. Record withdrawal and each purpose's resulting status. Do not retain usable authentication tokens as consent evidence. IP addresses/user-agent logs are not a statutory required field; collect them only if justified and with proportionate retention/access controls. Vendor audit records may supply some evidence, but their availability/exportability/retention was not checked. [GDPR Articles 5(1)(c), 5(1)(e), 7(1), 32][gdpr]

**Retention:** choose and disclose a short cleanup period for never-confirmed addresses; keep active delivery data while needed; retain only justified, limited evidence/suppression data afterward under an identified basis and schedule. Withdrawal does not necessarily require deleting every proof/suppression record immediately, but “until unsubscribe” is inaccurate if full profiles persist. No arbitrary “GDPR requires X years” conclusion is supported by the reviewed laws. [GDPR Articles 5, 6, 13(2)(a), 17(3)(e)][gdpr]

**Unsubscribe:** Article 7(3) requires withdrawal at any time and as easy as consent; Article 21(2)–(4) requires stopping direct-marketing processing on objection and clearly bringing the right to attention. TKG §174(5) requires an authentic address for cessation requests. [GDPR][gdpr]; [TKG][tkg174]

The reviewed unsubscribe action opts out the newsletter topic and removes its segment; it does **not delete** the contact/profile. The public form asks for an emailed link with Turnstile; a valid token presents a confirmation button. Tokens sent by `link-email.ts` expire after 90 days. **Recommended:** a low-friction link in every issue, no login or additional email round-trip for an already-authorised issue link, and a functioning email fallback. Evaluate actual effort against Article 7(3), including old links and provider outages. One-click unsubscribe is a good practical design, not a literal universal one-click mandate in these provisions. Issue templates and actual delivery suppression were not audited, so the policy's “Every issue includes” statement remains unverified.

## 4. Providers, Cloudflare and tracking disclosures

**Binding:** disclose recipients/categories, processing purposes/bases, retention and applicable transfer information; use Article 28 contracts for processors and a valid Chapter V transfer mechanism where needed. A newsletter-consent checkbox is not a blanket authorisation for provider processing or international transfers. [GDPR Articles 13, 28, 44–46][gdpr]

**Resend:** Privacy names it; the reviewed flow stores contacts and sends verification emails through it. Resend's own DPA identifies **Plus Five Five, Inc.**, normally a processor for customer data, with separate controller roles for account/usage data. It states primary processing takes place in the US and includes SCC arrangements; it also makes DPF certification statements. These are provider representations, not verification of this account's executed DPA, actual transfer basis or current DPF registration. Confirm the applicable arrangement and explain how safeguards can be obtained. [Resend DPA §§2, 6, 7, 9, 11 and Exhibit A][resend]

**Cloudflare Turnstile:** `src/components/turnstile-widget.tsx` loads Cloudflare's script on form mount when a site key exists, before submission. `src/lib/turnstile.ts` also passes the visitor IP to Siteverify when available. Privacy describes R2/Durable Objects for agent access but does not disclose **Turnstile/bot-prevention signals**, their basis or retention. Cloudflare's addendum identifies signals including IP, TLS fingerprint, user-agent, site key and origin. It describes Cloudflare as processor for customer-site protection and controller for improving bot detection. Its documentation says Turnstile does not access/store/transmit form entries; do not claim the email field is sent to Cloudflare by this integration. [Cloudflare addendum §§3–5][cloudflare]; [Turnstile docs][turnstile]

**Recommended notice content:** identify Cloudflare, security/bot-prevention purpose, relevant technical signals, the controller's assessed lawful basis (legitimate interests may fit necessary/proportionate security processing; document the balancing), roles, retention criteria, transfer arrangement and links to the addendum/main notice. Identify the actual hosting provider or give a sufficiently informative recipient category; verify its contracts/transfers. Article 13 permits categories, so naming every vendor is not a categorical statutory rule. [GDPR Articles 6(1)(f), 13, 28][gdpr]; [EDPB legitimate-interest guidance][edpb]

**Cookies and tracking are separate from newsletter consent.** Absence of advertising cookies does not mean absence of personal-data processing. ePrivacy Article 5(3) and Austrian TKG §165(3) require assessment of storage/access on terminal equipment, with a strict-necessity exception; “security tool” or Cloudflare's own necessity assertion is not automatically the legal assessment for every configuration. Check actual browser behaviour and settings, including optional pre-clearance, before deciding whether separate consent is required. No blanket conclusion that Turnstile always requires—or never requires—a cookie banner is made here. [ePrivacy][eprivacy]; [TKG §165][tkg165]; [Cloudflare][cloudflare]; [Turnstile docs][turnstile]

Privacy also says opens/clicks are tracked for audience improvement and sponsor reporting, but its legal-basis list does not clearly map to that purpose. Confirm whether enabled; if so, assess GDPR and any applicable terminal-access consent separately and disclose the result. Sending the requested newsletter does not automatically authorise tracking. No production tracking configuration was inspected. [GDPR Articles 5, 6, 13][gdpr]; [ePrivacy Article 5(3)][eprivacy]

## 5. Minimal actionable signup text

Use next to the email field and Join button, with real links:

> Join The Forward Pass: a free daily email on AI engineering, including sponsorships, published by Kaloyan Gamtchev. By clicking Join, you consent to receive the newsletter. Confirm your email to start. Unsubscribe anytime using the link in each issue. [Privacy](/privacy)

This wording assumes the newsletter includes sponsorships as Terms currently states, the issue links work, and the full notice is corrected. Frequency and explicit button-effect language are recommended clarity, not statutorily fixed phrases. No separate checkbox is necessary for this single purpose if the actual presentation meets the consent standard. [GDPR Articles 4(11), 7, 12–13][gdpr]

If retaining broader Radian marketing, add a **separate optional, unticked** choice identifying the actual sender/entity and specific purpose, for example:

> [ ] Also email me about Radian's AI products and services. I can withdraw this consent anytime. [Privacy](/privacy)

Do not make this a condition of the newsletter, and store/honour it independently. The example needs the controller/entity question resolved first. Otherwise stop the extra use and align Privacy with newsletter-only processing; merely deleting the disclosure while continuing the use is not a fix. [GDPR Article 7][gdpr]; [TKG §174][tkg174]

A short adjacent security note is recommended, not necessarily part of newsletter consent:

> This form uses Cloudflare Turnstile to prevent abuse. [Privacy](/privacy)

## 6. Verified gaps and priorities

| Priority | Verified working-tree observation | Action and qualification |
| --- | --- | --- |
| 1 | Privacy's Radian lead/product-contact purpose is broader than Join and the verification email. | Separate valid marketing choice or cease the additional purpose; sending such emails was not verified. Binding consent/scope issue if the use occurs. |
| 1 | No adjacent Privacy link in `NewsletterForm`; only footer link found. | Add accessible collection-time notice/link. Adjacent placement is recommended; accessibility and timely information are binding. |
| 1 | Privacy omits Turnstile security processing although the form mounts its script and server passes IP. | Add accurate purpose, basis, signals, roles, retention and transfer disclosures. Binding transparency issue; no automatic checkbox conclusion. |
| 1 | Reviewed join path stores current opt-in state, with no explicit durable confirmation/wording record. | Check vendor evidence; implement/version consent evidence if absent. Binding ability to demonstrate consent; log schema is recommended. |
| 2 | Privacy says newsletter contacts are kept until unsubscribe; action retains contacts/profiles. | Align actual deletion, suppression and evidence retention with a disclosed schedule/basis. Unsubscribe is not necessarily full erasure. |
| 2 | Notice does not explicitly state restriction rights, withdrawal's non-retroactive effect, or voluntary-email/consequence information. Transfers mention SCCs without access/copy instructions; processing bases are broadly grouped. | Complete applicable Article 13 details and map bases to purposes. No conclusion that a DPO or Article 22 process is required. |
| 2 | Never-confirmed-contact cleanup is not shown in the reviewed flow. | Confirm external cleanup; define/disclose proportionate retention if missing. No universal statutory number of days. |
| 2 | Newsletter-only topic/segment withdrawal, expiring custom tokens and email-round-trip fallback are present. | Verify issue links and all senders honour withdrawal; assess friction and clarify scope of optional marketing opt-outs. No finding that the whole production unsubscribe system fails. |
| 2 | Radian's legal/data role is unclear; tracking is disclosed without a clear purpose-specific basis. | Resolve roles, contracts, tracking settings and required choices. Facts remain unverified. |

## 7. Brief AI Act Article 50(4) note

**Binding scope is specific:** deployers of AI systems generating/manipulating text published **to inform the public on matters of public interest** must disclose its artificial generation/manipulation. The text exception requires both (a) a process of **human review or editorial control** and (b) a natural/legal person holding editorial responsibility. Article 50(5) requires clear, distinguishable information no later than first interaction/exposure. Article 113 sets the general 2 August 2026 application date; the Commission's current timeline confirms August 2026 transparency-rule application. [AI Act Articles 50(4)–(5), 113][aiact]; [Commission timeline][aitimeline]

This is **not a rule that every newsletter must carry an AI label**. Determine whether the actual AI-generated text/publication purpose falls within public-interest information and whether the exception genuinely applies. AI-engineering news may raise that question, but the classification is not conclusively established here. Automated source checks are not proof of human review/editorial control. The named publisher addresses responsibility, not necessarily the other limb of the exception. [AI Act Article 50(4), recital 134][aiact]

Current homepage/footer already say “AI-generated” / “Written by AI”; Terms describes an automated pipeline. Actual issues were not audited. If Article 50(4) applies without the exception, place clear disclosure at the issue/article's first exposure; a buried Terms statement alone does not establish compliance with Article 50(5). **Recommended concise issue text:** “AI-generated by The Forward Pass; checked against linked sources.” Do not describe the check as human unless true. Disclosure is information about the publication, not additional signup consent. Article 50(2)'s provider-side machine-readable marking obligation is distinct from this deployer/publication question. [AI Act Article 50][aiact]

## Primary sources

- [GDPR Regulation (EU) 2016/679, official EUR-Lex text][gdpr] — binding law; especially Articles 3–7, 12–13, 17, 21, 26, 28, 44–46; recitals explain interpretation.
- [ePrivacy Directive 2002/58/EC, consolidated 19 December 2009][eprivacy] — EU directive, implemented nationally; Articles 5(3), 13.
- [Austria TKG 2021 §174, RIS official consolidated text][tkg174] — binding national implementation, current page showed 3 October 2026.
- [Austria TKG 2021 §165, RIS, version 3 October 2026][tkg165] — binding terminal-access/privacy provision.
- [EDPB: Process personal data lawfully][edpb] — official supervisory-board guidance; interpretive guidance, not legislation. The linked Guidelines 05/2020 landing page was also fetched; its PDF was returned as binary by webfetch, so detailed paragraph claims from that PDF are not relied on here.
- [Cloudflare Turnstile Privacy Addendum, updated 18 June 2025][cloudflare] and [Turnstile developer documentation][turnstile] — first-party product/role representations, not law or a finding about this site's contracts.
- [Resend Data Processing Addendum, updated 31 December 2025][resend] — provider contractual/processing representations; account execution and operational settings unverified.
- [AI Act Regulation (EU) 2024/1689, official text][aiact] and [Commission current AI Act overview/timeline][aitimeline] — statutory Article 50 text and current official timing context; the overview also reports 2026 high-risk-timeline amendments, which are not a reason to defer Article 50 transparency.

[gdpr]: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
[eprivacy]: https://eur-lex.europa.eu/eli/dir/2002/58/2009-12-19/eng
[tkg174]: https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011678&Paragraf=174
[tkg165]: https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011678&Paragraf=165&FassungVom=2026-10-03
[edpb]: https://www.edpb.europa.eu/sme-data-protection-guide/process-personal-data-lawfully_en
[cloudflare]: https://www.cloudflare.com/turnstile-privacy-policy/
[turnstile]: https://developers.cloudflare.com/turnstile/
[resend]: https://resend.com/legal/dpa
[aiact]: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689
[aitimeline]: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
