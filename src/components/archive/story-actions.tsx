"use client";

import { Bookmark, Check, Link2, Triangle } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useLocalFlags } from "@/lib/use-local-flags";
import { castVote } from "@/lib/votes";

const numberFormat = new Intl.NumberFormat("en");

export function UpvoteButton({
  id,
  upvotes,
  viewerHasUpvoted,
  layout = "stack",
  className,
}: {
  id: string;
  upvotes: number;
  viewerHasUpvoted: boolean;
  layout?: "stack" | "inline";
  className?: string;
}) {
  const [localVotes, setLocalVote] = useLocalFlags("fp:votes");
  const [remote, setRemote] = useState<{ upvotes: number; voted: boolean } | null>(null);
  const [, startTransition] = useTransition();

  const localVoted = localVotes[id];
  const voted = remote?.voted ?? localVoted ?? viewerHasUpvoted;
  const drift = localVoted === undefined || localVoted === viewerHasUpvoted ? 0 : localVoted ? 1 : -1;
  const count = remote?.upvotes ?? Math.max(0, upvotes + drift);

  function toggle() {
    const next = !voted;
    setLocalVote(id, next);
    setRemote((current) => (current ? { upvotes: Math.max(0, current.upvotes + (next ? 1 : -1)), voted: next } : null));
    startTransition(async () => {
      const outcome = await castVote({ id, voted: next });
      if (outcome.status === "remote") setRemote({ upvotes: outcome.upvotes, voted: outcome.viewerHasUpvoted });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={voted}
      aria-label={voted ? `Remove upvote, ${count} upvotes` : `Upvote, ${count} upvotes`}
      className={cn(
        "group/vote inline-flex items-center font-mono text-sm tabular-nums text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
        layout === "stack" ? "flex-col gap-1.5 px-2 py-1" : "gap-2.5",
        voted && "text-foreground",
        className,
      )}
    >
      <Triangle
        className={cn(
          "size-3.5 transition-transform duration-200 group-active/vote:-translate-y-0.5",
          voted && "fill-current",
        )}
        strokeWidth={1.5}
      />
      <span>{numberFormat.format(count)}</span>
    </button>
  );
}

export function BookmarkButton({ id, title, className }: { id: string; title: string; className?: string }) {
  const [bookmarks, setBookmark] = useLocalFlags("fp:bookmarks");
  const saved = bookmarks[id] ?? false;
  return (
    <button
      type="button"
      onClick={() => setBookmark(id, !saved)}
      aria-pressed={saved}
      aria-label={saved ? `Remove bookmark: ${title}` : `Bookmark: ${title}`}
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
        saved && "text-foreground",
        className,
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} strokeWidth={1.5} />
    </button>
  );
}

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0] ?? window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Link copied" : "Copy link"}
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.2em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
        className,
      )}
    >
      {copied ? <Check className="size-4" strokeWidth={1.5} /> : <Link2 className="size-4" strokeWidth={1.5} />}
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}
