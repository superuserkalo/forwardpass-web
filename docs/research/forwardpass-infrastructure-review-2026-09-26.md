# Forward Pass infrastructure: what to improve after reverse engineering AlphaSignal

Reviewed 26 September 2026 against backend commit `d4a9c8d1f1c3961acb491fb592dbda9f6dba01aa` and website commit `057ca32f7c1fbe01d04ddaab7927974a283b8a20`.

**Keep the current infrastructure. Fix the contracts between research, published stories, editions and delivery.** Our captured evidence, claim verification, immutable production artifacts and send ledger are valuable foundations. The largest gaps occur when structured research becomes Markdown, when selection is treated as publication eligibility, and when personalized work is saved only after the entire audience has been processed.

AlphaSignal's useful architectural lesson is its separately addressable article corpus and campaign layer. Its public API also filters before pagination, and its newsletter output has consistent expanded and compact formats. Those are observable behaviors we can adapt. Its private importance weights, orchestration and reliability are unknown; the research does not justify migrating our TypeScript/Eve/R2/Resend stack to Python/MongoDB/SES.

This is an analysis with reproducible local probes. No application fixes, deployments, live sends or fresh paid model runs were performed. The [AlphaSignal reconstruction](./alphasignal-newsletter-reverse-engineering-2026-09-26.md) contains the competitor evidence and its uncertainty labels. The [local evidence directory](./forwardpass-infra-evidence/README.md) contains test logs, probes and results.

## Current system and proposed boundary

The backend owns collection, research, publication and delivery. The website calls its authenticated archive/reader endpoints. Polar customer state is projected into Resend subscriber properties for entitlement checks.

```text
CURRENT
Collection snapshots → captured evidence → event grouping → global research plan
  → researched/verified claims → reading-budget selection → edited Markdown
  → immutable daily artifact
      → parse Markdown again for website stories
      → rewrite selected stories separately for each paid recipient
      → save one whole-audience manifest → send ledger → Resend

PROPOSED
Collection → versioned evidence + persistent artifact/release identity
  → research + verified question coverage → approved story records
      ├─ compact searchable publication index → website
      ├─ edition plan → constrained rendering → immutable campaign
      └─ personal selection/verified variants → durable recipient work
  → resumable dispatch → provider reconciliation
```

These are ownership boundaries within the existing service, not a proposal for a service per box. Extend the existing schemas, publication module, article model and storage adapter.

The current schedules collect at 06:00 UTC, request daily production at 07:00 UTC, and request weekly production on Sunday at 08:00 UTC. Daily production also polls collection. The code does not currently schedule continuous hourly collection. Actual deployed schedules were not inspected. See [collection schedule](/Users/kalo/forwardpass/agent/schedules/collect_sources.ts:3), [daily workflow](/Users/kalo/forwardpass/agent/tools/produce_issue.ts:111) and [weekly schedule](/Users/kalo/forwardpass/agent/schedules/weekly_research.ts:3).

## Baseline and reproduced failures

The backend's **76 tests and typecheck passed**. The website's **24 tests passed**. These green checks do not cover several cross-module contracts.

| Probe using current functions | Result | What it establishes |
|---|---|---|
| Render one structured daily story, then parse it | Email sees 1 story; backend feed parser sees **0** | Current writer/parser incompatibility |
| Put a shared edition's second story first in a personal edition | Its anchor changes from `story-1` to `story-0` | Position is not a stable identity |
| Provide accepted evidence unrelated to a single-event research job | Contributing-evidence check returns true | Event relevance is not enforced on that path |
| Give a result no verified question coverage | It can still be selected | Event-count gain can substitute for answered questions |
| Compete one 400-word priority story with five 60-word lower-priority stories under a 400-word budget | All five short stories win | Among equally nonessential jobs, coverage per word overrides planner order |
| Render 2,519 words from a 60-word allocation | Structural length validator accepts 12,644 characters | Planned word budgets are not actual-output limits |
| Compare a model ID title with a descriptive title of the same release | Two groups, zero semantic comparisons | Title prefilter can prevent deduplication entirely |
| Classify “A rapid migration strategy” | Matches `APIs` | Substring-based topic inference produces false matches |

These are bounded reproductions, not measurements of production frequency. The overlong fixture passed the structural validator; it was not run through the final model-based claim gate. [Editorial results](./forwardpass-infra-evidence/editorial-results.json), [product results](./forwardpass-infra-evidence/product-results.json).

## 1. Make a published story a durable object

**First implementation priority: one stable story contract shared by the writer, feed, archive, personalization and votes.**

The current [writer](/Users/kalo/forwardpass/agent/lib/editorial-draft.ts:3) emits `##` headings and bare primary-source URLs. The backend [edition parser](/Users/kalo/forwardpass/agent/lib/edition-stories.ts:16) expects numbered headings and labeled Markdown source links. The [reader feed](/Users/kalo/forwardpass/agent/lib/reader-feed.ts:79) consumes that parser. The website can mask the empty result by [rebuilding stories from archived editions](/Users/kalo/forwardpass-web/src/lib/feed.ts:236), introducing a second interpretation of the same issue.

Story IDs are then assembled from date and array position. Paid [archive reads](/Users/kalo/forwardpass/agent/lib/archive.ts:83) return personalized text, whose stories can be filtered and reordered. A shared story link can point at a missing or different personal anchor, while the [archive vote ID](/Users/kalo/forwardpass-web/src/app/archive/[kind]/[date]/page.tsx:273) can identify another shared story. The probe reproduces the identity collision without sending a vote.

Persist an approved story before rendering. Its contract should carry:

- Stable story ID and revision; artifact/release identities; source snapshot and accepted claim references.
- Final verified copy, title, dek, primary/supporting URLs, content type and explicit topics.
- Source publication/update times, first discovery time and our actual publication time as separate fields.
- Verification and publication status independent of edition membership.

An edition should reference ordered story IDs with a role, allocated length and rendering variant. Personal editions should retain the same story IDs even when selection, order or wording changes. Canonical story URLs and edition URLs serve different purposes and should remain distinct.

The existing [editorial article model](/Users/kalo/forwardpass/agent/lib/articles.ts:11) already carries explicit metadata. Extend or align with it instead of creating another unrelated content model. Preserve historical positional URLs through a mapping made from the original shared issue; do not silently reinterpret existing votes using new ordering.

There is an immediate small fix available: teach the legacy parser the current output and add a writer-to-reader contract test. That repairs the present break while the structured publication record removes the recurring source of drift.

**Acceptance:** the same generated fixture retains identical story IDs, source associations and canonical links through email, shared archive, reordered personal archive and feed. Voting from each surface identifies the same story. Historical editions still resolve.

## 2. Separate evidence eligibility, editorial priority and edition assembly

The planner already asks useful questions, compares the full candidate set and accounts for every event. Preserve that behavior. The problem is what happens after it plans.

### Evidence must answer the investigation

In [hasContributingEvidence](/Users/kalo/forwardpass/agent/lib/editorial-evidence.ts:70), a single-event job needs only an accepted claim with a document ID. It does not need to establish that the document contributes to that event. The code then computes verified question coverage but does not require coverage for `publishable`.

Require an explicit evidence-to-event relationship and either a materially answered reader question or a verified negative finding that resolves the investigation. Keep legitimate source discovery: a community URL may lead to a different primary-source URL, so exact URL equality alone is too restrictive. True but unrelated facts should not qualify a story.

### Preserve editorial importance when allocating space

The [planner orders jobs by editorial priority](/Users/kalo/forwardpass/agent/lib/editorial-models.ts:102), but the [portfolio selector](/Users/kalo/forwardpass/agent/lib/editorial-selection.ts:67) ranks essential status first, then marginal coverage divided by estimated words. Planner order breaks ties. Every event contributes coverage even if none of its questions were answered.

This rewards inexpensive breadth. It can remove a substantive lead in favor of multiple small updates. Essential jobs have additional protection; the demonstrated failure concerns equally nonessential jobs.

Use a staged decision:

1. Establish evidence eligibility and resolved questions.
2. Preserve explicit editorial priority, including why omission matters.
3. Select a portfolio subject to novelty, redundancy, reader utility and necessary coverage.
4. Allocate expanded or compact treatment and actual word budgets.

Avoid inventing numeric weights and calling them AlphaSignal's algorithm. Start with interpretable priority tiers or pairwise editorial ordering, evaluate against reviewed historical candidate sets, then tune. Attention can inform discovery and interest without becoming a truth or importance score.

### Preserve useful verified work outside the free edition

[completeEditorialResearch](/Users/kalo/forwardpass/agent/lib/editorial-workflow.ts:178) sets each digest row's `publishable` flag from whether it won the shared edition's budget. [approvedStories](/Users/kalo/forwardpass/agent/lib/publication.ts:19) then limits personal and weekly composition to those rows. A verified niche development excluded from the general issue cannot become a paid subscriber's best match through this path.

Store verification status, publication approval and edition membership separately. Research eligibility does not automatically authorize public publication, but shared-edition omission should not erase eligibility for a relevant personal edition.

### Enforce the writing contract after generation

The present structural gate allows 80–40,000 characters and checks approved source coverage; it does not enforce the planner's word allocation. The renderer also treats lead/main/compact stories largely alike.

AlphaSignal's sampled lead bodies stayed within 138–178 words, while organic compact headlines stayed within 9–17 words. The useful adaptation is enforceable roles: expanded explanation, compact update, introduction and subject. Choose Forward Pass's own reading budget and number of stories. Validate actual lengths and required evidence, then allow a bounded repair. Do not force three leads on a quiet day or truncate useful research before comparison.

**Acceptance:** unrelated evidence fails; a verified negative result remains representable; reviewed high-priority stories are not displaced solely because they cost more words; actual copy satisfies its role budget; and personal selection can include approved research outside the shared issue.

## 3. Make paid personalization reusable, grounded and resumable

There are two separate problems: content assurance and work durability.

[Personal daily composition](/Users/kalo/forwardpass/agent/lib/personal-ai.ts:26) evaluates format plus every approved story, selects up to five and may generate fresh prose. [Weekly composition](/Users/kalo/forwardpass/agent/lib/weekly.ts:51) also generates fresh prose. Both check permitted URLs; neither applies the daily draft's final assertion-to-evidence verification. A permitted citation does not establish that a newly written sentence is supported.

Prefer selecting and arranging already verified story variants. When personalization rewrites factual prose, apply the same final claim gate and preserve its evidence references. Cache reusable work by source revision, normalized preferences, format and model/prompt policy. Interpret the requested format when preferences change rather than reevaluating it for every daily issue. Keep recipient-specific management links and consent outside reusable content.

[Daily staging](/Users/kalo/forwardpass/agent/lib/delivery.ts:94) serially composes recipients into memory and saves the manifest only after the whole audience succeeds. [Weekly staging](/Users/kalo/forwardpass/agent/lib/weekly.ts:102) follows the same pattern. A late failure can lose all earlier unsaved generation; concurrent staging can pay for duplicate work before one final manifest wins.

Persist an audience snapshot, then claim and checkpoint each recipient's prepared content. Use bounded concurrency and durable progress. Freeze the manifest as references to prepared objects. A recipient failure should have an explicit retry/fallback policy and should not prevent the shared issue from becoming archive-visible. A paid fallback must preserve the product promise rather than silently substituting another tier's edition.

### Scale implied by the current code

These are application-level operation counts, not invoices or measured production latency. For a fresh successful daily run with N eligible contacts, P personal readers and S approved stories, without skips, conflicts or retries:

| Work | Current count |
|---|---:|
| Personal format and relevance evaluation | P × (S + 1) model evaluations |
| Personal prose generation | One per personal reader requesting prose |
| Resend staging plus sending | 5N + ceil(N / 100) API calls |
| R2 staging plus sending, excluding research/save | 5N + 5 object operations |
| Deliberate send pauses | 0.6N seconds |

At 1,000 eligible recipients this path implies 5,010 Resend calls and ten minutes of deliberate pauses alone. Network time, generation and SDK retries add work. The response is bounded provider concurrency and reusable content, while retaining the current send-time consent/entitlement checks. The existing search reservation budget does not constrain audience-dependent model generation.

**Acceptance:** stop preparation halfway through, restart it, and prove completed content is reused; run two stagers and prove one claims each work item; verify source/profile changes invalidate the right content; reject unsupported claims in rewritten variants.

## 4. Finish the send ledger's recovery contract

Our sender already uses conditional attempt creation, sent/skipped markers and provider idempotency keys. Keep these protections. It also rechecks topic consent and entitlement immediately before sending.

The gap is recovery: an existing [attempt marker](/Users/kalo/forwardpass/agent/lib/delivery.ts:171) becomes `needsReconciliation`. A returned provider error writes `failed.json`, but the next run stops at the attempt and does not consume that failure. A network timeout or acceptance followed by a failed receipt write can leave an uncertain attempt. No reconciliation operation was found in the [delivery CLI](/Users/kalo/forwardpass/scripts/delivery.mjs:7).

Represent prepared, dispatching, accepted, rejected and unknown outcomes explicitly. Record provider identity and error category. Add reconciliation using provider evidence or an explicit operator resolution; retry only when established safe under the provider's current idempotency contract. Do not delete attempts and blindly resend.

The current [publication marker](/Users/kalo/forwardpass/agent/lib/delivery.ts:209) can be written with unresolved recipients. That can be valid for archive visibility, but content publication and delivery completion need separate statuses and alerts.

Also align the daily digest storage adapters: [R2 saves one immutable object](/Users/kalo/forwardpass/agent/lib/digest-store.ts:92), while [local mode overwrites two files](/Users/kalo/forwardpass/agent/lib/digest-store.ts:123). Current local tests do not establish production conflict/crash behavior.

**Acceptance:** inject rejection, timeout, termination after provider acceptance, and failure to persist the receipt. Demonstrate safe recovery, stable run counts and no blind duplicate sends. Run shared storage-contract tests against both adapters.

## 5. Turn collection and enrichment into incremental work

There is already substantial caching: frozen captures, content-hashed documents, researched results and policy/model/input-keyed evaluations. The improvement is to use durable incremental work and reduce repeated comparison, not simply “add caching.”

The [daily workflow](/Users/kalo/forwardpass/agent/tools/produce_issue.ts:123) captures/classifies in batches of six, builds the global plan, then processes research jobs sequentially. [Passage selection](/Users/kalo/forwardpass/agent/lib/evidence-passages.ts:22) scans source windows for each question; the [shared evaluation wrapper](/Users/kalo/forwardpass/agent/lib/jev.ts:20) limits evaluations to two concurrently. Personal/weekly evaluations use a different direct path.

A replay of the saved September 24 collection contained **2,665 canonical candidates**. Under an explicit scenario where the judge considers every compared pair a distinct event, current grouping offered **2,465 semantic comparisons** and consumed **8.623 seconds of local CPU**, excluding models, network and storage. Its global brief was **568,583 characters** with empty captured excerpts and no history, retaining only 60 summary characters per candidate. These are scenario measurements, not the actual production model bill or proof of a context-window failure. [Replay results](./forwardpass-infra-evidence/scale-results.json).

Improve this in three connected places:

- Persist artifact and release identities across days. Use repository/model/paper IDs and explicit crosslinks before semantic adjudication. Keep versions distinct. The current title-similarity prefilter can miss aliases completely.
- Precompute title terms and use an index for plausible neighbors. Incrementally capture/classify changed evidence and checkpoint research jobs before edition time. Bound concurrency through one observable gateway, including personal and weekly work.
- Budget planning by actual model context/tokens, with traceable compressed evidence and complete candidate accounting. Evaluate hierarchical comparison against a reviewed baseline before adopting it; do not silently drop a tail of candidates to make the prompt fit.

Source health is persisted but [the planner's candidate path](/Users/kalo/forwardpass/agent/lib/source-monitor.ts:42) does not carry its coverage summary. Make “source unavailable,” “source quiet,” “unchanged” and “deliberately deferred” distinguishable. In the historical snapshot, 71 of 875 routes failed and eight were partial; that is historical evidence, not today's outage count.

The HF [normalizer](/Users/kalo/forwardpass/agent/lib/source-index.ts:115) drops likes/downloads present in its input. Preserve useful native metrics with measurement time and units; calculate velocity only from actual repeated samples. The replay had 802 candidates with attention but zero measured velocities. Missing history is not zero momentum. Keep X/alphaXiv deferred rather than making paid or permission-based sources prerequisites.

Finally, collection's create-only hourly attempt can strand an interrupted hour, while the actual collection schedule is daily. Add explicit interrupted-attempt recovery and freshness alerts. Make degraded-model cache provenance explicit too: the evaluation wrapper records fallback usage, but caches a fallback result under the preferred-model key.

**Acceptance:** unchanged evidence causes no repeated enrichment; alias fixtures merge without merging distinct releases; interrupted collection/research resumes; every candidate remains accounted for; and source coverage, queue age, stage usage and fallback rates are visible.

## 6. Serve a bounded index and make reader feedback trustworthy

AlphaSignal demonstrates a useful product boundary: a queryable published corpus where filters apply before pagination. Our website instead filters an already loaded slice.

The backend reads at most [14 daily editions](/Users/kalo/forwardpass/agent/lib/reader-feed.ts:9); the website usually asks for [48 stories](/Users/kalo/forwardpass-web/src/lib/feed.ts:236). Browser filters and “load more” operate within that data. A month/all-time selection cannot discover otherwise eligible older stories outside the slice. Backend daily cards also emit empty topics, null image/author and a scheduled 07:00 timestamp instead of the actual publication time.

Publish compact metadata index shards/manifests alongside the canonical stories. Apply entitlement, topic, type, time and ordering before cursor pagination. Cache immutable public content; overlay reader state separately. Avoid caching personalized responses under shared keys. An indexed database can be considered when measured query needs exceed this design; MongoDB is not a prerequisite.

[Vote aggregation](/Users/kalo/forwardpass/agent/lib/reader-votes.ts:70) currently lists the full vote history and builds sets of voter hashes, including for a single editorial article. Keep idempotent per-reader vote membership as authority, but serve bounded count projections and query only the current viewer's state for requested stories. A naive mutable counter would introduce lost-update races.

Correct failure semantics before using votes as a ranking signal. The website [turns remote vote failures into local success](/Users/kalo/forwardpass-web/src/lib/votes.ts:16), and [the button keeps the local state](/Users/kalo/forwardpass-web/src/components/archive/story-actions.tsx:33). Authentication, rate-limit and service errors should remain distinguishable; rollback or show pending state when persistence fails.

Website personalization also differs from email. [For You](/Users/kalo/forwardpass-web/src/lib/feed-rank.ts:17) sorts by topic-match count, with recency only breaking ties. A 25-day-old two-topic fixture outranks a fresh one-topic fixture. Agree on one normalized preference contract, then evaluate explicit recency, topic affinity, novelty and exploration behavior. Do not assume a learned feedback loop exists: bookmarks are currently local browser state, and the reviewed ranker does not learn from behavior.

**Acceptance:** an older matching record beyond the first page is reachable; counts and cursors agree; reads are bounded by the requested page; failed votes are not presented as persisted; and fixed reader profiles produce reviewable selection reasons across website and email.

## Implementation order and what to measure

| Order | Coherent change | Proof before moving on |
|---|---|---|
| 1 | Repair writer/parser contract; add stable story IDs and structured publication records; migrate consumers and preserve old links | One fixture round-trips through every surface, including reordered personalization |
| 2 | Separate verification/approval/membership; close relevance gap; preserve priority and enforce output roles | Reviewed editorial fixtures plus actual-word and source-support checks |
| 3 | Reuse verified variants; checkpoint recipient preparation; add delivery reconciliation | Fault-injected restart/concurrency suite and counted synthetic audience run |
| 4 | Publish query index and vote projections; correct feedback errors | Pagination/entitlement checks, bounded read counts and persistence-failure UI checks |
| 5 | Incremental enrichment, persistent release identity, collection recovery and unified usage telemetry | Historical replay comparing quality, model calls, queue age and total latency |

Track the measures that tell us whether the changes work: broken/misbound story links; approved stories outside the general edition; verified question coverage; editorial inclusion judgments; actual issue length; model calls and tokens per approved story; cache reuse; repeated preparation after restart; unresolved delivery attempts; feed read counts and latency; and vote persistence failures.

The present baseline is green, and the probes identify concrete gaps despite that. They do not establish production p95, current provider limits, live audience size, deployed schedule correctness, actual model spend or delivered-email behavior. Those need a controlled deployment check and an explicitly scoped end-to-end smoke after implementation. No fresh model generation or live delivery was necessary to establish the first changes above.
