# Personal newsletter continuation handoff

Created 2026-09-24 from the recovered Command Code session and a read-only inspection of both repositories. The current request was to recover context and write this handoff, not implement the next phase.

## Source session

- Session ID: `8bbdd113-5bcd-4001-8c2a-62c3d5f9fa47`.
- Full log: `/Users/kalo/.commandcode/projects/users-kalo-forwardpass/8bbdd113-5bcd-4001-8c2a-62c3d5f9fa47.jsonl`.
- Session started 2026-09-22 at 17:14 UTC in `/Users/kalo/forwardpass`; final usage-limit message was 2026-09-24 at 00:06 UTC.
- User's excerpt: `/Users/kalo/.codex/attachments/9378a282-a0c8-4c8a-94b3-7e03cc497058/Pasted text.txt`.
- Useful JSONL line ranges: 966–972 for product intent and approval, 973–987 for persisted bundles, 988–1009 for personalization, 1010–1027 for rewrite versus links, 1028–1051 for web checkout, 1052–1067 for Professional rename and final build.
- Each JSONL message has `message.role` and `message.content`. Tool results also have role `user`; distinguish them from actual user text. Avoid dumping full logs, which may contain private data or embedded images.

No established handoff directory was found, so this document uses `.scratch/handoffs/`.

## Agreed product and boundaries

The product is a paid personal AI newsletter. Readers provide an email and a natural-language brief describing what they want to read. Their preferences must never affect the shared free newsletter.

- Use Polar, explicitly requested instead of Stripe.
- Tier names are Free, Personal, Professional. Professional replaced Deep in identifiers and labels. “Deep research” remains valid feature copy.
- Accepted monthly prices are Personal $4.99 and Professional $9.99. The prior implementation proposed annual prices of $49 and $99; do not assume actual Polar products are configured.
- Personal reads the daily shared research. Professional is intended to add weekly private research on the subscriber's niche; that extra workflow is not established as implemented.
- Rewrite is the default after Jev relevance matching. Explicit requests for links only use a deterministic renderer, selected by Jev format detection.
- No password/account system was planned. Email identifies the subscriber. The proposed edit flow uses an expiring signed link in each newsletter footer. Polar's customer portal is intended for billing management.
- Interests are limited to 500 characters and treated as untrusted data inside per-subscriber calls.
- Shared research is persisted once by the free workflow. Personalization only reads it, uses a separate tool/workflow, and does not feed subscriber text into discovery or shared research.
- Keep human approval before newsletter delivery. Existing agent delivery code creates a Resend broadcast draft.

Earlier cost estimates, including roughly $0.002 per personal prose issue and free Jev evaluation, were planning assumptions. They are not newly measured costs or verified current provider prices.

## Implementation references and stopping point

Agent repository: `/Users/kalo/forwardpass`.

| Work | Existing artifact |
| --- | --- |
| Phase 1: versioned research digest persistence | `agent/tools/produce_issue.ts`, `agent/lib/schemas.ts`, `issues/2026-09-23.bundles.json` |
| Phase 2: read-only matching, format detection, rewrite or links rendering | `agent/tools/produce_personal_issue.ts` |
| Personalization evals | `evals/personal-issue.eval.ts`, `evals/personal-links.eval.ts`, `evals/personal-urls.eval.ts` |
| Editorial/research instructions | `agent/instructions.md`, `agent/skills/editorial.md`, `agent/skills/research.md`, `agent/subagents/researcher/` |
| Human-review draft creation | `agent/tools/send_newsletter.ts` |

Web repository: `/Users/kalo/forwardpass-web`.

| Work | Existing artifact |
| --- | --- |
| Phase 3 pricing and signup | `src/app/pricing/page.tsx`, `src/components/personal-signup.tsx` |
| Polar checkout and plan mapping | `src/lib/polar.ts` |
| Resend contact properties | `src/lib/subscribers.ts` |
| Checkout and interests server actions | `src/lib/personal-actions.ts` |
| Billing webhook | `src/app/api/polar/webhook/route.ts` |
| Required variable names | `.env.example` |

Environment names are `RESEND_API_KEY`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PRODUCT_PERSONAL`, and `POLAR_PRODUCT_PROFESSIONAL`. No secrets or live configuration were inspected for this handoff.

The source session ended after the Professional rename and its production build. Phase 4 was still pending: subscriber fan-out, daily schedule, human approval, and signed edit links. The original Phase 3 scope also mentioned the billing portal; do not mistake the checkout helper for a completed portal integration.

## Current repository differs from the old session

The web HEAD at inspection was `e705191`, following `1b30e85` titled “Add personal newsletter pricing and subscription signup”. There is substantial existing uncommitted work. Preserve it and inspect `git status --short` in both repositories before editing. Do not reset, clean, or restore files to reproduce the older session.

The current web README documents newer onboarding and a 14-day complimentary Personal trial. Read that section rather than rebuilding onboarding from this historical plan. Relevant files include `src/app/welcome/`, `src/components/onboarding-flow.tsx`, `src/lib/onboarding*.ts`, and `scripts/onboarding.test.mjs`.

In particular, delivery must understand the newer `trial` and `free` statuses and `personal_trial_ends_at`. The README and `personalAccess` in `src/lib/onboarding.ts` define entitlement behavior, paid access precedence, expired-trial fallback, and avoiding duplicate free/personal deliveries. `src/lib/subscribers.ts` now preserves active/trial access when checkout opens. These changes postdate the recovered session and were not validated by its builds.

The agent repository has staged additions, later modifications, deletions of the editor subagent, and untracked personalization/eval files. Preserve the current workflow rather than resurrecting the older editor-subagent design discussed earlier in the log.

## Validation evidence and limits

The old log records personal-issue passing 3/3 gates. Its combined personal-urls and personal-links output at line 1022 reports both passing, 8/8 gates. That same output also contains a subsequent workflow `ECONNREFUSED` error, so the environment was not entirely clean. Another eval output warned about quarantined stale local workflow generations. Do not delete `.eve/.workflow-data` without understanding what will be lost.

Build output at lines 1048 and 1062 shows `/pricing` prerendered and `/api/polar/webhook` dynamic, including the build after the Professional rename. Several historical typecheck commands pipe through `head` and then print `$?`; those status codes alone do not establish that TypeScript succeeded.

No build, eval, browser test, checkout, webhook delivery, or email send was run during this handoff task. A successful build is not proof of a deployed route or working billing integration.

The URL check is an eval in `evals/personal-urls.eval.ts`, not an enforced production gate. It extracts URLs with a regex and checks membership through `digestRaw.includes`. Do not carry forward the source assistant's broad claim that this proves hallucinations cannot occur.

## Next work

1. Read both repositories' current instructions and diff, plus the web README's delivery integration section. Confirm which newer onboarding work is still in progress before touching shared files.
2. Finish the missing accountless edit and billing flows. `updateInterestsAction` currently accepts email and interests without a signed-token check. The planned authenticated edit link needs server-side enforcement before this flow can safely be used. Checkout also writes interests based on submitted email; include that path in the ownership review.
3. Validate the existing webhook against the installed Polar SDK and official protocol before relying on it. Current code reads `polar-signature`, parses `t`/`v1`, and signs `timestamp.body`. It also treats all `subscription.updated` events as active and ignores update errors in `setSubscriberStatus`. These are concrete review points, not verified billing behavior.
4. Implement Phase 4 against the existing shared digest and current trial entitlement contract. Exclude unsubscribed contacts, avoid sending both editions, make retries safe, and preserve human approval. Keep subscriber failures isolated from shared production and other subscribers.
5. Track Professional's weekly research, archive access promises, and billing portal separately. Persisting bundles alone does not implement archive access control or weekly private research.
6. Validate locally with synthetic contacts and provider fixtures before real delivery. Do not push casually: the web README says pushes to `main` deploy production.

Useful validation commands, to run from their respective repositories when continuing:

```bash
# forwardpass-web
npx tsc --noEmit
node --experimental-strip-types --test scripts/onboarding.test.mjs
npm run lint
npm run build

# forwardpass
npm run typecheck
node_modules/.bin/eve eval personal-issue personal-urls personal-links --timeout 300000
```

The agent evals make model calls and depend on the dated digest fixture. Review configuration and costs before rerunning them.

## Suggested skills

Call the Skill tool for these when the associated work begins, or read their SKILL.md if the host has no Skill tool:

- `vercel:eve` for the agent workflow and fan-out. Also read the repository-specific `/Users/kalo/forwardpass/.agents/skills/eve/SKILL.md`.
- `vercel:nextjs` for web route and server-action changes. Repository `AGENTS.md` requires reading relevant installed guides under `node_modules/next/dist/docs/` before writing code.
- `code-review` when reviewing the resulting continuation diff.
- `handoff` to refresh the continuation document after the next coherent block.
- `unslop` for user-facing copy and documentation.

Follow the web repository's prohibition on TypeScript `any`. No code, commits, deployments, provider configuration, or outbound messages were changed by this handoff task.
