import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Shared frame for text pages (imprint, privacy, terms, about, unsubscribe): the legal documents in a
 * quiet rail on the left, the copy in a readable column beside it. Section headings found in the copy
 * get anchor links and, when there are enough of them, a table of contents. Header and footer come
 * from the site layout.
 */

const LEGAL_DOCS = [
  { href: "/imprint", label: "Imprint" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

type LegalDocHref = (typeof LEGAL_DOCS)[number]["href"];

type HeadingElement = ReactElement<{ id?: string; children?: ReactNode }>;

type TocEntry = { id: string; label: string };

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as HeadingElement).props.children);
  return "";
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
}

function withAnchors(node: ReactNode, used: Map<string, number>, out: TocEntry[]): ReactNode {
  if (Array.isArray(node)) return Children.map(node, (child) => withAnchors(child, used, out));
  if (!isValidElement(node)) return node;
  const element = node as HeadingElement;
  if (element.type === "h2") {
    const label = textOf(element.props.children).trim();
    const base = slugify(label);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = element.props.id ?? (count === 0 ? base : `${base}-${count + 1}`);
    out.push({ id, label });
    return cloneElement(element, { id }, <a href={`#${id}`}>{element.props.children}</a>);
  }
  if (element.props.children === undefined) return element;
  return cloneElement(element, undefined, withAnchors(element.props.children, used, out));
}

function TableOfContents({ entries }: { entries: TocEntry[] }) {
  return (
    <details open className="group mt-10 border border-border bg-muted/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[0.9375rem] text-muted-foreground [&::-webkit-details-marker]:hidden sm:px-6 sm:py-5">
        Table of Contents
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <ol className="px-5 pb-5 sm:px-6 sm:pb-6">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className="text-[0.9375rem] leading-[1.9] text-foreground/85 transition-colors hover:text-foreground"
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function LegalPage({
  active,
  title,
  updated,
  lede,
  children,
}: {
  active?: LegalDocHref;
  title: string;
  updated?: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  const headings: TocEntry[] = [];
  const content = withAnchors(children, new Map(), headings);

  return (
    <main className="page-shell min-h-[70vh] pb-24 pt-32 md:pb-36 md:pt-44">
      <div className="mx-auto grid w-full max-w-[60rem] gap-x-20 gap-y-10 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-24">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-8 gap-y-2 lg:flex-col lg:gap-y-3">
              {LEGAL_DOCS.map((doc) => (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    aria-current={active === doc.href ? "page" : undefined}
                    className={`text-[0.9375rem] transition-colors ${
                      active === doc.href
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {doc.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div>
          <h1 className="text-[2.5rem] leading-[1.08] font-medium tracking-[-0.025em] sm:text-[2.75rem]">
            {title}
          </h1>
          {updated ? (
            <p className="mt-3 text-[0.9375rem] text-muted-foreground">Last updated {updated}</p>
          ) : null}
          {headings.length > 2 ? <TableOfContents entries={headings} /> : null}
          <article className="legal-copy mt-10">
            {lede}
            {content}
          </article>
        </div>
      </div>
    </main>
  );
}
