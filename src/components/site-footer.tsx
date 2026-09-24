import Link from "next/link";
import { BrandLockup } from "./brand-lockup";
import { SocialLinks } from "./social-links";

const COLUMNS: Array<{ label: string; links: Array<{ label: string; href: string }> }> = [
  {
    label: "Read",
    links: [
      { label: "The archive", href: "/archive" },
      { label: "Weekly research", href: "/archive#weekly" },
      { label: "Editorial", href: "/archive#editorial" },
      { label: "Reading brief", href: "/preferences" },
    ],
  },
  {
    label: "Plans",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Personal trial", href: "/welcome" },
      { label: "Advertise", href: "/collaborate" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Imprint", href: "/imprint" },
      { label: "Unsubscribe", href: "/unsubscribe" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <BrandLockup />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              One issue a day on what’s changing in AI engineering. The important
              models, agents, research, infrastructure and tools, with primary
              sources.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">@forwardpassnews</p>
            <SocialLinks />
          </div>
          <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3" aria-label="Footer">
            {COLUMNS.map((column) => (
              <div key={column.label}>
                <h2 className="font-mono text-[10px] tracking-[.18em] text-muted-foreground uppercase">
                  {column.label}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Forward Pass</p>
          <p>Vienna, Austria · hello@withradian.com</p>
        </div>
      </div>
    </footer>
  );
}
