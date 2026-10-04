import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { FooterField } from "./footer-field";
import { SocialLinks } from "./social-links";

const COLUMNS: Array<{ label: string; links: Array<{ label: string; href: string }> }> = [
  {
    label: "Read",
    links: [
      { label: "The archive", href: "/archive" },
      { label: "Live signals", href: "/signals" },
      { label: "Editorial", href: "/archive?section=editorial" },
      { label: "Weekly deep dive", href: "/archive?tab=weekly" },
    ],
  },
  {
    label: "Newsletter",
    links: [
      { label: "Personal AI newsletter", href: "/pricing" },
      { label: "Start your free trial", href: "/welcome" },
      { label: "Your reading brief", href: "/preferences" },
      { label: "Agent access", href: "/agents" },
      { label: "Unsubscribe", href: "/unsubscribe" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Advertise", href: "/advertise" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Imprint", href: "/imprint" },
    ],
  },
];

export function SiteFooter() {
  return (
    <FooterField>
      <div className="page-shell pt-16 pb-[clamp(7rem,13vw,15rem)] md:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="font-display max-w-md text-2xl leading-[1.15] font-medium tracking-[-0.01em] md:text-3xl">
              Read what changed. Skip the rest.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link href="/welcome" className="dither-box dither-solid inline-flex h-12 items-center px-6 text-sm font-medium">
                Join free
              </Link>
              <SocialLinks />
            </div>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-7"
            aria-label="Footer"
          >
            {COLUMNS.map((column) => (
              <div key={column.label}>
                <h2 className="font-mono text-[10px] tracking-[.18em] text-muted-foreground uppercase">{column.label}</h2>
                <ul className="mt-6 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center justify-between gap-3 text-sm whitespace-nowrap text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Forward Pass</p>
          <p>
            Written by AI, checked against sources.{" "}
            <Link href="/about" className="underline underline-offset-4 transition-colors hover:text-foreground">
              How it&apos;s made
            </Link>
          </p>
          <p className="flex items-center gap-1.5">
            Engineered with <Heart role="img" aria-label="love" className="size-3.5 fill-current" /> in Europe
          </p>
        </div>
      </div>
    </FooterField>
  );
}
