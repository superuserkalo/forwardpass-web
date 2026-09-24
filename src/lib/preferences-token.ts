import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const COOKIE = "forwardpass-preferences";
const tokenSchema = z.object({ email: z.email(), expires: z.number().int() });

export function verifyPreferencesToken(token: string, now = Date.now()): { email: string; expires: number } | null {
  const secret = process.env.PREFERENCES_SIGNING_SECRET;
  if (!secret || secret.length < 32) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || payload.length > 2048) return null;
  const expected = createHmac("sha256", secret).update(`preferences:${payload}`).digest("base64url");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const value = tokenSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return value.expires > now ? value : null;
  } catch {
    return null;
  }
}

export const preferencesCookieName = COOKIE;
