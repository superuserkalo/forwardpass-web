# Consumer hardware coverage and infrastructure review

Reviewed 15 October 2026 against both working checkouts, their tests, the live Cloudflare Worker, production R2 records and the website's Vercel deployment. Both repositories were clean before this work.

Consumer hardware was missing by policy, not just by source coverage. `compute.ts` rejected GeForce, RTX, Radeon RX and consumer devices. Triage scored consumer devices below four, and the editor prohibited them. The source feeds alone could not fix that chain.

## Implemented

Consumer GPUs, CPUs, NPUs, AI PCs, VRAM/GDDR, system and unified memory, prices, supply and measured local-inference hardware now enter the existing compute path. Triage and editorial prompts judge them by changes to capability, availability and cost. The ordinary daily issue chooses the most important stories; a consumer-hardware item is not guaranteed every day.

Fact extraction asks for SKU, memory capacity/type/bandwidth, precision, software compatibility, price, region, availability and measured inference conditions. Fact ranking lets memory be the main development. Manufacturer TOPS and model-fit claims must stay attributed; capacity and TOPS alone do not establish model fit or tokens per second. Existing quote and grounding checks remain in place.

Apple Newsroom and TechPowerUp were added to the editable catalog and generated registry. Apple serves Atom at its `.rss` URL. The existing NVIDIA, AMD, Intel, Qualcomm, Tom's Hardware and Chips and Cheese routes were checked against production health and were successful or unchanged. TechPowerUp remains a reported source, including when it republishes a vendor press release. Rumors retain Unconfirmed provenance.

The classifier continues to reject shopping deals, peripherals, gaming-only reviews, stock-market chatter and routine graphics-driver releases. It admits relevant hardware news in English and tested Chinese, Korean and Japanese examples. A low-power consumer chip does not become a Data centers story merely because its summary mentions power.

The website uses the existing Chips preference. Its homepage and Markdown copy share updated coverage labels, onboarding previews mention consumer chips and VRAM, and fallback topic matching recognizes hardware names. NPU matching uses word boundaries so an API's input is not classified as chip news. Saved reader profiles and the story schema need no migration.

The Node job runner now accepts `--compute`; previously its issue call omitted the production compute flag. Use a fresh `JOB_SCRATCH` for a new comparison. The engine README was replaced because it described removed Eve schedules, nonexistent package commands and outdated deployment state. Website documentation now distinguishes implemented personal/weekly workflows from disabled production switches.

## Verification and practical limits

- Before changes: 673 engine tests and 39 website tests passed.
- After changes: 677 engine tests, 40 website tests and 89 separate website account/billing/script tests passed. Both type checks, website lint, the Webpack production build, Worker deployment dry run and diff checks passed.
- A live read through the real collector parsed 20 Apple entries and 125 TechPowerUp entries without invalid records. The initial lookback emitted 98 recent candidates, of which 15 qualified for compute. The deployed collection was also checked after release, as recorded below.
- Six recent production snapshots across 13–15 October yielded 2,187 distinct URLs. Both classifiers admitted 128; the changed policy added none in that particular sample. The newly added feeds supplied relevant GPU and memory stories missing from that sample. This supports adding sources as well as changing policy; it does not establish a measured recall improvement across the full production corpus.
- A live model smoke triaged the 15 compute candidates. A consumer platform story scored eight, the GPU-pricing and VRAM-rumor stories scored five, and themed graphics-card and motherboard marketing were rejected. One real GPU-pricing story then passed full-page capture, six verbatim-verified facts, fact ranking, signal-headline writing and local email rendering. No fact was dropped and no capture fallback was used. Recorded model usage for this smoke totals approximately $0.0096.
- That smoke is one representative signal. It does not prove final editor choice, a complete new daily issue, future consistency, delivery to an inbox, or a benchmark of factual accuracy. No extra newsletter was sent and today's published issue was not replaced.

Evidence is saved in [collection and replay results](consumer-hardware-evidence-2026-10-15.json) and [editorial smoke results](consumer-editorial-smoke-2026-10-15.json). Synthetic regression cases are identified as synthetic in `scripts/consumer-hardware.test.mjs`.

## Runtime review

The website owns rendering, WorkOS sessions, reader consent and Polar webhook handling. The Worker owns collection, generation, publication, R2, email/chat delivery, reader APIs, MCP and Durable Objects. The existing split supports this feature without a database migration or another service.

The collector uses eight shards with concurrency two, bounded response bodies and retained state. The latest pre-deployment collection completed at 12:08 UTC and saved 529 items. Its source health contained 532 ok, 397 unchanged, 40 not due, 11 partial, 19 failed, five reference, 33 permission-required and one delegated route. These categories are not all successful coverage.

Durable steps keep large data in R2 and persist completed model calls. Structured story records carry stable IDs into email, archive and agent coverage. Source quotes are validated before prose is grounded. Delivery stages and rechecks consent, uses create-only claims and Resend idempotency, and records ambiguous outcomes separately. Reader and agent access have separate signed credentials; public archive reads do not inherit a subscriber's access. Polar fulfillment reads current provider state rather than trusting a checkout redirect. The focused automated suites cover these contracts. Real OAuth login, checkout, new credit purchase and chat delivery were not performed in this review.

Current Workers guidance and the latest `@cloudflare/workers-types` package, `5.20261015.1`, were retrieved. The project dependency was not changed. Configuration and binding shapes were checked with the installed Wrangler schema and deployment dry run. References: [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) and [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/).

The tested Worker was deployed as version `2ad79743-46de-4c64-b1a9-9c9925345dd7`, serving 100% of traffic. `/health`, `/stats` and authenticated `/admin/editions/status` returned HTTP 200 afterward. Stats reported 1,042 streams and 461 publishers, including discovered sources. Runtime flags were re-read: compute, daily autopublishing and editorial autopublishing are on; personal editions, weekly research, weekly compute, fast collection, scheduled signals and off-session refill remain off. Existing committed weekly-compute workflows were registered by deployment but remain disabled.

A post-deployment collection, `collect-manual-1792071792070`, completed successfully at 13:43:56 UTC and saved `collection/runs/2026-10-15/13.json` with 542 items. Apple and TechPowerUp both reported ok, with 20 and 125 parsed entries and zero invalid records. They emitted seven and 90 new feed entries respectively. Signals remained disabled and no issue was generated or emailed by this collection.

The website deployment for commit `a79fde3` reached READY. A live browser check showed `consumer_chips` and `gpu_memory` in the infrastructure coverage card and a source count of 1,042. The local production build was also opened successfully.

Today's published marker is `2026-10-15T05:37:38.682Z`. Its existing email ledger records 21 sent, zero failed and zero requiring reconciliation, completed at 05:38:58 UTC. This is provider/ledger evidence, not evidence that every recipient opened or received the email in their inbox.

## Findings still requiring work

1. **P1: A gateway failure can remove a whole day's briefing.** The scheduled 13 October issue failed at `write-1` after model gateway retries. R2 contained neither its published marker nor a delivery status. The watchdog recorded `issue-missing`; it did not recover the run. Collection and the next two daily sends succeeded. Add a bounded recovery policy or an operational retry process using the existing checkpoints. Preserve the prohibition on publishing an unverified draft. Evidence: Workflow `issue-2026-10-13`, `src/lib/watchdog.ts`, and the missing R2 records.
2. **P1: Paid-plan promises exceed enabled delivery.** Production still has personal and weekly editions disabled, while website pricing and agent guidance describe them as included. The code exists, but a paying reader currently gets the shared daily email and no scheduled weekly reader research. Either qualify the offer or enable each capability after a full preview, entitlement, retry and delivery acceptance run. Do not treat the public Sunday editorial article as that weekly product. Evidence: deployed flags, `src/delivery/deliver.ts`, `src/lib/archive.ts`, and the website's `src/lib/pricing.ts` and `src/lib/llms.ts`.
3. **P2: Successful collection hides individual publisher failures.** Nineteen routes failed in the checked snapshot, including oversized HTML, HTTP 403/404/419/429/500, redirects, timeouts and endpoints returning HTML instead of feeds. None of the checked existing hardware sources failed in that snapshot. The watchdog only checks whether a collection snapshot exists and is recent, so persistent source failures need a separate coverage-health check. Repair or retire broken endpoints individually; keep the response-size and access guards.
4. **P2: Automated validation is easy to run incompletely.** Neither checkout had a checked-in CI workflow. Website `npm test` covers only `tests/*.test.mjs`; 89 additional account/billing tests require the separate documented invocation. Add a CI gate for both sets, type checking, lint and build. The verification above ran them separately.
5. **P2: Some public metrics are estimates.** Website `source-stats.ts` derives its scanned-item display from elapsed time and a historical rate. The fallback source count is also historical. Neither is a measured processing ledger. Label the estimate visibly or replace it with stored counters before using it as evidence of coverage.

The review traced the main collection-to-reader path, configuration, access boundaries, billing reconciliation and tests. It was not an exhaustive security audit, a load test, a full provider delivery matrix or a review of every historical research file. The findings above are supported by current code and live state; absence of another finding is not a guarantee.
