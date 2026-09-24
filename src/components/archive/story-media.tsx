import { StoryArt } from "@/components/story-art";
import { cn } from "@/lib/utils";

export function StoryThumb({
  seed,
  image,
  className,
}: {
  seed: string;
  image: string | null;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden border border-border bg-muted", className)}>
      {image ? (
        // Story images come from arbitrary publisher hosts, so next/image remotePatterns cannot cover them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <StoryArt seed={seed} className="absolute inset-0 size-full" />
      )}
    </div>
  );
}

export function SourceMark({ name }: { name: string }) {
  const letter = name.trim().charAt(0) || "F";
  return (
    <span
      aria-hidden="true"
      className="inline-grid size-5 shrink-0 place-content-center bg-foreground font-mono text-[11px] font-medium leading-none text-background"
    >
      {letter}
    </span>
  );
}
