"use server";

import { requestAgentAccess, type AgentAccessResult } from "./agent-client";
import { preferencesEmail } from "./preferences-session";

export async function createAgentKeyAction(): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to create an agent key." };
  return requestAgentAccess("POST");
}

export async function revokeAgentKeyAction(): Promise<AgentAccessResult> {
  if (!await preferencesEmail()) return { error: "Sign in to revoke your agent key." };
  return requestAgentAccess("DELETE");
}
