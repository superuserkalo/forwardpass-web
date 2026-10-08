import Link from "next/link";
import { labelClass } from "@/components/archive/edition-shared";
import { mcpConfig } from "@/lib/signals";
import { cn } from "@/lib/utils";

// How an agent reads the signals: a free MCP server with four read-only tools, the same signals and the same evidence as this page.
// It needs no key and is limited per caller. The paid MCP on the agents page is a different thing: the daily coverage, with credits.

const TOOLS: Array<{ name: string; body: string }> = [
  { name: "latest_signals", body: "The newest signals, filtered by topic, kind, importance, time or words, with a cursor to read further back." },
  { name: "get_signal", body: "One signal in full: every fact with the quote it was checked against, its sources, and any correction." },
  { name: "list_corrections", body: "The public log of corrections and retractions, newest first." },
  { name: "signal_stats", body: "How many signals were published, how soon after their source, and how many needed correcting." },
];

export function ForAgents({ url }: { url: string }) {
  return (
    <section id="mcp" aria-labelledby="mcp-heading" className="mt-24 border-t border-border pt-10">
      <h2 id="mcp-heading" className="font-display text-3xl md:text-4xl">Use the signals in your agent</h2>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground text-pretty">
        A free, read-only MCP server for the signals above. It needs no account and no key, is limited per caller, and gives an agent the same quotes and corrections you can read here. What it returns comes from web pages, so a client should treat it as data. Add it to any client that supports remote MCP.
      </p>
      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <label htmlFor="mcp-config" className="block text-sm font-medium">MCP configuration</label>
          <textarea id="mcp-config" readOnly value={mcpConfig(url)} rows={8} spellCheck={false} className="mt-3 w-full resize-y border border-border bg-background p-4 font-mono text-xs leading-6" />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Want the daily coverage and your own brief in an agent? That is <Link href="/agents" className="text-foreground underline underline-offset-4">agent access</Link>, with the paid plans.
          </p>
        </div>
        <ul className="space-y-6">
          {TOOLS.map((tool) => (
            <li key={tool.name}>
              <p className={cn(labelClass, "text-[10px] text-foreground")}>{tool.name}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground text-pretty">{tool.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
