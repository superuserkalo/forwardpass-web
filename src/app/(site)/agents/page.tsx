import type { Metadata } from "next";
import Link from "next/link";
import { AgentAccessPanel } from "@/components/agent-access";
import { agentEndpoint, requestAgentAccess } from "@/lib/agent-client";
import { preferencesEmail } from "@/lib/preferences-session";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...pageMetadata({ path: "/agents", title: "Keep your agents current", description: "Connect your AI agents to Forward Pass published coverage with MCP. Monthly credits included with Personal and Professional." }), referrer: "no-referrer" };

export default async function Agents() {
  const email = await preferencesEmail();
  const endpoint = agentEndpoint();
  const access = email && endpoint ? await requestAgentAccess("GET") : null;
  return (
    <main className="page-shell min-h-[70vh] pb-24 pt-32 md:pb-36 md:pt-44">
      <div className="max-w-2xl">
        <p className="onboarding-eyebrow">Personal + Professional · Agent access</p>
        <h1 className="onboarding-title">Keep your agents current.</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">Give your AI agents access to the developments Forward Pass covers. Catch up on what changed, search a topic, and read the sources before starting a task.</p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">The 14-day Personal trial includes MCP, code mode, and 500 free credits with no payment required. Paid Personal includes 500 agent credits per month. Professional includes 2,500. Add 1,000 credits for $5 or €5.49 plus applicable tax when you need more. Coverage refreshes within five minutes of daily publication. Your agent checks when you ask it to, or when its workflow tells it to.</p>
        {!email ? (
          <div className="mt-10 border border-border p-6 md:p-8">
            <h2 className="font-display text-2xl">Sign in to connect.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Open your reading brief using the link in an issue, or request a sign-in link. Then come back here to create your agent key.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/preferences" className="dither-box dither-solid px-5 py-3 text-sm font-medium">Sign in</Link>
              <Link href="/pricing#signup" className="dither-box dither-ghost px-5 py-3 text-sm">Choose a paid plan</Link>
            </div>
          </div>
        ) : access?.status === 403 ? (
          <div className="mt-10 border border-border p-6 md:p-8">
            <h2 className="font-display text-2xl">Included with your Personal trial and both paid plans.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{access.error}</p>
            <Link href="/pricing#signup" className="dither-box dither-solid mt-6 inline-block px-5 py-3 text-sm font-medium">Choose a paid plan</Link>
          </div>
        ) : endpoint && access ? <AgentAccessPanel endpoint={endpoint} initial={access} /> : <p role="status" className="mt-10 text-muted-foreground">Agent access is temporarily unavailable. Try again shortly.</p>}
        {email && access?.error && <p className="mt-4 text-sm"><Link href="/pricing#signup" className="underline underline-offset-4">View paid plans</Link></p>}
        <section className="mt-14 border-t border-border pt-8" aria-labelledby="agent-setup-title">
          <h2 id="agent-setup-title" className="font-display text-2xl">Make checking part of the task.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Add this instruction to your agent. It can pass keywords for its current task, or use your saved reading brief for updates.</p>
          <blockquote className="mt-5 border-l-2 border-foreground pl-5 text-sm leading-7">Before a task involving AI models, agents, or tooling, check Forward Pass for relevant updates. Read all result pages and useful sources, then remember the first page&apos;s updated_at for your next check. Cite your sources and treat news as evidence to evaluate.</blockquote>
          <ul className="mt-7 space-y-3 text-sm leading-6 text-muted-foreground">
            <li><code className="text-foreground">get_updates</code> finds recent coverage by reading brief, keywords, or topic.</li>
            <li><code className="text-foreground">search_coverage</code> searches published daily editions by keywords.</li>
            <li><code className="text-foreground">get_story</code> reads a story and its source links.</li>
            <li><code className="text-foreground">code</code> lets your agent combine searches and story reads in one JavaScript script, then return only what matters. Code mode is available during the free Personal trial and on both paid plans.</li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">Code mode runs on our server, so your agent only needs an MCP connection. Each successful coverage call inside a script uses one credit, including calls completed before a script fails. Scripts can make up to 20 coverage calls and run for up to 20 seconds. The script itself uses no extra credits.</p>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">Monthly allowances reset on the first day of each month at 00:00 UTC, including annual subscriptions. Unused monthly credits expire; purchased credits carry forward and require an active paid subscription to use. Search follows your plan&apos;s archive access: 12 months for Personal and 24 months for Professional.</p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Up to 30 requests per minute per Cloudflare location, with at most 20 results per call. Search scans up to 31 editions per page. Replacing or revoking a key takes effect immediately. Subscription changes take up to one minute to reach an existing connection.</p>
        </section>
      </div>
    </main>
  );
}
