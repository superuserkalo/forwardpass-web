"use client";

import { useState, useTransition } from "react";
import { createAgentKeyAction, revokeAgentKeyAction } from "@/lib/agent-actions";
import type { AgentAccessResult } from "@/lib/agent-client";

export function AgentAccessPanel({ endpoint, initial }: { endpoint: string; initial: AgentAccessResult }) {
  const [createdAt, setCreatedAt] = useState(initial.access?.createdAt ?? null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState(initial.error ?? "");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const config = JSON.stringify({ mcpServers: { "forward-pass": { type: "http", url: endpoint, headers: { Authorization: `Bearer ${token ?? "YOUR_AGENT_KEY"}` } } } }, null, 2);

  function update(revoke: boolean) {
    setMessage("");
    setCopied(false);
    startTransition(async () => {
      try {
        const result = await (revoke ? revokeAgentKeyAction() : createAgentKeyAction());
        if (result.error) { setMessage(result.error); return; }
        if (!result.access) return;
        setCreatedAt(result.access.createdAt);
        setToken(result.access.token ?? null);
        setMessage(revoke ? "Key revoked. Your agents no longer have access." : "Save your key now. It is only shown here once.");
      } catch { setMessage("Could not update agent access. Try again shortly."); }
    });
  }

  async function copyConfig() {
    try { await navigator.clipboard.writeText(config); setCopied(true); }
    catch { setMessage("Select and copy the configuration below."); }
  }

  return (
    <section className="mt-10 border border-border p-6 md:p-8" aria-labelledby="agent-key-title">
      <h2 id="agent-key-title" className="font-display text-2xl">Connect your agent.</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {createdAt ? "You have an active key. Replacing it disconnects agents using the previous key." : "Create a key, then add the server URL and Bearer token to your MCP client."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => update(false)} className="dither-box dither-solid px-5 py-3 text-sm font-medium disabled:opacity-50">
          {pending ? "Updating…" : createdAt ? "Replace key" : "Create agent key"}
        </button>
        {createdAt && <button type="button" disabled={pending} onClick={() => update(true)} className="dither-box dither-ghost px-5 py-3 text-sm disabled:opacity-50">Revoke key</button>}
      </div>
      <p role="status" className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
      {token && <div className="mt-6">
        <label htmlFor="agent-key" className="block text-sm font-medium">Your agent key</label>
        <input id="agent-key" readOnly type="password" value={token} autoComplete="off" className="mt-2 w-full border border-border bg-background p-3 font-mono text-xs" onFocus={(event) => event.target.select()} />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Keep this key private. It gives read-only access to published coverage and uses your reading brief to filter updates.</p>
      </div>}
      <div className="mt-7">
        <label htmlFor="agent-config" className="block text-sm font-medium">MCP configuration</label>
        <textarea id="agent-config" readOnly value={config} rows={12} spellCheck={false} className="mt-3 w-full resize-y border border-border bg-background p-4 font-mono text-xs leading-6" />
        {token && <button type="button" onClick={copyConfig} className="mt-3 text-sm underline underline-offset-4">{copied ? "Configuration copied" : "Copy configuration with key"}</button>}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Use a client that supports remote MCP with custom authorization headers. Clients that require OAuth sign-in are not supported yet.</p>
      </div>
    </section>
  );
}
