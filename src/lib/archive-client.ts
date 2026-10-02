import { cookies } from "next/headers";
import { z } from "zod";
import { preferencesCookieName, verifyPreferencesToken } from "./preferences-token";

const archiveIndexSchema = z.object({
  tier: z.enum(["free", "personal", "professional"]),
  daily: z.array(z.iso.date()),
  weekly: z.array(z.iso.date()),
});

export type ArchiveIndex = z.infer<typeof archiveIndexSchema>;
export type ArchiveKind = "daily" | "weekly";

export type StoryImage = { path: string; credit: string | null; source: string | null };
export type ArchiveEntry = { status: number; text: string; image: string | null; storyImages: Record<string, StoryImage> };

const storyImagesSchema = z.record(
  z.string().regex(/^s-[a-f0-9]{16}$/),
  z.object({ path: z.string().regex(/^\/media\/story\/\d{4}-\d{2}-\d{2}\/s-[a-f0-9]{16}$/), credit: z.string().nullable(), source: z.url().nullable() }),
);

function storyImagesFrom(header: string | null): Record<string, StoryImage> {
  if (!header) return {};
  try {
    const parsed = storyImagesSchema.safeParse(JSON.parse(header));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

// Public outputs (sitemap, RSS, llms-full.txt, Markdown copies) read as an anonymous Free reader,
// so nothing behind a subscription leaks into them whoever triggers the render.
type Access = { anonymous?: boolean };

export async function archiveRequest(path: string, init?: RequestInit, access: Access = {}): Promise<Response | null> {
  const configured = process.env.FORWARDPASS_AGENT_URL;
  if (!configured) return null;
  const base = new URL(configured);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
    throw new Error("FORWARDPASS_AGENT_URL must use HTTPS outside local development.");
  }
  const token = access.anonymous ? undefined : (await cookies()).get(preferencesCookieName)?.value;
  const headers = new Headers(init?.headers);
  if (token && verifyPreferencesToken(token)) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(new URL(path, base), { ...init, headers, cache: "no-store" });
  } catch {
    return null;
  }
}

export async function archiveIndex(access: Access = {}): Promise<ArchiveIndex | null> {
  const response = await archiveRequest("/archive", undefined, access);
  if (!response?.ok) return null;
  return archiveIndexSchema.parse(await response.json());
}

export async function archiveEntry(kind: ArchiveKind, date: string, access: Access = {}): Promise<ArchiveEntry | null> {
  if (!z.iso.date().safeParse(date).success) return { status: 400, text: "Invalid edition date.", image: null, storyImages: {} };
  const response = await archiveRequest(`/archive/${kind}/${date}`, undefined, access);
  if (!response) return null;
  const image = response.headers.get("x-cover-image");
  return {
    status: response.status,
    text: await response.text(),
    image: image?.startsWith("/media/") ? image : null,
    storyImages: storyImagesFrom(response.headers.get("x-story-images")),
  };
}
