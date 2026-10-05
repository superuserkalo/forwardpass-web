# Forward Pass infrastructure handoff

> Historical handoff from 26 September 2026. Its Eve runtime, repository state and proposed changes predate the current Cloudflare Worker implementation. Start with [architecture](../architecture.md) and refresh the source baseline before using this handoff.

Prepared 26 September 2026. Research and analysis are complete. The proposed application changes have not been implemented by this investigation.

## Objective and first action

Improve Forward Pass's newsletter service using the observable parts of AlphaSignal's system: separately addressable published stories, edition assembly, constrained writing and a queryable archive. The user's focus is the backend, algorithms and actual newsletter behavior.

Keep the existing TypeScript/Eve, R2 and Resend foundation. Start implementation with the contract from structured editorial output to feed, archive, email and votes. The review reproduced a current-format story disappearing through the backend feed parser and positional story identities changing under personalization.

Before editing, refresh the baseline against the current code. The backend has changed since the review. Preserve the concurrent changes described below.

## Repository state and evidence boundary

| Repository | Reviewed commit | HEAD checked while preparing this handoff |
|---|---|---|
| `/Users/kalo/forwardpass` | `d4a9c8d1f1c3961acb491fb592dbda9f6dba01aa` | `07cab570f3d4efac5408a3c41bb17b3778dcc6fb` |
| `/Users/kalo/forwardpass-web` | `057ca32f7c1fbe01d04ddaab7927974a283b8a20` | Same commit |

The backend advanced through two commits:

- `1ed8754` removes the in-process evaluator queue.
- `07cab57` adds timeouts to model calls in `jev.ts`, `editorial-models.ts` and `evidence-review.ts`.

The diff was inspected. The review's statement that the shared evaluator has a concurrency limit of two is now historical. Evaluate current timeout, fallback and concurrency behavior before changing it. These commits do not modify the parser, story identity or delivery modules identified below, but the original tests and probes have not been rerun at the new HEAD.

The backend has an existing untracked `issues/2026-09-23.html`. Preserve it. The website has untracked `docs/research/`, containing this investigation's reports and evidence. No application changes, commits, pushes, deployments, paid model runs or live sends were performed as part of this investigation.

The baseline at the reviewed commits passed 76 backend tests, backend typechecking and 24 website tests. Treat those as results for the recorded commits, not a fresh acceptance result for the current backend.

## Read these artifacts

1. [Infrastructure review](/Users/kalo/forwardpass-web/docs/research/forwardpass-infrastructure-review-2026-09-26.md). Read for findings, code references, proposed changes and acceptance criteria.
2. [AlphaSignal newsletter reconstruction](/Users/kalo/forwardpass-web/docs/research/alphasignal-newsletter-reverse-engineering-2026-09-26.md). Read when deciding which competitor behaviors are observed and which remain inferred. This is the relevant research report; the older business-oriented report is not the implementation basis.
3. [Infrastructure evidence](/Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/README.md). Contains baseline logs, executable local probes and saved results.
4. [AlphaSignal evidence](/Users/kalo/forwardpass-web/docs/research/alphasignal-system-evidence/README.md). Contains public-query measurements, edition observations and verification instructions.

AlphaSignal's public article and campaign records, query behavior and writing patterns were inspected. Its private importance weights, prompts and delivery reliability were not recovered. Do not attribute proposed Forward Pass algorithms to AlphaSignal.

## Architecture to preserve and extend

```text
Source collection → captured evidence → event grouping → research and verification
  → approved structured stories
      → indexed website feed and canonical story pages
      → shared edition plan and rendered email
      → personal selection and verified variants
  → durable recipient preparation → send ledger → provider reconciliation
```

Use the existing modules and storage adapter. Preserve captured source snapshots, claim-level checks, candidate accountability, immutable production artifacts, conditional send claims, provider idempotency and send-time consent/entitlement checks.

The data model needs distinct concepts for verification status, publication approval and edition membership. A story ID must survive reordering. Story revisions must retain their evidence references. An edition owns ordered story references, presentation roles and rendering variants.

## Proposed implementation sequence

### 1. Repair the publication contract and story identity

Verified at the review baseline:

- `renderEditorialDraft` emits `##` headings and bare primary-source URLs. `editionStories` expects numbered headings and labeled Markdown links. A probe produced one email story and zero backend feed stories.
- The website can conceal the empty feed by reparsing archived editions through a different parser.
- Feed IDs and anchors use date and position. A personal edition can filter or reorder stories, changing the identity associated with a position. Links and votes can then refer to the wrong shared story.

Start in backend [editorial-draft.ts](/Users/kalo/forwardpass/agent/lib/editorial-draft.ts), [edition-stories.ts](/Users/kalo/forwardpass/agent/lib/edition-stories.ts), [reader-feed.ts](/Users/kalo/forwardpass/agent/lib/reader-feed.ts), [reader-votes.ts](/Users/kalo/forwardpass/agent/lib/reader-votes.ts) and [archive.ts](/Users/kalo/forwardpass/agent/lib/archive.ts). Website consumers are [feed.ts](/Users/kalo/forwardpass-web/src/lib/feed.ts), [story-parse.ts](/Users/kalo/forwardpass-web/src/lib/story-parse.ts) and the [edition page](/Users/kalo/forwardpass-web/src/app/archive/[kind]/[date]/page.tsx).

First add a failing writer-to-reader contract test and repair current-format parsing. Then persist a versioned story record with stable ID, final verified copy, source/claim references, explicit topics/type and actual timestamps. Align it with the existing [article model](/Users/kalo/forwardpass/agent/lib/articles.ts). Make each consumer use the same records.

Map historical positional links and votes using the original shared issue. Preserve ambiguous historical records without guessing their identity from personalized order. Keep canonical story URLs distinct from a reader's edition URL.

Done when the same fixture retains its IDs, sources, links and vote targets through email, feed, shared archive and reordered personal archive, and legacy editions still resolve.

### 2. Correct editorial eligibility and allocation

Verified at the review baseline:

- A single-event job's contributing-evidence check accepts an unrelated document if it contains an accepted claim.
- A result with no verified question coverage can still enter the portfolio.
- Among equally nonessential jobs, coverage per estimated word overrides planner order. Five short updates displaced a higher-priority 400-word story in a probe.
- Shared-edition selection determines `publishable`, restricting personal and weekly selection to the general issue's chosen stories.
- A 60-word allocation producing 2,519 words passed the structural publication validator. This was not a full model-based claim-validation run.

Start in [editorial-evidence.ts](/Users/kalo/forwardpass/agent/lib/editorial-evidence.ts), [editorial-selection.ts](/Users/kalo/forwardpass/agent/lib/editorial-selection.ts), [editorial-workflow.ts](/Users/kalo/forwardpass/agent/lib/editorial-workflow.ts) and [publication.ts](/Users/kalo/forwardpass/agent/lib/publication.ts).

Require evidence that contributes to the investigated event and resolves a useful question, including legitimate negative findings. Allow discovery to lead from a community link to a different primary source. Separate eligibility and approval from membership in a specific issue. Preserve explicit priority before assigning expanded or compact treatment. Validate actual output lengths and factual support, with bounded repair.

Done when unrelated evidence fails, approved niche research can enter a personal edition despite omission from the shared issue, important stories are not displaced solely by cheaper word allocations, and rendered sections satisfy their declared budgets.

### 3. Make personalization and delivery durable

Verified by code inspection at the review baseline:

- Personal daily and weekly prose is checked for allowed source URLs but does not receive the main daily draft's final assertion verification.
- Recipient generation accumulates in memory before the whole-audience manifest is saved. A late failure can repeat earlier paid generation.
- Attempt markers prevent blind resends, but unresolved attempts lack a reconciliation operation. Publication status does not establish that every recipient was delivered.
- Local daily digest persistence overwrites two files, unlike the immutable single-object production contract.

Start in [personal-ai.ts](/Users/kalo/forwardpass/agent/lib/personal-ai.ts), [weekly.ts](/Users/kalo/forwardpass/agent/lib/weekly.ts), [delivery.ts](/Users/kalo/forwardpass/agent/lib/delivery.ts), [digest-store.ts](/Users/kalo/forwardpass/agent/lib/digest-store.ts) and the [delivery CLI](/Users/kalo/forwardpass/scripts/delivery.mjs).

Reuse verified variants or verify rewritten assertions. Cache reusable content by source revision, preferences, format and model/prompt policy. Claim and checkpoint recipient preparation individually. Preserve individual consent and management links outside shared content. Add explicit accepted, rejected and unknown delivery outcomes plus reconciliation based on provider evidence. Keep archive publication separate from delivery completion.

Done when injected failures and concurrent workers reuse completed preparation, preserve send-time consent, safely reconcile uncertain outcomes and never blindly duplicate a send. Both storage adapters must satisfy the same publication contract.

### 4. Index published stories and correct feedback

The reviewed backend reads at most 14 daily editions. The website normally loads 48 stories and filters that slice. Daily topics are missing or inferred through fragile string matching. Vote reads aggregate the full history, and remote vote failures appear locally successful. Website personalization counts matching topics with recency as a tie-breaker.

Build bounded publication indexes, apply entitlement and filters before cursor pagination, and separate public content from reader-specific state. Keep authoritative per-reader vote membership and derive safe count projections. Preserve remote failure distinctions and undo unpersisted optimistic votes. Use a common preference contract across email and website.

Done when matching older stories are reachable beyond the initial page, reads scale with the requested page, personalized data stays correctly partitioned and failed votes are not shown as persisted.

### 5. Make enrichment incremental and observable

The historical collection replay had 2,665 canonical candidates. An explicitly all-distinct event scenario offered 2,465 semantic comparisons and produced a 568,583-character brief without captured excerpts or history. These are bounded replay results, not production cost or latency estimates.

Persist artifact/release aliases across days, index candidate neighbors, reuse unchanged evidence and checkpoint research jobs. Budget planning against actual token/context needs while accounting for every candidate. Carry source-health coverage into planning. Preserve HF metrics with units and measurement times, and compute velocity only from repeated observations. Add recovery for interrupted collection attempts and explicit fallback-model cache provenance.

Inspect the newly changed evaluator before choosing concurrency controls. Existing caches are real; measure reuse before adding another layer.

Done when unchanged evidence avoids repeated enrichment, aliases merge without merging distinct releases, interruptions resume, and usage, source coverage and queue age can be measured.

## Validation and working constraints

Begin with repository status, the diff since the reviewed commits and applicable `AGENTS.md` files. Before writing website application code, read the relevant installed Next.js guides under `/Users/kalo/forwardpass-web/node_modules/next/dist/docs/`. The user prohibits TypeScript `any`.

Use current code as authority. Existing caps and constants are tunable when evidence supports the change. Keep free sources working; X and alphaXiv remain deferred under the previously recorded source preference. Preserve current product consent and entitlement boundaries.

The prior baseline commands were:

```bash
cd /Users/kalo/forwardpass
npm test
npm run typecheck

cd /Users/kalo/forwardpass-web
node --test scripts/*.test.mjs
```

For the parser, selection, relevance and identity findings, rerun the local probes against the current checkout:

```bash
cd /Users/kalo/forwardpass
node --import tsx /Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/editorial-probe.mjs
node --import tsx /Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/product-probe.mjs
```

The optional scale probe requires the local snapshot `/Users/kalo/forwardpass/.delivery/collection/runs/2026-09-24/20.json`. It writes derived output to `/tmp/forwardpass-infra-probe-results.json`. If that snapshot is unavailable, use the saved results with their historical label rather than substituting a live collection run.

For implementation, add tests at the failing cross-module boundary and delivery fault points. Keep original evidence files intact and record new results with their commit. Compare correctness and quality before claiming performance gains.

Production latency, spend, actual schedules, provider limits and end-to-end delivery remain unmeasured. Local passing tests establish only their tested scope. After each implemented block, report the changed behavior, relevant proof, unresolved concerns and exact commit/deployment state.
