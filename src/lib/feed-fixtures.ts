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
    title: "Shopify’s Self-Improving Pipeline Cuts Serving Costs From $27M to $1M",
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

type EditorialFixture = Omit<EditorialPiece, "id" | "publishedAt" | "href" | "image" | "viewerHasUpvoted"> & {
  daysAgo: number;
};

const EDITORIAL_FIXTURES: EditorialFixture[] = [
  {
    title: "How to Run Qwen 3.8 27B as a Local Coding Agent",
    dek: "Pick a file, an engine and a harness for your machine. Install steps live in an interactive page.",
    author: "ADHAM KHALED",
    kind: "tutorial",
    topics: ["LLMs", "Development", "Open source"],
    upvotes: 873,
    daysAgo: 1,
  },
  {
    title: "How to Review Your Vibe Coded App Before Deployment",
    dek: "An API key theft shows why you must check authentication, credential access and permissions before you ship.",
    author: "AKRUTI ACHARYA",
    kind: "deep-dive",
    topics: ["Security", "Vibe coding"],
    upvotes: 412,
    daysAgo: 2,
  },
  {
    title: "What DeepSeek V4.1 Flash Teaches Us About Efficient AI",
    dek: "Sparse attention, a smaller expert pool and aggressive distillation. The cost curve bends again.",
    author: "BEN DICKSON",
    kind: "deep-dive",
    topics: ["LLMs", "Training"],
    upvotes: 325,
    daysAgo: 3,
  },
  {
    title: "Understanding the Harness Tax Behind Coding Agents",
    dek: "Why the scaffolding around a model now decides more of the outcome than the model itself.",
    author: "BEN DICKSON",
    kind: "deep-dive",
    topics: ["Agents", "Development"],
    upvotes: 290,
    daysAgo: 4,
  },
  {
    title: "Self-Improving AI Skills Learn in the Notebook, Not the File",
    dek: "Keep the learning loop in a scratch notebook and promote only what survives three runs.",
    author: "ADHAM KHALED",
    kind: "tutorial",
    topics: ["Agents", "Post-training"],
    upvotes: 188,
    daysAgo: 5,
  },
  {
    title: "Claude Prompt Caching: 6 Tricks That Cut Your API Bill",
    dek: "Breakpoints, TTL math, batch stacking and a two-session split. Measured at $0.003 against $0.022 per turn.",
    author: "ADHAM KHALED",
    kind: "tutorial",
    topics: ["APIs", "LLMs"],
    upvotes: 540,
    daysAgo: 6,
  },
  {
    title: "When to Gate Recursive Terminal-Task Synthesis",
    dek: "Mark each agent job Promote, Hybrid or Reject. Reuse only when the job is hermetic and outcome-verifiable.",
    author: "ADHAM KHALED",
    kind: "deep-dive",
    topics: ["Agents", "Data"],
    upvotes: 97,
    daysAgo: 7,
  },
  {
    title: "Benchmarks Stopped Telling Us Which Model to Ship",
    dek: "Leaderboards compress too much. The teams shipping fastest now run their own twenty-task evals.",
    author: "KALOYAN",
    kind: "opinion",
    topics: ["Benchmarks", "LLMs"],
    upvotes: 610,
    daysAgo: 8,
  },
  {
    title: "Coding Agent Cost: Why Sessions Get Expensive",
    dek: "Keep the project on disk, treat context as a bill, and score finished tasks rather than tokens.",
    author: "ADHAM KHALED",
    kind: "deep-dive",
    topics: ["Agents", "Business"],
    upvotes: 144,
    daysAgo: 10,
  },
  {
    title: "Open Weights Are Winning the Boring Workloads",
    dek: "Classification, extraction and routing moved in-house this year. The frontier labs kept the hard parts.",
    author: "KALOYAN",
    kind: "opinion",
    topics: ["Open source", "Business"],
    upvotes: 233,
    daysAgo: 12,
  },
  {
    title: "Encrypted Reasoning Traces on Your Laptop: Resume or Strip",
    dek: "Public traces hid 315,320 encrypted blocks. Treat resume logs and publish logs as two separate paths.",
    author: "ADHAM KHALED",
    kind: "tutorial",
    topics: ["Security", "Reasoning"],
    upvotes: 58,
    daysAgo: 15,
  },
  {
    title: "Components of a Coding Agent",
    dek: "How coding agents use tools, memory and repo context to make models useful in practice.",
    author: "BEN DICKSON",
    kind: "deep-dive",
    topics: ["Agents", "Development"],
    upvotes: 873,
    daysAgo: 20,
  },
];

export function demoEditorial(): EditorialPiece[] {
  return EDITORIAL_FIXTURES.map((piece, index) => ({
    ...piece,
    id: `demo:editorial:${index}`,
    image: null,
    viewerHasUpvoted: false,
    publishedAt: new Date(Date.now() - piece.daysAgo * 86_400_000).toISOString(),
    href: `/archive/daily/${new Date(Date.now() - piece.daysAgo * 86_400_000).toISOString().slice(0, 10)}`,
  }));
}

export function demoWeeklyDates(): string[] {
  return Array.from({ length: 6 }, (_, week) =>
    new Date(Date.now() - (week * 7 + 1) * 86_400_000).toISOString().slice(0, 10),
  );
}

export function demoDailyDates(): string[] {
  return Array.from({ length: 14 }, (_, day) =>
    new Date(Date.now() - day * 86_400_000).toISOString().slice(0, 10),
  );
}

export function demoEdition(kind: "daily" | "weekly", date: string): string {
  const heading = kind === "weekly" ? "The week agents learned to watch production" : "Refusals get a price tag";
  return `# ${heading}

Anthropic starts billing for blocked requests, Cursor sends agents into production, and a Stanford lab turns agent decisions into vector search. Edition for ${date}.

- Refused requests are now billed at input-token rates.
- Cursor Rollouts watches deploys and files fixes on its own.
- Cached latent memory cuts agent decision latency by 9x.

## Anthropic now charges for blocked safety refusals

Refused requests are billed at input-token rates starting next month. The [platform docs](https://docs.anthropic.com) recommend routing risky prompts to a fallback model before the refusal lands.

**Why it matters:** teams with high refusal rates in moderation or security tooling will see the change on their invoice first.

## Cursor’s Rollouts sends agents to watch your code in production

The new [Rollouts](https://cursor.com) feature attaches an agent to each deploy. It reads error spikes, proposes a patch, and opens a pull request with the trace attached.

> The agent is scoped to one service and one deploy window. It cannot merge.

## Stanford’s CLM turns agent decisions into vector search

A cached latent-memory layer replaces repeated reasoning with retrieval. On long tool sessions the [paper](https://arxiv.org) reports 9x lower decision latency with no drop in task success.

\`\`\`python
memory = CLM(index="agent-decisions", k=8)
action = memory.recall(state) or policy(state)
\`\`\`

## Qwen 3.8 27B becomes the default local coding model

The mid-size release fits on a 32 GB laptop and matches last generation’s frontier APIs on tool calling. Weights are on [GitHub](https://github.com) under Apache 2.0.
`;
}
