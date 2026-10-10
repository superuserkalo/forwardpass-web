import { cookies } from "next/headers";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { workosConfigured } from "./auth-config";
import { createPreferencesToken, preferencesCookieName, verifyPreferencesToken } from "./preferences-token";

export async function preferencesEmail(): Promise<string | null> {
  const jar = await cookies();
  if (workosConfigured() && jar.has(process.env.WORKOS_COOKIE_NAME || "wos-session")) {
    const { user } = await withAuth();
    return user?.emailVerified ? user.email.toLowerCase() : null;
  }
  const token = jar.get(preferencesCookieName)?.value;
  return token ? verifyPreferencesToken(token)?.email ?? null : null;
}

/** Server-to-Worker credential; never persisted as a WorkOS browser session. */
export async function preferencesBearer(): Promise<string | null> {
  const email = await preferencesEmail();
  return email ? createPreferencesToken(email, Date.now(), 60_000) : null;
}
