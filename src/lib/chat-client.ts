import { z } from "zod";
import { archiveRequest } from "./archive-client";

export const deliveryPlatformSchema = z.enum(["slack", "discord", "telegram", "teams"]);
export type DeliveryPlatform = z.infer<typeof deliveryPlatformSchema>;
export type DeliveryMode = "personal" | "shared";
export const chatSettingsSchema = z.object({
  available: z.object({ slack: z.boolean(), discord: z.boolean(), telegram: z.boolean(), teams: z.boolean() }),
  destinations: z.array(z.object({ id: z.string(), platform: deliveryPlatformSchema, mode: z.enum(["personal", "shared"]), label: z.string(), status: z.enum(["pending", "active", "paused", "disconnected"]), createdAt: z.iso.datetime() })),
});
export type ChatSettings = z.infer<typeof chatSettingsSchema>;
export const chatConnectionSchema = z.object({ token: z.string(), expiresAt: z.iso.datetime(), command: z.string(), url: z.url().nullable() });
export type ChatConnection = z.infer<typeof chatConnectionSchema>;

export async function chatRequest(body?: unknown): Promise<{ value: unknown; error?: never } | { error: string; value?: never }> {
  try {
    const response = await archiveRequest("/chat-settings", { method: body ? "POST" : "GET", signal: AbortSignal.timeout(12_000), ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    if (!response) return { error: "Delivery settings are temporarily unavailable. Try again shortly." };
    const value: unknown = await response.json();
    if (!response.ok) {
      const failure = z.object({ error: z.string() }).safeParse(value);
      return { error: failure.success ? failure.data.error : "Could not update delivery." };
    }
    return { value };
  } catch { return { error: "Delivery settings are temporarily unavailable. Try again shortly." }; }
}
export async function loadChatSettings(): Promise<{ settings: ChatSettings; error?: never } | { error: string; settings?: never }> {
  const result = await chatRequest();
  if (result.error) return { error: result.error };
  const parsed = chatSettingsSchema.safeParse(result.value);
  return parsed.success ? { settings: parsed.data } : { error: "Delivery settings are temporarily unavailable." };
}
