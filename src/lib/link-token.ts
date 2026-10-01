import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type LinkPurpose = "verify" | "signin" | "unsubscribe";

const tokenSchema = z.object({ email: z.email(), expires: z.number().int() });

function secret(): string | null {
  const value = process.env.PREFERENCES_SIGNING_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(purpose: LinkPurpose, payload: string, key: string): string {
  return createHmac("sha256", key).update(`link:${purpose}:${payload}`).digest("base64url");
}

/** Emailed, single-purpose token. Each purpose signs under its own prefix, so a link for one action never works for another. */
export function createLinkToken(purpose: LinkPurpose, email: string, now: number, ttlMs: number): string {
  const key = secret();
  if (!key) throw new Error("PREFERENCES_SIGNING_SECRET is not configured.");
  const payload = Buffer.from(
    JSON.stringify({ email: z.email().parse(email).toLowerCase(), expires: now + ttlMs }),
  ).toString("base64url");
  return `${payload}.${sign(purpose, payload, key)}`;
}

export function verifyLinkToken(
  purpose: LinkPurpose,
  token: string,
  now = Date.now(),
): { email: string; expires: number } | null {
  const key = secret();
  if (!key) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || payload.length > 2048) return null;
  const expected = Buffer.from(sign(purpose, payload, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const value = tokenSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return value.expires > now ? value : null;
  } catch {
    return null;
  }
}
