import { RollingCount, ScanCounter } from "@/components/scan-counter";
import { currentSourceCount } from "@/lib/source-count";

// Publishers from the engine's source catalogue. OpenAI has no mark in the open icon set, so it is set as a name.
const PUBLISHERS: Array<{ name: string; logo?: string }> = [
  { name: "OpenAI" },
  { name: "Anthropic", logo: "anthropic" },
  { name: "Google DeepMind", logo: "google-deepmind" },
  { name: "Meta AI", logo: "meta" },
  { name: "NVIDIA", logo: "nvidia" },
  { name: "Hugging Face", logo: "hugging-face" },
  { name: "GitHub", logo: "github" },
  { name: "arXiv", logo: "arxiv" },
  { name: "Hacker News", logo: "hacker-news" },
  { name: "PyTorch", logo: "pytorch" },
  { name: "Vercel", logo: "vercel" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "LangChain", logo: "langchain" },
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={hidden || undefined}>
      {PUBLISHERS.map(({ name, logo }) => (
        <li key={name} className="flex items-center gap-2.5 whitespace-nowrap text-foreground/55">
          {logo ? (
            // Static brand marks, so a plain img avoids the image optimiser for tiny SVGs.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/logos/${logo}.svg`} alt="" width={20} height={20} className="size-5 opacity-60" />
          ) : null}
          <span className="text-base font-semibold tracking-tight">{name}</span>
        </li>
      ))}
    </ul>
  );
}

export async function TrustBand({ heading }: { heading?: string } = {}) {
  const sources = heading ? null : await currentSourceCount();
  return (
    <section aria-label="Where the issues come from" className="border-t border-border">
      <div className="page-shell pt-6 text-center">
        <p className="text-sm text-muted-foreground sm:text-base">
          {heading ?? <>We&apos;ve scanned <ScanCounter /> signals across <RollingCount value={sources ?? 0} /> sources so you don&apos;t have to.</>}
        </p>
      </div>
      <div className="marquee-mask overflow-hidden pt-5 pb-6">
        <div className="marquee-track flex w-max">
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
