"use client";

import { useState, useTransition } from "react";
import { buyAgentCreditsAction, createAgentKeyAction, refreshAgentAccessAction, revokeAgentKeyAction, updateAgentRefillAction } from "@/lib/agent-actions";
import type { AgentAccessResult } from "@/lib/agent-client";
import { creditPackPrice, type AgentCreditCurrency } from "@/lib/agent-credit-policy";

export function AgentAccessPanel({ endpoint, initial }: { endpoint: string; initial: AgentAccessResult }) {
  const [createdAt, setCreatedAt] = useState(initial.access?.createdAt ?? null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState(initial.error ?? "");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState(initial.access);
  const [currency, setCurrency] = useState<AgentCreditCurrency>(initial.access?.credits.autoRefill.currency ?? "usd");
  const [autoRefill, setAutoRefill] = useState(initial.access?.credits.autoRefill.enabled ?? false);
  const [maxPacks, setMaxPacks] = useState(initial.access?.credits.autoRefill.maxPacksPerMonth ?? 2);
  const config = JSON.stringify({ mcpServers: { "forward-pass": { type: "http", url: endpoint, headers: { Authorization: `Bearer ${token ?? "YOUR_AGENT_KEY"}` } } } }, null, 2);

  function update(revoke: boolean) {
    setMessage("");
    setCopied(false);
    startTransition(async () => {
      try {
        const result = await (revoke ? revokeAgentKeyAction() : createAgentKeyAction());
        if (result.error) { setMessage(result.error); return; }
        if (result.access) setAccess(result.access);
        setCreatedAt(result.access?.createdAt ?? null);
        setToken(result.access?.token ?? null);
        setMessage(revoke ? "Key revoked. Your agents no longer have access." : "Save your key now. It is only shown here once.");
      } catch { setMessage("Could not update agent access. Try again shortly."); }
    });
  }

  function manageCredits(action: "buy" | "refresh" | "save") {
    setMessage("");
    startTransition(async () => {
      try {
        if (action === "buy") {
          const result = await buyAgentCreditsAction(currency);
          if (result.url) { window.location.assign(result.url); return; }
          setMessage(result.error ?? "Could not open checkout.");
          return;
        }
        const result = action === "save" ? await updateAgentRefillAction({ enabled: autoRefill, currency, maxPacksPerMonth: maxPacks }) : await refreshAgentAccessAction();
        if (result.error) { setMessage(result.error); return; }
        if (result.access) {
          setAccess(result.access);
          setAutoRefill(result.access.credits.autoRefill.enabled);
          setCurrency(result.access.credits.autoRefill.currency);
          setMaxPacks(result.access.credits.autoRefill.maxPacksPerMonth);
        }
        setMessage(action === "save" ? "Auto-refill settings saved." : "Credit balance refreshed.");
      } catch { setMessage("Could not update your credits. Try again shortly."); }
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
      {access && <div className="mt-8 border-t border-border pt-7">
        <h3 className="font-display text-2xl">Your agent credits</h3>
        <p className="mt-3 text-3xl tabular-nums">{access.credits.available.toLocaleString("en-US")} <span className="text-sm text-muted-foreground">available</span></p>
        {access.credits.trialEndsAt ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{access.credits.includedRemaining.toLocaleString("en-US")} of 500 free trial credits left. MCP and code mode are included at no charge until {new Date(access.credits.trialEndsAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC. No payment is required. These credits cover the full trial and do not reset monthly.</p> : <p className="mt-3 text-sm leading-6 text-muted-foreground">{access.credits.includedRemaining.toLocaleString("en-US")} of {access.credits.monthlyAllowance.toLocaleString("en-US")} monthly credits left, plus {access.credits.purchasedRemaining.toLocaleString("en-US")} purchased credits. Your monthly allowance resets on {access.credits.resetsAt.slice(0, 10)} at 00:00 UTC. Purchased credits carry forward.</p>}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">One successful coverage call uses one credit, including empty searches and each result page. Connecting and failed calls are free.</p>
        <button type="button" disabled={pending} onClick={() => manageCredits("refresh")} className="mt-3 text-sm underline underline-offset-4 disabled:opacity-50">Refresh balance</button>
        {!access.credits.trialEndsAt && <>
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-sm">Currency<select value={currency} disabled={pending} onChange={(event) => setCurrency(event.target.value === "eur" ? "eur" : "usd")} className="mt-2 block border border-border bg-background p-3"><option value="usd">USD</option><option value="eur">EUR</option></select></label>
          <button type="button" disabled={pending || !access.topUpAvailable} onClick={() => manageCredits("buy")} className="dither-box dither-solid px-5 py-3 text-sm font-medium disabled:opacity-50">Buy 1,000 credits · {creditPackPrice(currency)}</button>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{access.topUpAvailable ? "Pay securely through Polar. Any applicable tax is shown at checkout. Credits arrive after payment is confirmed. Refresh your balance if the payment is still processing." : "Credit top-ups are temporarily unavailable."}</p>
        <div className="mt-7 border-t border-border pt-6">
          <h4 className="text-sm font-medium">Optional auto-refill</h4>
          {access.autoRefillAvailable ? <>
            <label className="mt-4 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={autoRefill} disabled={pending} onChange={(event) => setAutoRefill(event.target.checked)} className="mt-1" /><span>I authorize Forward Pass to charge my saved Polar payment method {creditPackPrice(currency)} plus applicable tax for 1,000 credits when my available balance reaches 50 or fewer credits, up to the monthly limit below.</span></label>
            <label className="mt-4 block text-sm">Maximum automatic packs per month<input type="number" min={1} max={10} step={1} value={maxPacks} disabled={pending} onChange={(event) => setMaxPacks(Number(event.target.value))} className="ml-3 w-20 border border-border bg-background p-2" /></label>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{access.credits.autoRefill.automaticPacks} refill attempts this month. Failed and pending attempts count toward the limit, which resets on the first day of each month at 00:00 UTC. Manual purchases are separate. Turn auto-refill off and save to stop future charges. A payment already underway may still complete.</p>
            <button type="button" disabled={pending || !Number.isInteger(maxPacks) || maxPacks < 1 || maxPacks > 10} onClick={() => manageCredits("save")} className="dither-box dither-ghost mt-4 px-5 py-3 text-sm disabled:opacity-50">Save auto-refill settings</button>
          </> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Automatic refill is not available yet. You can add credits manually.</p>}
          {access.credits.autoRefill.pending && <p className="mt-3 text-sm text-muted-foreground">A refill payment is awaiting confirmation.</p>}
          {access.credits.autoRefill.error && <p role="alert" className="mt-3 text-sm text-muted-foreground">{access.credits.autoRefill.error}</p>}
        </div>
        </>}
      </div>}
    </section>
  );
}
