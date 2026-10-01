import { headers } from "next/headers";
import { z } from "zod";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const FAILED = "Verification failed. Please try again.";

export type TurnstileAction = "signup" | "signin" | "unsubscribe";

const resultSchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  hostname: z.string().optional(),
});

const CANONICAL_HOST = "theforwardpass.net";

/** Our own hostnames: the canonical site, plus whatever NEXT_PUBLIC_SITE_URL names when it parses. */
function allowedHostnames(): Set<string> {
  const hosts = [CANONICAL_HOST];
  try {
    hosts.push(new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname);
  } catch {
    // An unset or malformed site URL leaves just the canonical host.
  }
  return new Set(hosts.flatMap((host) => [host.replace(/^www\./, ""), `www.${host.replace(/^www\./, "")}`]));
}

async function visitorIp(): Promise<string | undefined> {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined;
}

/**
 * Proves a human or a real browser submitted the form, using the single-use
 * token from the Turnstile widget. Fails closed: a missing secret, an outage or
 * any mismatch rejects the request. Call it before touching any subscriber data.
 *
 * Production also pins the token to this form's action and to our own hostnames,
 * so a token minted elsewhere cannot be replayed here. Cloudflare's published test
 * keys report a placeholder host, so those checks apply in production only.
 */
export async function requireHuman(action: TurnstileAction, token: string | null | undefined): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) console.error("TURNSTILE_SECRET_KEY is not configured.");
  if (!secret || typeof token !== "string" || token.length === 0 || token.length > 2048) throw new Error(FAILED);
  try {
    const body = new URLSearchParams({ secret, response: token });
    const remoteIp = await visitorIp();
    if (remoteIp) body.set("remoteip", remoteIp);
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    const result = resultSchema.parse(await response.json());
    if (!result.success) throw new Error("challenge failed");
    if (process.env.NODE_ENV === "production") {
      if (result.action !== action) throw new Error(`unexpected action ${result.action}`);
      if (!result.hostname || !allowedHostnames().has(result.hostname)) throw new Error(`unexpected hostname ${result.hostname}`);
    }
  } catch (error) {
    console.error("Turnstile check failed", error);
    throw new Error(FAILED);
  }
}
