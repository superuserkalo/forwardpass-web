"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PersonalSignup } from "@/components/personal-signup";
import { PRICE_OPTIONS, type BillingPeriod, type Plan } from "@/lib/pricing";

const TIERS = [
  {
    id: "free",
    name: "Free",
    description: "The daily view of AI engineering.",
    includes: "Includes:",
    features: [
      "General daily newsletter",
      "Curated AI-engineering sources",
      "Full editorial access",
      "6-month archive",
    ],
  },
  {
    id: "personal",
    name: "Personal",
    description: "A daily issue shaped by your interests.",
    includes: "Everything in Free, plus:",
    features: [
      "Your own issue, ad-free",
      "An editable brief and links-only option",
      "MCP + code mode · 500 credits/month",
      "12-month archive",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Go deeper. Keep your agents informed.",
    includes: "Everything in Personal, plus:",
    features: [
      "Weekly deep research on your interests",
      "2,000 additional agent credits/month",
      "24-month archive",
      "Priority support",
    ],
  },
] as const;

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

function PricingSwitch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full bg-secondary/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm transition-colors ${focusClass} ${value === option.value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PricingPlans({
  initialPlan,
  initialBillingPeriod,
  showSignup,
  children,
}: {
  initialPlan: Plan;
  initialBillingPeriod: BillingPeriod;
  showSignup: boolean;
  children: ReactNode;
}) {
  const [billingPeriod, setBillingPeriod] = useState(initialBillingPeriod);
  const [plan, setPlan] = useState(initialPlan);
  const signupRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const revealSignup = () => {
      if (window.location.hash === "#signup" && signupRef.current) {
        signupRef.current.open = true;
        signupRef.current.scrollIntoView({ block: "start" });
      }
    };
    revealSignup();
    window.addEventListener("hashchange", revealSignup);
    return () => window.removeEventListener("hashchange", revealSignup);
  }, []);

  const paidHref = (plan: Plan) => `/pricing?plan=${plan}&billing=${billingPeriod}#signup`;
  const individual = TIERS[plan === "personal" ? 1 : 2];
  const periodLabel = billingPeriod === "monthly" ? "month" : "year";
  const cards = [
    {
      ...TIERS[0],
      price: "$0",
      billingNote: "Free forever · daily, sponsored",
      href: "/welcome",
      cta: "Join free",
    },
    {
      ...individual,
      id: "individual",
      name: "Individual",
      price: PRICE_OPTIONS[plan][billingPeriod].usd,
      billingNote: `Per ${periodLabel}${billingPeriod === "yearly" ? " · save 16%" : ""}`,
      href: plan === "professional" ? paidHref(plan) : "/welcome",
      cta: plan === "professional" ? "Get Pro" : "Try 14 days free",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "The data, reach, and engine behind Forward Pass.",
      price: "Custom",
      billingNote: "Tailored to your organization",
      includes: "Talk to us about:",
      features: [
        "Source-backed AI data and feeds",
        "Reach our AI-engineering audience",
        "Our research and briefing engine",
        "API and workflow integrations",
        "Custom delivery and licensing",
      ],
      href: "/contact",
      cta: "Contact sales",
    },
  ];

  return (
    <>
      <section aria-labelledby="pricing-title" className="pb-12 pt-32 md:pt-36">
        <h1 id="pricing-title" className="text-center text-5xl font-medium tracking-tight sm:text-6xl">
          Pricing
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PricingSwitch
            label="Billing period"
            options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]}
            value={billingPeriod}
            onChange={setBillingPeriod}
          />
        </div>
      </section>

      <section aria-label="Plans" className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className={`flex flex-col p-6 lg:p-8 ${card.id === "individual" ? "bg-secondary" : "bg-secondary/45"}`}>
            <h2 className="text-2xl font-medium tracking-tight">{card.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{card.description}</p>
            <div className="mt-6">
              <p className="text-4xl font-medium tracking-tight tabular-nums">
                {card.price}
              </p>
              <p className="mt-2 min-h-6 text-xs leading-6 text-muted-foreground">{card.billingNote}</p>
            </div>
            <div className="mt-5 min-h-11">
              {card.id === "individual" && (
                <PricingSwitch
                  label="Individual plan"
                  options={[{ value: "personal", label: "Personal" }, { value: "professional", label: "Pro" }]}
                  value={plan}
                  onChange={setPlan}
                />
              )}
            </div>
            <p className="mb-4 mt-8 min-h-12 text-sm text-muted-foreground">{card.includes}</p>
            <ul className="mb-8 flex-1 space-y-3 text-sm leading-6">
              {card.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span aria-hidden="true" className="text-muted-foreground">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={card.href}
              className={`inline-flex min-h-11 items-center justify-center px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98] ${focusClass} ${card.id === "individual" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-accent/70 hover:bg-accent"}`}
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
        Checkout applies your regional currency and applicable taxes. Your final total is shown at checkout. Cancel any time.
      </p>

      <div className="mt-16 mb-12">{children}</div>

      <details ref={signupRef} id="signup" open={showSignup} className="group mt-12 scroll-mt-24 border-y border-border">
        <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-sm [&::-webkit-details-marker]:hidden ${focusClass}`}>
          Ready for a paid plan?
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-10 pb-10 pt-4 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-3xl font-medium tracking-tight">Make it yours.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              Tell us what you build, what you want to follow, and what to skip.
              We’ll write your daily issue around it. Edit your brief any time.
            </p>
            <Link href="/welcome" className={`mt-6 inline-block text-sm underline underline-offset-4 ${focusClass}`}>
              Start with a free trial
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Or subscribe below. Cancel any time from your billing portal.
            </p>
          </div>
          <PersonalSignup plan={plan} onPlanChange={setPlan} billingPeriod={billingPeriod} onBillingPeriodChange={setBillingPeriod} />
        </div>
      </details>
    </>
  );
}
