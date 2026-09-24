import { cookies } from "next/headers";
import { z } from "zod";
import { onboardingEmail } from "./onboarding-session";
import { createPreferencesToken, preferencesCookieName, verifyPreferencesToken } from "./preferences-token";

const archiveIndexSchema = z.object({
  tier: z.enum(["free", "personal", "professional"]),
  daily: z.array(z.iso.date()),
  weekly: z.array(z.iso.date()),
});

export type ArchiveIndex = z.infer<typeof archiveIndexSchema>;
export type ArchiveKind = "daily" | "weekly";

export async function archiveRequest(path: string): Promise<Response | null> {
  const configured = process.env.FORWARDPASS_AGENT_URL;
  if (!configured) return null;
  const base = new URL(configured);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
    throw new Error("FORWARDPASS_AGENT_URL must use HTTPS outside local development.");
  }
  const token = (await cookies()).get(preferencesCookieName)?.value;
  const headers = new Headers();
  if (token && verifyPreferencesToken(token)) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    const email = await onboardingEmail();
    if (email) headers.set("Authorization", `Bearer ${createPreferencesToken(email)}`);
  }
  try {
    return await fetch(new URL(path, base), { headers, cache: "no-store" });
  } catch {
    return null;
  }
}

export async function archiveIndex(): Promise<ArchiveIndex | null> {
  const response = await archiveRequest("/archive");
  if (!response?.ok) return null;
  return archiveIndexSchema.parse(await response.json());
}

export async function archiveEntry(kind: ArchiveKind, date: string): Promise<{ status: number; text: string } | null> {
  if (!z.iso.date().safeParse(date).success) return { status: 400, text: "Invalid edition date." };
  const response = await archiveRequest(`/archive/${kind}/${date}`);
  if (!response) return null;
  return { status: response.status, text: await response.text() };
}
