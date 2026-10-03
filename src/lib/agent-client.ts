import { z } from "zod";
import { archiveRequest } from "./archive-client";

export const agentAccessSchema = z.object({
  createdAt: z.iso.datetime().nullable(), token: z.string().regex(/^fp_agent_[a-f0-9]{64}\.[A-Za-z0-9_-]{43}$/).optional(),
  topUpAvailable: z.boolean(), autoRefillAvailable: z.boolean(),
  credits: z.object({
    trialEndsAt: z.iso.datetime().nullable().default(null),
    plan: z.enum(["personal", "professional"]), monthlyAllowance: z.number().int().min(0),
    includedRemaining: z.number().int().min(0), purchasedRemaining: z.number().int(), available: z.number().int().min(0), resetsAt: z.iso.datetime(),
    autoRefill: z.object({ enabled: z.boolean(), currency: z.enum(["usd", "eur"]), maxPacksPerMonth: z.number().int().min(1).max(10), automaticPacks: z.number().int().min(0), pending: z.boolean(), error: z.string().nullable() }),
  }),
});
export type AgentAccess = z.infer<typeof agentAccessSchema>;
export type AgentAccessResult = { access: AgentAccess; error?: never; status?: never; revoked?: never } | { revoked: true; access?: never; error?: never; status?: never } | { error: string; status?: number; access?: never; revoked?: never };

export function agentEndpoint(): string | null {
  const configured = process.env.FORWARDPASS_AGENT_URL;
  if (!configured) return null;
  try {
    const base = new URL(configured);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) return null;
    return new URL("/mcp", base).toString();
  } catch { return null; }
}

export async function requestAgentAccess(method: "GET" | "POST" | "DELETE" | "PATCH", body?: { enabled: boolean; currency: "usd" | "eur"; maxPacksPerMonth: number }): Promise<AgentAccessResult> {
  const response = await archiveRequest("/agent-access", { method, signal: AbortSignal.timeout(12_000), ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  if (!response) return { error: "Agent access is temporarily unavailable. Try again shortly." };
  if (response.status === 401) return { error: "Sign in from your reading brief to manage agent access." };
  if (response.status === 403) return { error: "Agent access is included with an active Personal trial or Personal or Professional subscription.", status: 403 };
  if (response.status === 409) return { error: "Auto-refill is unavailable. Check your saved card in Polar and wait for previous payments to finish." };
  if (!response.ok) return { error: "Agent access is temporarily unavailable. Try again shortly." };
  const value: unknown = await response.json();
  // Revocation remains possible after cancellation, even when there is no paid credit status.
  if (method === "DELETE") return z.object({ createdAt: z.null() }).safeParse(value).success ? { revoked: true } : { error: "Could not revoke your key." };
  const parsed = agentAccessSchema.safeParse(value);
  return parsed.success ? { access: parsed.data } : { error: "Agent access is temporarily unavailable. Try again shortly." };
}
