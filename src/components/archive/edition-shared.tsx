import type { Components } from "react-markdown";
import type { ArchiveKind } from "@/lib/archive-client";
import type { EditionOutline } from "@/lib/feed";
import { SITE_URL } from "@/lib/seo";

// Pieces the issue page and the single-story page share.

export const absoluteUrl = (url: string) => (url.startsWith("/") ? `${SITE_URL}${url}` : url);

export function breadcrumbJsonLd(trail: Array<[string, string]>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: `${SITE_URL}${path}` })),
  };
}

export const labelClass = "font-mono text-[11px] uppercase tracking-[.2em]";

export const markdownComponents: Components = {
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure>
        {/* Edition images come from arbitrary publisher hosts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    ) : null,
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ),
};

export function storyVoteId(kind: ArchiveKind, date: string, sectionId: string, number: number): string {
  return /^s-[a-f0-9]{16}$/.test(sectionId) ? `${kind}:${date}:${sectionId}` : `${kind}:${date}:${number - 1}`;
}

export function storyNumber(outline: EditionOutline, id: string): number | null {
  const stories = outline.sections.filter((section) => !section.label);
  const position = stories.findIndex((section) => section.id === id);
  return position === -1 ? null : position + 1;
}

export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl py-28 text-center">
      <p className="font-display text-4xl">{title}</p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{children}</p>
    </div>
  );
}

