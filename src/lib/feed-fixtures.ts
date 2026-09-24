import type { EditorialPiece, Story } from "./feed";
import type { FeedTopic, StoryType } from "./story-parse";

export function demoFixturesEnabled(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.FORWARDPASS_AGENT_URL;
}

type Fixture = {
  type: StoryType;
  title: string;
  dek: string;
  sourceName: string;
  sourceUrl: string;
  topics: FeedTopic[];
  hoursAgo: number;
  upvotes: number;
};

const STORY_FIXTURES: Fixture[] = [
  {
    type: "papers",
    title: "Stanford’s CLM Turns Agent Decisions Into Vector Search 9x Faster",
    dek: "A cached latent-memory layer replaces repeated reasoning traces with retrieval, cutting agent decision latency across long tool sessions.",
    sourceName: "ALPHASIGNAL",
    sourceUrl: "https://alphasignal.ai",
    topics: ["Agents", "Retrieval", "Reasoning"],
    hoursAgo: 1,
    upvotes: 4124,
  },
  {
    type: "news",
    title: "Anthropic Now Charges Developers for Claude’s Blocked Safety Refusals",
    dek: "Refused requests are billed at input-token rates. The docs recommend fallback routing before the refusal lands.",
    sourceName: "CLAUDEDEVS",
    sourceUrl: "https://docs.anthropic.com",
    topics: ["LLMs", "Security", "APIs"],
    hoursAgo: 2,
    upvotes: 1325,
  },
  {
    type: "news",
    title: "Perplexity Brings Portable Computer to AMD Ryzen AI Max PCs",
    dek: "The local-first assistant ships a native build for Strix Halo laptops, keeping sessions on device by default.",
    sourceName: "PERPLEXITY",
    sourceUrl: "https://perplexity.ai",
    topics: ["Agents", "Infrastructure"],
    hoursAgo: 2,
    upvotes: 184,
  },
  {
    type: "models",
    title: "Qwen 3.8 27B Quietly Becomes the Default Local Coding Model",
    dek: "A mid-size release lands on consumer hardware with tool-calling parity against last generation’s frontier APIs.",
    sourceName: "GITHUB",
    sourceUrl: "https://github.com",
    topics: ["LLMs", "Open source", "Development"],
    hoursAgo: 5,
    upvotes: 2891,
  },
  {
    type: "news",
    title: "Cursor’s Rollouts Sends Agents to Watch Your Code in Production",
    dek: "Agents observe live rollouts and file findings back into the review thread, closing the loop between deploy and edit.",
    sourceName: "CURSOR",
    sourceUrl: "https://cursor.com",
    topics: ["Agents", "Development", "Vibe coding"],
    hoursAgo: 22,
    upvotes: 2884,
  },
  {
    type: "news",
    title: "OpenAI’s MentalHealthBench Tests AI on Everyday Stress Beyond Crisis Responses",
    dek: "The eval moves past crisis scenarios into daily stress support, with graded rubrics from clinicians.",
    sourceName: "OPENAI",
    sourceUrl: "https://openai.com",
    topics: ["Benchmarks", "Security"],
    hoursAgo: 26,
    upvotes: 4719,
  },
  {
    type: "news",
    title: "Anthropic and Accenture Bet $2B on Embedded AI Safety Audits",
    dek: "A joint practice will embed auditors inside enterprise deployments before models reach production traffic.",
    sourceName: "ANTHROPIC",
    sourceUrl: "https://anthropic.com",
    topics: ["Business", "Security"],
    hoursAgo: 120,
    upvotes: 3682,
  },
  {
    type: "repos",
    title: "vLLM 0.9 Ships Speculative Decoding For Every Open Weights Model",
    dek: "Draft-model speculation becomes a config flag, with measured 1.8x throughput on 70B class checkpoints.",
    sourceName: "GITHUB",
    sourceUrl: "https://github.com",
    topics: ["Infrastructure", "Open source", "LLMs"],
    hoursAgo: 30,
    upvotes: 1502,
  },
  {
    type: "papers",
    title: "Test-Time Compute Gains Hold Up Past 8K Tokens, Study Finds",
    dek: "Long-horizon reasoning traces keep paying off where earlier work reported saturation, on 12 new task suites.",
    sourceName: "ARXIV",
    sourceUrl: "https://arxiv.org",
    topics: ["Reasoning", "Training", "Benchmarks"],
    hoursAgo: 40,
    upvotes: 975,
  },
  {
    type: "news",
    title: "NVIDIA’s Vera Rubin Cluster Enters Early Access for Cloud Providers",
    dek: "The rack-scale system opens to three providers first, with per-token pricing landing next quarter.",
    sourceName: "NVIDIA",
    sourceUrl: "https://nvidia.com",
    topics: ["GPUs", "Infrastructure", "Training"],
    hoursAgo: 46,
    upvotes: 2210,
  },
  {
    type: "models",
    title: "Mistral Releases a 24B Reasoning Model Under Apache 2.0",
    dek: "Weights, cookbooks and eval harness ship together — the permissive licence covers commercial serving.",
    sourceName: "MISTRAL",
    sourceUrl: "https://mistral.ai",
    topics: ["LLMs", "Open source", "Reasoning"],
    hoursAgo: 52,
    upvotes: 1863,
  },
  {
    type: "news",
    title: "Shopify’s Self-Improving Pipeline Cuts Groqinfra Costs From $27M to $1M",
    dek: "A closed-loop serving policy renegotiated cache and routing decisions hourly during the GPT-5.6 surge.",
    sourceName: "SHOPIFY",
    sourceUrl: "https://shopify.com",
    topics: ["Infrastructure", "Business"],
    hoursAgo: 70,
    upvotes: 446,
  },
];

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function demoFeed(): Story[] {
  return STORY_FIXTURES.map((fixture, index) => ({
    id: `demo:${index}`,
    type: fixture.type,
    title: fixture.title,
    dek: fixture.dek,
    sourceName: fixture.sourceName,
    sourceUrl: fixture.sourceUrl,
    topics: fixture.topics,
    image: null,
    publishedAt: isoHoursAgo(fixture.hoursAgo),
    upvotes: fixture.upvotes,
    viewerHasUpvoted: false,
    href: `/archive/daily/${new Date(isoHoursAgo(fixture.hoursAgo)).toISOString().slice(0, 10)}#story-${index % 3}`,
    author: null,
    section: "daily",
  }));
}

const EDITORIAL_FIXTURES: Array<Omit<EditorialPiece, "publishedAt" | "href"> & { daysAgo: number }> = [
  {
    id: "demo:editorial:0",
    title: "How to Review Your Vibe Coded App Before Deployment",
    dek: "An API key theft shows why you must check authentication, credential access and permissions before deployment.",
    author: "AKRUTI ACHARYA",
    kind: "deep-dive",
    image: null,
    topics: ["Security", "Vibe coding"],
    daysAgo: 2,
  },
  {
    id: "demo:editorial:1",
    title: "How to Run Qwen 3.8 27B as a Local Coding Agent",
    dek: "Pick a file, an engine and a harness for your machine. Install steps live in an interactive page.",
    author: "ADHAM KHALED",
    kind: "tutorial",
    image: null,
    topics: ["LLMs", "Development", "Open source"],
    daysAgo: 3,
  },
  {
    id: "demo:editorial:2",
    title: "Understanding the “Harness Tax” Behind Coding Agents",
    dek: "Keep the project on disk, treat lunch as a build trigger, and price sessions instead of tokens.",
    author: "BEN DICKSON",
    kind: "deep-dive",
    image: null,
    topics: ["Agents", "Development", "Business"],
    daysAgo: 5,
  },
];

export function demoEditorial(): EditorialPiece[] {
  return EDITORIAL_FIXTURES.map((piece) => ({
    ...piece,
    publishedAt: new Date(Date.now() - piece.daysAgo * 86_400_000).toISOString(),
    href: "/archive",
  }));
}
