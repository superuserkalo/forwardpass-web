# Forward Pass infrastructure review evidence

Reviewed 26 September 2026. Backend checkout `d4a9c8d1f1c3961acb491fb592dbda9f6dba01aa`; website checkout `057ca32f7c1fbe01d04ddaab7927974a283b8a20`.

The backend's 76 tests and typecheck passed. The website's 24 tests passed. Logs are saved here. No application fixes, deployments, live email sends, paid model runs or production load tests were performed.

Three probes execute current functions against synthetic fixtures or a previously saved collection snapshot:

- `editorial-probe.mjs`: output-format round trip, event matching, evidence/question relevance, selection priority, length guard, HF metric preservation.
- `product-probe.mjs`: positional identity across personalized variants, incidental topic matching, topic-only recency ordering.
- `scale-probe.mjs`: replay of the local September 24 collection. It reads the historical snapshot from the backend checkout. The all-distinct event judge is a stated scenario, not a real model result. It writes its output to `/tmp/forwardpass-infra-probe-results.json`.

Run from `/Users/kalo/forwardpass` using the existing `tsx` dependency:

```bash
node --import tsx /Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/editorial-probe.mjs
node --import tsx /Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/product-probe.mjs
node --import tsx /Users/kalo/forwardpass-web/docs/research/forwardpass-infra-evidence/scale-probe.mjs
```

Saved results are in the corresponding `*-results.json` files. They establish current code behavior and bounded failure cases, not production prevalence. Timing for the scale probe is local CPU time, excluding network/model/storage operations.
