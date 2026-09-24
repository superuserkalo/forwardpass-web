import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PersonalSignup } from "@/components/personal-signup";
import { PRICE_OPTIONS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing | The Forward Pass",
  description:
    "A free daily issue for everyone. A personal issue written to your interests from $4.99/month.",
  openGraph: {
    title: "Pricing | The Forward Pass",
    description:
      "A free daily issue for everyone. A personal issue written to your interests from $4.99/month.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const TIERS = [
  {
    id: "free",
    name: "Free",
    blurb: "The general issue, every day.",
    price: "$0",
    cadence: "forever",
    features: [
      "General daily issue",
      "Curated AI-engineering sources",
      "Sponsored",
    ],
    cta: { label: "Join free", href: "/welcome" },
  },
  {
    id: "personal",
    name: "Personal",
    blurb: "An issue written to your interests.",
    price: PRICE_OPTIONS.personal.monthly.usd,
    cadence: "/mo",
    localPrice: `${PRICE_OPTIONS.personal.monthly.eur}/mo`,
    annualPrice: `${PRICE_OPTIONS.personal.yearly.usd}/yr · ${PRICE_OPTIONS.personal.yearly.eur}/yr`,
    recommended: true,
    features: [
      "Everything in Free",
      "Personal issue from a natural-language brief",
      "Ad-free",
      "Links-only mode on request",
    ],
    cta: { label: "Try Personal free for 14 days", href: "/welcome" },
  },
  {
    id: "professional",
    name: "Professional",
    blurb: "Plus weekly deep research on your niche.",
    price: PRICE_OPTIONS.professional.monthly.usd,
    cadence: "/mo",
    localPrice: `${PRICE_OPTIONS.professional.monthly.eur}/mo`,
    annualPrice: `${PRICE_OPTIONS.professional.yearly.usd}/yr · ${PRICE_OPTIONS.professional.yearly.eur}/yr`,
    features: [
      "Everything in Personal",
      "Weekly deep research on your brief",
      "Priority support",
    ],
    cta: { label: "Start with Professional", href: "/pricing?plan=professional#signup" },
  },
];

const COMPARE: Array<[string, string, string, string]> = [
  ["Issue", "General", "To your interests", "To your interests"],
  ["Filtering", "Curated source universe", "Your brief, in plain language", "Your brief, in plain language"],
  ["Editorial", "Full access", "Full access", "Full access"],
  ["Newsletter", "Daily, sponsored", "Daily, ad-free", "Daily, ad-free"],
  ["Deep research", "—", "—", "Weekly, on your niche"],
  ["Format", "Fixed layout", "Prose or links-only", "Prose or links-only"],
  ["Archive", "Last 6 months", "Last 12 months", "Last 24 months"],
];

export default async function Pricing({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const initialPlan = (await searchParams).plan === "professional" ? "professional" : "personal";
  return (
    <main>
      <SiteHeader />

      <section id="top" className="mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-10 md:pt-40">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Pricing
        </p>
        <h1 className="max-w-4xl text-5xl leading-none font-medium sm:text-7xl">
          One issue for everyone. One written for you.
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          The daily issue stays free and general. Try Personal for 14 days on us,
          with an edition shaped by your interests. No credit card. No automatic charge.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-10">
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col bg-background p-8"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl font-medium">{tier.name}</h2>
                {"recommended" in tier && tier.recommended ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.blurb}</p>
              <p className="mt-8 text-4xl font-medium">
                {tier.price}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {tier.cadence}
                </span>
              </p>
              {"localPrice" in tier ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.localPrice} · {tier.annualPrice}
                </p>
              ) : null}
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="text-muted-foreground">
                    <span className="mr-2 text-foreground">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.cta.href}
                className={`mt-10 inline-flex h-14 items-center justify-center px-6 text-sm font-medium transition-colors ${
                  tier.id !== "free"
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section
        id="signup"
        className="border-y border-border bg-card/40"
      >
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Paid plans
            </p>
            <h2 className="max-w-xl text-4xl leading-tight font-medium sm:text-5xl">
              Describe your ideal issue.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Write a brief the way you would write a system prompt: what you build,
              which topics and tools matter, what to skip. Every day we match it
              against the day’s research and write your edition — ad-free, and never
              padded with things you said you don’t care about.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-muted-foreground">
              <li>
                <span className="mr-2 text-foreground">✓</span>
                Change your brief any time from a link in every issue
              </li>
              <li>
                <span className="mr-2 text-foreground">✓</span>
                Ask for “links only” and we skip the prose
              </li>
              <li>
                <span className="mr-2 text-foreground">✓</span>
                Cancel from the billing portal in one click
              </li>
            </ul>
          </div>
          <div className="border border-border bg-background p-8">
            <p className="mb-5 text-sm leading-6 text-muted-foreground">New here? <Link href="/welcome" className="text-foreground underline underline-offset-4">Start with 14 days of Personal on us</Link>. Ready for a paid plan? Choose below.</p>
            <PersonalSignup key={initialPlan} initialPlan={initialPlan} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Compare plans
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-40 py-4 pr-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Features
                </th>
                <th className="w-56 py-4 pr-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Free
                </th>
                <th className="w-56 border-x border-border bg-card/40 px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Personal
                </th>
                <th className="w-56 py-4 pl-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Professional
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, free, personal, professional]) => (
                <tr key={label} className="border-b border-border">
                  <td className="py-4 pr-4 text-foreground">{label}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{free}</td>
                  <td className="border-x border-border bg-card/40 px-4 py-4 text-muted-foreground">
                    {personal}
                  </td>
                  <td className="py-4 pl-4 text-muted-foreground">{professional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          US prices in USD; euro-area prices in EUR. Billing handled by{" "}
          <span className="text-foreground">Polar</span>, which also manages VAT
          and sales tax. Your final price is shown at checkout. Every plan can be
          cancelled from the billing portal.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
