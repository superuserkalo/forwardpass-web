import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PricingPlans } from "@/components/pricing-plans";
import { TrustBand } from "@/components/trust-band";
import { PLAN_COMPARISON } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/pricing",
  title: "Pricing",
  description:
    "A free daily issue for everyone. A personal issue written to your interests from $4.99/month.",
});

export default async function Pricing({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const initialPlan = params.plan === "professional" ? "professional" : "personal";
  const initialBillingPeriod = params.billing === "yearly" ? "yearly" : "monthly";

  return (
    <main id="top" className="page-shell pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <PricingPlans
          key={`${initialPlan}-${initialBillingPeriod}`}
          initialPlan={initialPlan}
          initialBillingPeriod={initialBillingPeriod}
          showSignup={Boolean(params.plan)}
        >
          <TrustBand heading="Get daily news from world-class companies." />
        </PricingPlans>

        <details className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            Compare individual plans
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div role="region" aria-label="Plan comparison" tabIndex={0} className="overflow-x-auto pb-6 focus-visible:outline-2 focus-visible:outline-ring">
            <table className="w-full min-w-[42rem] table-fixed border-collapse text-left text-sm">
              <caption className="sr-only">Features included with Free, Personal, and Professional</caption>
              <thead>
                <tr className="border-b border-border">
                  {["Features", "Free", "Personal", "Professional"].map((name) => (
                    <th key={name} scope="col" className="px-4 py-5 font-medium first:sticky first:left-0 first:z-10 first:bg-background first:pl-0">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map(([label, ...values]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <th scope="row" className="sticky left-0 z-10 bg-background py-5 pr-4 font-normal">{label}</th>
                    {values.map((value, index) => (
                      <td key={index} className="px-4 py-5 text-muted-foreground">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pb-6 text-sm leading-6 text-muted-foreground">
            The 14-day Personal trial includes MCP, code mode, and 500 credits total.
            Credit top-ups are available with a paid plan.{" "}
            <Link href="/agents" className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              Learn about agent access
            </Link>
          </p>
        </details>
      </div>
    </main>
  );
}
