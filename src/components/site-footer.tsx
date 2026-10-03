import Link from "next/link";
import { FooterField } from "./footer-field";
import { SocialLinks } from "./social-links";

const COLUMNS: Array<{ label: string; links: Array<{ label: string; href: string }> }> = [
  {
    label: "Read",
    links: [
      { label: "The archive", href: "/archive" },
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
      { label: "Collaborate", href: "/collaborate" },
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
      <div className="page-shell pt-12 pb-10 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="font-display max-w-sm text-2xl leading-[1.15] font-medium tracking-[-0.01em] md:text-[1.75rem]">
              Read what changed. Skip the rest.
            </p>
            <Link
              href="/welcome"
              className="dither-box dither-solid mt-8 inline-flex h-12 items-center px-6 text-sm font-medium"
            >
              Join free
            </Link>
            <div className="mt-8">
              <SocialLinks />
            </div>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8"
            aria-label="Footer"
          >
            {COLUMNS.map((column) => (
              <div key={column.label}>
                <h2 className="border-t border-border pt-4 font-mono text-[10px] tracking-[.18em] text-muted-foreground uppercase">
                  {column.label}
                </h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm whitespace-nowrap text-foreground/75 transition-colors hover:text-foreground"
                      >
                        {link.label}
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
          <p>Published from Vienna, Europe</p>
        </div>
      </div>
    </FooterField>
  );
}
