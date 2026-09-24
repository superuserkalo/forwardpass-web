"use server";

import { z } from "zod";
import { submitRemoteVote } from "./feed";

const voteInputSchema = z.object({
  id: z.string().trim().min(1).max(160),
  voted: z.boolean(),
});

export type VoteOutcome =
  | { status: "remote"; upvotes: number; viewerHasUpvoted: boolean }
  | { status: "local"; viewerHasUpvoted: boolean }
  | { status: "unavailable" };

export async function castVote(input: { id: string; voted: boolean }): Promise<VoteOutcome> {
  const parsed = voteInputSchema.safeParse(input);
  if (!parsed.success) return { status: "unavailable" };
  const remote = await submitRemoteVote(parsed.data.id, parsed.data.voted);
  if (remote) {
    return { status: "remote", upvotes: remote.upvotes, viewerHasUpvoted: remote.viewerHasUpvoted };
  }
  return { status: "local", viewerHasUpvoted: parsed.data.voted };
}
