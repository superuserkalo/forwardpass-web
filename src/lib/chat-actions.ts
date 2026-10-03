"use server";

import { z } from "zod";
import { preferencesEmail } from "./preferences-session";
import { chatRequest, chatConnectionSchema, deliveryPlatformSchema, loadChatSettings } from "./chat-client";

export async function refreshChatSettingsAction(): ReturnType<typeof loadChatSettings> {
  if (!await preferencesEmail()) return { error: "Sign in to manage delivery." };
  return loadChatSettings();
}
export async function connectChatAction(input: unknown) {
  if (!await preferencesEmail()) return { error: "Sign in to connect a channel." };
  const parsed = z.object({ platform: deliveryPlatformSchema, mode: z.enum(["personal", "shared"]) }).safeParse(input);
  if (!parsed.success) return { error: "Choose a channel and destination type." };
  const result = await chatRequest({ action: "connect", ...parsed.data });
  if (result.error) return { error: result.error };
  const connection = chatConnectionSchema.safeParse(result.value);
  return connection.success ? { connection: connection.data } : { error: "Could not create a connection." };
}
export async function updateChatDestinationAction(input: unknown): ReturnType<typeof loadChatSettings> {
  if (!await preferencesEmail()) return { error: "Sign in to manage delivery." };
  const parsed = z.object({ id: z.string().regex(/^[a-f0-9]{64}$/), status: z.enum(["active", "paused", "disconnected"]) }).safeParse(input);
  if (!parsed.success) return { error: "Invalid destination." };
  const result = await chatRequest({ action: "update", ...parsed.data });
  if (result.error) return { error: result.error };
  if (!z.object({ updated: z.literal(true) }).safeParse(result.value).success) return { error: "Could not update delivery." };
  return loadChatSettings();
}
export async function installSlackAction() {
  if (!await preferencesEmail()) return { error: "Sign in to connect Slack." };
  const result = await chatRequest({ action: "install-slack" });
  if (result.error) return { error: result.error };
  const parsed = z.object({ url: z.url() }).safeParse(result.value);
  return parsed.success && new URL(parsed.data.url).origin === "https://slack.com" ? { url: parsed.data.url } : { error: "Could not open Slack installation." };
}
