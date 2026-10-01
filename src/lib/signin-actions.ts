"use server";

import { after } from "next/server";
import { z } from "zod";
import { linkTarget, sendLinkEmail } from "./link-email";
import { requireHuman } from "./turnstile";

const emailSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
});

/**
 * Always answers `{ success: true }`, whether or not the address is known, so the
 * form cannot be used to discover who is subscribed. The email goes out after
 * the response so a known and an unknown address take the same time.
 */
export async function requestSignInLinkAction(email: string, turnstileToken: string): Promise<{ success: true }> {
  await requireHuman("signin", turnstileToken);
  const data = emailSchema.parse({ email });
  const target = await linkTarget(data.email);
  if (target) after(() => sendLinkEmail("signin", data.email, target));
  return { success: true };
}
