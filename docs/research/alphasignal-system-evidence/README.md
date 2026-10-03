# Evidence for the AlphaSignal system reconstruction

Collected on 26 September 2026 through public archive pages, shipped browser JavaScript, intended anonymous REST/MCP reads, and four public GitHub/Hugging Face metadata requests. Most structured queries ran around 11:49–11:57 UTC. Counts can change between requests.

These files contain derived measurements and public metadata. They exclude article prose, newsletter bodies, account data, and credentials. Original temporary captures remain under `/tmp/alphasignal-{backend,ranking,newsletter}-analysis/` for this research session; those paths are not a durable archive.

| File | Contents |
|---|---|
| `feed-observations.json` | Eight query requests, returned IDs, dates, counters, types and attribution. Trending has no pagination metadata. |
| `edition-observations.json` | Twelve archive URLs, measured text lengths, source destinations, slot positions and popularity labels/counts. Headlines omitted. |
| `source-metrics.json` | Four source counter comparisons. Source URLs identify the originating GitHub repositories/HF models. |
| `taxonomy.json` | Public topic taxonomy from MCP. |
| `window-experiments.json` | Two matched pairs of REST reads with the time-window widening flag absent/present. |
| `campaign-timestamps.json` | September archive IDs and timestamps; these are not verified delivery times. |
| `client-source-map.json` | Public bundle URLs, character offsets and download hashes for inspected behavior. Bundles may change on deployment. |
| `verify.py` | Offline recalculation of key ranking and newsletter composition findings. |

Run from the repository root:

```bash
python3 docs/research/alphasignal-system-evidence/verify.py
```

The live anonymous service is documented at [AlphaSignal's agent skill](https://alphasignal.ai/.well-known/agent-skills/alphasignal-news/SKILL.md) and [MCP server card](https://api.alphasignal.ai/mcp/server-card). `feed-observations.json` preserves the exact JSON-RPC read requests. Public REST feed reads use POST; no vote, click, signup, preference, or subscription mutations were performed.

Interpretation limits: published items are a selected corpus, not the full ingestion stream. The archive transforms stored HTML before display. Dataset fields are public response contracts, not direct database schemas. Similar output ordering does not expose private model weights, prompts, or the sender's recipient-specific message.
