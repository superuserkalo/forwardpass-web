// EU AI Act Article 50(4) and (5): issues are AI-generated text published to inform the public,
// so readers are told at first exposure. Keep in sync with the agent's email (src/delivery/email.ts).
export const AI_LABEL = "Daily AI-generated issue";
export const AI_DISCLOSURE =
  "This issue is researched and written by AI models, and every fact is checked against its cited source. No human edits it before it is sent.";
// Machine-readable marking, Article 50(2).
export const AI_META = { "ai-generated": "true" } as const;
// Engine-written editorial (Sunday deep dives, monthly data reports) is disclosed the same way.
export const AI_ARTICLE_LABEL = "AI-generated article";
export const AI_ARTICLE_DISCLOSURE =
  "This article is researched and written by AI models from the sources it cites, and every claim is checked against them. No human edits it before it is published.";
// Live signals are written by the engine as well: a headline and a short summary, each fact checked against a line quoted from its source.
export const AI_SIGNAL_LABEL = "AI-generated signal";
export const AI_SIGNAL_DISCLOSURE =
  "This signal is written by AI models from the source it cites, and every fact is checked against a line quoted from that source. No human edits it before it is published.";
