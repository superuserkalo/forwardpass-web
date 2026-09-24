export type StoryType = "news" | "papers" | "models" | "repos" | "editorial";

export type ParsedBlock = {
  heading: string;
  body: string;
  /** Anchor id. Numbered stories use `story-<n>`, labelled sections (quick signals) a slug. */
  id?: string;
  /** True for labelled sections such as Quick signals, which are not stories. */
  label?: boolean;
};

export type ParsedEdition = {
  title: string | null;
  lead: string | null;
  preamble: string;
  blocks: ParsedBlock[];
  firstImage: string | null;
  wordCount: number;
};

export const FEED_TOPICS = [
  "Agents",
  "APIs",
  "Audio",
  "Benchmarks",
  "Business",
  "Data",
  "Development",
  "GPUs",
  "Image",
  "Infrastructure",
  "LLMs",
  "Open source",
  "Post-training",
  "Reasoning",
  "Retrieval",
  "Robotics",
  "Security",
  "Training",
  "Video",
  "Vibe coding",
] as const;

export type FeedTopic = (typeof FEED_TOPICS)[number];

const TOPIC_KEYWORDS: Record<FeedTopic, string[]> = {
  Agents: ["agent", "agentic", "harness", "tool use", "tool-use", "mcp", "autonomy", "copilot"],
  APIs: ["api", "sdk", "endpoint", "integration", "webhook"],
  Audio: ["audio", "speech", "voice", "tts", "asr", "transcription"],
  Benchmarks: ["benchmark", "eval", "evaluation", "leaderboard", "state of the art", "sota"],
  Business: ["funding", "acquisition", "revenue", "pricing", "partnership", "enterprise", "valuation", "raises", "billion", "million"],
  Data: ["dataset", "data", "annotation", "corpus", "synthetic data"],
  Development: ["developer", "dev tool", "coding", "code assistant", "cli", "typescript", "python", "rust", "ide", "pull request"],
  GPUs: ["gpu", "cuda", "nvidia", "amd", "chip", "h100", "tpu", "accelerator", "silicon"],
  Image: ["image", "vision", "diffusion", "multimodal", "visual", "text-to-image"],
  Infrastructure: ["inference", "serving", "infra", "kubernetes", "scaling", "latency", "throughput", "deployment", "cluster"],
  LLMs: ["llm", "language model", "frontier", "gpt", "claude", "gemini", "llama", "qwen", "mistral", "deepseek", "model release"],
  "Open source": ["open source", "open-source", "weights", "licence", "license", "apache", "mit", "github", "repository"],
  "Post-training": ["fine-tun", "finetun", "rlhf", "post-training", "distill", "alignment", "lora", "grpo"],
  Reasoning: ["reasoning", "chain-of-thought", "chain of thought", "planning", "test-time compute"],
  Retrieval: ["retrieval", "rag", "search", "embedding", "vector", "index", "rerank"],
  Robotics: ["robot", "robotics", "embodied", "manipulation", "humanoid"],
  Security: ["security", "vulnerability", "jailbreak", "prompt injection", "attack", "red team", "safety", "exploit"],
  Training: ["training", "pretraining", "optimizer", "scaling law", "compute", "checkpoint"],
  Video: ["video", "world model", "motion", "text-to-video"],
  "Vibe coding": ["vibe coding", "vibe-coding", "cursor", "windsurf", "bolt", "lovable", "replit"],
};

const IMAGE_PATTERN = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g;
const LINK_PATTERN = /(?<!!)\[[^\]]*]\((https?:\/\/[^)\s]+)[^)]*\)/g;

export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findUrls(text: string, pattern: RegExp): string[] {
  const urls: string[] = [];
  for (const match of text.matchAll(pattern)) {
    if (match[1]) urls.push(match[1]);
  }
  return urls;
}

export function findImages(markdown: string): string[] {
  return findUrls(markdown, IMAGE_PATTERN);
}

export function findLinks(markdown: string): string[] {
  return findUrls(markdown, LINK_PATTERN);
}

export function sourceNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const label = host.split(".")[0] ?? host;
    return label.replace(/[-_]/g, " ").toUpperCase();
  } catch {
    return "SOURCE";
  }
}

export function matchTopics(text: string): FeedTopic[] {
  const haystack = text.toLowerCase();
  return FEED_TOPICS.filter((topic) =>
    TOPIC_KEYWORDS[topic].some((keyword) => haystack.includes(keyword)),
  );
}

export function inferStoryType(text: string, sourceUrl: string | null): StoryType {
  const haystack = text.toLowerCase();
  const host = sourceUrl ? sourceUrl.toLowerCase() : "";
  if (/\b(deep dive|tutorial|opinion|editorial|analysis|how to|guide)\b/.test(haystack)) return "editorial";
  if (host.includes("arxiv") || /\b(paper|preprint|study|researchers)\b/.test(haystack)) return "papers";
  if (host.includes("github") || /\b(open[- ]source|repository|repo|weights)\b/.test(haystack)) return "repos";
  if (/\b(model|weights|checkpoint|launches|releases|billion[- ]parameter|\d+b\b)\b/.test(haystack)) return "models";
  return "news";
}

const SENTENCE_PATTERN = /^(.{20,180}?[.!?])(\s|$)/;

function firstSentence(text: string): string {
  const match = SENTENCE_PATTERN.exec(text);
  return match?.[1] ?? text;
}

function summarize(block: string, limit = 220): string {
  const paragraph = block
    .split(/\n\s*\n/)
    .map((part) => stripInlineMarkdown(part))
    .find((part) => part.length > 0) ?? "";
  const summary = firstSentence(paragraph);
  return summary.length > limit ? `${summary.slice(0, limit - 1).trimEnd()}…` : summary;
}

function splitAtHeading(text: string, marker: RegExp): ParsedBlock[] | null {
  const lines = text.split("\n");
  const sections: ParsedBlock[] = [];
  let current: { heading: string | null; lines: string[] } | null = null;
  for (const line of lines) {
    const match = marker.exec(line);
    if (match?.[1]) {
      if (current) sections.push({ heading: current.heading ?? "", body: current.lines.join("\n").trim() });
      current = { heading: stripInlineMarkdown(match[1]), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ heading: current.heading ?? "", body: current.lines.join("\n").trim() });
  const kept = sections.filter((section) => section.heading || section.body);
  return kept.length >= 2 ? kept : null;
}

function splitAtRules(text: string): ParsedBlock[] | null {
  const parts = text
    .split(/^\s*(?:---+|\*\*\*+)\s*$/m)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  return parts.map((part) => ({ heading: "", body: part }));
}

function splitAtBoldLeads(text: string): ParsedBlock[] | null {
  const lines = text.split("\n");
  const sections: ParsedBlock[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (const line of lines) {
    const match = /^\*\*([^*\n]{4,140})\*\*\s*$/.exec(line.trim());
    if (match?.[1]) {
      if (current) sections.push({ heading: current.heading, body: current.lines.join("\n").trim() });
      current = { heading: stripInlineMarkdown(match[1]), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ heading: current.heading, body: current.lines.join("\n").trim() });
  const kept = sections.filter((section) => section.body);
  return kept.length >= 2 ? kept : null;
}

const NUMBERED_STORY = /^(\d{1,2})\s+[—–-]\s+(.+)$/;
const SECTION_LABEL = /^[A-Z][A-Z ]{3,}$/;
const MASTHEAD = new Set(["THE FORWARD PASS"]);
const FIELD_LABELS = new Set(["What happened", "Why it matters"]);

function isNumberedHeading(line: string): boolean {
  const match = NUMBERED_STORY.exec(line.trim());
  return Boolean(match?.[2] && !/https?:\/\//.test(match[2]));
}

function sentenceCase(label: string): string {
  const lower = label.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function plainBody(lines: string[]): string {
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (FIELD_LABELS.has(trimmed)) return `#### ${trimmed}`;
      const signal = /^•\s+(.+?)\s+[—–-]\s+(https?:\/\/\S+)$/.exec(trimmed);
      if (signal) return `- [${signal[1]}](${signal[2]})`;
      if (trimmed.startsWith("• ")) return `- ${trimmed.slice(2)}`;
      return line;
    })
    .join("\n")
    .trim();
}

/** The delivered newsletter format: `01 — Headline` stories and uppercase section labels, no markdown headings. */
function parseNumberedEdition(text: string): ParsedBlock[] | null {
  if (!text.split("\n").some(isNumberedHeading)) return null;
  const blocks: ParsedBlock[] = [];
  let current: { block: ParsedBlock; lines: string[] } | null = null;
  let stories = 0;
  const flush = () => {
    if (current) blocks.push({ ...current.block, body: plainBody(current.lines) });
    current = null;
  };
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const numbered = isNumberedHeading(trimmed) ? NUMBERED_STORY.exec(trimmed) : null;
    if (numbered?.[2]) {
      flush();
      current = { block: { heading: stripInlineMarkdown(numbered[2]), body: "", id: `story-${stories}` }, lines: [] };
      stories += 1;
    } else if (SECTION_LABEL.test(trimmed) && !MASTHEAD.has(trimmed)) {
      flush();
      const heading = sentenceCase(trimmed);
      current = { block: { heading, body: "", id: heading.toLowerCase().replace(/\s+/g, "-"), label: true }, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return blocks.filter((block) => block.body || !block.label);
}

export function parseEdition(markdown: string): ParsedEdition {
  const plain = markdown.replace(/\r\n/g, "\n").trim();
  const numbered = parseNumberedEdition(plain);
  if (numbered) {
    const leadBlock = numbered.find((block) => !block.label);
    const leadSource = (leadBlock?.body ?? "")
      .split("\n")
      .filter((line) => !line.startsWith("#"))
      .join("\n");
    return {
      title: leadBlock?.heading ?? null,
      lead: summarize(leadSource) || null,
      preamble: "",
      blocks: numbered,
      firstImage: findImages(plain)[0] ?? null,
      wordCount: plain.split(/\s+/).filter(Boolean).length,
    };
  }
  return parseMarkdownEdition(plain);
}

function parseMarkdownEdition(markdown: string): ParsedEdition {
  const text = markdown.replace(/\r\n/g, "\n").trim();
  const titleMatch = /^#\s+(.+)$/m.exec(text);
  const title = titleMatch?.[1] ? stripInlineMarkdown(titleMatch[1]) : null;
  const body = titleMatch ? text.replace(titleMatch[0], "").trim() : text;
  const headingBlocks = splitAtHeading(body, /^##\s+(.+)$/) ?? splitAtHeading(body, /^###\s+(.+)$/);
  const blocks = headingBlocks ?? splitAtRules(body) ?? splitAtBoldLeads(body) ?? [{ heading: title ?? "", body }];
  const firstHeading = headingBlocks ? /^#{2,3}\s+.+$/m.exec(body) : null;
  const preamble = firstHeading ? body.slice(0, firstHeading.index).trim() : "";
  const firstImage = findImages(text)[0] ?? null;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const leadSource = preamble || (blocks[0] ? blocks[0].body : body);
  return {
    title,
    lead: summarize(leadSource) || null,
    preamble,
    blocks,
    firstImage,
    wordCount,
  };
}

export function editionReadMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 220));
}

export function formatTimeAgo(input: string, now: number = Date.now()): string {
  const date = new Date(input.includes("T") ? input : `${input}T00:00:00Z`);
  const elapsed = Math.max(0, now - date.getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function prettyDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function sentenceTitle(text: string, fallback: string): string {
  const candidate = stripInlineMarkdown(text).split(/(?<=[.!?])\s/)[0] ?? "";
  const trimmed = candidate.trim();
  return trimmed.length >= 12 ? trimmed.replace(/\.$/, "") : fallback;
}
