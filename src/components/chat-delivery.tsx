"use client";

import { useEffect, useState, useTransition } from "react";
import { connectChatAction, installSlackAction, refreshChatSettingsAction, updateChatDestinationAction } from "@/lib/chat-actions";
import type { ChatConnection, ChatSettings, DeliveryMode, DeliveryPlatform } from "@/lib/chat-client";

const platforms: Array<{ id: DeliveryPlatform; name: string; personal: string; shared: string }> = [
  { id: "telegram", name: "Telegram", personal: "Receive the daily digest directly from our bot.", shared: "Deliver to a group or a topic. A group administrator connects it." },
  { id: "slack", name: "Slack", personal: "Receive the daily digest in an app direct message. This also links your account for coverage tools in Slackbot, using your plan and agent credits. Disconnect to revoke that link.", shared: "Post the daily digest in your team's chosen channel." },
  { id: "discord", name: "Discord", personal: "Receive the daily digest directly from our bot. Allow direct messages from Forward Pass.", shared: "Post to a server channel. An administrator or channel manager connects it." },
  { id: "teams", name: "Microsoft Teams", personal: "Receive the daily digest in the app's personal chat.", shared: "Post to a team channel or shared conversation where the app is installed." },
];
type Initial = { settings?: ChatSettings; error?: string };

export function ChatDeliveryPanel({ initial }: { initial: Initial }) {
  const [settings, setSettings] = useState(initial.settings);
  const [message, setMessage] = useState(initial.error ?? "");
  const [mode, setMode] = useState<DeliveryMode>("personal");
  const [link, setLink] = useState<(ChatConnection & { platform: DeliveryPlatform; mode: DeliveryMode }) | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  async function refresh() {
    try {
      const result = await refreshChatSettingsAction();
      if (result.settings) setSettings(result.settings);
      if (result.error) setMessage(result.error);
    } catch { setMessage("Could not refresh delivery settings."); }
  }
  useEffect(() => {
    if (!link) return;
    const timer = window.setInterval(() => {
      if (Date.now() > Date.parse(link.expiresAt)) { setLink(null); return; }
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [link]);

  function connect(platform: DeliveryPlatform) {
    setMessage(""); setCopied(false);
    startTransition(async () => {
      try {
        const result = await connectChatAction({ platform, mode });
        if (result.connection) setLink({ ...result.connection, platform, mode });
        else setMessage(result.error ?? "Could not connect this channel.");
      } catch { setMessage("Could not connect this channel. Try again shortly."); }
    });
  }
  function update(id: string, status: "active" | "paused" | "disconnected") {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await updateChatDestinationAction({ id, status });
        if (result.settings) { setSettings(result.settings); setMessage(status === "active" ? "Daily delivery enabled." : status === "paused" ? "Daily delivery paused." : "Destination disconnected."); setLink(null); }
        else setMessage(result.error ?? "Could not update delivery.");
      } catch { setMessage("Could not update delivery. Try again shortly."); }
    });
  }
  function installSlack() {
    startTransition(async () => {
      try {
        const result = await installSlackAction();
        if (result.url) window.location.assign(result.url);
        else setMessage(result.error ?? "Could not connect Slack.");
      } catch { setMessage("Could not connect Slack."); }
    });
  }

  return <section id="delivery" className="mt-12 border-t border-border pt-8" aria-labelledby="delivery-title">
    <h2 id="delivery-title" className="font-display text-3xl">Your edition, where you read.</h2>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">A compact daily digest with headlines and a link to the full edition. Connect several destinations and manage each independently. Your email subscription stays separate.</p>
    <label htmlFor="delivery-mode" className="mt-6 block text-sm font-medium">Deliver to</label>
    <select id="delivery-mode" value={mode} disabled={pending} onChange={event => setMode(event.target.value === "shared" ? "shared" : "personal")} className="mt-2 w-full border border-border bg-background p-3 text-sm">
      <option value="personal">My personal inbox</option><option value="shared">A shared team channel or group</option>
    </select>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {platforms.filter(platform => platform.id !== "teams").map(platform => <div key={platform.id} className="border border-border p-5">
        <h3 className="font-display text-xl">{platform.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{mode === "personal" ? platform.personal : platform.shared}</p>
        <button type="button" disabled={pending || !settings?.available[platform.id]} onClick={() => connect(platform.id)} className="dither-box dither-solid mt-4 px-4 py-2 text-sm disabled:opacity-50">{settings?.available[platform.id] ? `Connect ${platform.name}` : settings ? "Coming soon" : "Temporarily unavailable"}</button>
        {platform.id === "slack" && settings?.available.slack && <button type="button" disabled={pending} onClick={installSlack} className="mt-3 block text-sm underline underline-offset-4 disabled:opacity-50">Add Forward Pass to your workspace</button>}
      </div>)}
    </div>
    {link && <div className="mt-6 border border-border p-5">
      <h3 className="text-sm font-medium">Connect {platforms.find(platform => platform.id === link.platform)?.name}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{link.platform === "telegram" ? "Open Telegram and press Start, or add the bot to your group. If needed, send the command below." : link.platform === "teams" ? "Open Forward Pass in Teams. Send the command below in your personal chat, or mention the app with this command in the shared conversation." : "Install the app if needed, then run this command in the app or your chosen channel."} Return here and confirm the destination. This code expires in ten minutes.</p>
      {link.url && <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4">Open {platforms.find(platform => platform.id === link.platform)?.name}</a>}
      <label htmlFor="delivery-command" className="mt-4 block text-xs font-medium">Connection command</label>
      <input id="delivery-command" readOnly value={link.command} autoComplete="off" onFocus={event => event.target.select()} className="mt-2 w-full border border-border bg-background p-3 font-mono text-xs" />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(link.command); setCopied(true); } catch { setMessage("Select and copy the command above."); } }} className="mt-3 text-sm underline underline-offset-4">{copied ? "Copied" : "Copy command"}</button>
    </div>}
    {!!settings?.destinations.length && <div className="mt-8 space-y-4">
      <h3 className="text-sm font-medium">Connected destinations</h3>
      {settings.destinations.map(destination => <div key={destination.id} className="border border-border p-5">
        <p className="text-sm font-medium break-words">{destination.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{platforms.find(platform => platform.id === destination.platform)?.name} · {destination.mode === "shared" ? "Shared" : "Personal"} · {destination.status === "pending" ? "Waiting for your confirmation" : destination.status}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          {destination.status === "pending" && <button type="button" disabled={pending} onClick={() => update(destination.id, "active")} className="text-sm underline underline-offset-4">Confirm daily delivery here</button>}
          {destination.status === "active" && <button type="button" disabled={pending} onClick={() => update(destination.id, "paused")} className="text-sm underline underline-offset-4">Pause</button>}
          {destination.status === "paused" && <button type="button" disabled={pending} onClick={() => update(destination.id, "active")} className="text-sm underline underline-offset-4">Resume</button>}
          {destination.status !== "disconnected" && <button type="button" disabled={pending} onClick={() => update(destination.id, "disconnected")} className="text-sm underline underline-offset-4">Disconnect</button>}
        </div>
      </div>)}
    </div>}
    <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
    <button type="button" disabled={pending} onClick={() => startTransition(refresh)} className="mt-3 text-sm underline underline-offset-4 disabled:opacity-50">{pending ? "Updating…" : "Refresh destinations"}</button>
  </section>;
}
