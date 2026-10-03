import { z } from "zod";
import { archiveRequest } from "./archive-client";

export const agentAccessSchema = z.object({ createdAt: z.iso.datetime().nullable(), token: z.string().regex(/^fp_agent_[a-f0-9]{64}\.[A-Za-z0-9_-]{43}$/).optional() });
export type AgentAccess = z.infer<typeof agentAccessSchema>;
export type AgentAccessResult = { access: AgentAccess; error?: never; status?: never } | { error: string; status?: number; access?: never };

export function agentEndpoint(): string | null {
  const configured = process.env.FORWARDPASS_AGENT_URL;
  if (!configured) return null;
  try {
    const base = new URL(configured);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) return null;
    return new URL("/mcp", base).toString();
  } catch { return null; }
}

export async function requestAgentAccess(method: "GET" | "POST" | "DELETE"): Promise<AgentAccessResult> {
  const response = await archiveRequest("/agent-access", { method, signal: AbortSignal.timeout(8_000) });
  if (!response) return { error: "Agent access is temporarily unavailable. Try again shortly." };
  if (response.status === 401) return { error: "Sign in from your reading brief to manage agent access." };
  if (response.status === 403) return { error: "Agent access is included with an active Professional subscription.", status: 403 };
  if (!response.ok) return { error: "Agent access is temporarily unavailable. Try again shortly." };
  const parsed = agentAccessSchema.safeParse(await response.json());
  return parsed.success ? { access: parsed.data } : { error: "Agent access is temporarily unavailable. Try again shortly." };
}
