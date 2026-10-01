// EU AI Act Article 50(4) and (5): issues are AI-generated text published to inform the public,
// so readers are told at first exposure. Keep in sync with the agent's email (src/delivery/email.ts).
export const AI_LABEL = "Daily AI-generated issue";
export const AI_DISCLOSURE =
  "This issue is researched and written by AI models, and every fact is checked against its cited source. No human edits it before it is sent.";
// Machine-readable marking, Article 50(2).
export const AI_META = { "ai-generated": "true" } as const;
