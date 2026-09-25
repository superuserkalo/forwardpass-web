import Link from "next/link";
import { BrandLockup } from "./brand-lockup";
import { Sigil } from "./sigil";
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
      { label: "Unsubscribe", href: "/unsubscribe" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "Collaborate", href: "/collaborate" },
      { label: "Contact", href: "mailto:hello@withradian.com" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Imprint", href: "/imprint" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="border-t border-border">
        <Sigil />
      </div>
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div>
            <BrandLockup />
            <SocialLinks />
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4" aria-label="Footer">
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
          <p>
            Engineered with <span aria-label="love">❤️</span> in Europe
          </p>
        </div>
      </div>
    </footer>
  );
}
