"use server";

import { requestAgentAccess, type AgentAccessResult } from "./agent-client";
import { preferencesEmail } from "./preferences-session";
import { z } from "zod";
import { createAgentCreditCheckout } from "./agent-billing";

export async function createAgentKeyAction(): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to create an agent key." };
  return requestAgentAccess("POST");
}

export async function revokeAgentKeyAction(): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to revoke your agent key." };
  return requestAgentAccess("DELETE");
}

export async function refreshAgentAccessAction(): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to view agent credits." };
  return requestAgentAccess("GET");
}

export async function updateAgentRefillAction(input: unknown): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to manage auto-refill." };
  const parsed = z.object({ enabled: z.boolean(), currency: z.enum(["usd", "eur"]), maxPacksPerMonth: z.number().int().min(1).max(10) }).safeParse(input);
  if (!parsed.success) return { error: "Choose a monthly limit of 1 to 10 packs." };
  return requestAgentAccess("PATCH", parsed.data);
}

export async function buyAgentCreditsAction(currency: unknown): Promise<{ url: string; error?: never } | { error: string; url?: never }> {
  const email = await preferencesEmail();
  if (!email) return { error: "Sign in to buy agent credits." };
  const parsed = z.enum(["usd", "eur"]).safeParse(currency);
  if (!parsed.success) return { error: "Choose USD or EUR." };
  const access = await requestAgentAccess("GET");
  if (!access.access?.topUpAvailable) return { error: access.error ?? "Credit top-ups are temporarily unavailable." };
  try { return { url: await createAgentCreditCheckout(email, parsed.data) }; }
  catch { return { error: "Could not open checkout. Check your subscription and try again shortly." }; }
}
