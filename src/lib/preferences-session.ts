import { cookies } from "next/headers";
import { preferencesCookieName, verifyPreferencesToken } from "./preferences-token";

export async function preferencesEmail(): Promise<string | null> {
  const token = (await cookies()).get(preferencesCookieName)?.value;
  return token ? verifyPreferencesToken(token)?.email ?? null : null;
}
