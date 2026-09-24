import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

const COOKIE = "forwardpass-onboarding";
const sessionSchema = z.object({
  email: z.string().email(),
  expires: z.number(),
});
function sign(payload: string) {
  const secret = process.env.RESEND_API_KEY;
  if (!secret) throw new Error("Email service is not configured");
  return createHmac("sha256", secret)
    .update(`onboarding:${payload}`)
    .digest("base64url");
}
// Issued only when this browser creates a NEW contact. An email address alone
// must never grant permission to modify an existing subscriber's profile.
export async function createOnboardingSession(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, expires: Date.now() + 86_400_000 }),
  ).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
}
export async function onboardingEmail(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      return null;
    const data = sessionSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString()),
    );
    return data.expires > Date.now() ? data.email : null;
  } catch {
    return null;
  }
}
