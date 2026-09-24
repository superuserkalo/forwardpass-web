import Link from "next/link";
import type { EditorialPiece } from "@/lib/feed";
import { cn } from "@/lib/utils";
import { UpvoteButton } from "./story-actions";
import { StoryThumb } from "./story-media";

export const EDITORIAL_KINDS = [
  { value: "all", label: "All" },
  { value: "deep-dive", label: "Deep dive" },
  { value: "tutorial", label: "Tutorial" },
  { value: "opinion", label: "Opinion" },
] as const;

export type EditorialFilter = (typeof EDITORIAL_KINDS)[number]["value"];

const KIND_LABELS: Record<EditorialPiece["kind"], string> = {
  "deep-dive": "Deep dive",
  tutorial: "Tutorial",
  opinion: "Opinion",
};

const labelClass = "font-mono text-[11px] uppercase tracking-[.2em]";
const shortDate = new Intl.DateTimeFormat("en", { timeZone: "UTC", month: "short", day: "2-digit" });

export function EditorialKindNav({ active }: { active: EditorialFilter }) {
  return (
    <nav aria-label="Editorial kind" className="flex gap-8 overflow-x-auto border-b border-border">
      {EDITORIAL_KINDS.map((kind) => (
        <Link
          key={kind.value}
          href={kind.value === "all" ? "/archive?section=editorial" : `/archive?section=editorial&kind=${kind.value}`}
          scroll={false}
          aria-current={active === kind.value ? "page" : undefined}
          className={cn(
            labelClass,
            "relative shrink-0 pt-1 pb-4 text-xs transition-colors",
            active === kind.value
              ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {kind.label}
        </Link>
      ))}
    </nav>
  );
}

function Byline({ piece, className }: { piece: EditorialPiece; className?: string }) {
  return (
    <p className={cn(labelClass, "text-[10px] text-muted-foreground", className)}>
      {piece.author} <span aria-hidden="true">·</span> {KIND_LABELS[piece.kind]}
    </p>
  );
}

function PieceTitle({ piece, className }: { piece: EditorialPiece; className?: string }) {
  return (
    <h3 className={cn("font-medium text-balance", className)}>
      <Link
        href={piece.href}
        className="decoration-1 underline-offset-[6px] after:absolute after:inset-0 group-hover/piece:underline"
      >
        {piece.title}
      </Link>
    </h3>
  );
}

function SidePiece({ piece }: { piece: EditorialPiece }) {
  return (
    <article className="group/piece relative flex flex-col gap-5 py-8 first:pt-0 last:pb-0">
      <StoryThumb seed={piece.id} image={piece.image} className="aspect-[16/10]" />
      <PieceTitle piece={piece} className="text-xl leading-snug" />
      <Byline piece={piece} />
    </article>
  );
}

export function EditorialBoard({ pieces }: { pieces: EditorialPiece[] }) {
  if (pieces.length === 0) {
    return (
      <div className="border-b border-border py-24 text-center">
        <p className="font-display text-3xl">Nothing here yet.</p>
        <p className="mt-3 text-sm text-muted-foreground">New deep dives, tutorials and opinion pieces land here first.</p>
      </div>
    );
  }
  const [hero, ...rest] = pieces;
  const left = rest.slice(0, 2);
  const right = rest.slice(2, 4);
  const row = rest.slice(4, 8);
  const list = rest.slice(8);

  return (
    <div className="onboarding-enter">
      {hero && (
        <section className="grid gap-10 py-12 lg:grid-cols-[1fr_2fr_1fr] lg:gap-0">
          <div className="order-2 divide-y divide-border lg:order-1 lg:border-r lg:border-border lg:pr-8">
            {left.map((piece) => (
              <SidePiece key={piece.id} piece={piece} />
            ))}
          </div>
          <article className="group/piece relative order-1 flex flex-col items-center text-center lg:order-2 lg:px-8">
            <StoryThumb seed={hero.id} image={hero.image} className="aspect-[3/2] w-full" />
            <PieceTitle piece={hero} className="mt-10 text-3xl leading-tight md:text-4xl" />
            {hero.dek && <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{hero.dek}</p>}
            <Byline piece={hero} className="mt-7" />
          </article>
          <div className="order-3 divide-y divide-border lg:border-l lg:border-border lg:pl-8">
            {right.map((piece) => (
              <SidePiece key={piece.id} piece={piece} />
            ))}
          </div>
        </section>
      )}

      {row.length > 0 && (
        <section className="overflow-hidden border-t border-border py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:-mx-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border">
            {row.map((piece) => (
              <article key={piece.id} className="group/piece relative flex flex-col gap-4 lg:px-8">
                <StoryThumb seed={piece.id} image={piece.image} className="aspect-[3/2]" />
                <PieceTitle piece={piece} className="mt-2 text-lg leading-snug" />
                {piece.dek && <p className="text-sm leading-6 text-muted-foreground">{piece.dek}</p>}
                <Byline piece={piece} className="mt-auto pt-2" />
              </article>
            ))}
          </div>
        </section>
      )}

      {list.length > 0 && (
        <section className="mx-auto max-w-4xl border-t border-border">
          <ul>
            {list.map((piece) => (
              <li
                key={piece.id}
                className="group/piece relative grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-5 border-b border-border py-7 transition-colors hover:bg-muted/30 sm:grid-cols-[3.5rem_minmax(0,1fr)_10rem]"
              >
                <div className="relative z-10 flex justify-center">
                  <UpvoteButton id={piece.id} upvotes={piece.upvotes} viewerHasUpvoted={piece.viewerHasUpvoted} className="text-xs" />
                </div>
                <div className="min-w-0">
                  <p className={cn(labelClass, "text-[10px] text-muted-foreground")}>{piece.topics[0] ?? KIND_LABELS[piece.kind]}</p>
                  <PieceTitle piece={piece} className="mt-2 text-base leading-snug" />
                  {piece.dek && <p className="mt-2 text-sm leading-6 text-muted-foreground">{piece.dek}</p>}
                  <p className={cn(labelClass, "mt-3 text-[10px] text-muted-foreground")}>
                    {piece.author} <span aria-hidden="true">·</span>{" "}
                    <time dateTime={piece.publishedAt}>{shortDate.format(new Date(piece.publishedAt))}</time>
                  </p>
                </div>
                <StoryThumb seed={piece.id} image={piece.image} className="hidden aspect-[16/10] sm:block" />
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className={cn(labelClass, "pt-12 text-center text-[10px] text-muted-foreground")}>You’re all caught up</p>
    </div>
  );
}
